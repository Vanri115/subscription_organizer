import { supabase } from '../lib/supabase';
import { loadSubscriptions, saveSubscriptions } from './storage';
import type { UserSubscription } from '../types';

export const syncOnLogin = async (userId: string) => {
    try {
        const localSubs = loadSubscriptions();

        // 1. Fetch cloud subs
        const { data: cloudSubs, error } = await supabase
            .from('user_subscriptions')
            .select('*')
            .eq('user_id', userId);

        if (error) throw error;

        // 2. If no cloud data, push local data
        if (!cloudSubs || cloudSubs.length === 0) {
            if (localSubs.length > 0) {
                await pushToCloud(localSubs, userId);
            }
            return localSubs;
        }

        // 3. If cloud data exists, merge
        // For simplicity in this v1:
        // - If ID exists in both, Cloud wins (or latest updated_at if we had it)
        // - If ID only in local, keep it (and push to cloud?) -> Let's append local-only to cloud
        // - If ID only in Cloud, add to local

        // Convert db row to UserSubscription type if needed. 
        // Assuming column names match roughly or we map them.
        // DB: id, user_id, service_id, plan_id, price, currency, cycle, is_active...
        // Local: id, serviceId, planId, price... 

        // Map Cloud -> Local
        const formattedCloudSubs: UserSubscription[] = cloudSubs.map((item: any) => ({
            id: item.id,
            serviceId: item.service_id,
            planId: item.plan_id,
            customName: item.custom_name,
            price: Number(item.price),
            currency: item.currency,
            cycle: item.cycle as 'monthly' | 'yearly',
            startDate: item.start_date,
            isActive: item.is_active
        }));

        // Find items in local that are NOT in cloud (by ID)
        // Note: Local IDs might be random UUIDs generated locally. 
        // If we want to dedup by ServiceID, that's complex (what if user has 2 Netflix accounts?).
        // For now, let's assume we implement a specific strategy: 
        // "Cloud is Source of Truth". We just return cloud data. 
        // BUT, if user just created data locally before login, we want to keep it.

        // Strategy: 
        // Combined list. 
        // If local has items not in cloud (ID mismatch), upload them.

        const cloudIds = new Set(formattedCloudSubs.map(s => s.id));
        const newLocalSubs = localSubs.filter(s => !cloudIds.has(s.id));

        if (newLocalSubs.length > 0) {
            await pushToCloud(newLocalSubs, userId);
            // Now fetching again to get complete list including newly inserted 
            // (or just append)
            return [...formattedCloudSubs, ...newLocalSubs];
        }

        // Update local storage with cloud data
        saveSubscriptions(formattedCloudSubs);
        return formattedCloudSubs;

    } catch (error) {
        console.error('Sync failed:', error);
        return loadSubscriptions(); // Fallback to local
    }
};

const pushToCloud = async (subs: UserSubscription[], userId: string) => {
    if (subs.length === 0) return;

    const dbRows = subs.map(sub => ({
        id: sub.id, // Use local ID if it's a valid UUID, otherwise let DB generate? 
        // Better to let DB generate if it's not a UUID, but we use crypto.randomUUID() usually.
        user_id: userId,
        service_id: sub.serviceId,
        plan_id: sub.planId,
        custom_name: sub.customName,
        price: sub.price,
        currency: sub.currency,
        cycle: sub.cycle,
        is_active: sub.isActive,
        start_date: sub.startDate
    }));

    const { error } = await supabase
        .from('user_subscriptions')
        .upsert(dbRows);

    if (error) throw error;
};
