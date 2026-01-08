import feedparser
import sqlite3
import datetime
import os
import json
import time
from database import get_db_connection

# Known paid domains or rigorous paywalls
PAID_DOMAINS = [
    "nikkei.com",
    "bloomberg.co.jp",
    "shikiho.toyokeizai.net",
    "diamond.jp",
    "newspicks.com",
    "asahi.com",
    "mainichi.jp",
    "yomiuri.co.jp"
]

def is_paid_domain(url):
    for domain in PAID_DOMAINS:
        if domain in url:
            return True
    return False

def fetch_rss(query):
    encoded_query = requests.utils.quote(query)
    url = f"https://news.google.com/rss/search?q={encoded_query}&hl=ja&gl=JP&ceid=JP:ja"
    feed = feedparser.parse(url)
    return feed.entries

import requests
from bs4 import BeautifulSoup

def extract_content(url):
    """
    Attempt to extract main text from a free article.
    Returns truncated text.
    """
    try:
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code != 200:
            return None
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Simple heuristic to find main content (p tags)
        # This differs vastly by site, but is a starting point
        paragraphs = soup.find_all('p')
        text = "\n".join([p.get_text() for p in paragraphs if len(p.get_text()) > 20])
        
        return text[:2000] # Limit length for LLM processing
    except Exception as e:
        print(f"Error extracting content from {url}: {e}")
        return None

def summarize_with_llm(title, content, is_paid):
    """
    Placeholder for LLM summarization.
    In a real scenario, this would call OpenAI API.
    For now, return a dummy summary based on title/snippet.
    """
    
    # Check for API key
    api_key = os.getenv("OPENAI_API_KEY")
    if api_key:
        try:
            from openai import OpenAI
            client = OpenAI(api_key=api_key)
            
            prompt = f"""
            以下のニュース記事を投資家向けに要約してください。
            タイトル: {title}
            本文: {content}
            
            制約:
            - 3行以内の箇条書き
            - 煽りなし、事実のみ
            - 投資助言はしない
            """
            
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=200
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"LLM Error: {e}")
            pass

    # Fallback / Mock
    prefix = "[有料記事] " if is_paid else ""
    return f"{prefix}{title}に関するニュースです。詳細な内容は公式サイトをご確認ください。\n- 自動収集された記事です\n- {content[:50]}..."

def run_fetch():
    conn = get_db_connection()
    c = conn.cursor()
    
    # Get Investors
    investors = c.execute('SELECT * FROM investors').fetchall()
    
    for inv in investors:
        inv_id = inv['id']
        name = inv['name']
        aliases = json.loads(inv['aliases'])
        
        queries = [name] + aliases
        full_query = " OR ".join(queries)
        print(f"Fetching for {name} ({full_query})...")
        
        entries = fetch_rss(full_query)
        
        for entry in entries:
            title = entry.title
            link = entry.link
            published = entry.published
            
            # Check exist
            exists = c.execute('SELECT id FROM news_items WHERE url = ?', (link,)).fetchone()
            if exists:
                continue
            
            is_paid = is_paid_domain(link)
            domain = link.split('/')[2]
            
            content_snippet = entry.description
            if not is_paid:
                extracted = extract_content(link)
                if extracted:
                    content_snippet = extracted
            
            summary = summarize_with_llm(title, content_snippet, is_paid)
            
            # Parse date
            try:
                # published is like 'Wed, 07 Jan 2026 12:00:00 GMT'
                pub_date = datetime.datetime.strptime(published, '%a, %d %b %Y %H:%M:%S %Z')
            except:
                pub_date = datetime.datetime.now()
            
            print(f"  New article: {title}")
            c.execute('''
                INSERT INTO news_items (investor_id, title, url, summary, domain, is_paid, published_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (inv_id, title, link, summary, domain, is_paid, pub_date))
            
            conn.commit()
            time.sleep(1) # Be nice
            
    conn.close()
    print("Fetch complete.")

import schedule
import time

def job():
    print(f"Starting scheduled fetch at {datetime.datetime.now()}")
    run_fetch()

if __name__ == "__main__":
    # Run once immediately on start
    job()
    
    # Schedule every 2 hours
    schedule.every(2).hours.do(job)
    
    print("Scheduler started. Running every 2 hours...")
    while True:
        schedule.run_pending()
        time.sleep(60)
