import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend', 'investor_news.db')

def migrate():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    print("Creating edinet_documents table...")
    c.execute("""
        CREATE TABLE IF NOT EXISTS edinet_documents (
            id TEXT PRIMARY KEY,
            submitter_name TEXT,
            subject_edinet_code TEXT,
            doc_description TEXT,
            submitted_at DATETIME,
            pdf_link TEXT,
            investor_id INTEGER
        )
    """)
    
    print("Done.")
    conn.commit()
    conn.close()

if __name__ == "__main__":
    migrate()
