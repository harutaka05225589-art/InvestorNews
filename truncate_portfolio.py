
file_path = 'frontend/app/portfolio/page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# We want to keep lines up to 925 (index 924)
# verifying line 924 (index 923) is '}'
if len(lines) > 924 and '}' in lines[923]:
    print(f"Line 924 is: {lines[923]}")
    # checking line 926 (index 925) starts with const assetHistory
    if len(lines) > 925 and 'const assetHistoryData' in lines[925]:
         print(f"Line 926 is: {lines[925]}")
         print("Truncating file at line 925...")
         new_lines = lines[:925]
         with open(file_path, 'w', encoding='utf-8') as f:
             f.writelines(new_lines)
         print("Success.")
    else:
        print("Line 926 does not match expected garbage start. Printing it:")
        if len(lines) > 925:
            print(lines[925])
        else:
            print("File is shorter than 926 lines.")
else:
    print("Line 924 does not match expected closure. Printing it:")
    if len(lines) > 923:
        print(lines[923])

