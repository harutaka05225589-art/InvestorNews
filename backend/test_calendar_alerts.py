import sqlite3
import os
import datetime
from database import get_db_connection
from send_calendar_alerts import send_calendar_alerts

def setup_mock_data():
    conn = get_db_connection()
    c = conn.cursor()
    
    # 1. Clean previous mocks
    ticker_today = "TEST1"
    ticker_2days = "TEST2"
    
    today = datetime.date.today().strftime('%Y-%m-%d')
    two_days = (datetime.date.today() + datetime.timedelta(days=2)).strftime('%Y-%m-%d')
    
    # Clean up old mock user if exists
    c.execute("DELETE FROM users WHERE email = 'mock@example.com'")
    
    # 2. Add IR Events
    print("Inserting mock IR Events...")
    c.execute("DELETE FROM ir_events WHERE ticker IN (?, ?)", (ticker_today, ticker_2days))
    c.execute("INSERT INTO ir_events (ticker, company_name, event_date, event_type) VALUES (?, ?, ?, ?)", (ticker_today, "テスト株式会社(今日)", today, "決算"))
    c.execute("INSERT INTO ir_events (ticker, company_name, event_date, event_type) VALUES (?, ?, ?, ?)", (ticker_2days, "テスト株式会社(明後日)", two_days, "決算"))
    
    # 3. Add User & Alert/Portfolio
    print("Inserting mock User/Alert...")
    # Create valid dummy user
    c.execute("""
        INSERT INTO users (account_id, email, nickname, password_hash, line_user_id) 
        VALUES (?, ?, ?, ?, ?)
    """, ('mock_acc_123', 'mock@example.com', 'MockUser', 'dummy_hash', 'U_TEST_12345'))
    
    user_id = c.lastrowid
        
    # Bind Ticker 1 to Alert
    c.execute("DELETE FROM alerts WHERE user_id = ? AND ticker = ?", (user_id, ticker_today))
    c.execute("INSERT INTO alerts (user_id, ticker, is_active) VALUES (?, ?, 1)", (user_id, ticker_today))
    
    # Bind Ticker 2 to Portfolio
    c.execute("DELETE FROM portfolio_transactions WHERE user_id = ? AND ticker = ?", (user_id, ticker_2days))
    c.execute("INSERT INTO portfolio_transactions (user_id, ticker, shares, price, transaction_date, account_type) VALUES (?, ?, 100, 1000, ?, 'general')", (user_id, ticker_2days, today))
    
    conn.commit()
    conn.close()
    print("Mock data ready.")

if __name__ == "__main__":
    setup_mock_data()
    print("\n--- Running Alert Script ---")
    send_calendar_alerts()
    print("--- Done ---")
