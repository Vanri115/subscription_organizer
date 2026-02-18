import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { POPULAR_SERVICES } from '../data/services';
import ServiceIcon from '../components/ServiceIcon';
import StarRating from '../components/StarRating';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Send, User as UserIcon } from 'lucide-react';
import { containsProfanity } from '../utils/validator';

interface Review {
    id: number;
    user_id: string;
    rating: number;
    comment: string;
    created_at: string;
    profiles?: {
        display_name: string;
        avatar_url?: string;
    };
}

const ServiceDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const service = POPULAR_SERVICES.find((s) => s.id === id);

    const [reviews, setReviews] = useState<Review[]>([]);
    const [myReview, setMyReview] = useState<{ rating: number; comment: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');

    useEffect(() => {
        if (service) {
            fetchReviews();
        }
    }, [service, user]);

    const fetchReviews = async () => {
        if (!service) return;
        setLoading(true);

        const { data, error } = await supabase
            .from('reviews')
            .select(`
                *,
                profiles (display_name, avatar_url)
            `)
            .eq('service_id', service.id)
            .order('created_at', { ascending: false });

        if (!error && data) {
            setReviews(data as unknown as Review[]);

            // Check if user has reviewed
            if (user) {
                const userReview = data.find((r: any) => r.user_id === user.id);
                if (userReview) {
                    setMyReview({ rating: userReview.rating, comment: userReview.comment });
                    setRating(userReview.rating);
                    setComment(userReview.comment);
                }
            }
        }
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !service || rating === 0) return;

        if (containsProfanity(comment)) {
            alert('不適切な表現が含まれているため投稿できません。');
            return;
        }

        setSubmitting(true);

        try {
            // 1. Ensure profile (Safe Check)
            // We only insert if the profile doesn't exist to avoid overwriting custom names.
            const { data: profile } = await supabase.from('profiles').select('id').eq('id', user.id).single();

            if (!profile) {
                await supabase
                    .from('profiles')
                    .upsert({
                        id: user.id,
                        display_name: user.email?.split('@')[0] || 'User',
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'id', ignoreDuplicates: true });
            }

            // 2. Upsert Review
            const { error } = await supabase
                .from('reviews')
                .upsert({
                    user_id: user.id,
                    service_id: service.id,
                    rating,
                    comment,
                }, { onConflict: 'user_id, service_id' });

            if (error) throw error;

            // Refresh
            await fetchReviews();
            alert('レビューを送信しました！');
        } catch (error) {
            console.error(error);
            alert('レビューの送信に失敗しました。');
        } finally {
            setSubmitting(false);
        }
    };

    if (!service) {
        return <div className="p-8 text-center">サービスが見つかりません。</div>;
    }

    const averageRating = reviews.length > 0
        ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
        : '0.0';

    return (
        <div className="pb-24 min-h-screen bg-background text-foreground animate-in fade-in duration-300">
            {/* Header */}
            <div className="p-4 flex items-center space-x-4 bg-card border-b border-border sticky top-0 z-10 shadow-sm">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-muted rounded-full transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-lg font-bold truncate">{service.name} のレビュー</h1>
            </div>

            <div className="max-w-md mx-auto p-4 space-y-6">
                {/* Service Info Card */}
                <div className="bg-card border border-border rounded-2xl p-6 text-center shadow-md">
                    <div className="flex justify-center mb-4">
                        <ServiceIcon
                            serviceName={service.name}
                            serviceColor={service.color}
                            domain={service.url}
                            className="w-20 h-20 shadow-lg"
                        />
                    </div>
                    <h2 className="text-2xl font-bold mb-1">{service.name}</h2>
                    <a href={`https://${service.url}`} target="_blank" rel="noreferrer" className="text-primary text-sm hover:underline">
                        公式サイト
                    </a>

                    <div className="mt-6 flex flex-col items-center">
                        <span className="text-4xl font-bold mb-2">{averageRating}</span>
                        <StarRating rating={Number(averageRating)} readonly size={28} />
                        <span className="text-sm text-muted-foreground mt-2">
                            {reviews.length} 件のレビュー
                        </span>
                    </div>
                </div>

                {/* Review Form */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                    <h3 className="font-bold mb-4 flex items-center">
                        {myReview ? 'レビューを編集' : 'レビューを書く'}
                    </h3>

                    {!user ? (
                        <div className="text-center py-6 bg-muted/30 rounded-xl">
                            <p className="text-sm mb-4">レビューを投稿するにはログインが必要です</p>
                            <button
                                onClick={() => navigate('/login')}
                                className="bg-primary text-primary-foreground px-6 py-2 rounded-full font-bold text-sm shadow-md hover:scale-105 transition-transform"
                            >
                                ログインする
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="flex justify-center py-2">
                                <StarRating rating={rating} onRatingChange={setRating} size={32} />
                            </div>
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="このサブスクの感想を教えてください..."
                                className="w-full bg-muted border border-border rounded-xl p-3 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                                required
                            />
                            <p className="text-xs text-muted-foreground">※不適切な表現は自動的にブロックされます</p>
                            <button
                                type="submit"
                                disabled={submitting || rating === 0}
                                className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center space-x-2"
                            >
                                <Send size={18} />
                                <span>{submitting ? '送信中...' : '投稿する'}</span>
                            </button>
                        </form>
                    )}
                </div>

                {/* Review List */}
                <div className="space-y-4">
                    <h3 className="font-bold px-2">みんなのレビュー</h3>
                    {loading ? (
                        <div className="text-center py-8 text-muted-foreground">読み込み中...</div>
                    ) : reviews.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-xl">
                            まだレビューはありません。<br />最初のレビューを投稿しませんか？
                        </div>
                    ) : (
                        reviews.map((review) => (
                            <div key={review.id} className="bg-card border border-border rounded-xl p-4 shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center space-x-2">
                                        {/* Avatar Display */}
                                        <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-muted border border-border">
                                            {review.profiles?.avatar_url ? (
                                                <img src={review.profiles.avatar_url} alt="Av" className="w-full h-full object-cover" />
                                            ) : (
                                                <UserIcon size={16} className="text-muted-foreground" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-foreground">
                                                {review.profiles?.display_name || `User ${review.user_id.slice(0, 4)}...`}
                                            </p>
                                            <StarRating rating={review.rating} readonly size={14} />
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground">
                                        {new Date(review.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <p className="text-sm pl-10 whitespace-pre-wrap">{review.comment}</p>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default ServiceDetail;
