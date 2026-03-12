import sqlite3

# Test script for the new revenue-based rival company selection logic
def get_related_stocks(current_ticker, sector, limit=5):
    conn = sqlite3.connect('investor_news.db')
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    # Get current revenue
    c.execute('''
        SELECT sales FROM financial_stats 
        WHERE ticker = ? AND period_type = 'annual' AND sales IS NOT NULL
        ORDER BY period_end DESC LIMIT 1
    ''', (current_ticker,))
    current_sales_row = c.fetchone()
    
    if current_sales_row and current_sales_row['sales'] > 0:
        current_sales = current_sales_row['sales']
        print(f"Target Ticker: {current_ticker} | Sector: {sector} | Latest Revenue (Millions): {current_sales}")
        
        c.execute('''
            SELECT p.ticker, COALESCE(c.name, p.company_name) as company_name, f.sales
            FROM stock_profiles p
            LEFT JOIN companies c ON p.ticker = c.code
            LEFT JOIN (
                SELECT ticker, sales FROM financial_stats 
                WHERE period_type = 'annual' AND sales IS NOT NULL
                GROUP BY ticker HAVING MAX(period_end)
            ) f ON p.ticker = f.ticker
            WHERE p.sector = ? AND p.ticker != ? AND f.sales IS NOT NULL
            ORDER BY ABS(f.sales - ?) ASC
            LIMIT ?
        ''', (sector, current_ticker, current_sales, limit))
        
        results = c.fetchall()
        for r in results:
            print(f"  - Rival: {r['ticker']} {r['company_name']} | Revenue: {r['sales']} | Diff: {abs(r['sales'] - current_sales)}")
    else:
        print("No revenue data found for target ticker.")
    
    conn.close()

if __name__ == "__main__":
    # Test with Toyota (7203), sector should be 輸送用機器
    get_related_stocks('7203', '輸送用機器', 5)
    # Test with Softbank Corp (9434), sector should be 情報・通信業
    print("\n---")
    get_related_stocks('9434', '情報・通信業', 5)
