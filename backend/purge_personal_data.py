"""Purge all personal / user-account data from SQLite databases.

- Run AFTER creating an encrypted backup of the DB file.
- Drops tables: portfolio_transactions, alerts, notifications, users
- Rebuilds user_votes without free-text comments, irreversibly anonymizing any legacy numeric user_ids
  using a one-time random 128-bit salt so only anonymous bull/bear vote counts remain.
- Checkpoints WAL and runs VACUUM so deleted bytes are physically wiped from SQLite pages.
"""
import os
import sqlite3
import hashlib
import secrets

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CANDIDATE_DBS = [
    os.path.join(ROOT, "frontend", "investor_news.db"),
    os.path.join(ROOT, "investor_news.db"),
    os.path.join(ROOT, "database.db"),
    os.path.join(ROOT, "backend", "investor_news.db"),
]

DROP_TABLES = [
    "portfolio_transactions",
    "alerts",
    "notifications",
    "users",
]

def purge_db(db_path: str):
    if not os.path.exists(db_path):
        return
    print(f"=== Purging personal data from: {db_path} ===")
    salt = secrets.token_hex(16)
    conn = sqlite3.connect(db_path)
    c = conn.cursor()

    existing = {
        r[0] for r in c.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()
    }

    for tbl in DROP_TABLES:
        if tbl in existing:
            cnt = c.execute(f"SELECT COUNT(*) FROM {tbl}").fetchone()[0]
            c.execute(f"DROP TABLE IF EXISTS {tbl}")
            print(f"  Dropped table '{tbl}' (had {cnt} rows)")

    if "user_votes" in existing:
        rows = c.execute(
            "SELECT user_id, ticker, vote_type, created_at FROM user_votes"
        ).fetchall()
        c.execute("DROP TABLE user_votes")
        c.execute("""
            CREATE TABLE user_votes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                ticker TEXT NOT NULL,
                vote_type TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, ticker)
            )
        """)
        c.execute("CREATE INDEX IF NOT EXISTS idx_user_votes_ticker ON user_votes (ticker)")

        legacy_cnt = 0
        for uid, ticker, vote_type, created_at in rows:
            uid_str = str(uid)
            if not uid_str.startswith("anon:"):
                uid_str = "anon:legacy-" + hashlib.sha256(f"{salt}:{uid_str}:{ticker}".encode()).hexdigest()[:24]
                legacy_cnt += 1
            c.execute(
                "INSERT OR IGNORE INTO user_votes (user_id, ticker, vote_type, created_at) VALUES (?, ?, ?, ?)",
                (uid_str, ticker, vote_type, created_at),
            )
        print(f"  Rebuilt 'user_votes' without comment column (kept {len(rows)} votes, anonymized {legacy_cnt} legacy IDs)")

    conn.commit()
    c.execute("PRAGMA wal_checkpoint(TRUNCATE)")
    c.execute("VACUUM")
    conn.close()
    print(f"  VACUUM completed for {db_path}")

if __name__ == "__main__":
    for p in CANDIDATE_DBS:
        purge_db(p)
    print("All databases purged of personal information.")
