import React, { useState, useEffect } from 'react';
import { POPULAR_SERVICES } from '../data/services';
import ServiceIcon from '../components/ServiceIcon';
import type { Service } from '../types';
import { loadSubscriptions } from '../utils/storage';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

type VoteType = 'favorite' | 'wasteful';



interface RankingItem {
    serviceId: string;
    votes: number;
}

const Ranking: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<VoteType>('favorite');
    const [userVotes, setUserVotes] = useState<{ favorite: string | null; wasteful: string | null }>({
        favorite: null,
        wasteful: null,
    });
    const [myServices, setMyServices] = useState<Service[]>([]);
    const [globalRankings, setGlobalRankings] = useState<{ favorite: RankingItem[], wasteful: RankingItem[] }>({
        favorite: [],
        wasteful: []
    });
    const [loading, setLoading] = useState(true);

    // Initial Load & Realtime Subscription
    useEffect(() => {
        // 1. Load User's available services to vote for
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

        // 2. Fetch Global Votes and My Votes
        fetchVotes();

        // 3. Subscribe to Realtime Updates
        const channel = supabase
            .channel('public:service_votes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'service_votes' }, () => {
                fetchVotes(); // Re-fetch on any change
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    const fetchVotes = async () => {
        try {
            // Fetch all votes (for client-side aggregation - OK for small scale)
            const { data, error } = await supabase
                .from('service_votes')
                .select('service_id, vote_type, user_id');

            if (error) throw error;

            // Aggregate Votes
            const favCounts: Record<string, number> = {};
            const wasteCounts: Record<string, number> = {};
            const myVotesState = { favorite: null as string | null, wasteful: null as string | null };

            data?.forEach((vote: any) => {
                // Count globally
                if (vote.vote_type === 'favorite') {
                    favCounts[vote.service_id] = (favCounts[vote.service_id] || 0) + 1;
                } else {
                    wasteCounts[vote.service_id] = (wasteCounts[vote.service_id] || 0) + 1;
                }

                // Check if it's my vote
                if (user && vote.user_id === user.id) {
                    if (vote.vote_type === 'favorite') myVotesState.favorite = vote.service_id;
                    if (vote.vote_type === 'wasteful') myVotesState.wasteful = vote.service_id;
                }
            });

            // Convert to Array & Sort
            const sortedFav = Object.entries(favCounts)
                .map(([id, count]) => ({ serviceId: id, votes: count }))
                .sort((a, b) => b.votes - a.votes);

            const sortedWaste = Object.entries(wasteCounts)
                .map(([id, count]) => ({ serviceId: id, votes: count }))
                .sort((a, b) => b.votes - a.votes);

            setGlobalRankings({ favorite: sortedFav, wasteful: sortedWaste });
            setUserVotes(myVotesState);
        } catch (err) {
            console.error('Error fetching votes:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleVote = async (serviceId: string) => {
        if (!user) {
            if (window.confirm('投票するにはログインが必要です。ログインページに移動しますか？')) {
                navigate('/login');
            }
            return;
        }

        // Optimistic UI Update
        const previousVotes = { ...userVotes };
        setUserVotes(prev => ({ ...prev, [activeTab]: serviceId }));

        try {
            const { error } = await supabase
                .from('service_votes')
                .upsert({
                    user_id: user.id,
                    vote_type: activeTab,
                    service_id: serviceId
                }, { onConflict: 'user_id, vote_type' });

            if (error) throw error;
        } catch (err) {
            console.error('Vote failed:', err);
            setUserVotes(previousVotes); // Revert on error
            alert('投票に失敗しました。');
        }
    };

    const getService = (id: string) => POPULAR_SERVICES.find(s => s.id === id) || {
        id,
        name: 'Unlisted Service',
        category: 'Other',
        color: '#888',
        price: 0,
        currency: 'JPY',
        plans: [],
        url: ''
    } as Service;

    const currentRanking = activeTab === 'favorite' ? globalRankings.favorite : globalRankings.wasteful;

    return (
        <div className="p-4 max-w-md mx-auto min-h-screen pb-24">
            <header className="pt-2 pb-6 text-center">
                <h1 className="text-2xl font-bold text-foreground">
                    みんなのランキング
                </h1>
                <p className="text-xs text-muted-foreground mt-1">
                    ユーザー投票による人気・不人気サブスク (リアルタイム)
                </p>
            </header>

            {/* Tabs */}
            <div className="flex p-1 bg-muted/50 rounded-xl mb-6">
                <button
                    onClick={() => setActiveTab('favorite')}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'favorite'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground/80'
                        }`}
                >
                    🏆 神サブスク
                </button>
                <button
                    onClick={() => setActiveTab('wasteful')}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'wasteful'
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground/80'
                        }`}
                >
                    💸 無駄遣い
                </button>
            </div>

            {/* Vote Section */}
            <div className="mb-8 bg-card border border-border rounded-xl p-4 shadow-sm">
                <h2 className="text-sm font-bold text-center mb-3">
                    {activeTab === 'favorite' ? 'あなたが選ぶ No.1 は？' : '一番「無駄だった」と思うのは？'}
                </h2>

                {!user ? (
                    <button
                        onClick={() => navigate('/login')}
                        className="w-full py-3 text-sm text-primary font-bold bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
                    >
                        ログインして投票する
                    </button>
                ) : myServices.length === 0 ? (
                    <p className="text-center text-xs text-muted-foreground py-2">
                        投票するにはまずサブスクを登録してください
                    </p>
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
                                <ServiceIcon
                                    serviceName={service.name}
                                    domain={service.url}
                                    serviceColor={service.color}
                                    className="w-8 h-8 mb-1"
                                />
                                <span className="text-[10px] truncate w-full text-center">
                                    {service.name}
                                </span>
                                {userVotes[activeTab] === service.id && (
                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-white text-[10px] flex items-center justify-center rounded-full shadow-sm">
                                        ✓
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Ranking List */}
            <div className="space-y-3">
                <h3 className="font-bold text-lg px-1">
                    {activeTab === 'favorite' ? '愛用者ランキング' : '解約予備軍ランキング'}
                </h3>

                {loading ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">読み込み中...</div>
                ) : currentRanking.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm bg-muted/30 rounded-xl dashed border border-muted">
                        まだ投票がありません。<br />最初の1票を入れよう！
                    </div>
                ) : (
                    currentRanking.map((item, index) => {
                        const service = getService(item.serviceId);
                        const rank = index + 1;

                        return (
                            <div key={item.serviceId} className="flex items-center bg-card border border-border rounded-xl p-3 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <div className={`w-8 h-8 flex items-center justify-center font-black italic text-lg mr-3 ${rank === 1 ? 'text-yellow-500' :
                                    rank === 2 ? 'text-gray-400' :
                                        rank === 3 ? 'text-amber-600' : 'text-muted-foreground/50'
                                    }`}>
                                    {rank}
                                </div>

                                <ServiceIcon
                                    serviceName={service.name}
                                    domain={service.url}
                                    serviceColor={service.color}
                                    className="w-10 h-10 mr-3 shadow-md"
                                />

                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-sm truncate">{service.name}</h4>
                                    <p className="text-xs text-muted-foreground">{service.category}</p>
                                </div>

                                <div className="text-right">
                                    <span className="block font-bold text-primary">{item.votes}</span>
                                    <span className="text-[10px] text-muted-foreground">votes</span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default Ranking;
