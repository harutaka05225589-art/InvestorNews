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
    ath_drop_threshold: number | null;
    pbr_limit: number | null;
    dividend_yield_min: number | null;
    alert_yuutai_change: number;
    alert_earnings_date: number;
    alert_revision: number;
    volume_spike_ratio: number | null;
    alert_dilution: number;
    current_pbr: number | null;
    current_dividend_yield: number | null;
    ath_price: number | null;
    ath_drop_pct: number | null;
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
        drop_threshold: '-20', per_limit: '15',
        ath_drop_threshold: '', pbr_limit: '', dividend_yield_min: '',
        alert_yuutai_change: false, alert_earnings_date: false,
        alert_revision: false, volume_spike_ratio: '', alert_dilution: false
    });

    // Search Suggestions State
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Price Auto-Calculator State
    const [currentPrice, setCurrentPrice] = useState<number | null>(null);
    const [isFetchingPrice, setIsFetchingPrice] = useState(false);

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

    const handleFetchPrice = async () => {
        let tickerToFetch = form.ticker;
        if (!tickerToFetch) {
            const match = form.name.match(/^([0-9A-Z]{4})(\.T)?$/i);
            if (match) {
                tickerToFetch = `${match[1].toUpperCase()}.T`;
            } else {
                setError('先に銘柄を候補から選ぶか、ティッカーコード（例: 7203）を入力してください');
                return;
            }
        }
        setIsFetchingPrice(true);
        setError('');
        try {
            const res = await fetch(`/api/admin/price?ticker=${tickerToFetch}&t=${Date.now()}`);
            const data = await res.json();
            if (res.ok && data.price) {
                setCurrentPrice(data.price);
            } else {
                setError(data.detail || data.error || '株価の取得に失敗しました');
            }
        } catch (e: any) {
            setError(e.message || '株価の取得に失敗しました');
        } finally {
            setIsFetchingPrice(false);
        }
    };

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

        let finalTicker = form.ticker;
        let finalName = form.name;

        // Auto-detect ticker from input if missing
        if (!finalTicker) {
            const match = finalName.match(/^([0-9A-Z]{4})(\.T)?$/i);
            if (match) {
                finalTicker = `${match[1].toUpperCase()}.T`;
                // Use the ticker as the name if they didn't provide one
                finalName = finalTicker;
            } else {
                setError('ティッカーが不明です。検索候補から選択するか、コード（例: 7203）を入力してください。');
                return;
            }
        }

        const body: any = {
            name: finalName,
            ticker: finalTicker,
            price_above: form.price_above ? parseFloat(form.price_above) : null,
            price_below: form.price_below ? parseFloat(form.price_below) : null,
            drop_threshold: parseFloat(form.drop_threshold) || -20,
            per_limit: parseFloat(form.per_limit) || 15,
            ath_drop_threshold: form.ath_drop_threshold ? parseFloat(form.ath_drop_threshold) : null,
            pbr_limit: form.pbr_limit ? parseFloat(form.pbr_limit) : null,
            dividend_yield_min: form.dividend_yield_min ? parseFloat(form.dividend_yield_min) : null,
            alert_yuutai_change: form.alert_yuutai_change ? 1 : 0,
            alert_earnings_date: form.alert_earnings_date ? 1 : 0,
            alert_revision: form.alert_revision ? 1 : 0,
            volume_spike_ratio: form.volume_spike_ratio ? parseFloat(form.volume_spike_ratio) : null,
            alert_dilution: form.alert_dilution ? 1 : 0,
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
            ath_drop_threshold: item.ath_drop_threshold?.toString() || '',
            pbr_limit: item.pbr_limit?.toString() || '',
            dividend_yield_min: item.dividend_yield_min?.toString() || '',
            alert_yuutai_change: item.alert_yuutai_change === 1,
            alert_earnings_date: item.alert_earnings_date === 1,
            alert_revision: item.alert_revision === 1,
            volume_spike_ratio: item.volume_spike_ratio?.toString() || '',
            alert_dilution: item.alert_dilution === 1,
        });
        setEditingId(item.id);
        setShowForm(true);
    };

    const resetForm = () => {
        setForm({ name: '', ticker: '', price_above: '', price_below: '', drop_threshold: '-20', per_limit: '15',
            ath_drop_threshold: '', pbr_limit: '', dividend_yield_min: '',
            alert_yuutai_change: false, alert_earnings_date: false,
            alert_revision: false, volume_spike_ratio: '', alert_dilution: false
        });
        setEditingId(null);
        setShowForm(false);
        setCurrentPrice(null);
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
                            <div className={styles.formGroup} style={{ position: 'relative', gridColumn: '1 / -1' }}>
                                <label>銘柄（会社名 または コード） *</label>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <input 
                                        type="text" 
                                        value={form.name} 
                                        onChange={e => setForm({ ...form, name: e.target.value, ticker: '' })} 
                                        onFocus={() => form.name.length >= 2 && setShowSuggestions(true)}
                                        placeholder="例: トヨタ または 7203" 
                                        required 
                                        autoComplete="off"
                                        style={{ flex: 1 }}
                                    />
                                    {form.ticker && (
                                        <div style={{ fontWeight: 'bold', color: '#38bdf8', whiteSpace: 'nowrap', padding: '0 1rem' }}>
                                            ✅ 選択中: {form.ticker}
                                        </div>
                                    )}
                                </div>
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

                            {/* Auto-Calculator UI */}
                            <div className={styles.formGroup} style={{ gridColumn: '1 / -1', background: '#0f172a', padding: '1rem', borderRadius: '8px', border: '1px solid #334155' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <label style={{ margin: 0, color: '#38bdf8' }}>💡 現在株価から目標値を自動計算</label>
                                    <button 
                                        type="button" 
                                        onClick={handleFetchPrice} 
                                        disabled={isFetchingPrice}
                                        style={{ background: '#38bdf8', color: '#000', border: 'none', padding: '0.4rem 1rem', borderRadius: '4px', fontWeight: 'bold', cursor: isFetchingPrice ? 'wait' : 'pointer' }}
                                    >
                                        {isFetchingPrice ? '取得中...' : '現在の株価を取得'}
                                    </button>
                                </div>
                                
                                {currentPrice !== null && (
                                    <div style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 'bold' }}>
                                        現在株価: <span style={{ color: '#fff' }}>¥{currentPrice.toLocaleString('ja-JP')}</span>
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: '0.85rem' }}>現在株価から 〇% 上昇（上限アラート）</label>
                                        <input 
                                            type="number" 
                                            placeholder="例: 20" 
                                            onChange={(e) => {
                                                const pct = parseFloat(e.target.value);
                                                if (!isNaN(pct) && currentPrice) {
                                                    setForm(prev => ({ ...prev, price_above: (currentPrice * (1 + pct / 100)).toFixed(2) }));
                                                }
                                            }} 
                                            disabled={currentPrice === null}
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: '0.85rem' }}>現在株価から 〇% 下落（下限アラート）</label>
                                        <input 
                                            type="number" 
                                            placeholder="例: 20" 
                                            onChange={(e) => {
                                                const pct = parseFloat(e.target.value);
                                                if (!isNaN(pct) && currentPrice) {
                                                    setForm(prev => ({ ...prev, price_below: (currentPrice * (1 - pct / 100)).toFixed(2) }));
                                                }
                                            }} 
                                            disabled={currentPrice === null}
                                        />
                                    </div>
                                </div>
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

                            {/* === 追加アラート項目 === */}
                            <div style={{ gridColumn: '1 / -1', borderTop: '1px solid #334155', paddingTop: '1rem', marginTop: '0.5rem' }}>
                                <h4 style={{ color: '#94a3b8', marginBottom: '0.75rem', fontSize: '0.9rem' }}>📊 追加アラート設定</h4>
                            </div>
                            <div className={styles.formGroup}>
                                <label>上場来高値 下落率 (%)</label>
                                <input type="number" value={form.ath_drop_threshold} onChange={e => setForm({ ...form, ath_drop_threshold: e.target.value })} placeholder="例: -30" />
                            </div>
                            <div className={styles.formGroup}>
                                <label>PBR上限 (倍)</label>
                                <input type="number" step="0.1" value={form.pbr_limit} onChange={e => setForm({ ...form, pbr_limit: e.target.value })} placeholder="例: 1.0" />
                            </div>
                            <div className={styles.formGroup}>
                                <label>配当利回り下限 (%)</label>
                                <input type="number" step="0.1" value={form.dividend_yield_min} onChange={e => setForm({ ...form, dividend_yield_min: e.target.value })} placeholder="例: 3.0" />
                            </div>
                            <div className={styles.formGroup}>
                                <label>出来高急増 (倍率)</label>
                                <input type="number" step="0.1" value={form.volume_spike_ratio} onChange={e => setForm({ ...form, volume_spike_ratio: e.target.value })} placeholder="例: 2.0" />
                            </div>
                            <div style={{ gridColumn: '1 / -1', display: 'flex', flexWrap: 'wrap', gap: '1.2rem', padding: '0.5rem 0' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: '#e2e8f0' }}>
                                    <input type="checkbox" checked={form.alert_earnings_date} onChange={e => setForm({ ...form, alert_earnings_date: e.target.checked })} />
                                    📅 決算日接近通知
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: '#e2e8f0' }}>
                                    <input type="checkbox" checked={form.alert_revision} onChange={e => setForm({ ...form, alert_revision: e.target.checked })} />
                                    📈 上方/下方修正通知
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: '#e2e8f0' }}>
                                    <input type="checkbox" checked={form.alert_yuutai_change} onChange={e => setForm({ ...form, alert_yuutai_change: e.target.checked })} />
                                    🎁 優待変更・廃止通知
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: '#e2e8f0' }}>
                                    <input type="checkbox" checked={form.alert_dilution} onChange={e => setForm({ ...form, alert_dilution: e.target.checked })} />
                                    ⚠️ 希薄化イベント通知
                                </label>
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
                                <th style={{ textAlign: 'right' }}>下落率</th>
                                <th style={{ textAlign: 'right' }}>PER</th>
                                <th style={{ textAlign: 'right' }}>PBR</th>
                                <th style={{ textAlign: 'right' }}>配当利回り</th>
                                <th style={{ textAlign: 'center' }}>アラート</th>
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
                                        <td style={{ textAlign: 'right', fontFamily: 'monospace', color: dropColor, fontWeight: 'bold' }}>
                                            <div>{item.drop_pct !== null ? `52w: ${item.drop_pct}%` : '-'}</div>
                                            {(item as any).ath_drop_pct !== null && (item as any).ath_drop_pct !== undefined && (
                                                <div style={{ fontSize: '0.75rem', color: '#888' }}>ATH: {(item as any).ath_drop_pct}%</div>
                                            )}
                                        </td>
                                        <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>
                                            {item.current_per !== null ? `${item.current_per}x` : '-'}
                                        </td>
                                        <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>
                                            {(item as any).current_pbr !== null && (item as any).current_pbr !== undefined ? `${(item as any).current_pbr}x` : '-'}
                                        </td>
                                        <td style={{ textAlign: 'right', fontFamily: 'monospace', color: (item as any).current_dividend_yield >= 3 ? '#44cc44' : '#ccc' }}>
                                            {(item as any).current_dividend_yield !== null && (item as any).current_dividend_yield !== undefined ? `${(item as any).current_dividend_yield}%` : '-'}
                                        </td>
                                        <td style={{ textAlign: 'center', fontSize: '0.75rem' }}>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px', justifyContent: 'center' }}>
                                                {item.price_above && <span title={`上限: ¥${formatNum(item.price_above)}`}>📈</span>}
                                                {item.price_below && <span title={`下限: ¥${formatNum(item.price_below)}`}>📉</span>}
                                                {(item as any).alert_earnings_date === 1 && <span title="決算日接近">📅</span>}
                                                {(item as any).alert_revision === 1 && <span title="上方/下方修正">📊</span>}
                                                {(item as any).alert_yuutai_change === 1 && <span title="優待変更">🎁</span>}
                                                {(item as any).alert_dilution === 1 && <span title="希薄化">⚠️</span>}
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
