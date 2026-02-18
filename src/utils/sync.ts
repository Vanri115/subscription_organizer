import { supabase } from '../lib/supabase';
import { saveSubscriptions, loadSubscriptions } from './storage';
import { POPULAR_SERVICES } from '../data/services';
import type { UserSubscription } from '../types';

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
            updated_at: new Date().toISOString(),
            custom_icon: sub.customIcon, // Save custom icon URL
            renewal_date: sub.renewalDate,
            memo: sub.memo,
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
