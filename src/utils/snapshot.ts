/**
 * Monthly snapshot utility
 * Saves a monthly snapshot of subscription data to localStorage.
 * Used for yearly reports in the Analytics page.
 */

export interface MonthlySnapshot {
    yearMonth: string;              // "2025-02"
    totalMonthly: number;           // Total monthly cost (yearly subs ÷12)
    totalYearly: number;            // Annualized total
    activeCount: number;
    inactiveCount: number;
    categoryBreakdown: Record<string, number>; // category → monthly cost
    savedAt: string;                // ISO timestamp
}

const STORAGE_KEY = 'monthly_snapshots';

export function saveSnapshot(
    subs: { isActive: boolean; price: number; cycle: string; serviceId?: string; customName?: string }[],
    categoryMap: Record<string, string> // serviceId → category
): void {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Check if already saved this month
    const existing = getSnapshots();
    if (existing.some(s => s.yearMonth === yearMonth)) return;

    const activeSubs = subs.filter(s => s.isActive);
    const inactiveSubs = subs.filter(s => !s.isActive);

    const toMonthly = (s: { price: number; cycle: string }) =>
        s.cycle === 'yearly' ? s.price / 12 : s.price;

    const totalMonthly = activeSubs.reduce((sum, s) => sum + toMonthly(s), 0);

    const categoryBreakdown: Record<string, number> = {};
    activeSubs.forEach(s => {
        const cat = (s.serviceId && categoryMap[s.serviceId]) || 'Other';
        categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + toMonthly(s);
    });

    const snapshot: MonthlySnapshot = {
        yearMonth,
        totalMonthly: Math.round(totalMonthly),
        totalYearly: Math.round(totalMonthly * 12),
        activeCount: activeSubs.length,
        inactiveCount: inactiveSubs.length,
        categoryBreakdown,
        savedAt: now.toISOString(),
    };

    const updated = [...existing, snapshot].sort((a, b) => a.yearMonth.localeCompare(b.yearMonth));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function getSnapshots(): MonthlySnapshot[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

export function getYearlyReport(year: number): MonthlySnapshot[] {
    return getSnapshots().filter(s => s.yearMonth.startsWith(`${year}-`));
}

export function getAvailableYears(): number[] {
    const snapshots = getSnapshots();
    const years = [...new Set(snapshots.map(s => parseInt(s.yearMonth.split('-')[0])))];
    return years.sort((a, b) => b - a);
}
