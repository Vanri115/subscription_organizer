import React, { useMemo, useState } from 'react';
import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer
} from 'recharts';
import { PieChart as PieIcon, Lightbulb, FileText, Settings, ChevronRight } from 'lucide-react';
import { loadSubscriptions } from '../utils/storage';
import { POPULAR_SERVICES } from '../data/services';
import { useSettings } from '../contexts/SettingsContext';
import { formatCurrency } from '../utils/calculations';
import { getCategoryBreakdownFromMap, toMonthly } from '../utils/analytics';
import { getAvailableYears, getYearlyReport } from '../utils/snapshot';
import { useNavigate } from 'react-router-dom';

const CATEGORY_LABELS: Record<string, string> = {
    'All': 'すべて', 'Video': '動画', 'Music': '音楽', 'Book': '書籍',
    'Game': 'ゲーム', 'Gym': 'ジム', 'Salon': 'サロン', 'Travel': '旅行',
    'Food': 'グルメ', 'Dev': '開発', 'Business': 'ビジネス', 'AI': 'AI',
    'Security': 'セキュリティ', 'Learning': '学習', 'Software': 'IT',
    'School': '学校', 'Shopping': '買い物', 'Other': 'その他',
};

type AnalyticsTab = 'breakdown' | 'diagnosis' | 'report';

type SubForScore = { price: number; cycle: string };

function monthlyFromSub(s: SubForScore): number {
    return s.cycle === 'yearly' ? s.price / 12 : s.price;
}

// Savings score logic (0–100)
function calcSavingsScore(
    activeSubs: SubForScore[],
    inactiveSubs: SubForScore[],
    duplicateCount: number,
): { score: number; rank: 'S' | 'A' | 'B' | 'C' | 'D' } {
    let score = 100;

    // Penalty: inactive subs (up to -30)
    const inactiveRatio = inactiveSubs.length / Math.max(activeSubs.length + inactiveSubs.length, 1);
    score -= Math.round(inactiveRatio * 30);

    // Penalty: duplicate categories (up to -30, -10 per duplicate category)
    score -= Math.min(duplicateCount * 10, 30);

    // Penalty: high-cost subs over ¥3000/month (up to -20, -7 per)
    const expensive = activeSubs.filter(s => monthlyFromSub(s) > 3000);
    score -= Math.min(expensive.length * 7, 20);

    // Penalty: too many subs (over 8 active, -2 per extra)
    const excess = Math.max(activeSubs.length - 8, 0);
    score -= Math.min(excess * 2, 20);

    score = Math.max(0, Math.min(100, score));

    const rank = score >= 90 ? 'S' : score >= 75 ? 'A' : score >= 55 ? 'B' : score >= 35 ? 'C' : 'D';
    return { score, rank };
}

const RANK_CONFIG = {
    S: { color: 'text-yellow-400', bg: 'bg-yellow-500/20 border-yellow-500/30', label: '完璧！無駄なし' },
    A: { color: 'text-emerald-400', bg: 'bg-emerald-500/20 border-emerald-500/30', label: '優秀！ほぼ最適' },
    B: { color: 'text-blue-400', bg: 'bg-blue-500/20 border-blue-500/30', label: '良好。少し改善余地あり' },
    C: { color: 'text-amber-400', bg: 'bg-amber-500/20 border-amber-500/30', label: '要見直し。節約チャンスあり' },
    D: { color: 'text-rose-400', bg: 'bg-rose-500/20 border-rose-500/30', label: '要改善。大幅節約できます' },
};

const Analytics: React.FC = () => {
    const { currency, exchangeRate } = useSettings();
    const navigate = useNavigate();
    const subs = useMemo(() => loadSubscriptions(), []);
    const [activeTab, setActiveTab] = useState<AnalyticsTab>('breakdown');
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

    const categoryData = useMemo(() =>
        getCategoryBreakdownFromMap(subsWithMeta, CATEGORY_LABELS), [subsWithMeta]);

    const totalMonthly = useMemo(() =>
        activeSubs.reduce((sum, s) => sum + toMonthly(s), 0), [activeSubs]);

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

    const { score, rank } = useMemo(() =>
        calcSavingsScore(activeSubs, inactiveSubs, duplicateCategories.length),
        [activeSubs, inactiveSubs, duplicateCategories.length]);

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
        { id: 'breakdown', label: '内訳', icon: <PieIcon size={14} /> },
        { id: 'diagnosis', label: '節約診断', icon: <Lightbulb size={14} /> },
        { id: 'report', label: '年次レポート', icon: <FileText size={14} /> },
    ];

    return (
        <div className="p-4 max-w-md mx-auto pb-24">
            {/* Header */}
            <header className="pb-4 flex items-center justify-between">
                <button
                    onClick={() => navigate('/settings')}
                    className="text-muted-foreground hover:text-foreground hover:bg-muted p-2 rounded-full transition-colors"
                    title="設定"
                >
                    <Settings size={20} />
                </button>
                <h1 className="text-2xl font-bold text-foreground">分析</h1>
                <div className="w-9" />
            </header>

            {activeSubs.length === 0 && activeTab !== 'report' ? (
                <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
                    <PieIcon size={48} className="text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground font-medium">サブスクを登録すると<br />分析データが表示されます</p>
                </div>
            ) : (
                <>
                    {/* Tab Navigation */}
                    <div className="flex p-1 bg-muted/50 rounded-xl mb-6 gap-1">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${activeTab === tab.id
                                    ? 'bg-background text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground/80'
                                    }`}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Tab: 内訳 */}
                    {activeTab === 'breakdown' && (
                        <div className="space-y-4 animate-in fade-in duration-200">
                            {/* Summary row */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-card border border-border rounded-2xl p-4">
                                    <p className="text-xs text-muted-foreground mb-1">月額合計</p>
                                    <p className="text-xl font-bold text-primary">{fmt(totalMonthly)}</p>
                                    <p className="text-[10px] text-muted-foreground mt-1">{activeSubs.length}件アクティブ</p>
                                </div>
                                <div className="bg-card border border-border rounded-2xl p-4">
                                    <p className="text-xs text-muted-foreground mb-1">年間合計</p>
                                    <p className="text-xl font-bold text-foreground">{fmt(totalMonthly * 12)}</p>
                                    <p className="text-[10px] text-muted-foreground mt-1">年額換算</p>
                                </div>
                            </div>

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
                        </div>
                    )}

                    {/* Tab: 節約診断 */}
                    {activeTab === 'diagnosis' && (
                        <div className="space-y-4 animate-in fade-in duration-200">
                            {/* Savings Score */}
                            <section className="bg-card border border-border rounded-2xl p-5">
                                <h2 className="text-sm font-bold mb-4 flex items-center gap-2">
                                    <Lightbulb size={16} className="text-yellow-500" />
                                    節約スコア
                                </h2>
                                <div className={`flex items-center gap-4 p-4 rounded-xl border ${RANK_CONFIG[rank].bg}`}>
                                    <div className="text-center">
                                        <div className={`text-5xl font-black ${RANK_CONFIG[rank].color}`}>{rank}</div>
                                        <div className="text-xs text-muted-foreground mt-1">ランク</div>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-end gap-1 mb-2">
                                            <span className={`text-3xl font-black ${RANK_CONFIG[rank].color}`}>{score}</span>
                                            <span className="text-sm text-muted-foreground mb-1">/100</span>
                                        </div>
                                        {/* Score bar */}
                                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-700"
                                                style={{
                                                    width: `${score}%`,
                                                    background: score >= 75 ? '#10b981' : score >= 55 ? '#3b82f6' : score >= 35 ? '#f59e0b' : '#ef4444'
                                                }}
                                            />
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-2">{RANK_CONFIG[rank].label}</p>
                                    </div>
                                </div>

                                {/* Score breakdown */}
                                <div className="mt-4 space-y-2 text-xs">
                                    <div className="flex justify-between py-1.5 border-b border-border">
                                        <span className="text-muted-foreground">非アクティブ率</span>
                                        <span className={`font-bold ${inactiveSubs.length > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                            {inactiveSubs.length === 0 ? '✓ なし' : `-${Math.round((inactiveSubs.length / Math.max(subs.length, 1)) * 30)}pt`}
                                        </span>
                                    </div>
                                    <div className="flex justify-between py-1.5 border-b border-border">
                                        <span className="text-muted-foreground">重複カテゴリ</span>
                                        <span className={`font-bold ${duplicateCategories.length > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                            {duplicateCategories.length === 0 ? '✓ なし' : `-${Math.min(duplicateCategories.length * 10, 30)}pt`}
                                        </span>
                                    </div>
                                    <div className="flex justify-between py-1.5 border-b border-border">
                                        <span className="text-muted-foreground">高額サブスク（¥3000超）</span>
                                        <span className={`font-bold ${activeSubs.filter(s => toMonthly(s) > 3000).length > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                            {activeSubs.filter(s => toMonthly(s) > 3000).length === 0 ? '✓ なし' : `-${Math.min(activeSubs.filter(s => toMonthly(s) > 3000).length * 7, 20)}pt`}
                                        </span>
                                    </div>
                                    <div className="flex justify-between py-1.5">
                                        <span className="text-muted-foreground">登録数（8件超）</span>
                                        <span className={`font-bold ${activeSubs.length > 8 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                            {activeSubs.length <= 8 ? '✓ 適切' : `-${Math.min((activeSubs.length - 8) * 2, 20)}pt`}
                                        </span>
                                    </div>
                                </div>
                            </section>

                            {/* Wasted cost */}
                            {wastedYearly > 0 && (
                                <section className="bg-card border border-border rounded-2xl p-4">
                                    <h2 className="text-sm font-bold mb-3">💸 解約で節約できる金額</h2>
                                    <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4">
                                        <p className="text-xs text-muted-foreground mb-1">非アクティブ {inactiveSubs.length}件を解約すると</p>
                                        <p className="text-2xl font-black text-rose-500">{fmt(wastedYearly)}<span className="text-sm font-normal text-muted-foreground">/年</span></p>
                                        <p className="text-xs text-muted-foreground mt-1">月額 {fmt(wastedMonthly)} の節約</p>
                                    </div>
                                </section>
                            )}

                            {/* Duplicate categories */}
                            {duplicateCategories.length > 0 && (
                                <section className="bg-card border border-border rounded-2xl p-4">
                                    <h2 className="text-sm font-bold mb-3">⚠️ 同カテゴリ複数登録</h2>
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

                            {/* Top expensive */}
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

                            {/* Suggestions */}
                            <section className="bg-card border border-border rounded-2xl p-4">
                                <h2 className="text-sm font-bold mb-3">💡 改善提案</h2>
                                <div className="space-y-2 text-xs text-muted-foreground leading-relaxed">
                                    {wastedYearly > 0 && (
                                        <div className="flex gap-2">
                                            <ChevronRight size={14} className="text-primary shrink-0 mt-0.5" />
                                            <p>非アクティブ<span className="font-bold text-foreground">{inactiveSubs.length}件</span>を解約 → 年間<span className="font-bold text-rose-500">{fmt(wastedYearly)}</span>節約</p>
                                        </div>
                                    )}
                                    {duplicateCategories.map((cat, i) => (
                                        <div key={i} className="flex gap-2">
                                            <ChevronRight size={14} className="text-primary shrink-0 mt-0.5" />
                                            <p><span className="font-bold text-foreground">{cat.name}</span>を1件に絞る → 月額<span className="font-bold text-amber-500">{fmt(cat.total)}</span>見直し可能</p>
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
                </>
            )}
        </div>
    );
};

export default Analytics;
