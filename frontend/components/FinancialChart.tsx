"use client";

import { useState } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Cell
} from 'recharts';

interface FinancialStat {
    ticker: string;
    period_type: 'annual' | 'quarter';
    period_end: string;
    sales: number;
    operating_profit: number;
    ordinary_profit: number;
    net_profit: number;
    eps: number;
    is_forecast: number;
}

interface FinancialChartProps {
    data: FinancialStat[];
    ticker: string;
}

const Metrics = [
    { key: 'sales', label: '売上高', color: '#3b82f6' },
    { key: 'operating_profit', label: '営業利益', color: '#10b981' },
    { key: 'ordinary_profit', label: '経常利益', color: '#f59e0b' },
    { key: 'net_profit', label: '当期純利益', color: '#8b5cf6' },
    { key: 'eps', label: 'EPS (1株益)', color: '#ec4899' },
];

export default function FinancialChart({ data, ticker }: FinancialChartProps) {
    const [selectedMetric, setSelectedMetric] = useState('sales');
    const [selectedYear, setSelectedYear] = useState<string | null>(null);

    // 1. Filter Annual Data
    // Sort by period_end
    const annualData = data
        .filter(d => d.period_type === 'annual')
        .sort((a, b) => a.period_end.localeCompare(b.period_end));

    // Limit to latest 5-6 years + forecast?
    // Kabutan returns ~5 years normally.

    // 2. Prepare Drill-down Data
    // Filter quarterly data related to selected year
    let quarterlyData: FinancialStat[] = [];
    if (selectedYear) {
        // Annual period_end is usually "YYYY-MM" (Fiscal End)
        // e.g. "2024-03" -> Q1: 2023-06, Q2: 2023-09, Q3: 2023-12, Q4: 2024-03

        // Logic: Find quarters whose period_end is within (Year-1).Month+1 to Year.Month
        const [yStr, mStr] = selectedYear.split('-');
        const y = parseInt(yStr);
        const m = parseInt(mStr);

        // Start date roughly: Year-1, Month+1
        // End date: Year, Month

        // Because "Quarters" in Kabutan are stored by End Date.
        // Q1 end: 2023-06 (for Mar 2024 fiscal)

        // Simplification: Match quarters that fall in the 12 months leading up to the annual date.
        // Approx: period_end <= selectedYear AND period_end > (selectedYear - 1yr)

        quarterlyData = data.filter(d => {
            if (d.period_type !== 'quarter') return false;

            // Compare strings: "2023-04" > "2023-03" works for ISO format
            // selectedYear = "2024-03"
            // We want > "2023-03" and <= "2024-03"

            const prevYear = `${y - 1}-${mStr}`;
            return d.period_end > prevYear && d.period_end <= selectedYear;
        }).sort((a, b) => a.period_end.localeCompare(b.period_end));
    }

    const currentMetricInfo = Metrics.find(m => m.key === selectedMetric);

    const handleBarClick = (data: any) => {
        if (data && data.period_end) {
            if (selectedYear === data.period_end) {
                setSelectedYear(null); // Deselect
            } else {
                setSelectedYear(data.period_end);
            }
        }
    };

    // Custom Tooltip
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const d = payload[0].payload;
            const isForecast = d.is_forecast === 1;
            const val = payload[0].value;
            const formattedVal = selectedMetric === 'eps'
                ? `${val.toFixed(1)}円`
                : `${(val / 1000).toFixed(0).toLocaleString()}億円`; // Kabutan is Million, so /1000 = Billion ? No.
            // Kabutan usually Million Yen. 
            // 30,000,000 (Million) -> 30 Trillion? No.
            // 30,000 (Million) -> 300 Oku
            // So / 100 = Oku yen

            // Wait, Kabutan "Sales" 45,095,325 (Million) -> 45 Trillion.
            // 45,095,325 / 10000 = 4509 Oku? No.
            // 100 Million = 1 Oku.
            // So / 100.

            const displayVal = selectedMetric === 'eps' ? val.toLocaleString() + '円' : (val / 100).toLocaleString() + '億円';

            return (
                <div style={{ background: '#1e293b', padding: '10px', border: '1px solid #475569', borderRadius: '4px' }}>
                    <p style={{ fontWeight: 'bold', color: '#fff' }}>{label}期 {isForecast ? "(予)" : ""}</p>
                    <p style={{ color: currentMetricInfo?.color }}>
                        {currentMetricInfo?.label}: {displayVal}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div style={{ padding: '1rem', background: '#1e293b', borderRadius: '8px' }}>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                {Metrics.map(m => (
                    <button
                        key={m.key}
                        onClick={() => setSelectedMetric(m.key)}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '20px',
                            border: 'none',
                            background: selectedMetric === m.key ? m.color : '#334155',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            whiteSpace: 'nowrap',
                            opacity: selectedMetric === m.key ? 1 : 0.7
                        }}
                    >
                        {m.label}
                    </button>
                ))}
            </div>

            {/* Main Chart (Annual) */}
            <div style={{ height: '300px', width: '100%', marginBottom: '2rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#94a3b8' }}>
                    {selectedYear ? `👇 ${selectedYear}期を選択中` : "👆 各年度をタップして四半期詳細を表示"}
                </div>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={annualData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                        <XAxis
                            dataKey="period_end"
                            stroke="#94a3b8"
                            tickFormatter={(val) => val.split('-')[0]} // Show Year only
                            tick={{ fontSize: 12 }}
                        />
                        <YAxis
                            stroke="#94a3b8"
                            tickFormatter={(val) => selectedMetric === 'eps' ? val : (val / 100).toFixed(0)} // Oku or Yen
                            width={40}
                            tick={{ fontSize: 10 }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar
                            dataKey={selectedMetric}
                            fill={currentMetricInfo?.color}
                            radius={[4, 4, 0, 0]}
                            onClick={handleBarClick}
                            cursor="pointer"
                        >
                            {annualData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.period_end === selectedYear ? '#fbbf24' : (entry.is_forecast ? `url(#stripe-${selectedMetric})` : currentMetricInfo?.color)}
                                    // Striped pattern for forecast is hard in pure Recharts/SVG without defs
                                    // Falling back to simple opacity for forecast
                                    opacity={entry.is_forecast ? 0.6 : 1}
                                    stroke={entry.period_end === selectedYear ? '#fbbf24' : 'none'}
                                    strokeWidth={2}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Drill-down Chart (Quarterly) */}
            {selectedYear && (
                <div style={{
                    height: '250px', width: '100%',
                    background: '#0f172a', padding: '1rem', borderRadius: '8px',
                    border: '1px solid #334155', animation: 'fadeIn 0.3s ease-in'
                }}>
                    <h4 style={{ color: '#cbd5e1', fontSize: '0.9rem', marginBottom: '1rem', textAlign: 'center' }}>
                        {selectedYear}期の四半期推移
                    </h4>
                    {quarterlyData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={quarterlyData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                    <XAxis
                                        dataKey="period_end"
                                        stroke="#94a3b8"
                                        tickFormatter={(val) => val.split('-')[1] + '月'} // Show Month
                                        tick={{ fontSize: 12 }}
                                    />
                                    <YAxis
                                        stroke="#94a3b8"
                                        tickFormatter={(val) => selectedMetric === 'eps' ? val : (val / 100).toFixed(0)}
                                        width={40}
                                        tick={{ fontSize: 10 }}
                                    />
                                    <Tooltip
                                        contentStyle={{ background: '#1e293b', border: '1px solid #475569' }}
                                        formatter={(value: any) => [
                                            selectedMetric === 'eps' ? `${value}円` : `${(value / 100).toLocaleString()}億円`,
                                            currentMetricInfo?.label
                                        ]}
                                        labelFormatter={(label) => `${label} (四半期)`}
                                    />
                                    <Bar
                                        dataKey={selectedMetric}
                                        fill={currentMetricInfo?.color}
                                        radius={[4, 4, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                                四半期データがありません
                            </div>
                        )}
                    </div>
                )
            }
            <div style={{ textAlign: 'right', fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>
                データソース: TDnet
            </div>
        </div >
    );
}
