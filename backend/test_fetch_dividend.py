from fetch_dividend_history import fetch_dividend_history, save_history

ticker = "7203" # Toyota
print(f"Testing fetch for {ticker}...")
history = fetch_dividend_history(ticker)
print(f"Found {len(history)} records:")
for h in history:
    print(h)

if history:
    print("Saving...")
    save_history(ticker, history)
    print("Done.")
else:
    print("No history found.")
