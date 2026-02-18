import type { UserSubscription } from '../types';

const STORAGE_KEY = 'subs_manager_data';

export const loadSubscriptions = (): UserSubscription[] => {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Failed to load subscriptions:', error);
        return [];
    }
};

export const saveSubscriptions = (subs: UserSubscription[]) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(subs));
    } catch (error) {
        console.error('Failed to save subscriptions:', error);
    }
};


export const clearSubscriptions = () => {
    localStorage.removeItem(STORAGE_KEY);
};

export const parseCSV = (csvText: string): UserSubscription[] => {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    // Expected headers: name, price, cycle, firstBillDate, category, memo, url

    // Create a map of header name to index
    const headerMap = headers.reduce((acc, header, index) => {
        acc[header] = index;
        return acc;
    }, {} as Record<string, number>);

    return lines.slice(1).map(line => {
        // Handle quotes if necessary, but for now simple split
        // A better regex split for CSV:
        const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g)?.map(v => v.replace(/^"|"$/g, '')) || line.split(',');

        // Helper to get value safely
        const getVal = (key: string) => {
            const idx = headerMap[key];
            return idx !== undefined && values[idx] ? values[idx].trim() : '';
        };

        const name = getVal('name');
        const price = parseInt(getVal('price')) || 0;
        const cycle = getVal('cycle') === 'yearly' ? 'yearly' : 'monthly';

        return {
            id: crypto.randomUUID(),
            serviceId: 'custom',
            planId: 'custom',
            customName: name || 'No Name',
            price: price,
            currency: 'JPY',
            cycle: cycle,
            startDate: getVal('firstBillDate') || new Date().toISOString(),
            isActive: true,
            memo: getVal('memo'),
            category: getVal('category') || 'Other',
            // url is not in UserSubscription directly but maybe serviceUrl if we had it
        } as UserSubscription;
    }).filter(sub => sub.price > 0 || sub.customName !== 'No Name');
};
