import React, { useState, useEffect } from 'react';
import { POPULAR_SERVICES } from '../data/services';
import ServiceIcon from '../components/ServiceIcon';
import StarRating from '../components/StarRating';
import type { Service } from '../types';
import { loadSubscriptions } from '../utils/storage';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, MessageSquare } from 'lucide-react';

type TabType = 'favorite' | 'wasteful' | 'star' | 'reviewer';

interface RankingItem {
    serviceId: string;
    votes: number;
}

interface StarRankingItem {
    serviceId: string;
    average: number;
    count: number;
}

interface ReviewerRankingItem {
    userId: string;
    displayName: string;
    count: number;
}

const Ranking: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<TabType>('favorite');

    // Vote State
    const [userVotes, setUserVotes] = useState<{ favorite: string | null; wasteful: string | null }>({
        favorite: null,
        wasteful: null,
    });
    const [myServices, setMyServices] = useState<Service[]>([]);

    // Data State
    const [voteRankings, setVoteRankings] = useState<{ favorite: RankingItem[], wasteful: RankingItem[] }>({
        favorite: [],
        wasteful: []
    });
    const [starRankings, setStarRankings] = useState<StarRankingItem[]>([]);
    const [reviewerRankings, setReviewerRankings] = useState<ReviewerRankingItem[]>([]);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 1. Load User's available services
        const subs = loadSubscriptions();
        const services = subs.map(sub => {
            const s = POPULAR_SERVICES.find(ps => ps.id === sub.serviceId);
            if (s) return s;
            return {
                id: sub.serviceId,
                name: sub.customName || 'Unknown',
                price: sub.price,
                currency: sub.currency,
                category: 'Other',
                url: '',
                color: '#888',
                plans: []
            } as Service;
        });
        setMyServices(services);

        fetchAllData();

        // Subscribe to changes
        const voteSub = supabase.channel('ranking_votes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'service_votes' }, fetchVoteData)
            .subscribe();

        const reviewSub = supabase.channel('ranking_reviews')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, () => {
                fetchStarData();
                fetchReviewerData();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(voteSub);
            supabase.removeChannel(reviewSub);
        };
    }, [user]);

    const fetchAllData = async () => {
        setLoading(true);
        await Promise.all([fetchVoteData(), fetchStarData(), fetchReviewerData()]);
        setLoading(false);
    };

    const fetchVoteData = async () => {
        const { data } = await supabase.from('service_votes').select('service_id, vote_type, user_id');
        if (!data) return;

        const favCounts: Record<string, number> = {};
        const wasteCounts: Record<string, number> = {};
        const myVotes = { favorite: null as string | null, wasteful: null as string | null };

        data.forEach((vote: any) => {
            if (vote.vote_type === 'favorite') favCounts[vote.service_id] = (favCounts[vote.service_id] || 0) + 1;
            else wasteCounts[vote.service_id] = (wasteCounts[vote.service_id] || 0) + 1;

            if (user && vote.user_id === user.id) {
                if (vote.vote_type === 'favorite') myVotes.favorite = vote.service_id;
                if (vote.vote_type === 'wasteful') myVotes.wasteful = vote.service_id;
            }
        });

        setVoteRankings({
            favorite: Object.entries(favCounts).map(([id, c]) => ({ serviceId: id, votes: c })).sort((a, b) => b.votes - a.votes),
            wasteful: Object.entries(wasteCounts).map(([id, c]) => ({ serviceId: id, votes: c })).sort((a, b) => b.votes - a.votes)
        });
        setUserVotes(myVotes);
    };

    const fetchStarData = async () => {
        const { data } = await supabase.from('reviews').select('service_id, rating');
        if (!data) return;

        const serviceStats: Record<string, { sum: number, count: number }> = {};
        data.forEach((r: any) => {
            if (!serviceStats[r.service_id]) serviceStats[r.service_id] = { sum: 0, count: 0 };
            serviceStats[r.service_id].sum += r.rating;
            serviceStats[r.service_id].count += 1;
        });

        const sorted = Object.entries(serviceStats)
            .map(([id, stats]) => ({
                serviceId: id,
                average: stats.sum / stats.count,
                count: stats.count
            }))
            .sort((a, b) => b.average - a.average || b.count - a.count); // desc avg, then desc count

        setStarRankings(sorted);
    };

    const fetchReviewerData = async () => {
        const { data: reviews } = await supabase.from('reviews').select('user_id');
        const { data: profiles } = await supabase.from('profiles').select('id, display_name');

        if (!reviews) return;

        const userCounts: Record<string, number> = {};
        reviews.forEach((r: any) => {
            userCounts[r.user_id] = (userCounts[r.user_id] || 0) + 1;
        });

        const sorted = Object.entries(userCounts)
            .map(([uid, count]) => {
                const profile = profiles?.find((p: any) => p.id === uid);
                return {
                    userId: uid,
                    displayName: profile?.display_name || '名無しさん',
                    count
                };
            })
            .sort((a, b) => b.count - a.count);

        setReviewerRankings(sorted);
    };

    const handleVote = async (serviceId: string) => {
        if (!user) {
            if (window.confirm('投票するにはログインが必要です。ログインページに移動しますか？')) navigate('/login');
            return;
        }
        if (activeTab !== 'favorite' && activeTab !== 'wasteful') return;

        const { error } = await supabase.from('service_votes').upsert({
            user_id: user.id,
            vote_type: activeTab,
            service_id: serviceId
        }, { onConflict: 'user_id, vote_type' });

        if (error) {
            alert('投票に失敗しました。');
        } else {
            // Manually trigger fetch to update UI immediately
            fetchVoteData();
        }
    };

    const getService = (id: string) => POPULAR_SERVICES.find(s => s.id === id) || {
        id, name: id, category: 'Other', color: '#888', plans: [], url: ''
    } as Service;

    return (
        <div className="p-4 max-w-md mx-auto min-h-screen pb-24">
            <header className="pt-2 pb-6 text-center">
                <h1 className="text-2xl font-bold text-foreground">みんなのランキング</h1>
                <p className="text-xs text-muted-foreground mt-1">リアルタイム更新中</p>
            </header>

            {/* Tabs */}
            <div className="flex p-1 bg-muted/50 rounded-xl mb-6 overflow-x-auto">
                {[
                    { id: 'favorite', label: '🏆 神サブスク' },
                    { id: 'wasteful', label: '💸 無駄遣い' },
                    { id: 'star', label: '⭐ 高評価' },
                    { id: 'reviewer', label: '📝 達人' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as TabType)}
                        className={`flex-1 py-2 px-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${activeTab === tab.id
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground/80'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content: Vote UI (Only for Fav/Waste) */}
            {(activeTab === 'favorite' || activeTab === 'wasteful') && (
                <div className="mb-8 bg-card border border-border rounded-xl p-4 shadow-sm">
                    <h2 className="text-sm font-bold text-center mb-3">
                        {activeTab === 'favorite' ? 'あなたが選ぶ No.1 は？' : '一番「無駄だった」と思うのは？'}
                    </h2>
                    {!user ? (
                        <button onClick={() => navigate('/login')} className="w-full py-3 text-sm text-primary font-bold bg-primary/10 rounded-lg">
                            ログインして投票する
                        </button>
                    ) : myServices.length === 0 ? (
                        <p className="text-center text-xs text-muted-foreground py-2">投票するにはまずサブスクを登録してください</p>
                    ) : (
                        <div className="grid grid-cols-4 gap-2">
                            {myServices.map(service => (
                                <button
                                    key={service.id}
                                    onClick={() => handleVote(service.id)}
                                    disabled={userVotes[activeTab] === service.id}
                                    className={`flex flex-col items-center p-2 rounded-lg transition-all border relative ${userVotes[activeTab] === service.id
                                        ? 'bg-primary/10 border-primary ring-1 ring-primary'
                                        : 'bg-background border-border hover:bg-muted'
                                        }`}
                                >
                                    <ServiceIcon serviceName={service.name} domain={service.url} serviceColor={service.color} className="w-8 h-8 mb-1" />
                                    <span className="text-[10px] truncate w-full text-center">{service.name}</span>
                                    {userVotes[activeTab] === service.id && (
                                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-white text-[10px] flex items-center justify-center rounded-full">✓</div>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Ranking Lists */}
            <div className="space-y-3">
                {loading ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">読み込み中...</div>
                ) : (
                    <>
                        {/* Vote Ranking */}
                        {(activeTab === 'favorite' || activeTab === 'wasteful') && voteRankings[activeTab].map((item, index) => {
                            const service = getService(item.serviceId);
                            const rank = index + 1;
                            return (
                                <div key={item.serviceId} onClick={() => navigate(`/service/${item.serviceId}`)} className="cursor-pointer flex items-center bg-card border border-border rounded-xl p-3 shadow-sm hover:shadow-md transition-all">
                                    <div className={`w-8 h-8 flex items-center justify-center font-black italic text-lg mr-3 ${rank <= 3 ? 'text-yellow-500' : 'text-muted-foreground/50'}`}>{rank}</div>
                                    <ServiceIcon serviceName={service.name} domain={service.url} serviceColor={service.color} className="w-10 h-10 mr-3 shadow-md" />
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-sm truncate">{service.name}</h4>
                                        <p className="text-xs text-muted-foreground">{service.category}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="block font-bold text-primary">{item.votes}</span>
                                        <span className="text-[10px] text-muted-foreground">票</span>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Star Ranking */}
                        {activeTab === 'star' && starRankings.map((item, index) => {
                            const service = getService(item.serviceId);
                            const rank = index + 1;
                            return (
                                <div key={item.serviceId} onClick={() => navigate(`/service/${item.serviceId}`)} className="cursor-pointer flex items-center bg-card border border-border rounded-xl p-3 shadow-sm hover:shadow-md transition-all">
                                    <div className={`w-8 h-8 flex items-center justify-center font-black italic text-lg mr-3 ${rank <= 3 ? 'text-yellow-500' : 'text-muted-foreground/50'}`}>{rank}</div>
                                    <ServiceIcon serviceName={service.name} domain={service.url} serviceColor={service.color} className="w-10 h-10 mr-3 shadow-md" />
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-sm truncate">{service.name}</h4>
                                        <div className="flex items-center">
                                            <StarRating rating={item.average} readonly size={12} />
                                            <span className="text-xs text-muted-foreground ml-1">({item.count})</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="block font-bold text-yellow-500">{item.average.toFixed(1)}</span>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Reviewer Ranking */}
                        {activeTab === 'reviewer' && reviewerRankings.map((item, index) => {
                            const rank = index + 1;
                            return (
                                <div key={item.userId} className="flex items-center bg-card border border-border rounded-xl p-3 shadow-sm">
                                    <div className={`w-8 h-8 flex items-center justify-center font-black italic text-lg mr-3 ${rank <= 3 ? 'text-yellow-500' : 'text-muted-foreground/50'}`}>{rank}</div>
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-3 text-primary">
                                        <User size={20} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-sm truncate">{item.displayName}</h4>
                                        <p className="text-xs text-muted-foreground">レビュアー</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="block font-bold text-primary">{item.count}</span>
                                        <span className="text-[10px] text-muted-foreground pb-1 flex items-center justify-end gap-1">
                                            <MessageSquare size={10} /> 件
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </>
                )}
            </div>
        </div>
    );
};

export default Ranking;
