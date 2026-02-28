"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface SearchResult {
    ticker: string;
    name: string;
    market: string | null;
    sector: string | null;
}

export default function SearchCompanies() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef]);

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (query.trim().length > 1) {
                setLoading(true);
                try {
                    const res = await fetch(`/api/search/companies?q=${encodeURIComponent(query)}`);
                    if (res.ok) {
                        const data = await res.json();
                        setResults(data.results);
                        setIsOpen(true);
                    }
                } catch (e) {
                    console.error(e);
                } finally {
                    setLoading(false);
                }
            } else {
                setResults([]);
                setIsOpen(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [query]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // If query looks like a ticker (4 digits), go directly
        if (/^\d{4}$/.test(query)) {
            router.push(`/stocks/${query}`);
            setIsOpen(false);
            setQuery('');
        }
    };

    return (
        <div ref={wrapperRef} style={{ position: 'relative', width: '100%', maxWidth: '400px', marginRight: '1rem' }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ position: 'relative', width: '100%' }}>
                    <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                        🔍
                    </span>
                    <input
                        type="text"
                        placeholder="銘柄検索 (コード/社名)"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => { if (results.length > 0) setIsOpen(true); }}
                        autoComplete="off"
                        style={{
                            width: '100%',
                            padding: '0.5rem 0.5rem 0.5rem 2.2rem',
                            borderRadius: '20px',
                            border: '1px solid #334155',
                            background: '#1e293b',
                            color: '#fff',
                            outline: 'none',
                            fontSize: '16px' // Must be 16px or larger to prevent iOS Safari zoom
                        }}
                    />
                </div>
            </form>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    width: '100%',
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    marginTop: '0.5rem',
                    overflow: 'hidden',
                    zIndex: 1000,
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                }}>
                    {loading && <div style={{ padding: '1rem', color: '#94a3b8', fontSize: '0.8rem' }}>検索中...</div>}
                    {!loading && results.length === 0 && (
                        <div style={{ padding: '1rem', color: '#94a3b8', fontSize: '0.8rem' }}>見つかりませんでした</div>
                    )}
                    {!loading && results.map((item) => (
                        <Link
                            key={item.ticker}
                            href={`/stocks/${item.ticker}`}
                            onClick={() => { setIsOpen(false); setQuery(''); }}
                            style={{
                                display: 'block',
                                padding: '0.75rem 1rem',
                                borderBottom: '1px solid #334155',
                                textDecoration: 'none',
                                color: '#f1f5f9',
                                transition: 'background 0.15s'
                            }}
                            onMouseOver={(e) => (e.currentTarget.style.background = '#334155')}
                            onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: 'bold' }}>{item.ticker}</span>
                                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{item.market}</span>
                            </div>
                            <div style={{ fontSize: '0.9rem' }}>{item.name}</div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
