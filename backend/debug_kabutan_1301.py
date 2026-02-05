from fetch_dividend_history import fetch_dividend_history

print("Debugging 1301...")
try:
    hist = fetch_dividend_history("1301")
    print("\nResult:")
    print(hist)
except Exception as e:
    print(f"Error: {e}")
