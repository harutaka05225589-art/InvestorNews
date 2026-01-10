import sqlite3
import os

# Database path (same as in database.py)
DB_NAME = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend', 'investor_news.db')

def update_investors():
    if not os.path.exists(DB_NAME):
        print(f"Database not found at {DB_NAME}")
        return

    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()

    # Mapping: Old Name in DB -> (New Name, New Twitter URL)
    # Mapping: Current/Old Name -> (Correct Name, Correct Twitter URL)
    updates = {
        "テスタ": ("テスタ", "https://twitter.com/tesuta001"), # User specified tesuta001
        "藤本茂": ("藤本茂(シゲルさん)", ""),
        "藤本茂(シゲルさん)": ("藤本茂(シゲルさん)", ""),
        "かんち": ("かんち", "https://twitter.com/kanti990"), # User specified kanti990
        "成長株テリー": ("成長株テリー", "https://twitter.com/freepapa"),
        "桐谷広人": ("桐谷広人(桐谷さん)", "https://twitter.com/yuutaihiroto"),
        "桐谷広人(桐谷さん)": ("桐谷広人(桐谷さん)", "https://twitter.com/yuutaihiroto"),
        "kenmo": ("kenmo", "https://twitter.com/kenmokenmo"),
        "かぶ1000": ("かぶ1000", "https://twitter.com/kabu1000"),
        "かぶ１０００": ("かぶ1000", "https://twitter.com/kabu1000"),
        "弍億貯男": ("弍億貯男", "https://twitter.com/2okutameo"),
        "弐億貯男": ("弍億貯男", "https://twitter.com/2okutameo"),
        "テンバガー投資家X": ("テンバガー投資家X", "https://twitter.com/Investor__X"),
        "DAIBOUCHOU": ("DAIBOUCHOU", "https://twitter.com/DAIBOUCHO"),
    }

    print("Updating investor data...")
    for old_name, (new_name, twitter_url) in updates.items():
        # Check if record exists
        c.execute("SELECT id FROM investors WHERE name = ?", (old_name,))
        row = c.fetchone()
        
        if row:
            print(f"Updating {old_name} -> {new_name}")
            c.execute("UPDATE investors SET name = ?, twitter_url = ? WHERE name = ?", 
                      (new_name, twitter_url, old_name))
        else:
            print(f"Skipping {old_name} (Not found)")

    conn.commit()
    conn.close()
    print("Update complete.")

if __name__ == "__main__":
    update_investors()
