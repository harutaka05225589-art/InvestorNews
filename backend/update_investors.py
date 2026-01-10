import sqlite3
import os
import json

# Database path (same as in database.py)
DB_NAME = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend', 'investor_news.db')

def update_investors():
    if not os.path.exists(DB_NAME):
        print(f"Database not found at {DB_NAME}")
        return

    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()

    # Mapping: Current/Old Name -> (Correct Name, Correct Twitter URL, Aliases List)
    # Aliases are CRITICAL for news search. If the Name is complex (e.g. "Name(Desc)"), 
    # the original simple name MUST be in aliases.
    updates = {
        # Format: "Match Name": ("New Name", "Twitter", ["Alias1", "Alias2"])
        
        "テスタ": ("テスタ", "https://twitter.com/tesuta001", ["Testa", "testa"]),
        
        "藤本茂": ("藤本茂(シゲルさん)", "", ["藤本茂", "シゲル", "シゲルさん"]),
        "藤本茂(シゲルさん)": ("藤本茂(シゲルさん)", "", ["藤本茂", "シゲル", "シゲルさん"]),
        
        "かんち": ("かんち", "https://twitter.com/kanti990", ["kanchi"]),
        
        "成長株テリー": ("成長株テリー", "https://twitter.com/freepapa", []),
        
        "桐谷広人": ("桐谷広人(桐谷さん)", "https://twitter.com/yuutaihiroto", ["桐谷広人", "桐谷さん"]),
        "桐谷広人(桐谷さん)": ("桐谷広人(桐谷さん)", "https://twitter.com/yuutaihiroto", ["桐谷広人", "桐谷さん"]),
        
        "kenmo": ("kenmo", "https://twitter.com/kenmokenmo", ["けんも", "kenmo"]),
        
        "かぶ1000": ("かぶ1000", "https://twitter.com/kabu1000", ["kabu1000", "かぶ１０００"]),
        "かぶ１０００": ("かぶ1000", "https://twitter.com/kabu1000", ["kabu1000", "かぶ１０００"]),
        
        "弍億貯男": ("弍億貯男", "https://twitter.com/2okutameo", ["弐億貯男", "2okutameo"]),
        "弐億貯男": ("弍億貯男", "https://twitter.com/2okutameo", ["弐億貯男", "2okutameo"]),
        
        "テンバガー投資家X": ("テンバガー投資家X", "https://twitter.com/Investor__X", ["テンバガー投資家", "Investor__X"]),
        
        "DAIBOUCHOU": ("DAIBOUCHOU", "https://twitter.com/DAIBOUCHO", ["大膨張", "DAIBOUCYOU"]),
        "DAIBOUCYOU": ("DAIBOUCHOU", "https://twitter.com/DAIBOUCHO", ["大膨張", "DAIBOUCYOU"]),
    }

    print("Updating investor data and SEARCH ALIASES...")
    
    updated_count = 0
    for match_name, (new_name, twitter_url, aliases) in updates.items():
        # Check if record exists
        c.execute("SELECT id FROM investors WHERE name = ?", (match_name,))
        row = c.fetchone()
        
        if row:
            print(f"Updating {match_name} -> {new_name} (Aliases: {aliases})")
            aliases_json = json.dumps(aliases, ensure_ascii=False)
            
            c.execute("""
                UPDATE investors 
                SET name = ?, twitter_url = ?, aliases = ? 
                WHERE name = ?
            """, (new_name, twitter_url, aliases_json, match_name))
            updated_count += 1
        else:
            # Maybe it was already updated to the new name? Try finding by ID isn't easy here, but usually one of the keys will match.
            pass

    conn.commit()
    conn.close()
    print(f"Update complete. Updated {updated_count} records.")

if __name__ == "__main__":
    update_investors()
