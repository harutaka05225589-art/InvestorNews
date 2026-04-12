'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import styles from './alerts.module.css';

type Alert = {
    id: number;
    ticker: string;
    target_per: number;
    condition: 'ABOVE' | 'BELOW';
    is_active: number;
    current_per?: number;
    company_name?: string;
    memo?: string;
};

type Company = {
    ticker: string;
    name: string;
};

export default function AlertsPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [alerts, setAlerts] = useState<Alert[]>([]);

    // Form State
    const [ticker, setTicker] = useState('');
    const [memo, setMemo] = useState('');
    const [msg, setMsg] = useState('');

    // Search Suggestions State
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState<Company[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Edit Memo State
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editMemo, setEditMemo] = useState('');

    useEffect(() => {
        if (!loading && !user) {
            router.push('/auth/signin');
            return;
        }
        if (user) {
            fetchAlerts();
        }
    }, [user, loading, router]);

    // Debounce Search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.length >= 2) {
                fetchSuggestions(query);
            } else {
                setSuggestions([]);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [query]);

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

    const fetchAlerts = async () => {
        const res = await fetch('/api/alerts');
        if (res.ok) {
            const data = await res.json();
            setAlerts(data.alerts || []);
        }
    };

    const handleSelectCompany = (c: Company) => {
        setTicker(c.ticker);
        setQuery(`${c.ticker} ${c.name}`); // Show selected info
        setShowSuggestions(false);
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        setMsg('');

        if (!ticker) {
            setMsg('銘柄を指定してください');
            return;
        }

        const res = await fetch('/api/alerts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ticker: ticker.toUpperCase().trim(),
                target_per: null,
                condition: null,
                memo: memo
            }),
        });

        if (res.ok) {
            setTicker('');
            setQuery('');
            setMemo('');
            fetchAlerts();
            setMsg('ウォッチリストに追加しました');
        } else {
            setMsg('作成に失敗しました');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('削除しますか？')) return;
        const res = await fetch('/api/alerts', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
        });
        if (res.ok) fetchAlerts();
    };

    const startEditing = (alert: Alert) => {
        setEditingId(alert.id);
        setEditMemo(alert.memo || '');
    };

    const saveMemo = async (id: number) => {
        const res = await fetch('/api/alerts', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, memo: editMemo }),
        });

        if (res.ok) {
            setEditingId(null);
            fetchAlerts();
        } else {
            alert('メモの保存に失敗しました');
        }
    };

    if (loading) return <div className={styles.container}>Loading...</div>;

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>登録銘柄 (ウォッチリスト)</h1>
            <p className={styles.desc}>
                気になる銘柄を登録して、決算カレンダーで情報をチェックしましょう。<br />
                自分だけのメモ（購入理由やチェックポイントなど）も残せます。
                <br />
                <span style={{ fontSize: '0.9em', color: 'var(--accent)' }}>
                    ※ 登録した銘柄は「決算カレンダー」の「MY」タブで、その銘柄だけの決算スケジュールを確認できるようになります。
                </span>
            </p>

            <div className={styles.panel}>
                <form onSubmit={handleAdd} className={styles.form}>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-start', width: '100%' }}>
                        <div className={styles.field} style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
                            <label>銘柄検索 (コード・会社名)</label>
                            <input
                                type="text"
                                value={query}
                                onChange={e => {
                                    setQuery(e.target.value);
                                    if (e.target.value === '') setTicker('');
                                }}
                                placeholder="例: トヨタ または 7203"
                                required
                                autoComplete="off"
                                onFocus={() => query.length >= 2 && setShowSuggestions(true)}
                            />
                            {/* Suggestions Dropdown */}
                            {showSuggestions && suggestions.length > 0 && (
                                <ul className={styles.suggestionsList}>
                                    {suggestions.map((c) => (
                                        <li
                                            key={c.ticker}
                                            onClick={() => handleSelectCompany(c)}
                                            className={styles.suggestionItem}
                                        >
                                            <span className={styles.sugTicker}>{c.ticker}</span>
                                            <span className={styles.sugName}>{c.name}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            {/* Overlay to close suggestions */}
                            {showSuggestions && <div className={styles.overlay} onClick={() => setShowSuggestions(false)}></div>}
                        </div>

                        <div className={styles.field} style={{ flex: 1, minWidth: '250px' }}>
                            <label>メモ (任意)</label>
                            <input
                                type="text"
                                value={memo}
                                onChange={e => setMemo(e.target.value)}
                                placeholder="例: 決算またぎ狙い、1500円以下で検討"
                            />
                        </div>
                    </div>

                    {/* Hidden actual ticker input or display only */}
                    {ticker && <div style={{ fontSize: '0.8rem', color: 'var(--accent)', marginBottom: '0.5rem', width: '100%' }}>
                        選択中: {ticker}
                    </div>}

                    <button type="submit" className={styles.addButton} style={{ marginTop: '0.5rem' }}>ウォッチリストに追加</button>
                </form>
                {msg && <p className={styles.msg}>{msg}</p>}
            </div>

            <div className={styles.list}>
                <h2>登録済み銘柄</h2>
                {alerts.length === 0 ? (
                    <p className={styles.empty}>登録された銘柄はありません</p>
                ) : (
                    <ul style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {alerts.map((alert: any) => (
                            <li key={alert.id} className={styles.item} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                    <div className={styles.itemInfo}>
                                        <div>
                                            <span className={styles.ticker}>
                                                <a href={`https://finance.yahoo.co.jp/quote/${alert.ticker}.T`} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
                                                    {alert.ticker} ↗
                                                </a>
                                            </span>
                                            <span style={{ marginLeft: '1rem', fontWeight: 'bold' }}>{alert.company_name || '名称不明'}</span>
                                        </div>
                                    </div>
                                    <button onClick={() => handleDelete(alert.id)} className={styles.delButton}>
                                        削除
                                    </button>
                                </div>

                                {/* Memo Section */}
                                <div style={{ width: '100%', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
                                    {editingId === alert.id ? (
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <input
                                                type="text"
                                                value={editMemo}
                                                onChange={e => setEditMemo(e.target.value)}
                                                className={styles.memoInput}
                                                style={{ flex: 1, padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--primary)', background: '#1e293b', color: '#fff' }}
                                                autoFocus
                                            />
                                            <button onClick={() => saveMemo(alert.id)} style={{ padding: '0.4rem 1rem', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>保存</button>
                                            <button onClick={() => setEditingId(null)} style={{ padding: '0.4rem 0.8rem', background: 'transparent', color: '#fff', border: '1px solid #666', borderRadius: '4px', cursor: 'pointer' }}>キャンセル</button>
                                        </div>
                                    ) : (
                                        <div
                                            onClick={() => startEditing(alert)}
                                            style={{
                                                fontSize: '0.9rem',
                                                color: alert.memo ? '#e2e8f0' : 'rgba(255,255,255,0.3)',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem'
                                            }}
                                            title="クリックしてメモを編集"
                                        >
                                            <span style={{ fontSize: '1.1rem' }}>📝</span>
                                            {alert.memo ? alert.memo : <span style={{ fontStyle: 'italic' }}>メモを追加...</span>}
                                        </div>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
