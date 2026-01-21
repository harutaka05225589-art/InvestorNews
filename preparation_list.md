# 今後の実装に必要なものリスト

次の「AI要約機能」と「通知機能」の実装に向けて、以下のご準備をお願いします。

## 1. AI要約機能に必要なもの
ニュースやレポートをAIに要約させるために必要です。
以下のいずれかのAPIキーをご用意ください。（OpenAIが推奨です）

-   **OpenAI API Key (ChatGPT)**
    -   APIキーの取得: [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
    -   課金設定（Credits）が必要です（最低5ドル程度で十分です）。
-   **または Google Gemini API Key**
    -   取得: [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)

## 2. 通知機能（メール）に必要なもの
ユーザーにアラートメールを送信するために使います。
Gmailを使う場合、通常のパスワードではなく「アプリパスワード」が必要です。

-   **Gmailアカウント**（送信用）
-   **Gmail アプリパスワード**
    1.  Googleアカウント管理画面へ [https://myaccount.google.com/](https://myaccount.google.com/)
    2.  左側の「セキュリティ」を選択
    3.  「2段階認証プロセス」をオンにする
    4.  検索バーで「アプリ パスワード」と検索して作成画面へ
    5.  アプリ名に適当な名前（例: `InvestorNews`）を入力して作成
    6.  表示された16桁のパスワードをメモしてください。

※ LINE通知をご希望の場合は「LINE Notify」のトークンが必要ですが、まずはメールから始めるのがおすすめです。

---
準備ができたら、チャットでAPIキーなどを共有いただくか（セキュリティ的に不安であれば）サーバー上の `.env` ファイルに直接書き込む方法をご案内します。
