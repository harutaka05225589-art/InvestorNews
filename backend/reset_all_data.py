
import sqlite3
import os
from database import get_db_connection

def reset_all_data():
    conn = get_db_connection()
    c = conn.cursor()

    print("WARNING: This will DELETE all collected Financial, Shareholder, and Profile data.")
    print("It will also RESET all AI analysis status for Revisions.")
    # confirm = input("Are you sure? (y/n): ")
    # if confirm.lower() != 'y':
    #     print("Aborted.")
    #     return

    print("1. Deleting Financial Stats...")
    c.execute("DELETE FROM financial_stats")
    
    print("2. Deleting Shareholder Data...")
    c.execute("DELETE FROM stock_shareholders")

    print("3. Deleting Company Profiles...")
    c.execute("DELETE FROM stock_profiles")

    print("4. Resetting AI Analysis for Revisions...")
    c.execute("""
        UPDATE revisions 
        SET ai_analyzed = 0,
            is_upward = NULL,
            revision_rate_op = NULL,
            ai_summary = NULL,
            forecast_data = NULL,
            quarter = NULL,
            dividend_forecast_annual = NULL,
            dividend_forecast_previous = NULL,
            is_dividend_hike = 0,
            dividend_rights_month = NULL,
            dividend_payment_month = NULL,
            category = NULL
    """)

    conn.commit()
    print("All specified data has been reset.")
    conn.close()

if __name__ == "__main__":
    reset_all_data()
