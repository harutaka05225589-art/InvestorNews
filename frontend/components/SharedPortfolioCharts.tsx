"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['#38bdf8', '#fbbf24', '#a78bfa', '#f472b6', '#4ade80', '#fb923c', '#94a3b8'];

export default function SharedPortfolioCharts({ holdings }: { holdings: any[] }) {
    if (!holdings || holdings.length === 0) return null;

    // Process data for Asset Allocation
    const assetData = holdings
        .map(h => ({ name: h.ticker, value: h.invested }))
        .sort((a, b) => b.value - a.value);
    
    // Group small assets into "その他"
    let topAssets = assetData.slice(0, 5);
    const others = assetData.slice(5).reduce((acc, curr) => acc + curr.value, 0);
    if (others > 0) {
        topAssets.push({ name: 'その他', value: others });
    }

    // Process data for Dividend Contribution
    const divData = holdings
        .map(h => ({ name: h.ticker, value: h.netDividend }))
        .sort((a, b) => b.value - a.value);
    
    let topDivs = divData.slice(0, 5);
    const otherDivs = divData.slice(5).reduce((acc, curr) => acc + curr.value, 0);
    if (otherDivs > 0) {
        topDivs.push({ name: 'その他', value: otherDivs });
    }

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
            <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid #334155' }}>
                <h3 style={{ textAlign: 'center', color: '#f8fafc', marginBottom: '1rem', fontWeight: 'bold' }}>資産保有割合</h3>
                <div style={{ width: '100%', height: '250px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={topAssets}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={2}
                                dataKey="value"
                            >
                                {topAssets.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value: any) => `${Math.round(value as number).toLocaleString()}円`} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid #334155' }}>
                <h3 style={{ textAlign: 'center', color: '#f8fafc', marginBottom: '1rem', fontWeight: 'bold' }}>予想配当金構成比</h3>
                <div style={{ width: '100%', height: '250px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={topDivs}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={2}
                                dataKey="value"
                            >
                                {topDivs.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value: any) => `${Math.round(value as number).toLocaleString()}円`} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
