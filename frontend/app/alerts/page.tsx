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
    const [targetPER, setTargetPER] = useState('');
    const [condition, setCondition] = useState<'ABOVE' | 'BELOW'>('BELOW');
    const [msg, setMsg] = useState('');

    // Search Suggestions State
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState<Company[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

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
                setSuggestions(data.companies);
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
            setAlerts(data.alerts);
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
                ticker: ticker.replace(/\D/g, ''), // Ensure clean ticker
                target_per: parseFloat(targetPER),
                condition
            }),
        });

        if (res.ok) {
            setTicker('');
            setQuery('');
            setTargetPER('');
            fetchAlerts();
            setMsg('アラートを作成しました');
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

    if (loading) return <div className={styles.container}>Loading...</div>;

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>PERアラート管理</h1>
            <p className={styles.desc}>
                指定した銘柄のPERが条件を満たしたときに通知を受け取ることができます。
                <br />(現在はベータ版のため、通知機能は順次有効化されます)
            </p>

            <div className={styles.panel}>
                <form onSubmit={handleAdd} className={styles.form}>
                    <div className={styles.field} style={{ position: 'relative' }}>
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

                    {/* Hidden actual ticker input or display only */}
                    {ticker && <div style={{ fontSize: '0.8rem', color: 'var(--accent)', marginBottom: '1rem' }}>
                        選択中: {ticker}
                    </div>}

                    <div className={styles.field}>
                        <label>目標PER</label>
                        <input
                            type="number"
                            step="0.1"
                            value={targetPER}
                            onChange={e => setTargetPER(e.target.value)}
                            placeholder="例: 15.0"
                            required
                        />
                    </div>
                    <div className={styles.field}>
                        <label>条件</label>
                        <select
                            value={condition}
                            onChange={e => setCondition(e.target.value as 'ABOVE' | 'BELOW')}
                        >
                            <option value="BELOW">以下になったら (割安)</option>
                            <option value="ABOVE">以上になったら (割高)</option>
                        </select>
                    </div>
                    <button type="submit" className={styles.addButton}>追加</button>
                </form>
                {msg && <p className={styles.msg}>{msg}</p>}
            </div>

            <div className={styles.list}>
                <h2>登録済みアラート</h2>
                {alerts.length === 0 ? (
                    <p className={styles.empty}>登録されたアラートはありません</p>
                ) : (
                    <ul>
                        {alerts.map(alert => (
                            <li key={alert.id} className={styles.item}>
                                <div className={styles.itemInfo}>
                                    <span className={styles.ticker}>{alert.ticker}</span>
                                    <span className={styles.condition}>
                                        PER {alert.target_per} {alert.condition === 'BELOW' ? '以下' : '以上'}
                                    </span>
                                </div>
                                <button onClick={() => handleDelete(alert.id)} className={styles.delButton}>
                                    削除
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
