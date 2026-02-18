import { supabase } from '../lib/supabase';
import { loadSubscriptions } from './storage';
import { POPULAR_SERVICES } from '../data/services';

export const syncToCloud = async (userId: string) => {
    const localSubs = loadSubscriptions();

    // 1. Delete existing cloud subs for this user (Simple "Replace All" strategy for MVP)
    const { error: deleteError } = await supabase
        .from('user_subscriptions')
        .delete()
        .eq('user_id', userId);

    if (deleteError) {
        console.error('Error clearing old cloud data:', deleteError);
        throw deleteError;
    }

    if (localSubs.length === 0) return;

    // 2. Format local data for DB
    const subsToInsert = localSubs.map(sub => {
        const service = POPULAR_SERVICES.find(s => s.id === sub.serviceId);

        return {
            user_id: userId,
            service_id: sub.serviceId,
            name_custom: !service ? sub.customName : null, // Store name only if custom
            price: sub.price,
            currency: sub.currency,
            cycle: sub.cycle,
            category: service?.category || 'Other',
            is_active: sub.isActive,
            updated_at: new Date().toISOString()
        };
    });

    // 3. Insert new data
    const { error: insertError } = await supabase
        .from('user_subscriptions')
        .insert(subsToInsert);

    if (insertError) {
        console.error('Error syncing to cloud:', insertError);
        throw insertError;
    }

    return true;
};

export const setPublicProfile = async (userId: string, isPublic: boolean) => {
    const { error } = await supabase
        .from('profiles')
        .update({ is_public: isPublic })
        .eq('id', userId);

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
