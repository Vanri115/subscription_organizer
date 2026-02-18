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
            .select('display_name, is_public, bio, avatar_url')
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
                .eq('is_active', true)
                .order('price', { ascending: false });

            if (subsData) {
                setSubscriptions(subsData as PublicSubscription[]);
            }
        } else {
            // Explicitly set subscriptions to empty if not public (though RLS should handle it)
            setSubscriptions([]);
        }
        setLoading(false);
    };

    const copyUrl = () => {
        navigator.clipboard.writeText(window.location.href);
        alert('URLをコピーしました！');
    };

    if (loading) return <div className="p-8 text-center text-muted-foreground animate-pulse">プロフィールを読み込み中...</div>;

    if (!profile) {
        return (
            <div className="p-8 text-center min-h-screen bg-background text-foreground flex flex-col items-center justify-center">
                <div className="bg-muted rounded-full p-4 mb-4">
                    <User size={48} className="text-muted-foreground" />
                </div>
                <h2 className="text-xl font-bold mb-2">ユーザーが見つかりません</h2>
                <p className="text-muted-foreground text-sm mb-6">URLが間違っているか、削除された可能性があります。</p>
                <button onClick={() => navigate('/')} className="bg-primary text-primary-foreground px-6 py-2 rounded-full font-bold shadow-md hover:scale-105 transition-transform">
                    トップページへ
                </button>
            </div>
        );
    }

    if (!profile.is_public) {
        return (
            <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
                <div className="bg-card p-8 rounded-3xl shadow-lg border border-border text-center max-w-sm w-full animate-in zoom-in-95 duration-300">
                    <div className="mx-auto mb-6 bg-muted/30 w-20 h-20 rounded-full flex items-center justify-center">
                        <Lock size={32} className="text-muted-foreground" />
                    </div>
                    <h1 className="text-xl font-bold mb-2">{profile.display_name}</h1>
                    <p className="text-muted-foreground text-sm mb-6">このプロフィールは非公開に設定されています。</p>
                    <button onClick={() => navigate('/')} className="text-primary font-bold hover:underline">トップへ戻る</button>
                </div>
            </div>
        );
    }

    // Calculate Total
    const totalMonthly = subscriptions.reduce((acc, sub) => {
        let amount = sub.price;
        if (sub.cycle === 'yearly') amount = Math.floor(amount / 12);
        return acc + amount;
    }, 0);

    return (
        <div className="min-h-screen bg-background text-foreground pb-24">
            {/* Header */}
            <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between">
                <button
                    onClick={() => navigate('/')}
                    className="p-2 -ml-2 hover:bg-muted rounded-full transition-colors flex items-center space-x-1 text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft size={20} />
                    <span className="text-sm font-bold">戻る</span>
                </button>
                <button onClick={copyUrl} className="p-2 hover:bg-muted rounded-full text-primary transition-colors" title="URLをコピー">
                    <Share2 size={20} />
                </button>
            </div>

            <div className="max-w-md mx-auto p-4 space-y-6 animate-in slide-in-from-bottom-4 duration-500">

                {/* Profile Card */}
                <div className="bg-card border border-border rounded-3xl p-6 shadow-sm text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-primary/20 to-blue-500/5 z-0" />

                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-24 h-24 rounded-full bg-background p-1 shadow-lg mb-3">
                            <div className="w-full h-full rounded-full bg-muted flex items-center justify-center overflow-hidden">
                                {(profile as any).avatar_url ? (
                                    <img src={(profile as any).avatar_url} alt={profile.display_name} className="w-full h-full object-cover" />
                                ) : (
                                    <User size={40} className="text-muted-foreground/50" />
                                )}
                            </div>
                        </div>

                        <h1 className="text-2xl font-black mb-1">{profile.display_name}</h1>
                        {(profile as any).bio && (
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap max-w-xs mx-auto mb-4 leading-relaxed">
                                {(profile as any).bio}
                            </p>
                        )}

                        <div className="flex items-center space-x-4 text-xs font-bold text-muted-foreground bg-muted/50 px-4 py-2 rounded-full">
                            <span className="flex items-center">
                                <RefreshCw size={12} className="mr-1.5" />
                                {subscriptions.length} サブスク
                            </span>
                            <span className="w-px h-3 bg-border" />
                            <span>
                                月額 ¥{totalMonthly.toLocaleString()}
                            </span>
                        </div>
                    </div>
                </div>

                {/* List Header */}
                <div className="flex items-center justify-between px-2">
                    <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">登録サブスク</h2>
                </div>

                {/* List */}
                <div className="space-y-3">
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
