export default function PrivacyPage() {
    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem', lineHeight: '1.8' }}>
            <h1 style={{ marginBottom: '2rem', borderBottom: '2px solid var(--primary)', paddingBottom: '0.5rem', display: 'inline-block' }}>プライバシーポリシー</h1>

            <section style={{ marginBottom: '2.5rem' }}>
                <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>第1条（個人情報の利用目的）</h2>
                <p>
                    当サイト（億り人・決算速報）では、お問い合わせや記事へのコメントの際、名前やメールアドレス等の個人情報を取得する場合があります。<br />
                    取得した個人情報は、お問い合わせに対する回答や必要な情報を電子メールなどでご連絡する場合にのみ利用し、これらの目的以外では利用いたしません。
                </p>
                <p style={{ marginTop: '1rem' }}>
                    また、会員登録機能（ログイン）においては、ユーザーごとの設定（アラート登録やウォッチリスト）を保存するために認証情報を使用しますが、これも本サービスの提供以外の目的では使用いたしません。
                </p>
            </section>

            <section style={{ marginBottom: '2.5rem' }}>
                <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>第2条（広告の配信について）</h2>
                <p>
                    当サイトでは、第三者配信の広告サービス（Google AdSense）を利用しており、ユーザーの興味に応じた商品やサービスの広告を表示するため、クッキー（Cookie）を使用しております。<br />
                    クッキーを使用することで当サイトはお客様のコンピュータを識別できるようになりますが、お客様個人を特定できるものではありません。<br />
                    Cookieを無効にする方法やGoogleアドセンスに関する詳細は<a href="https://policies.google.com/technologies/ads?hl=ja" target="_blank" rel="nofollow noreferrer" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>「Googleポリシーと規約」</a>をご確認ください。
                </p>
            </section>

            <section style={{ marginBottom: '2.5rem' }}>
                <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>第3条（アクセス解析ツールについて）</h2>
                <p>
                    当サイトでは、Googleによるアクセス解析ツール「Googleアナリティクス」を利用しています。<br />
                    このGoogleアナリティクスはトラフィックデータの収集のためにクッキー（Cookie）を使用しております。トラフィックデータは匿名で収集されており、個人を特定するものではありません。
                </p>
            </section>

            <section style={{ marginBottom: '2.5rem' }}>
                <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>第4条（情報の取得元について）</h2>
                <p>
                    当サイトで配信している決算情報や大量保有報告書等のデータは、金融庁の公開するEDINET APIおよび適時開示情報閲覧サービス（TDnet）、日本取引所グループ（JPX）の公開データを元に独自に集計・加工して表示しています。<br />
                    情報の正確性には万全を期していますが、その内容を保証するものではありません。投資の最終決定は、ご自身の判断で行ってください。
                </p>
            </section>

            <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>第5条（免責事項）</h2>
                <p>
                    当サイトからのリンクやバナーなどで移動したサイトで提供される情報、サービス等について一切の責任を負いません。<br />
                    当サイトのコンテンツ・情報について、できる限り正確な情報を掲載するよう努めておりますが、正確性や安全性を保証するものではありません。<br />
                    当サイトに掲載された内容によって生じた損害等の一切の責任を負いかねますのでご了承ください。
                </p>
            </section>
        </div>
    );
}
