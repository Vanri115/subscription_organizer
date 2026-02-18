import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { POPULAR_SERVICES } from '../data/services';
import ServiceIcon from '../components/ServiceIcon';
import { ArrowLeft, Lock, User, RefreshCw, Share2 } from 'lucide-react';
import { formatCurrency } from '../utils/calculations';

interface PublicSubscription {
    id: string;
    service_id: string;
    name_custom: string | null;
    price: number;
    currency: string;
    cycle: 'monthly' | 'yearly';
    category: string;
    is_active: boolean;
}

const UserProfile: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<{ display_name: string; is_public: boolean } | null>(null);
    const [subscriptions, setSubscriptions] = useState<PublicSubscription[]>([]);

    useEffect(() => {
        if (id) fetchPublicProfile();
    }, [id]);

    const fetchPublicProfile = async () => {
        if (!id) return;
        setLoading(true);

        // 1. Fetch Profile
        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('display_name, is_public')
            .eq('id', id)
            .single();

        if (profileError || !profileData) {
            setProfile(null);
            setLoading(false);
            return;
        }

        setProfile(profileData);

        // 2. If Public, Fetch Subscriptions
        if (profileData.is_public) {
            const { data: subsData } = await supabase
                .from('user_subscriptions')
                .select('*')
                .eq('user_id', id)
                .eq('is_active', true) // Only show active subs? Or all? Let's show active.
                .order('price', { ascending: false });

            if (subsData) {
                setSubscriptions(subsData as PublicSubscription[]);
            }
        }
        setLoading(false);
    };

    const copyUrl = () => {
        navigator.clipboard.writeText(window.location.href);
        alert('URLをコピーしました！');
    };

    if (loading) return <div className="p-8 text-center text-muted-foreground">読み込み中...</div>;

    if (!profile) {
        return (
            <div className="p-8 text-center min-h-screen bg-background text-foreground">
                <p className="mb-4">ユーザーが見つかりません</p>
                <button onClick={() => navigate('/')} className="text-primary hover:underline">トップへ戻る</button>
            </div>
        );
    }

    if (!profile.is_public) {
        return (
            <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
                <div className="bg-card p-6 rounded-2xl shadow-sm border border-border text-center max-w-sm w-full">
                    <Lock size={48} className="mx-auto mb-4 text-muted-foreground" />
                    <h1 className="text-lg font-bold mb-2">{profile.display_name} さんのプロフィール</h1>
                    <p className="text-muted-foreground text-sm">このプロフィールは非公開です。</p>
                    <button onClick={() => navigate('/')} className="mt-6 text-primary text-sm hover:underline">トップへ戻る</button>
                </div>
            </div>
        );
    }

    // Calculate Total
    const totalMonthly = subscriptions.reduce((acc, sub) => {
        let amount = sub.price;
        if (sub.cycle === 'yearly') amount = Math.floor(amount / 12);
        // Simplified currency handling (assuming JPY for now or matching)
        return acc + amount;
    }, 0);

    return (
        <div className="min-h-screen bg-background text-foreground pb-24">
            {/* Header */}
            <div className="p-4 flex items-center justify-between bg-card border-b border-border sticky top-0 z-10 shadow-sm">
                <div className="flex items-center space-x-2">
                    <button onClick={() => navigate('/')} className="p-2 -ml-2 hover:bg-muted rounded-full transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <span className="font-bold truncate">{profile.display_name} のサブスク</span>
                </div>
                <button onClick={copyUrl} className="p-2 hover:bg-muted rounded-full text-primary transition-colors">
                    <Share2 size={20} />
                </button>
            </div>

            <div className="max-w-md mx-auto p-4 space-y-6">

                {/* Profile Card */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex items-center space-x-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                        <User size={32} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold">{profile.display_name}</h1>
                        <p className="text-muted-foreground text-xs flex items-center mt-1">
                            <RefreshCw size={10} className="mr-1" />
                            公開中サブスク: {subscriptions.length}個
                        </p>
                    </div>
                </div>

                {/* Total Card */}
                <div className="bg-gradient-to-r from-primary/10 to-blue-500/10 rounded-2xl p-5 border border-primary/20">
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">推定月額合計</p>
                    <p className="text-3xl font-black text-foreground">
                        {/* Currency symbol hardcoded or derived from first item for MVP */}
                        ¥{totalMonthly.toLocaleString()}
                    </p>
                </div>

                {/* List */}
                <div className="space-y-3">
                    <h2 className="text-sm font-bold text-muted-foreground px-1">登録リスト</h2>
                    {subscriptions.length === 0 ? (
                        <p className="text-center text-sm text-muted-foreground py-8">公開されているサブスクはありません</p>
                    ) : (
                        subscriptions.map(sub => {
                            const service = POPULAR_SERVICES.find(s => s.id === sub.service_id);
                            const name = service ? service.name : sub.name_custom || 'Unknown';
                            const color = service ? service.color : '#888';
                            const url = service?.url;

                            return (
                                <div key={sub.id} className="bg-card border border-border rounded-xl p-3 shadow-sm flex items-center">
                                    <ServiceIcon
                                        serviceName={name}
                                        serviceColor={color}
                                        domain={url}
                                        className="w-10 h-10 mr-3 shadow-sm"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-sm truncate">{name}</h3>
                                        <p className="text-xs text-muted-foreground">{sub.cycle === 'yearly' ? '年額' : '月額'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-sm">
                                            {formatCurrency(sub.price, sub.currency, 1)}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

            </div>
        </div>
    );
};

export default UserProfile;
