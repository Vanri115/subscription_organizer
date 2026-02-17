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
