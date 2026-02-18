import React, { useMemo, useState } from 'react';
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { TrendingUp, Calendar, PieChart as PieIcon, BarChart2, Lightbulb, FileText, ChevronRight } from 'lucide-react';
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
import { getAvailableYears, getYearlyReport } from '../utils/snapshot';

const CATEGORY_LABELS: Record<string, string> = {
    'All': 'すべて', 'Video': '動画', 'Music': '音楽', 'Book': '書籍',
    'Game': 'ゲーム', 'Gym': 'ジム', 'Salon': 'サロン', 'Travel': '旅行',
    'Food': 'グルメ', 'Dev': '開発', 'Business': 'ビジネス', 'AI': 'AI',
    'Security': 'セキュリティ', 'Learning': '学習', 'Software': 'IT',
    'School': '学校', 'Shopping': '買い物', 'Other': 'その他',
};

type AnalyticsTab = 'trend' | 'breakdown' | 'diagnosis' | 'report';

const Analytics: React.FC = () => {
    const { currency, exchangeRate } = useSettings();
    const subs = useMemo(() => loadSubscriptions(), []);
    const [activeTab, setActiveTab] = useState<AnalyticsTab>('trend');
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

    const activeSubs = useMemo(() => subs.filter(s => s.isActive), [subs]);
    const inactiveSubs = useMemo(() => subs.filter(s => !s.isActive), [subs]);

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

    // Savings diagnosis
    const wastedMonthly = useMemo(() =>
        inactiveSubs.reduce((sum, s) => sum + toMonthly(s), 0), [inactiveSubs]);
    const wastedYearly = useMemo(() => wastedMonthly * 12, [wastedMonthly]);

    const duplicateCategories = useMemo(() => {
        const catMap: Record<string, { name: string; count: number; total: number }> = {};
        subsWithMeta.forEach(s => {
            if (!catMap[s.category]) catMap[s.category] = { name: CATEGORY_LABELS[s.category] || s.category, count: 0, total: 0 };
            catMap[s.category].count++;
            catMap[s.category].total += s.monthlyPrice;
        });
        return Object.entries(catMap)
            .filter(([, v]) => v.count >= 2)
            .map(([, v]) => v)
            .sort((a, b) => b.total - a.total);
    }, [subsWithMeta]);

    const topExpensive = useMemo(() =>
        [...subsWithMeta].sort((a, b) => b.monthlyPrice - a.monthlyPrice).slice(0, 3),
        [subsWithMeta]);

    // Yearly report
    const availableYears = useMemo(() => getAvailableYears(), []);
    const yearlySnapshots = useMemo(() => getYearlyReport(selectedYear), [selectedYear]);

    const fmt = (v: number) => formatCurrency(v, currency, exchangeRate);

    const tooltipStyle = {
        backgroundColor: 'hsl(var(--card))',
        border: '1px solid hsl(var(--border))',
        borderRadius: '12px',
        color: 'hsl(var(--foreground))',
        fontSize: '12px',
    };

    const tabs: { id: AnalyticsTab; label: string; icon: React.ReactNode }[] = [
        { id: 'trend', label: '推移', icon: <TrendingUp size={14} /> },
        { id: 'breakdown', label: '内訳', icon: <PieIcon size={14} /> },
        { id: 'diagnosis', label: '節約診断', icon: <Lightbulb size={14} /> },
        { id: 'report', label: '年次レポート', icon: <FileText size={14} /> },
    ];

    if (activeSubs.length === 0 && activeTab !== 'report') {
        return (
            <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] text-center">
                <BarChart2 size={48} className="text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground font-medium">サブスクを登録すると<br />分析データが表示されます</p>
            </div>
        );
    }

    return (
        <div className="p-4 max-w-md mx-auto pb-24">
            {/* Header */}
            <header className="pb-4 text-center">
                <h1 className="text-2xl font-bold text-foreground">分析</h1>
                {activeSubs.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">アクティブ {activeSubs.length}件 · 月額 {fmt(totalMonthly)}</p>
                )}
            </header>

            {/* Tab Navigation */}
            <div className="flex p-1 bg-muted/50 rounded-xl mb-6 overflow-x-auto gap-1">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-1 py-2 px-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${activeTab === tab.id
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground/80'
                            }`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab: 推移 */}
            {activeTab === 'trend' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-card border border-border rounded-2xl p-4">
                            <p className="text-xs text-muted-foreground mb-1">月額合計</p>
                            <p className="text-xl font-bold text-primary">{fmt(totalMonthly)}</p>
                        </div>
                        <div className="bg-card border border-border rounded-2xl p-4">
                            <p className="text-xs text-muted-foreground mb-1">年間合計</p>
                            <p className="text-xl font-bold text-foreground">{fmt(totalYearly)}</p>
                        </div>
                    </div>

                    {/* 月別推移 */}
                    <section className="bg-card border border-border rounded-2xl p-4">
                        <h2 className="text-sm font-bold flex items-center gap-2 mb-4">
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
                                <XAxis dataKey="month" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => v.slice(5)} />
                                <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                                <Tooltip contentStyle={tooltipStyle} formatter={(v: number | undefined) => [fmt(v ?? 0), '月額']} />
                                <Area type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2} fill="url(#colorTotal)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </section>

                    {/* 年間予測 */}
                    <section className="bg-card border border-border rounded-2xl p-4">
                        <h2 className="text-sm font-bold flex items-center gap-2 mb-4">
                            <Calendar size={16} className="text-emerald-500" />
                            年間予測（今後12ヶ月）
                        </h2>
                        <ResponsiveContainer width="100%" height={180}>
                            <BarChart data={annualForecast} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis dataKey="month" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => v.slice(5)} />
                                <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                                <Tooltip contentStyle={tooltipStyle} formatter={(v: number | undefined, name: string | undefined) => [fmt(v ?? 0), name === 'monthly' ? '月払い' : '年払い（更新月）']} />
                                <Legend formatter={(v) => v === 'monthly' ? '月払い' : '年払い（更新月）'} wrapperStyle={{ fontSize: '10px' }} />
                                <Bar dataKey="monthly" stackId="a" fill="#6366f1" />
                                <Bar dataKey="yearly" stackId="a" fill="#ec4899" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                        <p className="text-[10px] text-muted-foreground mt-2">※ 年払いは更新日（または開始日）の月に計上</p>
                    </section>
                </div>
            )}

            {/* Tab: 内訳 */}
            {activeTab === 'breakdown' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                    {categoryData.length > 0 && (
                        <section className="bg-card border border-border rounded-2xl p-4">
                            <h2 className="text-sm font-bold flex items-center gap-2 mb-4">
                                <PieIcon size={16} className="text-amber-500" />
                                カテゴリ別内訳
                            </h2>
                            <div className="flex items-center gap-4">
                                <ResponsiveContainer width={140} height={140}>
                                    <PieChart>
                                        <Pie data={categoryData} cx="50%" cy="50%" innerRadius={35} outerRadius={60} dataKey="value" strokeWidth={0}>
                                            {categoryData.map((entry, i) => (
                                                <Cell key={i} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={tooltipStyle} formatter={(v: number | undefined) => [fmt(v ?? 0), '月額']} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="flex-1 space-y-1.5 min-w-0">
                                    {categoryData.map((d, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                                            <span className="text-xs text-muted-foreground truncate flex-1">{d.name}</span>
                                            <span className="text-xs font-bold shrink-0">{fmt(d.value)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>
                    )}

                    {heatmapData.length > 0 && (
                        <section className="bg-card border border-border rounded-2xl p-4">
                            <h2 className="text-sm font-bold flex items-center gap-2 mb-4">
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
                                                <div className="h-full rounded-lg transition-all duration-500"
                                                    style={{ width: `${intensity * 100}%`, backgroundColor: `rgba(99, 102, 241, ${opacity})`, minWidth: '4px' }}
                                                />
                                            </div>
                                            <span className="text-xs font-bold w-16 text-right shrink-0">{fmt(d.value)}</span>
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
            )}

            {/* Tab: 節約診断 */}
            {activeTab === 'diagnosis' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                    {/* 無駄コスト */}
                    <section className="bg-card border border-border rounded-2xl p-4">
                        <h2 className="text-sm font-bold flex items-center gap-2 mb-3">
                            <Lightbulb size={16} className="text-yellow-500" />
                            節約診断
                        </h2>
                        {wastedYearly > 0 ? (
                            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 mb-3">
                                <p className="text-xs text-muted-foreground mb-1">非アクティブのサブスクを解約すると</p>
                                <p className="text-2xl font-black text-rose-500">{fmt(wastedYearly)}<span className="text-sm font-normal text-muted-foreground">/年</span></p>
                                <p className="text-xs text-muted-foreground mt-1">節約できます（月額 {fmt(wastedMonthly)}）</p>
                            </div>
                        ) : (
                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mb-3">
                                <p className="text-sm font-bold text-emerald-500">✅ 非アクティブのサブスクはありません</p>
                                <p className="text-xs text-muted-foreground mt-1">すべてのサブスクが有効化されています</p>
                            </div>
                        )}
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between py-2 border-b border-border">
                                <span className="text-muted-foreground">アクティブ</span>
                                <span className="font-bold">{activeSubs.length}件 · {fmt(totalMonthly)}/月</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-border">
                                <span className="text-muted-foreground">非アクティブ</span>
                                <span className="font-bold text-rose-500">{inactiveSubs.length}件 · {fmt(wastedMonthly)}/月</span>
                            </div>
                            <div className="flex justify-between py-2">
                                <span className="text-muted-foreground">年間支出（予測）</span>
                                <span className="font-bold">{fmt(totalYearly)}</span>
                            </div>
                        </div>
                    </section>

                    {/* 重複カテゴリ */}
                    {duplicateCategories.length > 0 && (
                        <section className="bg-card border border-border rounded-2xl p-4">
                            <h2 className="text-sm font-bold mb-3">⚠️ 同カテゴリ複数登録</h2>
                            <p className="text-xs text-muted-foreground mb-3">同じカテゴリに複数のサブスクが登録されています。見直しのチャンスかもしれません。</p>
                            <div className="space-y-2">
                                {duplicateCategories.map((cat, i) => (
                                    <div key={i} className="flex items-center justify-between bg-muted/30 rounded-xl px-3 py-2">
                                        <div>
                                            <span className="text-sm font-bold">{cat.name}</span>
                                            <span className="text-xs text-muted-foreground ml-2">{cat.count}件</span>
                                        </div>
                                        <span className="text-sm font-bold text-amber-500">{fmt(cat.total)}/月</span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* 高額TOP3 */}
                    {topExpensive.length > 0 && (
                        <section className="bg-card border border-border rounded-2xl p-4">
                            <h2 className="text-sm font-bold mb-3">💰 高額サブスク TOP3</h2>
                            <div className="space-y-2">
                                {topExpensive.map((s, i) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-sm font-black ${i === 0 ? 'text-yellow-500' : 'text-muted-foreground/50'}`}>{i + 1}</span>
                                            <span className="text-sm font-medium truncate max-w-[160px]">{s.name}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-sm font-bold text-primary">{fmt(s.monthlyPrice)}</span>
                                            <span className="text-xs text-muted-foreground">/月</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* 削減提案 */}
                    <section className="bg-card border border-border rounded-2xl p-4">
                        <h2 className="text-sm font-bold mb-3">💡 削減提案</h2>
                        <div className="space-y-2 text-xs text-muted-foreground leading-relaxed">
                            {wastedYearly > 0 && (
                                <div className="flex gap-2">
                                    <ChevronRight size={14} className="text-primary shrink-0 mt-0.5" />
                                    <p>非アクティブの<span className="font-bold text-foreground">{inactiveSubs.length}件</span>を解約すると年間<span className="font-bold text-rose-500">{fmt(wastedYearly)}</span>の節約になります</p>
                                </div>
                            )}
                            {duplicateCategories.map((cat, i) => (
                                <div key={i} className="flex gap-2">
                                    <ChevronRight size={14} className="text-primary shrink-0 mt-0.5" />
                                    <p><span className="font-bold text-foreground">{cat.name}</span>カテゴリに{cat.count}件登録されています。1件に絞ると月額<span className="font-bold text-amber-500">{fmt(cat.total)}</span>の見直しができます</p>
                                </div>
                            ))}
                            {wastedYearly === 0 && duplicateCategories.length === 0 && (
                                <p className="text-center py-4">🎉 現在の登録内容に改善点は見つかりませんでした！</p>
                            )}
                        </div>
                    </section>
                </div>
            )}

            {/* Tab: 年次レポート */}
            {activeTab === 'report' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                    <section className="bg-card border border-border rounded-2xl p-4">
                        <h2 className="text-sm font-bold flex items-center gap-2 mb-4">
                            <FileText size={16} className="text-indigo-500" />
                            年次レポート
                        </h2>

                        {availableYears.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-muted-foreground text-sm">まだデータがありません</p>
                                <p className="text-xs text-muted-foreground mt-2">アプリを使い続けると月次データが蓄積されます</p>
                            </div>
                        ) : (
                            <>
                                {/* Year selector */}
                                <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
                                    {availableYears.map(year => (
                                        <button
                                            key={year}
                                            onClick={() => setSelectedYear(year)}
                                            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${selectedYear === year ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                                        >
                                            {year}年
                                        </button>
                                    ))}
                                </div>

                                {yearlySnapshots.length === 0 ? (
                                    <p className="text-center text-sm text-muted-foreground py-4">{selectedYear}年のデータはありません</p>
                                ) : (
                                    <div className="space-y-3">
                                        {/* Year summary */}
                                        <div className="grid grid-cols-2 gap-2 mb-4">
                                            <div className="bg-muted/30 rounded-xl p-3">
                                                <p className="text-xs text-muted-foreground">年間合計（実績）</p>
                                                <p className="text-lg font-bold text-primary">
                                                    {fmt(yearlySnapshots.reduce((sum, s) => sum + s.totalMonthly, 0))}
                                                </p>
                                            </div>
                                            <div className="bg-muted/30 rounded-xl p-3">
                                                <p className="text-xs text-muted-foreground">記録月数</p>
                                                <p className="text-lg font-bold">{yearlySnapshots.length}ヶ月</p>
                                            </div>
                                        </div>

                                        {/* Monthly breakdown */}
                                        {yearlySnapshots.map((snap, i) => (
                                            <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                                                <div>
                                                    <p className="text-sm font-bold">{snap.yearMonth.replace('-', '年')}月</p>
                                                    <p className="text-xs text-muted-foreground">アクティブ {snap.activeCount}件</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-bold text-primary">{fmt(snap.totalMonthly)}</p>
                                                    <p className="text-xs text-muted-foreground">/月</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </section>
                </div>
            )}
        </div>
    );
};

export default Analytics;
