'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import Link from 'next/link';

export default function SettingsPage() {
    const { user, loading, logout } = useAuth();
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);
    const [emailEnabled, setEmailEnabled] = useState(false);
    const [settingLoading, setSettingLoading] = useState(true);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/auth/signin');
        } else if (user) {
            // Fetch current setting
            fetch(`/api/settings/notifications?userId=${user.id}`)
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        setEmailEnabled(!!data.emailNotifications);
                    }
                    setSettingLoading(false);
                })
                .catch(err => {
                    console.error(err);
                    setSettingLoading(false);
                });
        }
    }, [user, loading, router]);

    const toggleEmail = async () => {
        const newValue = !emailEnabled;
        setEmailEnabled(newValue); // Optimistic update

        try {
            await fetch('/api/settings/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user?.id, emailNotifications: newValue })
            });
        } catch (e) {
            console.error(e);
            setEmailEnabled(!newValue); // Revert
            alert("設定の保存に失敗しました");
        }
    };

    if (loading || !user) return <div style={{ padding: '2rem' }}>Loading...</div>;

    const handleDeleteAccount = async () => {
        if (!confirm('本当にアカウントを削除しますか？\nこの操作は取り消せません。\n登録したアラートや設定はすべて削除されます。')) {
            return;
        }

        setIsDeleting(true);
        try {
            const res = await fetch('/api/auth/delete', {
                method: 'DELETE',
            });

            if (res.ok) {
                alert('アカウントを削除しました。ご利用ありがとうございました。');
                window.location.href = '/'; // Force reload to clear client state
            } else {
                alert('削除に失敗しました。');
                setIsDeleting(false);
            }
        } catch (error) {
            console.error(error);
            alert('エラーが発生しました。');
            setIsDeleting(false);
        }
    };

    return (
        <div style={{ maxWidth: '600px', margin: '2rem auto', padding: '0 1rem' }}>
            <h1 style={{ marginBottom: '2rem', borderBottom: '1px solid #333', paddingBottom: '0.5rem' }}>アカウント設定</h1>

            <section style={{ marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#fff' }}>プロフィール情報</h2>
                <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '8px' }}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.9rem', marginBottom: '0.3rem' }}>ニックネーム</label>
                        <div style={{ fontSize: '1.1rem' }}>{user.nickname}</div>
                    </div>
                    <div>
                        <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.9rem', marginBottom: '0.3rem' }}>ユーザーID</label>
                        <div style={{ fontFamily: 'monospace', color: '#cbd5e1' }}>{user.userId}</div>
                    </div>
                </div>
            </section >

            <section style={{ marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#fff' }}>通知設定</h2>
                <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', color: '#f8fafc', fontSize: '1rem', fontWeight: 'bold' }}>メール通知</label>
                            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.3rem' }}>
                                登録したアラート条件にヒットした際、メールを受け取る
                            </p>
                        </div>
                        <div>
                            <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '50px', height: '28px' }}>
                                <input
                                    type="checkbox"
                                    checked={emailEnabled}
                                    onChange={toggleEmail}
                                    disabled={settingLoading || !user.email}
                                    style={{ opacity: 0, width: 0, height: 0 }}
                                />
                                <span style={{
                                    position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                                    backgroundColor: emailEnabled ? '#3b82f6' : '#ccc', borderRadius: '34px', transition: '.4s'
                                }}>
                                    <span style={{
                                        position: 'absolute', content: '""', height: '20px', width: '20px', left: '4px', bottom: '4px',
                                        backgroundColor: 'white', borderRadius: '50%', transition: '.4s',
                                        transform: emailEnabled ? 'translateX(22px)' : 'translateX(0)'
                                    }}></span>
                                </span>
                            </label>
                        </div>
                    </div>
                    {user.email ? (
                        <div style={{ fontSize: '0.9rem', color: '#94a3b8', marginTop: '0.5rem' }}>
                            送信先: <span style={{ color: '#cbd5e1' }}>{user.email}</span>
                        </div>
                    ) : (
                        <div style={{ fontSize: '0.9rem', color: '#ef4444', marginTop: '0.5rem' }}>
                            ※ メールアドレスが未登録です。再ログインまたは登録が必要です。
                        </div>
                    )}
                </div>
            </section>

            <section style={{ marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#fff' }}>プラン設定</h2>
                <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.9rem', marginBottom: '0.3rem' }}>現在のプラン</label>
                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: user.plan === 'pro' ? '#fbbf24' : '#fff' }}>
                                {user.plan === 'pro' ? '🏆 Pro Plan' : 'Free Plan'}
                            </div>
                        </div>
                        {user.plan !== 'pro' && (
                            <span style={{ fontSize: '0.8rem', background: '#334155', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                                無料
                            </span>
                        )}
                    </div>

                    {user.plan !== 'pro' && (
                        <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #334155' }}>
                            <label style={{ display: 'block', color: '#f8fafc', fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>招待コードをお持ちの方</label>
                            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1rem' }}>
                                招待コードを入力すると、Pro機能を無料で利用できます。
                            </p>
                            <form onSubmit={async (e) => {
                                e.preventDefault();
                                const form = e.target as HTMLFormElement;
                                const input = form.elements.namedItem('inviteCode') as HTMLInputElement;
                                const code = input.value;

                                if (!code) return;

                                if (!confirm('招待コードを適用しますか？')) return;

                                try {
                                    const res = await fetch('/api/settings/upgrade', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ code })
                                    });

                                    const data = await res.json();

                                    if (res.ok) {
                                        alert(data.message);
                                        window.location.reload();
                                    } else {
                                        alert(data.error || 'コードの適用に失敗しました');
                                    }
                                } catch (err) {
                                    alert('エラーが発生しました');
                                }
                            }}>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input
                                        name="inviteCode"
                                        type="text"
                                        placeholder="例: ABC12345"
                                        style={{
                                            flex: 1,
                                            padding: '0.6rem',
                                            borderRadius: '4px',
                                            border: '1px solid #475569',
                                            background: '#0f172a',
                                            color: '#fff'
                                        }}
                                    />
                                    <button
                                        type="submit"
                                        style={{
                                            background: '#fbbf24',
                                            color: '#000',
                                            border: 'none',
                                            borderRadius: '4px',
                                            padding: '0 1rem',
                                            fontWeight: 'bold',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        適用
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </section>

            <section style={{ marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#ff6b6b' }}>危険なエリア</h2>
                <div style={{ border: '1px solid #ef4444', background: 'rgba(239, 68, 68, 0.1)', padding: '1.5rem', borderRadius: '8px' }}>
                    <h3 style={{ fontSize: '1rem', color: '#ef4444', marginBottom: '0.5rem', marginTop: 0 }}>アカウント削除</h3>
                    <p style={{ fontSize: '0.9rem', color: '#cbd5e1', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                        アカウントを削除すると、設定したアラートや通知履歴など、すべてのデータが完全に削除されます。この操作は元に戻せません。
                    </p>
                    <button
                        onClick={handleDeleteAccount}
                        disabled={isDeleting}
                        style={{
                            background: '#ef4444',
                            color: '#fff',
                            border: 'none',
                            padding: '0.6rem 1.2rem',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            opacity: isDeleting ? 0.7 : 1
                        }}
                    >
                        {isDeleting ? '削除中...' : 'アカウントを削除する'}
                    </button>
                </div>
            </section>

            <Link href="/" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem' }}>
                &larr; ホームに戻る
            </Link>
        </div >
    );
}
