import os

ENV_PATH = os.path.join(os.path.dirname(__file__), '.env')

def fix_encoding():
    try:
        # Try reading with different encodings
        content = ""
        try:
            with open(ENV_PATH, 'r', encoding='utf-16') as f:
                content = f.read()
        except:
            try:
                with open(ENV_PATH, 'r', encoding='utf-8-sig') as f:
                    content = f.read()
            except:
                with open(ENV_PATH, 'r', encoding='utf-8') as f:
                    content = f.read()
                    
        # Filter out weird chars if any (basic cleaning)
        lines = content.splitlines()
        clean_lines = []
        for line in lines:
            line = line.strip()
            if line and not line.startswith('\x00'): # Null bytes
                clean_lines.append(line)
        
        # Write back as utf-8 (no BOM)
        with open(ENV_PATH, 'w', encoding='utf-8') as f:
            for line in clean_lines:
                f.write(line + '\n')
                
        print(f"Fixed .env encoding. Content preview:")
        print('\n'.join(clean_lines))
        
    except Exception as e:
        print(f"Error fixing .env: {e}")

if __name__ == "__main__":
    fix_encoding()
