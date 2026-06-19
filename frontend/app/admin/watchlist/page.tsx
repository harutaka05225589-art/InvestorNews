'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../hooks/useAuth';
import styles from '../admin.module.css';

interface WatchlistItem {
    id: number;
    name: string;
    ticker: string;
    price_above: number | null;
    price_below: number | null;
    drop_threshold: number;
    per_limit: number;
    is_active: number;
    last_price: number | null;
    high_52w: number | null;
    drop_pct: number | null;
    current_per: number | null;
    market_cap_oku: number | null;
    buy_signal: string;
    signal_reasons: string;
    last_checked_at: string | null;
    last_alerted_at: string | null;
}

export default function AdminWatchlistPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [items, setItems] = useState<WatchlistItem[]>([]);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [form, setForm] = useState({
        name: '', ticker: '',
        price_above: '', price_below: '',
        drop_threshold: '-20', per_limit: '15'
    });

    // Search Suggestions State
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Debounce Search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (form.name.length >= 2 && showForm) {
                fetchSuggestions(form.name);
            } else {
                setSuggestions([]);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [form.name, showForm]);

    const fetchSuggestions = async (q: string) => {
        try {
            const res = await fetch(`/api/search/companies?q=${encodeURIComponent(q)}`);
            if (res.ok) {
                const data = await res.json();
                setSuggestions(data.results || []);
                setShowSuggestions(true);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const fetchItems = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/watchlist');
            if (res.status === 403) {
                setError('管理者権限がありません');
                return;
            }
            if (res.ok) {
                const data = await res.json();
                setItems(data.items);
            }
        } catch (e) {
            setError('データの取得に失敗しました');
        }
    }, []);

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push('/auth/signin');
            } else {
                fetchItems();
            }
        }
    }, [user, loading, router, fetchItems]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        setMessage('');
        setError('');
        try {
            const res = await fetch('/api/admin/watchlist/refresh', { method: 'POST' });
            const data = await res.json();
            if (res.ok) {
                setItems(data.items);
                setMessage(`✅ ${data.message}`);
            } else {
                setError(data.error || '更新に失敗しました');
            }
        } catch (e) {
            setError('株価の取得に失敗しました');
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        setError('');

        const body: any = {
            name: form.name,
            ticker: form.ticker,
            price_above: form.price_above ? parseFloat(form.price_above) : null,
            price_below: form.price_below ? parseFloat(form.price_below) : null,
            drop_threshold: parseFloat(form.drop_threshold) || -20,
            per_limit: parseFloat(form.per_limit) || 15,
        };

        if (editingId) body.id = editingId;

        try {
            const res = await fetch('/api/admin/watchlist', {
                method: editingId ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (res.ok) {
                setMessage(data.message);
                resetForm();
                fetchItems();
            } else {
                setError(data.error);
            }
        } catch (e) {
            setError('エラーが発生しました');
        }
    };

    const handleDelete = async (id: number, name: string) => {
        if (!confirm(`「${name}」を削除しますか？`)) return;
        try {
            const res = await fetch(`/api/admin/watchlist?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                setMessage('削除しました');
                fetchItems();
            }
        } catch (e) {
            setError('削除に失敗しました');
        }
    };

    const startEdit = (item: WatchlistItem) => {
        setForm({
            name: item.name,
            ticker: item.ticker,
            price_above: item.price_above?.toString() || '',
            price_below: item.price_below?.toString() || '',
            drop_threshold: item.drop_threshold?.toString() || '-20',
            per_limit: item.per_limit?.toString() || '15',
        });
        setEditingId(item.id);
        setShowForm(true);
    };

    const resetForm = () => {
        setForm({ name: '', ticker: '', price_above: '', price_below: '', drop_threshold: '-20', per_limit: '15' });
        setEditingId(null);
        setShowForm(false);
    };

    const formatNum = (n: number | null, decimals = 0) => {
        if (n === null || n === undefined) return '-';
        return n.toLocaleString('ja-JP', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    };

    if (loading) return <div className={styles.container}>Loading...</div>;
    if (error && !items.length) return <div className={styles.container} style={{ color: '#ff6b6b' }}>{error}</div>;

    return (
        <div className={styles.container}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h1 className={styles.title} style={{ marginBottom: 0, borderBottom: 'none', paddingBottom: 0 }}>
                    📊 株価ウォッチリスト
                </h1>
                <div style={{ display: 'flex', gap: '0.8rem' }}>
                    <button
                        onClick={() => router.push('/admin')}
                        style={{
                            background: 'transparent', border: '1px solid #444', color: '#aaa',
                            padding: '0.6rem 1.2rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem'
                        }}
                    >
                        ← 管理画面へ
                    </button>
                    <button
                        onClick={() => { setShowForm(!showForm); if (showForm) resetForm(); }}
                        style={{
                            background: showForm ? '#333' : 'var(--accent, #00d4ff)',
                            color: showForm ? '#fff' : '#000',
                            border: 'none', padding: '0.6rem 1.2rem', borderRadius: '6px',
                            cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem'
                        }}
                    >
                        {showForm ? '✕ 閉じる' : '＋ 銘柄追加'}
                    </button>
                </div>
            </div>

            {message && <div className={styles.message}>{message}</div>}
            {error && <div style={{ padding: '1rem', background: 'rgba(255,0,0,0.1)', border: '1px solid #ff4444', color: '#ff6b6b', marginBottom: '1rem', borderRadius: '4px' }}>{error}</div>}

            {/* Add/Edit Form */}
            {showForm && (
                <div className={styles.form} style={{ marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#fff' }}>
                        {editingId ? '銘柄を編集' : '新規銘柄を追加'}
                    </h2>
                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className={styles.formGroup} style={{ position: 'relative' }}>
                                <label>銘柄検索（コード・会社名） *</label>
                                <input 
                                    type="text" 
                                    value={form.name} 
                                    onChange={e => setForm({ ...form, name: e.target.value })} 
                                    onFocus={() => form.name.length >= 2 && setShowSuggestions(true)}
                                    placeholder="例: トヨタ または 7203" 
                                    required 
                                    autoComplete="off"
                                />
                                {/* Suggestions Dropdown */}
                                {showSuggestions && suggestions.length > 0 && (
                                    <>
                                        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9 }} onClick={() => setShowSuggestions(false)}></div>
                                        <ul style={{
                                            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
                                            background: '#1e293b', border: '1px solid #334155', borderRadius: '4px',
                                            listStyle: 'none', padding: 0, margin: '4px 0 0 0', maxHeight: '250px', overflowY: 'auto',
                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                        }}>
                                            {suggestions.map((c) => (
                                                <li
                                                    key={c.ticker}
                                                    onClick={() => {
                                                        // Auto-fill both name and ticker, append .T to ticker
                                                        setForm({ ...form, name: c.name, ticker: `${c.ticker}.T` });
                                                        setShowSuggestions(false);
                                                    }}
                                                    style={{
                                                        padding: '0.6rem 1rem', cursor: 'pointer', borderBottom: '1px solid #334155',
                                                        display: 'flex', gap: '1rem', alignItems: 'center'
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.background = '#334155'}
                                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                                >
                                                    <span style={{ color: '#38bdf8', fontWeight: 'bold', width: '60px' }}>{c.ticker}</span>
                                                    <span style={{ color: '#f1f5f9' }}>{c.name}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </>
                                )}
                            </div>
                            <div className={styles.formGroup}>
                                <label>ティッカー *</label>
                                <input type="text" value={form.ticker} onChange={e => setForm({ ...form, ticker: e.target.value })} placeholder="例: 285A.T" required />
                            </div>
                            <div className={styles.formGroup}>
                                <label>上限アラート（円）</label>
                                <input type="number" step="0.01" value={form.price_above} onChange={e => setForm({ ...form, price_above: e.target.value })} placeholder="この価格以上で通知" />
                            </div>
                            <div className={styles.formGroup}>
                                <label>下限アラート（円）</label>
                                <input type="number" step="0.01" value={form.price_below} onChange={e => setForm({ ...form, price_below: e.target.value })} placeholder="この価格以下で通知" />
                            </div>
                            <div className={styles.formGroup}>
                                <label>52週高値下落率アラート（%）</label>
                                <input type="number" step="1" value={form.drop_threshold} onChange={e => setForm({ ...form, drop_threshold: e.target.value })} />
                            </div>
                            <div className={styles.formGroup}>
                                <label>PER上限（倍）</label>
                                <input type="number" step="0.1" value={form.per_limit} onChange={e => setForm({ ...form, per_limit: e.target.value })} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                            <button type="submit" className={styles.submitBtn}>
                                {editingId ? '更新する' : '追加する'}
                            </button>
                            {editingId && (
                                <button type="button" className={styles.cancelBtn} onClick={resetForm}>キャンセル</button>
                            )}
                        </div>
                    </form>
                </div>
            )}

            {/* Refresh Button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ color: '#888', fontSize: '0.85rem' }}>
                    {items.length > 0 && items[0].last_checked_at
                        ? `最終更新: ${new Date(items[0].last_checked_at).toLocaleString('ja-JP')}`
                        : '未取得'}
                </span>
                <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    style={{
                        background: isRefreshing ? '#333' : 'linear-gradient(135deg, #00d4ff, #0099cc)',
                        color: '#fff', border: 'none',
                        padding: '0.7rem 1.5rem', borderRadius: '8px',
                        cursor: isRefreshing ? 'not-allowed' : 'pointer',
                        fontWeight: 'bold', fontSize: '0.95rem',
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        boxShadow: isRefreshing ? 'none' : '0 2px 8px rgba(0, 212, 255, 0.3)',
                        transition: 'all 0.2s',
                    }}
                >
                    {isRefreshing ? (
                        <>
                            <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⏳</span>
                            取得中...
                        </>
                    ) : (
                        <>🔄 今すぐ株価チェック</>
                    )}
                </button>
            </div>

            {/* Watchlist Table */}
            {items.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
                    <p style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>ウォッチリストが空です</p>
                    <p>「＋ 銘柄追加」ボタンから銘柄を登録してください</p>
                </div>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>銘柄</th>
                                <th style={{ textAlign: 'right' }}>株価</th>
                                <th style={{ textAlign: 'right' }}>52週高値</th>
                                <th style={{ textAlign: 'right' }}>下落率</th>
                                <th style={{ textAlign: 'right' }}>PER</th>
                                <th style={{ textAlign: 'right' }}>時価総額</th>
                                <th style={{ textAlign: 'center' }}>アラート設定</th>
                                <th style={{ textAlign: 'center' }}>シグナル</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map(item => {
                                const dropColor = item.drop_pct !== null
                                    ? item.drop_pct <= -20 ? '#ff4444'
                                    : item.drop_pct <= -10 ? '#ff8800'
                                    : item.drop_pct >= 0 ? '#44cc44'
                                    : '#ccc'
                                    : '#666';

                                return (
                                    <tr key={item.id} style={{ opacity: item.is_active ? 1 : 0.5 }}>
                                        <td>
                                            <div style={{ fontWeight: 'bold' }}>{item.name}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#888' }}>{item.ticker}</div>
                                        </td>
                                        <td style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: '1.05rem', fontWeight: 'bold' }}>
                                            {item.last_price ? `¥${formatNum(item.last_price)}` : '-'}
                                        </td>
                                        <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#aaa' }}>
                                            {item.high_52w ? `¥${formatNum(item.high_52w)}` : '-'}
                                        </td>
                                        <td style={{ textAlign: 'right', fontFamily: 'monospace', color: dropColor, fontWeight: 'bold' }}>
                                            {item.drop_pct !== null ? `${item.drop_pct}%` : '-'}
                                        </td>
                                        <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>
                                            {item.current_per !== null ? `${item.current_per}x` : '-'}
                                        </td>
                                        <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#aaa' }}>
                                            {item.market_cap_oku ? `${formatNum(item.market_cap_oku, 0)}億` : '-'}
                                        </td>
                                        <td style={{ textAlign: 'center', fontSize: '0.8rem' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                {item.price_above && (
                                                    <span style={{ color: '#44cc44' }}>↑ ¥{formatNum(item.price_above)}</span>
                                                )}
                                                {item.price_below && (
                                                    <span style={{ color: '#ff4444' }}>↓ ¥{formatNum(item.price_below)}</span>
                                                )}
                                                {!item.price_above && !item.price_below && (
                                                    <span style={{ color: '#555' }}>-</span>
                                                )}
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            {item.buy_signal === '◎' ? (
                                                <div>
                                                    <span style={{ fontSize: '1.5rem' }}>🎯</span>
                                                    <div style={{ fontSize: '0.7rem', color: '#ffaa00', marginTop: '2px' }}>
                                                        {item.signal_reasons}
                                                    </div>
                                                </div>
                                            ) : (
                                                <span style={{ color: '#555' }}>-</span>
                                            )}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                                                <button onClick={() => startEdit(item)} className={styles.editBtn}>編集</button>
                                                <button
                                                    onClick={() => handleDelete(item.id, item.name)}
                                                    className={styles.editBtn}
                                                    style={{ background: '#441111', color: '#ff6666' }}
                                                >
                                                    削除
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            <style jsx>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
