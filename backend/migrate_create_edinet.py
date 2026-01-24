import sqlite3
import os
from database import get_db_connection

def migrate():
    conn = get_db_connection()
    c = conn.cursor()
    
    print("Checking 'edinet_documents' table...")
    c.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='edinet_documents'")
    if not c.fetchone():
        print("Creating table 'edinet_documents'...")
        c.execute('''
        CREATE TABLE IF NOT EXISTS edinet_documents (
            id TEXT PRIMARY KEY,
            submitter_name TEXT,
            subject_edinet_code TEXT,
            doc_description TEXT,
            submitted_at DATETIME,
            pdf_link TEXT,
            investor_id INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (investor_id) REFERENCES investors (id)
        )
        ''')
        print("Table created.")
    else:
        print("Table already exists.")
    
    conn.commit()
    conn.close()

if __name__ == "__main__":
    migrate()
