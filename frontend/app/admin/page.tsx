'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import styles from './admin.module.css';

export default function AdminPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [stats, setStats] = useState<any>(null);
    const [recentUsers, setRecentUsers] = useState<any[]>([]);
    const [investors, setInvestors] = useState<any[]>([]);
    const [newsForm, setNewsForm] = useState({ title: '', url: '', summary: '', investor_id: '' });
    const [investorForm, setInvestorForm] = useState({ id: '', name: '', twitter_url: '', image_url: '', style_description: '', aliases: '' });
    const [isEditingInvestor, setIsEditingInvestor] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push('/auth/signin');
            } else {
                fetchStats();
                fetchInvestors();
            }
        }
    }, [user, loading, router]);

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/admin/stats');
            if (res.ok) {
                const data = await res.json();
                setStats(data.stats);
                setRecentUsers(data.recentUsers);
            } else {
                setError('管理者権限がありません');
            }
        } catch (e) {
            console.error(e);
            setError('データの取得に失敗しました');
        }
    };

    const fetchInvestors = async () => {
        try {
            const res = await fetch('/api/investors');
            if (res.ok) {
                const data = await res.json();
                setInvestors(data.investors);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleNewsSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        try {
            const res = await fetch('/api/admin/news', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newsForm),
            });
            if (res.ok) {
                setMessage('ニュースを追加しました');
                setNewsForm({ title: '', url: '', summary: '', investor_id: '' });
            } else {
                const data = await res.json();
                alert(data.error);
            }
        } catch (e) {
            alert('工ラーが発生しました');
        }
    };

    const handleInvestorSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        const method = isEditingInvestor ? 'PUT' : 'POST';
        const body: any = { ...investorForm };

        // Parse aliases from string to array if needed to be safe, but API handles it? 
        // Actually our API expects `aliases` as string or JSON? 
        // The DB stores it as JSON string. The API implementation I wrote passes it directly.
        // Let's ensure we send what standard usage expects. The existing DB content is `["Alias"]`.
        // So the input should probably be a comma separated string that we can convert to JSON array string on submit?
        // Or just let user type JSON. Let's try comma separated for UX.

        try {
            // Convert comma separated string to JSON string array
            const aliasArray = investorForm.aliases.split(',').map(s => s.trim()).filter(s => s);
            body.aliases = JSON.stringify(aliasArray);

            const res = await fetch('/api/investors', {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            if (res.ok) {
                setMessage(isEditingInvestor ? '投資家情報を更新しました' : '投資家を追加しました');
                setInvestorForm({ id: '', name: '', twitter_url: '', image_url: '', style_description: '', aliases: '' });
                setIsEditingInvestor(false);
                fetchInvestors();
            } else {
                const data = await res.json();
                alert(data.error);
            }
        } catch (e) {
            alert('エラーが発生しました');
        }
    };

    const startEditInvestor = (inv: any) => {
        // aliases is stored as JSON string `["a", "b"]` from DB.
        let aliasStr = '';
        try {
            const parsed = JSON.parse(inv.aliases || '[]');
            if (Array.isArray(parsed)) aliasStr = parsed.join(', ');
        } catch (e) {
            aliasStr = inv.aliases || '';
        }

        setInvestorForm({
            id: inv.id,
            name: inv.name,
            twitter_url: inv.twitter_url || '',
            image_url: inv.image_url || '',
            style_description: inv.style_description || '',
            aliases: aliasStr
        });
        setIsEditingInvestor(true);
        setActiveTab('investors');
    };

    if (loading) return <div className={styles.container}>Loading...</div>;
    if (error) return <div className={styles.container} style={{ color: 'red' }}>{error}</div>;

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>管理者ダッシュボード</h1>

            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${activeTab === 'dashboard' ? styles.active : ''}`}
                    onClick={() => setActiveTab('dashboard')}
                >
                    ダッシュボード
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'investors' ? styles.active : ''}`}
                    onClick={() => setActiveTab('investors')}
                >
                    投資家管理
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'news' ? styles.active : ''}`}
                    onClick={() => setActiveTab('news')}
                >
                    ニュース追加
                </button>
            </div>

            {message && <div className={styles.message}>{message}</div>}

            {activeTab === 'dashboard' && stats && (
                <>
                    <div className={styles.grid}>
                        <div className={styles.card}>
                            <h3>総ユーザー数</h3>
                            <p className={styles.number}>{stats.totalUsers}</p>
                        </div>
                        <div className={styles.card}>
                            <h3>総アラート数</h3>
                            <p className={styles.number}>{stats.totalAlerts}</p>
                        </div>
                        <div className={styles.card}>
                            <h3>稼働中アラート</h3>
                            <p className={styles.number}>{stats.activeAlerts}</p>
                        </div>
                        <div className={styles.card}>
                            <h3>送信済み通知</h3>
                            <p className={styles.number}>{stats.totalNotifications}</p>
                        </div>
                    </div>

                    <div className={styles.section}>
                        <h2>最近登録したユーザー</h2>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>ニックネーム</th>
                                    <th>Email</th>
                                    <th>登録日時</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentUsers.map((u, i) => (
                                    <tr key={i}>
                                        <td>{u.nickname}</td>
                                        <td>{u.email}</td>
                                        <td>{new Date(u.created_at).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {activeTab === 'investors' && (
                <div className={styles.section}>
                    <h2>{isEditingInvestor ? '投資家を編集' : '新規投資家追加'}</h2>
                    <form onSubmit={handleInvestorSubmit} className={styles.form}>
                        <div className={styles.formGroup}>
                            <label>名前</label>
                            <input
                                type="text"
                                value={investorForm.name}
                                onChange={e => setInvestorForm({ ...investorForm, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Twitter URL</label>
                            <input
                                type="text"
                                value={investorForm.twitter_url}
                                onChange={e => setInvestorForm({ ...investorForm, twitter_url: e.target.value })}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>画像 URL</label>
                            <input
                                type="text"
                                value={investorForm.image_url}
                                onChange={e => setInvestorForm({ ...investorForm, image_url: e.target.value })}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>スタイル詳細</label>
                            <textarea
                                value={investorForm.style_description}
                                onChange={e => setInvestorForm({ ...investorForm, style_description: e.target.value })}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>別名 (カンマ区切り)</label>
                            <input
                                type="text"
                                value={investorForm.aliases}
                                onChange={e => setInvestorForm({ ...investorForm, aliases: e.target.value })}
                            />
                        </div>
                        <div className={styles.buttonGroup}>
                            <button type="submit" className={styles.submitBtn}>
                                {isEditingInvestor ? '更新する' : '追加する'}
                            </button>
                            {isEditingInvestor && (
                                <button
                                    type="button"
                                    className={styles.cancelBtn}
                                    onClick={() => {
                                        setIsEditingInvestor(false);
                                        setInvestorForm({ id: '', name: '', twitter_url: '', image_url: '', style_description: '', aliases: '' });
                                    }}
                                >
                                    キャンセル
                                </button>
                            )}
                        </div>
                    </form>

                    <h3>投資家一覧</h3>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>名前</th>
                                <th>スタイル</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {investors.map((inv) => (
                                <tr key={inv.id}>
                                    <td>{inv.id}</td>
                                    <td>{inv.name}</td>
                                    <td>{inv.style_description}</td>
                                    <td>
                                        <button onClick={() => startEditInvestor(inv)} className={styles.editBtn}>
                                            編集
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === 'news' && (
                <div className={styles.section}>
                    <h2>記事を手動で追加</h2>
                    <form onSubmit={handleNewsSubmit} className={styles.form}>
                        <div className={styles.formGroup}>
                            <label>投資家</label>
                            <select
                                value={newsForm.investor_id}
                                onChange={e => setNewsForm({ ...newsForm, investor_id: e.target.value })}
                                required
                            >
                                <option value="">選択してください</option>
                                {investors.map(inv => (
                                    <option key={inv.id} value={inv.id}>{inv.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label>タイトル</label>
                            <input
                                type="text"
                                value={newsForm.title}
                                onChange={e => setNewsForm({ ...newsForm, title: e.target.value })}
                                required
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>記事URL</label>
                            <input
                                type="url"
                                value={newsForm.url}
                                onChange={e => setNewsForm({ ...newsForm, url: e.target.value })}
                                required
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>要約/コメント</label>
                            <textarea
                                value={newsForm.summary}
                                onChange={e => setNewsForm({ ...newsForm, summary: e.target.value })}
                            />
                        </div>
                        <button type="submit" className={styles.submitBtn}>追加する</button>
                    </form>
                </div>
            )}
        </div>
    );
}
