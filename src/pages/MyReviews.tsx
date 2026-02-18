import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, ExternalLink, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { POPULAR_SERVICES } from '../data/services';
import StarRating from '../components/StarRating';

interface UserReview {
    id: number;
    service_id: string;
    rating: number;
    comment: string;
    created_at: string;
}

const MyReviews: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [reviews, setReviews] = useState<UserReview[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchMyReviews();
        } else {
            setLoading(false);
        }
    }, [user]);

    const fetchMyReviews = async () => {
        if (!user) return;
        setLoading(true);
        const { data } = await supabase
            .from('reviews')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (data) {
            setReviews(data);
        }
        setLoading(false);
    };

    const handleDelete = async (reviewId: number) => {
        if (!window.confirm('このレビューを削除してもよろしいですか？')) return;

        const { error } = await supabase
            .from('reviews')
            .delete()
            .eq('id', reviewId);

        if (error) {
            alert('削除に失敗しました');
        } else {
            setReviews(prev => prev.filter(r => r.id !== reviewId));
        }
    };

    if (!user) {
        return (
            <div className="p-4 text-center">
                <p>ログインが必要です</p>
                <button onClick={() => navigate('/login')} className="mt-4 text-primary">ログイン画面へ</button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground pb-24">
            <header className="p-4 flex items-center space-x-4 bg-card border-b border-border sticky top-0 z-10">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-muted rounded-full transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-lg font-bold">投稿したレビュー</h1>
            </header>

            <div className="max-w-md mx-auto p-4">
                {loading ? (
                    <div className="text-center py-8 text-muted-foreground">読み込み中...</div>
                ) : reviews.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-2xl border border-dashed border-border">
                        <Star size={32} className="mx-auto mb-2 opacity-30" />
                        <p>まだレビューがありません</p>
                        <button
                            onClick={() => navigate('/ranking')}
                            className="mt-4 text-primary font-bold text-sm hover:underline"
                        >
                            ランキングから探す
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {reviews.map(review => {
                            const service = POPULAR_SERVICES.find(s => s.id === review.service_id);
                            return (
                                <div key={review.id} className="bg-card border border-border rounded-xl p-4 shadow-sm relative group">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center space-x-3">
                                            <div
                                                className="w-10 h-10 rounded-lg flex items-center justify-center text-xl font-bold text-white shadow-sm"
                                                style={{ backgroundColor: service?.color || '#888' }}
                                            >
                                                {service?.name.slice(0, 1) || '?'}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-sm">{service?.name || review.service_id}</h3>
                                                <div className="flex items-center">
                                                    <StarRating rating={review.rating} readonly size={14} />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => navigate(`/service/${review.service_id}`)}
                                                className="p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-full transition-colors"
                                            >
                                                <ExternalLink size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(review.id)}
                                                className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="bg-muted/30 p-3 rounded-lg mt-3">
                                        <p className="text-sm whitespace-pre-wrap">{review.comment}</p>
                                    </div>

                                    <div className="mt-2 text-right">
                                        <span className="text-[10px] text-muted-foreground">
                                            {new Date(review.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyReviews;
