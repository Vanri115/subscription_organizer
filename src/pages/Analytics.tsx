import React, { useMemo } from 'react';
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { TrendingUp, Calendar, PieChart as PieIcon, BarChart2 } from 'lucide-react';
import { loadSubscriptions } from '../utils/storage';
import { POPULAR_SERVICES } from '../data/services';
import { useSettings } from '../contexts/SettingsContext';
import { formatCurrency } from '../utils/calculations';
import {
    getMonthlyTotals,
    getAnnualForecast,
    getCategoryBreakdownFromMap,
    getHeatmapData,
    getIntensity,
    toMonthly,
} from '../utils/analytics';

const CATEGORY_LABELS: Record<string, string> = {
    'All': 'すべて', 'Video': '動画', 'Music': '音楽', 'Book': '書籍',
    'Game': 'ゲーム', 'Gym': 'ジム', 'Salon': 'サロン', 'Travel': '旅行',
    'Food': 'グルメ', 'Dev': '開発', 'Business': 'ビジネス', 'AI': 'AI',
    'Security': 'セキュリティ', 'Learning': '学習', 'Software': 'IT',
    'School': '学校', 'Shopping': '買い物', 'Other': 'その他',
};

const Analytics: React.FC = () => {
    const { currency, exchangeRate } = useSettings();
    const subs = useMemo(() => loadSubscriptions(), []);

    const activeSubs = useMemo(() => subs.filter(s => s.isActive), [subs]);

    // サービス情報付きサブスク
    const subsWithMeta = useMemo(() =>
        activeSubs.map(s => {
            const service = POPULAR_SERVICES.find(p => p.id === s.serviceId);
            return {
                ...s,
                category: service?.category || 'Other',
                name: s.customName || service?.name || s.serviceId,
                monthlyPrice: toMonthly(s),
            };
        }), [activeSubs]);

    const monthlyTotals = useMemo(() => getMonthlyTotals(activeSubs), [activeSubs]);
    const annualForecast = useMemo(() => getAnnualForecast(activeSubs), [activeSubs]);
    const categoryData = useMemo(() =>
        getCategoryBreakdownFromMap(subsWithMeta, CATEGORY_LABELS), [subsWithMeta]);
    const heatmapData = useMemo(() =>
        getHeatmapData(subsWithMeta), [subsWithMeta]);

    const maxHeatmap = useMemo(() =>
        Math.max(...heatmapData.map(d => d.value), 1), [heatmapData]);

    const totalMonthly = useMemo(() =>
        activeSubs.reduce((sum, s) => sum + toMonthly(s), 0), [activeSubs]);

    const totalYearly = useMemo(() => totalMonthly * 12, [totalMonthly]);

    const fmt = (v: number) => formatCurrency(v, currency, exchangeRate);

    const tooltipStyle = {
        backgroundColor: 'hsl(var(--card))',
        border: '1px solid hsl(var(--border))',
        borderRadius: '12px',
        color: 'hsl(var(--foreground))',
        fontSize: '12px',
    };

    if (activeSubs.length === 0) {
        return (
            <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] text-center">
                <BarChart2 size={48} className="text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground font-medium">サブスクを登録すると<br />分析データが表示されます</p>
            </div>
        );
    }

    return (
        <div className="p-4 max-w-md mx-auto space-y-6 pb-24">
            {/* Header */}
            <header className="pt-2 pb-2 text-center">
                <h1 className="text-2xl font-bold text-foreground">分析</h1>
                <p className="text-xs text-muted-foreground mt-1">アクティブなサブスク {activeSubs.length}件</p>
            </header>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-card border border-border rounded-2xl p-4">
                    <p className="text-xs text-muted-foreground mb-1">月額合計</p>
                    <p className="text-xl font-bold text-primary">{fmt(totalMonthly)}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">/月</p>
                </div>
                <div className="bg-card border border-border rounded-2xl p-4">
                    <p className="text-xs text-muted-foreground mb-1">年間合計</p>
                    <p className="text-xl font-bold text-foreground">{fmt(totalYearly)}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">/年</p>
                </div>
            </div>

            {/* 月別推移グラフ */}
            <section className="bg-card border border-border rounded-2xl p-4">
                <h2 className="text-sm font-bold text-foreground flex items-center gap-2 mb-4">
                    <TrendingUp size={16} className="text-primary" />
                    月別推移（過去12ヶ月）
                </h2>
                <ResponsiveContainer width="100%" height={180}>
                    <AreaChart data={monthlyTotals} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis
                            dataKey="month"
                            tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                            tickFormatter={(v) => v.slice(5)}
                        />
                        <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                        <Tooltip
                            contentStyle={tooltipStyle}
                            formatter={(v: number | undefined) => [fmt(v ?? 0), '月額']}
                        />
                        <Area
                            type="monotone"
                            dataKey="total"
                            stroke="#6366f1"
                            strokeWidth={2}
                            fill="url(#colorTotal)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </section>

            {/* 年間予測 */}
            <section className="bg-card border border-border rounded-2xl p-4">
                <h2 className="text-sm font-bold text-foreground flex items-center gap-2 mb-4">
                    <Calendar size={16} className="text-emerald-500" />
                    年間予測（今後12ヶ月）
                </h2>
                <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={annualForecast} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis
                            dataKey="month"
                            tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                            tickFormatter={(v) => v.slice(5)}
                        />
                        <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                        <Tooltip
                            contentStyle={tooltipStyle}
                            formatter={(v: number | undefined, name: string | undefined) => [
                                fmt(v ?? 0),
                                name === 'monthly' ? '月払い' : '年払い（更新月）'
                            ]}
                        />
                        <Legend
                            formatter={(v) => v === 'monthly' ? '月払い' : '年払い（更新月）'}
                            wrapperStyle={{ fontSize: '10px' }}
                        />
                        <Bar dataKey="monthly" stackId="a" fill="#6366f1" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="yearly" stackId="a" fill="#ec4899" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
                <p className="text-[10px] text-muted-foreground mt-2">
                    ※ 年払いは更新日（または開始日）の月に計上
                </p>
            </section>

            {/* カテゴリ内訳 */}
            {categoryData.length > 0 && (
                <section className="bg-card border border-border rounded-2xl p-4">
                    <h2 className="text-sm font-bold text-foreground flex items-center gap-2 mb-4">
                        <PieIcon size={16} className="text-amber-500" />
                        カテゴリ別内訳
                    </h2>
                    <div className="flex items-center gap-4">
                        <ResponsiveContainer width={140} height={140}>
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={35}
                                    outerRadius={60}
                                    dataKey="value"
                                    strokeWidth={0}
                                >
                                    {categoryData.map((entry, i) => (
                                        <Cell key={i} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={tooltipStyle}
                                    formatter={(v: number | undefined) => [fmt(v ?? 0), '月額']}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="flex-1 space-y-1.5 min-w-0">
                            {categoryData.map((d, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <div
                                        className="w-2.5 h-2.5 rounded-full shrink-0"
                                        style={{ backgroundColor: d.color }}
                                    />
                                    <span className="text-xs text-muted-foreground truncate flex-1">{d.name}</span>
                                    <span className="text-xs font-bold text-foreground shrink-0">{fmt(d.value)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* コストヒートマップ */}
            {heatmapData.length > 0 && (
                <section className="bg-card border border-border rounded-2xl p-4">
                    <h2 className="text-sm font-bold text-foreground flex items-center gap-2 mb-4">
                        <BarChart2 size={16} className="text-rose-500" />
                        コストヒートマップ
                    </h2>
                    <div className="space-y-2">
                        {heatmapData.map((d, i) => {
                            const intensity = getIntensity(d.value, maxHeatmap);
                            const opacity = 0.15 + intensity * 0.85;
                            return (
                                <div key={i} className="flex items-center gap-3">
                                    <span className="text-xs text-muted-foreground w-16 shrink-0 truncate">
                                        {CATEGORY_LABELS[d.category] || d.category}
                                    </span>
                                    <div className="flex-1 h-6 rounded-lg overflow-hidden bg-muted/30">
                                        <div
                                            className="h-full rounded-lg transition-all duration-500"
                                            style={{
                                                width: `${intensity * 100}%`,
                                                backgroundColor: `rgba(99, 102, 241, ${opacity})`,
                                                minWidth: '4px',
                                            }}
                                        />
                                    </div>
                                    <span className="text-xs font-bold text-foreground w-16 text-right shrink-0">
                                        {fmt(d.value)}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                    <div className="flex items-center justify-between mt-3">
                        <span className="text-[10px] text-muted-foreground">低</span>
                        <div className="flex-1 mx-2 h-1.5 rounded-full bg-gradient-to-r from-indigo-500/20 to-indigo-500" />
                        <span className="text-[10px] text-muted-foreground">高</span>
                    </div>
                </section>
            )}
        </div>
    );
};

export default Analytics;
