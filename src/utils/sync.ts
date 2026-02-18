import { supabase } from '../lib/supabase';
import { saveSubscriptions, loadSubscriptions } from './storage';
import { POPULAR_SERVICES } from '../data/services';
import type { UserSubscription } from '../types';

export const syncToCloud = async (userId: string) => {
    const localSubs = loadSubscriptions();

    if (localSubs.length === 0) {
        // If local is empty, we should clear cloud too
        // But we should be careful not to wipe cloud if local is just "fresh"
        // However, if the user explicitly deleted everything locally, we should reflect that.
        // For now, if local is empty, we wipe cloud for this user.
        const { error } = await supabase.from('user_subscriptions').delete().eq('user_id', userId);
        if (error) throw error;
        return;
    }

    // 1. Format local data for DB (Include ID for upsert)
    const subsToUpsert = localSubs.map(sub => {
        const service = POPULAR_SERVICES.find(s => s.id === sub.serviceId);
        return {
            id: sub.id, // IMPORTANT: Maintain ID stability
            user_id: userId,
            service_id: sub.serviceId,
            name_custom: !service ? sub.customName : null,
            price: sub.price,
            currency: sub.currency,
            cycle: sub.cycle,
            category: service?.category || 'Other',
            is_active: sub.isActive,
            updated_at: new Date().toISOString(),
            custom_icon: sub.customIcon,
            renewal_date: sub.renewalDate,
            memo: sub.memo,
        };
    });

    // 2. Upsert (Insert or Update)
    const { error: upsertError } = await supabase
        .from('user_subscriptions')
        .upsert(subsToUpsert, { onConflict: 'id' });

    if (upsertError) {
        console.error('Error syncing (upsert):', upsertError);
        throw upsertError;
    }

    // 3. Delete items that are in Cloud but NOT in Local
    // Verify what's in Cloud now
    const { data: cloudData, error: fetchError } = await supabase
        .from('user_subscriptions')
        .select('id')
        .eq('user_id', userId);

    if (fetchError) {
        console.error('Error fetching for cleanup:', fetchError);
        return;
    }

    if (cloudData) {
        const localIds = new Set(localSubs.map(s => s.id));
        const idsToDelete = cloudData
            .filter(row => !localIds.has(row.id))
            .map(row => row.id);

        if (idsToDelete.length > 0) {
            const { error: deleteError } = await supabase
                .from('user_subscriptions')
                .delete()
                .in('id', idsToDelete);

            if (deleteError) console.error('Error cleaning up old subs:', deleteError);
        }
    }

    return true;
};

export const loadFromCloud = async (userId: string): Promise<UserSubscription[]> => {
    const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId);

    if (error) {
        console.error('Error loading from cloud:', error);
        throw error;
    }

    if (!data) return [];

    // Map DB data to local format
    const remoteSubs: UserSubscription[] = data.map((item: any) => ({
        id: item.id || crypto.randomUUID(),
        serviceId: item.service_id,
        planId: 'cloud_sync_restored', // Placeholder since DB doesn't store planId yet
        customName: item.name_custom,
        price: item.price,
        currency: item.currency,
        cycle: item.cycle,
        isActive: item.is_active,
        startDate: new Date().toISOString(), // We don't store start date in DB currently? 
        customIcon: item.custom_icon,
        renewalDate: item.renewal_date,
        memo: item.memo
    }));

    saveSubscriptions(remoteSubs);
    return remoteSubs;
};

export const setPublicProfile = async (userId: string, isPublic: boolean) => {
    const { error } = await supabase
        .from('profiles')
        .upsert({ id: userId, is_public: isPublic, updated_at: new Date().toISOString() }, { onConflict: 'id' });

    if (error) throw error;
};

export const getPublicProfile = async (userId: string) => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) return null;
    return data;
};
