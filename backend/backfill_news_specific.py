import sqlite3
import os
import datetime
import json
import time
from database import get_db_connection
from fetch_news import fetch_rss, extract_content, is_paid_domain, summarize_with_llm
from bs4 import BeautifulSoup
import requests

def backfill_news_specific():
    """
    Fetch news for "井村俊哉" and "五味大輔" and try to get past 2 weeks.
    Google News RSS doesn't strictly support date ranges, but we can query freely.
    """
    target_names = ["井村俊哉", "五味大輔"]
    
    conn = get_db_connection()
    c = conn.cursor()
    
    print(f"Backfilling news for: {target_names}")

    for name in target_names:
        row = c.execute("SELECT * FROM investors WHERE name = ?", (name,)).fetchone()
        if not row:
            print(f"Investor not found: {name}")
            continue
            
        inv_id = row['id']
        aliases = json.loads(row['aliases'])
        
        # Build query
        queries = [name] + aliases
        full_query = " OR ".join(queries)
        print(f"\nProcessing {name} (Query: {full_query})...")
        
        # Standard Fetch (Google News RSS usually gives recent ~30 days)
        entries = fetch_rss(full_query)
        print(f"  Found {len(entries)} items in RSS.")
        
        for entry in entries:
            title = entry.title
            link = entry.link
            published = entry.published
            
            # Check exist
            exists = c.execute('SELECT id FROM news_items WHERE url = ?', (link,)).fetchone()
            if exists:
                print(f"  [Skip] Already exists: {title[:20]}...")
                continue
            
            # Parse date
            try:
                pub_date = datetime.datetime.strptime(published, '%a, %d %b %Y %H:%M:%S %Z')
            except:
                pub_date = datetime.datetime.now()
            
            # Filter: Only past 14 days (approx 2 weeks)
            if (datetime.datetime.now() - pub_date).days > 14:
                print(f"  [Skip] Too old ({pub_date}): {title[:20]}...")
                continue

            is_paid = is_paid_domain(link)
            domain = link.split('/')[2] if '//' in link else ''
            
            content_snippet = entry.description
            if not is_paid:
                extracted = extract_content(link)
                if extracted:
                    content_snippet = extracted
            
            # Sanitize
            soup = BeautifulSoup(content_snippet, "html.parser")
            clean_content = soup.get_text(separator=" ", strip=True)
            
            summary = summarize_with_llm(title, clean_content, is_paid)
            
            print(f"  [New] {title[:40]}... ({pub_date})")
            c.execute('''
                INSERT INTO news_items (investor_id, title, url, summary, domain, is_paid, published_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (inv_id, title, link, summary, domain, is_paid, pub_date))
            
            conn.commit()
            time.sleep(1) # Be nice
            
    conn.close()
    print("\nBackfill complete.")

if __name__ == "__main__":
    backfill_news_specific()
