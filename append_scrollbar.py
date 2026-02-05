
css_path = 'frontend/app/globals.css'
css_content = """
/* Custom Scrollbar for Webkit Browsers */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #0f172a; /* Slate 900 */
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: #334155; /* Slate 700 */
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #475569; /* Slate 600 */
}

/* Firefox support */
* {
  scrollbar-width: thin;
  scrollbar-color: #334155 #0f172a;
}
"""

with open(css_path, 'a', encoding='utf-8') as f:
    f.write(css_content)

print(f"Appended scrollbar styles to {css_path}")
