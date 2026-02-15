import re
def parse_val_test(txt):
    if not txt: return 0.0
    txt = txt.replace("▲", "-").replace("−", "-")
    val_str = re.sub(r'[^\d\.-]', '', txt)
    return float(val_str)

tests = [
    ("4,614", 4614.0),
    ("▲100", -100.0),
    ("-50", -50.0),
    ("−30", -30.0),
    ("12.5", 12.5),
    ("▲2,300.5", -2300.5)
]

for inp, expected in tests:
    res = parse_val_test(inp)
    print(f"'{inp}' -> {res} (Expected: {expected}) - {'OK' if res == expected else 'FAIL'}")
