"""
Migration v2: Add new alert setting columns and data columns to admin_watchlist.

New alert setting columns:
  - ath_drop_threshold       (#3 上場来高値からの下落率)
  - pbr_limit                (#5 PBR到達)
  - dividend_yield_min       (#6 配当利回り到達)
  - alert_yuutai_change      (#8 優待変更・廃止)
  - alert_earnings_date      (#9 次回決算日接近)
  - alert_revision           (#10 上方/下方修正)
  - volume_spike_ratio       (#14 出来高急増)
  - alert_dilution           (#15 希薄化・需給悪化)

New data columns:
  - current_pbr
  - current_dividend_yield
  - ath_price
  - ath_drop_pct

Usage:
  python migrate_watchlist_v2.py
"""
import sqlite3
import os
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
logger = logging.getLogger(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(os.path.dirname(BASE_DIR), 'frontend', 'investor_news.db')


# (column_name, column_definition)
NEW_COLUMNS = [
    # Alert setting columns
    ("ath_drop_threshold",    "REAL"),
    ("pbr_limit",             "REAL"),
    ("dividend_yield_min",    "REAL"),
    ("alert_yuutai_change",   "INTEGER DEFAULT 0"),
    ("alert_earnings_date",   "INTEGER DEFAULT 0"),
    ("alert_revision",        "INTEGER DEFAULT 0"),
    ("volume_spike_ratio",    "REAL"),
    ("alert_dilution",        "INTEGER DEFAULT 0"),
    # Data columns
    ("current_pbr",           "REAL"),
    ("current_dividend_yield", "REAL"),
    ("ath_price",             "REAL"),
    ("ath_drop_pct",          "REAL"),
]


def migrate():
    """Add new columns to admin_watchlist table (idempotent)."""
    if not os.path.exists(DB_PATH):
        logger.error(f"Database not found: {DB_PATH}")
        return False

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    success_count = 0
    skip_count = 0
    error_count = 0

    for col_name, col_def in NEW_COLUMNS:
        try:
            sql = f"ALTER TABLE admin_watchlist ADD COLUMN {col_name} {col_def}"
            c.execute(sql)
            logger.info(f"  ✅ Added column: {col_name} {col_def}")
            success_count += 1
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e).lower():
                logger.info(f"  ⏭️  Column already exists: {col_name}")
                skip_count += 1
            else:
                logger.error(f"  ❌ Error adding column {col_name}: {e}")
                error_count += 1
        except Exception as e:
            logger.error(f"  ❌ Unexpected error adding column {col_name}: {e}")
            error_count += 1

    conn.commit()
    conn.close()

    logger.info(f"\n{'='*50}")
    logger.info(f"Migration complete:")
    logger.info(f"  Added:   {success_count}")
    logger.info(f"  Skipped: {skip_count} (already existed)")
    logger.info(f"  Errors:  {error_count}")
    logger.info(f"{'='*50}")

    return error_count == 0


if __name__ == '__main__':
    logger.info(f"Database: {DB_PATH}")
    logger.info(f"Adding {len(NEW_COLUMNS)} columns to admin_watchlist...")
    ok = migrate()
    if ok:
        print("\n✅ Migration v2 completed successfully.")
    else:
        print("\n⚠️ Migration v2 completed with errors. Check logs above.")
