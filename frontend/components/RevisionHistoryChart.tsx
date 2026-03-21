"use client";

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ReferenceDot
} from 'recharts';

export default function RevisionHistoryChart({ data }: { data: any[] }) {
    if (!data || data.length === 0) return null;

    // Format data for Recharts
    const formattedData = data.map(d => {
        // Parse "YYYY-MM-DD" safely
        const dateStr = d.revision_date || '';
        const displayDate = dateStr.length >= 10 ? dateStr.substring(0, 10).replace(/-/g, '/') : dateStr;

        // Convert string formatted numbers if they are strings, otherwise keep as number
        let oldOp = d.previous_forecast_op;
        let newOp = d.new_forecast_op;
        
        if (typeof oldOp === 'string') {
            oldOp = parseFloat(oldOp.replace(/,/g, '').replace('十億', '000').replace('百万', ''));
        }
        if (typeof newOp === 'string') {
            newOp = parseFloat(newOp.replace(/,/g, '').replace('十億', '000').replace('百万', ''));
        }

        return {
            date: displayDate,
            oldOp: Number(oldOp) || 0,
            newOp: Number(newOp) || 0,
            isUpward: d.is_upward,
            rate: d.revision_rate_op || 0
        };
    });

    // We only want to plot if we have actual numbers
    const validData = formattedData.filter(d => d.newOp > 0 || d.oldOp > 0);
    if (validData.length === 0) return null;

    return (
        <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '1px solid #334155', marginBottom: '3rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                📈 営業利益予想の推移（過去の修正履歴）
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                企業が発表した営業利益予想（会社予想）の変遷をグラフ化しています。上方修正の連続性は将来の業績期待を高める重要なシグナルとなります。
            </p>
            <div style={{ width: '100%', height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        data={validData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis 
                            dataKey="date" 
                            stroke="#94a3b8" 
                            fontSize={12}
                            tickMargin={10} 
                        />
                        <YAxis 
                            stroke="#94a3b8" 
                            fontSize={12}
                            tickFormatter={(value) => `${value}`} 
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                            itemStyle={{ color: '#e2e8f0' }}
                            formatter={(value: any, name: any) => {
                                return [
                                    `${Math.round(value as number).toLocaleString()}`, 
                                    name === 'newOp' ? '修正後予想' : '修正前予想'
                                ];
                            }}
                            labelStyle={{ color: '#94a3b8', marginBottom: '0.5rem' }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '1rem' }} />
                        <Line
                            type="monotone"
                            dataKey="oldOp"
                            stroke="#64748b"
                            name="修正前予想"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            dot={{ r: 4, fill: '#64748b' }}
                        />
                        <Line
                            type="monotone"
                            dataKey="newOp"
                            stroke="#38bdf8"
                            name="修正後予想"
                            strokeWidth={3}
                            dot={(props: any) => {
                                const { cx, cy, payload } = props;
                                const fill = payload.isUpward === 1 ? '#4ade80' : (payload.isUpward === 0 ? '#f87171' : '#38bdf8');
                                return <circle cx={cx} cy={cy} r={6} fill={fill} stroke="#0f172a" strokeWidth={2} key={`dot-${cx}`} />;
                            }}
                            activeDot={{ r: 8 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', marginTop: '1rem', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', background: '#4ade80' }}></span>
                    <span style={{ color: '#cbd5e1' }}>上方修正</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', background: '#f87171' }}></span>
                    <span style={{ color: '#cbd5e1' }}>下方修正</span>
                </div>
            </div>
        </div>
    );
}
