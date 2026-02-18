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

    // 4. Sync Category Order to Profile
    try {
        const categoryOrderStr = localStorage.getItem('category_order');
        const categoryOrder = categoryOrderStr ? JSON.parse(categoryOrderStr) : [];
        if (categoryOrder.length > 0) {
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: userId,
                    category_order: categoryOrder, // Ensure this column is JSONB/JSON in DB
                    updated_at: new Date().toISOString()
                }, { onConflict: 'id' });

            if (profileError) {
                console.error('Error syncing profile (category_order):', profileError);
                // We don't throw here to avoid blocking main sync if profile fails
            }
        }
    } catch (e) {
        console.error('Error readying category_order for sync:', e);
    }

    return true;
};

export const loadFromCloud = async (userId: string): Promise<{ subscriptions: UserSubscription[], categoryOrder: string[] | null }> => {
    // Load Subscriptions
    const { data: subData, error: subError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId);

    if (subError) {
        console.error('Error loading from cloud:', subError);
        throw subError;
    }

    // Load Profile (Category Order)
    const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('category_order')
        .eq('id', userId)
        .single();

    if (profileError && profileError.code !== 'PGRST116') { // Ignore "Row not found"
        console.error('Error loading profile:', profileError);
    }

    const categoryOrder = profileData?.category_order as string[] || null;

    if (categoryOrder) {
        localStorage.setItem('category_order', JSON.stringify(categoryOrder));
    }

    if (!subData) return { subscriptions: [], categoryOrder };

    // Map DB data to local format
    const remoteSubs: UserSubscription[] = subData.map((item: any) => ({
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
        memo: item.memo,
        sortOrder: item.sort_order // Ensure simple snake_case mapping from DB if we added it
    }));

    saveSubscriptions(remoteSubs);
    return { subscriptions: remoteSubs, categoryOrder };
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
