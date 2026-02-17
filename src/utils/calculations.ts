import type { UserSubscription } from '../types';

export const calculateTotal = (subs: UserSubscription[], period: 'monthly' | 'yearly'): number => {
    return subs.reduce((total, sub) => {
        if (!sub.isActive) return total;

        let cost = sub.price;

        if (period === 'monthly') {
            if (sub.cycle === 'monthly') {
                return total + cost;
            } else {
                return total + Math.floor(cost / 12);
            }
        } else {
            if (sub.cycle === 'monthly') {
                return total + (cost * 12);
            } else {
                return total + cost;
            }
        }
    }, 0);
};

export const formatCurrency = (amountInJpy: number, currency: string = 'JPY', rate: number | null = null): string => {
    let displayAmount = amountInJpy;
    let locale = 'ja-JP';

    if (currency === 'USD') {
        locale = 'en-US';
        if (rate) {
            displayAmount = amountInJpy * rate;
        }
    }

    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: currency === 'USD' ? 2 : 0,
        maximumFractionDigits: currency === 'USD' ? 2 : 0,
    }).format(displayAmount);
};
