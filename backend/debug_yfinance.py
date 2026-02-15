
import yfinance as yf
import datetime

def debug_yfinance(ticker):
    print(f"Fetching {ticker} via yfinance...")
    t = yf.Ticker(f"{ticker}.T")
    info = t.info
    
    print("--- Info Keys ---")
    keys = ['exDividendDate', 'dividendDate', 'lastDividendDate', 'lastDividendValue', 'dividendRate', 'trailingAnnualDividendRate']
    for k in keys:
        val = info.get(k)
        print(f"{k}: {val}")
        if val and 'Date' in k:
            try:
                # epoch to date
                dt = datetime.datetime.fromtimestamp(val)
                print(f"  -> {dt}")
            except: pass

    # Calendar
    try:
        cal = t.calendar
        print("\n--- Calendar ---")
        print(cal)
    except:
        print("\n--- Calendar Not Found ---")

if __name__ == "__main__":
    debug_yfinance("1726")
