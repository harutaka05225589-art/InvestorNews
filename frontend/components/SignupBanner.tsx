'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export default function SignupBanner() {
    const { user, loading } = useAuth();

    if (loading || user) {
        return null; // Don't show if logged in or loading
    }

    return (
        <div style={{
            margin: '2rem 0',
            padding: '1.5rem',
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            borderRadius: '12px',
            border: '1px solid #334155',
            borderLeft: '4px solid var(--accent)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            alignItems: 'center',
            textAlign: 'center'
        }}>
            <div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: '#f8fafc' }}>
                    🔔 この銘柄の決算速報を受け取りませんか？
                </h3>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.5' }}>
                    無料アカウントを作成してウォッチリストに登録すると、<br/>
                    上方修正や増配などの重要なお知らせが<strong>LINE</strong>に直接届きます。
                </p>
            </div>
            <Link href="/auth/signup" style={{
                background: 'var(--accent)',
                color: '#000',
                padding: '0.6rem 1.5rem',
                borderRadius: '30px',
                fontWeight: 'bold',
                textDecoration: 'none',
                fontSize: '0.95rem',
                display: 'inline-block',
                boxShadow: '0 2px 8px rgba(74, 222, 128, 0.3)'
            }}>
                無料登録して通知を設定する
            </Link>
        </div>
    );
}
