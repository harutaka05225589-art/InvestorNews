import sqlite3
import os
from datetime import datetime

DB_NAME = "investor_news.db"

def get_db_connection():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    c = conn.cursor()

    # Investors Table
    c.execute('''
    CREATE TABLE IF NOT EXISTS investors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        aliases TEXT,  -- JSON string of aliases
        style_description TEXT,
        twitter_url TEXT,
        image_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    # News Items Table
    c.execute('''
    CREATE TABLE IF NOT EXISTS news_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        investor_id INTEGER,
        title TEXT NOT NULL,
        url TEXT UNIQUE NOT NULL,
        summary TEXT,
        domain TEXT,
        is_paid BOOLEAN DEFAULT 0,
        published_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (investor_id) REFERENCES investors (id)
    )
    ''')

    # Daily Stats Table for Access Ranking
    c.execute('''
    CREATE TABLE IF NOT EXISTS daily_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        investor_id INTEGER,
        date DATE,
        access_count INTEGER DEFAULT 0,
        UNIQUE(investor_id, date),
        FOREIGN KEY (investor_id) REFERENCES investors (id)
    )
    ''')

    # Seed Initial Investors
    initial_investors = [
        ("テスタ", '["Testa"]', "デイトレード・スキャルピング中心、数十億運用", "https://twitter.com/tesuta1"),
        ("藤本茂", '["シゲル"]', "88歳の現役デイトレーダー", "https://twitter.com/"), 
        ("弐億貯男", '["2okutameo"]', "割安成長株、サラリーマン投資家", "https://twitter.com/2okutameo"),
        ("テンバガー投資家X", '[]', "中長期の成長株投資", "https://twitter.com/"),
        ("かんち", '["kanchi"]', "高配当・優待バリュー株", "https://twitter.com/kanchi555"),
        ("DAIBOUCYOU", '["大膨張"]', "割安成長株からの分散投資", "https://twitter.com/DAIBOUCHOU"),
        ("成長株テリー", '["Terry"]', "成長株集中投資", "https://twitter.com/"),
        ("桐谷広人", '["桐谷さん"]', "株主優待投資", "https://twitter.com/"),
        ("kenmo", '["けんも"]', "イベントドリブン・需給", "https://twitter.com/kenmocalis"),
        ("かぶ１０００", '["kabu1000"]', "バリュー株・資産バリュー", "https://twitter.com/kabu1000")
    ]

    # Check if investors exist, if not seed
    c.execute('SELECT count(*) FROM investors')
    if c.fetchone()[0] == 0:
        print("Seeding initial investors...")
        for name, aliases, style, twitter in initial_investors:
            c.execute('INSERT INTO investors (name, aliases, style_description, twitter_url) VALUES (?, ?, ?, ?)',
                      (name, aliases, style, twitter))

    conn.commit()
    conn.close()
    print("Database initialized successfully.")

if __name__ == "__main__":
    init_db()
