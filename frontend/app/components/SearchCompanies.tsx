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
    const [isExpanded, setIsExpanded] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        setIsMobile(window.innerWidth < 850);
        const handleResize = () => setIsMobile(window.innerWidth < 850);
        window.addEventListener('resize', handleResize);

        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setIsExpanded(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);

        // Fix for iOS Safari aggressively restoring focus on cross-page navigation
        const activeElem = document.activeElement as HTMLElement;
        if (activeElem && activeElem.tagName === 'INPUT') {
            activeElem.blur();
        }

        return () => {
            window.removeEventListener('resize', handleResize);
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

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
            setIsExpanded(false);
            setQuery('');
        }
    };

    return (
        <div ref={wrapperRef} style={{
            position: isExpanded ? 'fixed' : 'relative',
            top: isExpanded ? 0 : 'auto',
            left: isExpanded ? 0 : 'auto',
            width: isExpanded ? '100vw' : '100%',
            maxWidth: isExpanded ? '100vw' : '400px',
            height: isExpanded ? '60px' : 'auto', // Match header height
            marginRight: isExpanded ? 0 : '1rem',
            zIndex: isExpanded ? 100000 : 1, // Must be higher than header's z-index (9999)
            background: isExpanded ? 'var(--background)' : 'transparent',
            display: 'flex',
            alignItems: 'center',
            padding: isExpanded ? '0 1rem' : 0,
            boxSizing: 'border-box'
        }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <div style={{ position: 'relative', width: '100%', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                        🔍
                    </span>
                    <input
                        type="text"
                        placeholder="銘柄検索 (コード/社名)"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onClick={() => {
                            if (isMobile) setIsExpanded(true);
                        }}
                        onFocus={() => {
                            if (results.length > 0) setIsOpen(true);
                        }}
                        autoComplete="off"
                        style={{
                            flex: 1,
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
                    {isExpanded && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                setIsExpanded(false);
                                setIsOpen(false);
                            }}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#94a3b8',
                                fontSize: '0.9rem',
                                padding: '0.5rem',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            キャンセル
                        </button>
                    )}
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
