
import sqlite3
import os

def check_db():
    # Check both possible paths
    paths = [
        os.path.join(os.getcwd(), 'investor_news.db'),
        os.path.join(os.getcwd(), 'frontend', 'investor_news.db')
    ]
    
    for db_path in paths:
        if os.path.exists(db_path):
            print(f"--- Checking DB at: {db_path} ---")
            try:
                conn = sqlite3.connect(db_path)
                c = conn.cursor()
                
                # Check 1726
                print("Checking 1726 Revisions (Top 5):")
                c.execute("""
                    SELECT id, revision_date, title, dividend_rights_month, dividend_payment_month, dividend_forecast_annual
                    FROM revisions 
                    WHERE ticker = '1726' 
                    ORDER BY revision_date DESC 
                    LIMIT 2
                """)
                for r in rows: print(r)

                # Check 9251
                print("Checking 9251 Revisions (Top 5):")
                c.execute("""
                    SELECT id, revision_date, title, dividend_rights_month, dividend_payment_month, dividend_forecast_annual
                    FROM revisions 
                    WHERE ticker = '9251' 
                    ORDER BY revision_date DESC 
                    LIMIT 2
                """)
                rows = c.fetchall()
                for r in rows:
                    print(r)
                    
                conn.close()
            except Exception as e:
                print(f"Error reading DB: {e}")
        else:
            print(f"DB not found at: {db_path}")

if __name__ == "__main__":
    check_db()
