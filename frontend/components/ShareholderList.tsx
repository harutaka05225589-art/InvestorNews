"use client";

import { useState } from 'react';
import Link from 'next/link';

interface Shareholder {
    ticker: string;
    entry_date: string; // YYYY-MM-DD
    shareholder_name: string;
    share_count: string;
    share_ratio: number;
    rank: number;
}

interface ShareholderListProps {
    data: Shareholder[];
}

export default function ShareholderList({ data }: ShareholderListProps) {
    // 1. Group by Date
    // Map: Date -> Shareholder[]
    const grouped: { [date: string]: Shareholder[] } = {};

    data.forEach(s => {
        if (!grouped[s.entry_date]) {
            grouped[s.entry_date] = [];
        }
        grouped[s.entry_date].push(s);
    });

    // Sort dates descending
    const dates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

    // Default to latest
    const [selectedDate, setSelectedDate] = useState<string | null>(dates.length > 0 ? dates[0] : null);

    if (!selectedDate || dates.length === 0) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', background: '#334155', borderRadius: '8px' }}>
                株主データがありません
            </div>
        );
    }

    const currentList = grouped[selectedDate].sort((a, b) => a.rank - b.rank);

    // Helper to format date for Tab
    // e.g. 2024-09-30 -> 24.09
    const formatTabDate = (dateStr: string) => {
        const [y, m, d] = dateStr.split('-');
        return `${y.slice(2)}.${m}`;
    };

    return (
        <div style={{ background: '#1e293b', borderRadius: '8px', overflow: 'hidden' }}>
            {/* Tabs */}
            <div style={{ display: 'flex', background: '#0f172a', overflowX: 'auto', borderBottom: '1px solid #334155' }}>
                <div style={{ padding: '1rem', color: '#fff', fontWeight: 'bold', background: '#334155', whiteSpace: 'nowrap' }}>
                    株主推移
                </div>
                {dates.map(date => (
                    <button
                        key={date}
                        onClick={() => setSelectedDate(date)}
                        style={{
                            padding: '1rem 1.5rem',
                            background: selectedDate === date ? '#1e293b' : 'transparent',
                            color: selectedDate === date ? '#3b82f6' : '#94a3b8',
                            border: 'none',
                            borderBottom: selectedDate === date ? '2px solid #3b82f6' : 'none',
                            fontWeight: selectedDate === date ? 'bold' : 'normal',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            fontSize: '0.9rem'
                        }}
                    >
                        {formatTabDate(date)}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                    <thead>
                        <tr style={{ background: '#334155', color: '#cbd5e1', fontSize: '0.85rem' }}>
                            <th style={{ padding: '1rem', textAlign: 'left', width: '50px' }}>順位</th>
                            <th style={{ padding: '1rem', textAlign: 'left' }}>株主名</th>
                            <th style={{ padding: '1rem', textAlign: 'right' }}>比率 (%)</th>
                            <th style={{ padding: '1rem', textAlign: 'right' }}>株式数</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentList.map((s, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid #334155' }}>
                                <td style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8' }}>{s.rank}</td>
                                <td style={{ padding: '1rem', fontWeight: 'bold', color: '#fff' }}>
                                    {/* Link if not "Self" */}
                                    {s.shareholder_name.includes('自社') || s.shareholder_name.includes('自己') ? (
                                        s.shareholder_name
                                    ) : (
                                        <Link href={`/holders/${encodeURIComponent(s.shareholder_name)}`} style={{ color: '#60a5fa', textDecoration: 'none' }}>
                                            {s.shareholder_name}
                                        </Link>
                                    )}
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'right', color: '#fbbf24' }}>
                                    {s.share_ratio.toFixed(2)}%
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'right', color: '#cbd5e1' }}>
                                    {s.share_count}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div style={{ padding: '0.5rem 1rem', background: '#0f172a', textAlign: 'right', fontSize: '0.8rem', color: '#64748b' }}>
                データの基準日: {selectedDate}
            </div>
        </div>
    );
}
