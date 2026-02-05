
import os

file_path = 'frontend/app/portfolio/page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

output_lines = []
found_boundary = False

for i, line in enumerate(lines):
    # The garbage block starts with this specific comment
    if '    // --- Asset History Logic ---' in line and i > 800:
        found_boundary = True
        print(f"Found boundary at line {i+1}")
        break
    output_lines.append(line)

if found_boundary:
    # Ensure the component is closed
    output_lines.append('}\n')
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(output_lines)
    print("File truncated and saved.")
else:
    print("Boundary not found. No changes made.")
