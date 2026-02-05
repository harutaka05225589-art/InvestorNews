import sqlite3
import os
from database import get_db_connection

def update_bios():
    conn = get_db_connection()
    c = conn.cursor()
    
    # 井村俊哉 (Imura Toshiya)
    imura_bio = """
## 経歴・概要
元お笑い芸人（トリオ「ザ・フライ」）から数十億円の資産を築いた異色の投資家。通称「株芸人」「Zeppy井村」。
中小企業診断士の資格を持ち、徹底的なファンダメンタルズ分析（企業分析）を行うことで知られる。
2011年に元手100万円で株式投資を開始し、2017年に"億り人"を達成。その後も資産を急拡大させ、2020年代には数十億円規模の運用を行う大口個人投資家となった。

## 投資スタイル
**「徹底的な開示情報の読み込み」**と**「現地調査・IR取材」**を武器とする。
決算短信、有価証券報告書、中期経営計画などを隅々まで読み込み、市場が織り込んでいない「アルファ（超過収益）」を探し出すスタイル。
特に、海運株（三井松島HD）の大株主として名を連ねた際のトレードは有名で、市場への影響力も極めて大きい。

## 主なエピソード
- お笑い芸人時代の年収は数万円だった時期もある。
- 1日十数時間を銘柄分析に費やす「投資の鬼」。
- YouTubeチャンネル「Zeppy投資ちゃんねる」の創設メンバーとしても活躍（現在は卒業）。
"""

    # 五味大輔 (Gomi Daisuke)
    gomi_bio = """
## 経歴・概要
中学生時代から株式投資を始め、資産数百億円（推定）を運用する日本屈指の個人投資家。通称「そーせい五味」とも呼ばれる。
学生時代にアルバイトで貯めた資金を元手に、ゲーム株やIT株への投資で資産を増やした。
ソフトバンクグループの孫正義氏も注目するほどの実力を持ち、あの大手運用会社からも一目置かれる存在。

## 投資スタイル
**「長期・集中・現物」**が基本。
数千銘柄をチェックし、その中で確信度の高い数銘柄に数十億〜百億円単位で集中投資を行う。
特に「生活に身近な成長株」「時価総額がまだ小さいが将来性のある企業」を好む傾向がある。
一度保有すると数年単位で持ち続け、企業の成長をじっくり待つスタイル。

## 代表的な保有銘柄（過去含む）
- **そーせいグループ**: 大株主として有名になり、彼の代名詞ともなった。
- **MIXI (ミクシィ)**: 「モンスターストライク」の大ヒット前から保有し、巨額の利益を得たと言われる。
- **イー・ギャランティ**: 長期保有銘柄の一つ。
- **ENECHANGE**: 大株主として名を連ねる。
"""

    updates = [
        ("井村俊哉", imura_bio),
        ("五味大輔", gomi_bio)
    ]

    print("Updating bios...")
    for name, bio in updates:
        # Check if exists
        exists = c.execute("SELECT id FROM investors WHERE name = ?", (name,)).fetchone()
        if exists:
            c.execute("UPDATE investors SET profile = ? WHERE name = ?", (bio, name))
            print(f"Updated bio for: {name}")
        else:
            print(f"Warning: Investor {name} not found. Please run add_new_investors_v2.py first.")

    conn.commit()
    conn.close()
    print("Bio update complete.")

if __name__ == "__main__":
    update_bios()
