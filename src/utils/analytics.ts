import type { UserSubscription } from '../types';

/** 月額換算（年払いは÷12） */
export function toMonthly(sub: UserSubscription): number {
    return sub.cycle === 'yearly' ? sub.price / 12 : sub.price;
}

/** 過去N ヶ月の月別合計（現在のサブスク構成を基に推定） */
export function getMonthlyTotals(
    subs: UserSubscription[],
    months = 12
): { month: string; total: number }[] {
    const result: { month: string; total: number }[] = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const label = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}`;

        // アクティブなサブスクのみ集計
        const total = subs
            .filter(s => s.isActive)
            .reduce((sum, s) => sum + toMonthly(s), 0);

        result.push({ month: label, total: Math.round(total) });
    }
    return result;
}

/** 今後12ヶ月の年間予測 */
export function getAnnualForecast(
    subs: UserSubscription[]
): { month: string; monthly: number; yearly: number }[] {
    const result: { month: string; monthly: number; yearly: number }[] = [];
    const now = new Date();

    for (let i = 0; i < 12; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
        const label = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}`;

        const activeSubs = subs.filter(s => s.isActive);

        // 月払いの合計
        const monthlyTotal = activeSubs
            .filter(s => s.cycle === 'monthly')
            .reduce((sum, s) => sum + s.price, 0);

        // 年払いで、その月が更新月のもの（renewalDate ベース、なければ startDate）
        const yearlyThisMonth = activeSubs
            .filter(s => {
                if (s.cycle !== 'yearly') return false;
                const refDate = s.renewalDate || s.startDate;
                if (!refDate) return false;
                const ref = new Date(refDate);
                return ref.getMonth() === d.getMonth();
            })
            .reduce((sum, s) => sum + s.price, 0);

        result.push({
            month: label,
            monthly: Math.round(monthlyTotal),
            yearly: Math.round(yearlyThisMonth),
        });
    }
    return result;
}

/** カテゴリ別コスト内訳 */
export function getCategoryBreakdown(
    subs: UserSubscription[],
    categoryLabels: Record<string, string>
): { name: string; value: number; color: string }[] {
    const COLORS = [
        '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
        '#f97316', '#eab308', '#22c55e', '#14b8a6',
        '#3b82f6', '#06b6d4', '#a855f7', '#84cc16',
    ];

    const map: Record<string, number> = {};
    subs.filter(s => s.isActive).forEach(s => {
        // serviceId から category を取得するのは難しいので、serviceId をキーに
        // Dashboard側でカテゴリ情報を渡す設計にする
        const key = s.serviceId || 'Other';
        map[key] = (map[key] || 0) + toMonthly(s);
    });

    return Object.entries(map)
        .map(([key, value], i) => ({
            name: categoryLabels[key] || key,
            value: Math.round(value),
            color: COLORS[i % COLORS.length],
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8); // 上位8件
}

/** カテゴリ別コスト内訳（カテゴリ情報付き版） */
export interface CategoryData {
    name: string;
    value: number;
    color: string;
}

export function getCategoryBreakdownFromMap(
    subsWithCategory: { category: string; monthlyPrice: number }[],
    categoryLabels: Record<string, string>
): CategoryData[] {
    const COLORS = [
        '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
        '#f97316', '#eab308', '#22c55e', '#14b8a6',
        '#3b82f6', '#06b6d4', '#a855f7', '#84cc16',
    ];

    const map: Record<string, number> = {};
    subsWithCategory.forEach(({ category, monthlyPrice }) => {
        map[category] = (map[category] || 0) + monthlyPrice;
    });

    return Object.entries(map)
        .map(([key, value], i) => ({
            name: categoryLabels[key] || key,
            value: Math.round(value),
            color: COLORS[i % COLORS.length],
        }))
        .sort((a, b) => b.value - a.value);
}

/** コストヒートマップ用データ（月×カテゴリ） */
export function getHeatmapData(
    subsWithCategory: { category: string; monthlyPrice: number; name: string }[]
): { category: string; value: number }[] {
    const map: Record<string, number> = {};
    subsWithCategory.forEach(({ category, monthlyPrice }) => {
        map[category] = (map[category] || 0) + monthlyPrice;
    });
    return Object.entries(map)
        .map(([category, value]) => ({ category, value: Math.round(value) }))
        .sort((a, b) => b.value - a.value);
}

/** 最大値を基準にした強度（0〜1） */
export function getIntensity(value: number, max: number): number {
    if (max === 0) return 0;
    return value / max;
}
