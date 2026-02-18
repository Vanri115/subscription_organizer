import React, { useEffect, useState } from 'react';
import { Moon, Sun, CreditCard, ChevronRight, Trash2, User, LogOut, Edit2, MessageSquare } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { validateDisplayName } from '../utils/validator';
import { POPULAR_SERVICES } from '../data/services';
import StarRating from '../components/StarRating';


interface UserReview {
    id: number;
    service_id: string;
    rating: number;
    comment: string;
    created_at: string;
}

const Settings: React.FC = () => {
    const { theme, toggleTheme, currency, setCurrency } = useSettings();
    const { user, signOut } = useAuth();
    const navigate = useNavigate();

    // Profile State
    const [displayName, setDisplayName] = useState('');
    const [isEditingName, setIsEditingName] = useState(false);
    const [nameError, setNameError] = useState<string | null>(null);

    // Reviews State
    const [myReviews, setMyReviews] = useState<UserReview[]>([]);

    useEffect(() => {
        if (user) {
            fetchProfile();
            fetchMyReviews();
        }
    }, [user]);

    const fetchProfile = async () => {
        if (!user) return;
        const { data } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('id', user.id)
            .single();

        if (data?.display_name) {
            setDisplayName(data.display_name);
        }
    };

    const fetchMyReviews = async () => {
        if (!user) return;
        const { data } = await supabase
            .from('reviews')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (data) setMyReviews(data);
    };

    const handleSaveName = async () => {
        if (!user) return;
        const error = validateDisplayName(displayName);
        if (error) {
            setNameError(error);
            return;
        }

        const { error: upsertError } = await supabase
            .from('profiles')
            .upsert({ id: user.id, display_name: displayName });

        if (upsertError) {
            alert('プロフィールの保存に失敗しました');
        } else {
            setIsEditingName(false);
            setNameError(null);
        }
    };

    const handleClearData = () => {
        if (window.confirm('本当にすべてのデータを削除しますか？この操作は取り消せません。')) {
            import('../utils/storage').then(({ clearSubscriptions }) => {
                clearSubscriptions();
                window.location.reload();
            });
        }
    };

    const handleLogout = async () => {
        if (window.confirm('ログアウトしますか？')) {
            await signOut();
        }
    };

    return (
        <div className="p-4 max-w-md mx-auto pb-24 space-y-6">
            <header className="pt-2 mb-6">
                <h1 className="text-2xl font-bold text-foreground">設定</h1>
            </header>

            {/* Account Section */}
            <section className="space-y-3">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">アカウント</h2>
                <div className="bg-card rounded-2xl overflow-hidden border border-border shadow-sm">
                    {user ? (
                        <div className="p-4 space-y-4">
                            {/* Profile Info */}
                            <div className="flex items-center space-x-3">
                                <div className="p-3 bg-primary/10 rounded-full text-primary">
                                    <User size={24} />
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    {isEditingName ? (
                                        <div className="space-y-2">
                                            <input
                                                type="text"
                                                value={displayName}
                                                onChange={(e) => setDisplayName(e.target.value)}
                                                placeholder="表示名を入力"
                                                className="w-full bg-muted border border-border rounded px-2 py-1 text-sm focus:outline-none focus:border-primary"
                                            />
                                            {nameError && <p className="text-xs text-red-500">{nameError}</p>}
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={handleSaveName}
                                                    className="px-3 py-1 bg-primary text-primary-foreground text-xs rounded-md"
                                                >
                                                    保存
                                                </button>
                                                <button
                                                    onClick={() => setIsEditingName(false)}
                                                    className="px-3 py-1 bg-muted text-muted-foreground text-xs rounded-md"
                                                >
                                                    キャンセル
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-bold text-base truncate">
                                                    {displayName || '名無しさん'}
                                                </p>
                                                <p className="text-xs text-muted-foreground">{user.email}</p>
                                            </div>
                                            <button
                                                onClick={() => setIsEditingName(true)}
                                                className="p-2 text-muted-foreground hover:text-primary transition-colors"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* My Reviews Link (Accordion style or separate page? List here implies checking history) */}
                            {myReviews.length > 0 && (
                                <div className="pt-4 border-t border-border">
                                    <h3 className="text-sm font-bold mb-3 flex items-center">
                                        <MessageSquare size={16} className="mr-2" />
                                        投稿したレビュー ({myReviews.length})
                                    </h3>
                                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1 scrollbar-thin">
                                        {myReviews.map(review => {
                                            const service = POPULAR_SERVICES.find(s => s.id === review.service_id);
                                            return (
                                                <div
                                                    key={review.id}
                                                    onClick={() => navigate(`/service/${review.service_id}`)}
                                                    className="bg-muted/30 p-3 rounded-xl cursor-pointer hover:bg-muted/60 transition-colors"
                                                >
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="font-bold text-sm">{service?.name || review.service_id}</span>
                                                        <span className="text-[10px] text-muted-foreground">
                                                            {new Date(review.created_at).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center space-x-2 mb-1">
                                                        <StarRating rating={review.rating} readonly size={12} />
                                                    </div>
                                                    <p className="text-xs text-muted-foreground line-clamp-1">{review.comment}</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center justify-center space-x-2 bg-muted hover:bg-muted/80 text-foreground py-2 rounded-xl transition-colors text-sm font-medium mt-2"
                            >
                                <LogOut size={16} />
                                <span>ログアウト</span>
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => navigate('/login')}
                            className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                        >
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-muted rounded-full text-muted-foreground">
                                    <User size={20} />
                                </div>
                                <span className="font-medium text-card-foreground">ログイン / 登録</span>
                            </div>
                            <ChevronRight size={16} className="text-muted-foreground" />
                        </button>
                    )}
                </div>
            </section>

            {/* Appearance Section */}
            <section className="space-y-3">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">外観</h2>
                <div className="bg-card rounded-2xl overflow-hidden border border-border shadow-sm">
                    <button
                        onClick={toggleTheme}
                        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                    >
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-primary/10 rounded-full text-primary">
                                {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                            </div>
                            <span className="font-medium text-card-foreground">テーマ設定</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className="text-sm text-muted-foreground capitalize">
                                {theme === 'dark' ? 'ダーク' : 'ライト'}
                            </span>
                            <ChevronRight size={16} className="text-muted-foreground" />
                        </div>
                    </button>

                    <div className="h-px bg-border mx-4" />

                    <div className="w-full flex items-center justify-between p-4">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-green-500/10 rounded-full text-green-500">
                                <CreditCard size={20} />
                            </div>
                            <span className="font-medium text-card-foreground">表示通貨</span>
                        </div>
                        <div className="flex bg-muted p-1 rounded-lg">
                            <button
                                onClick={() => setCurrency('JPY')}
                                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${currency === 'JPY' ? 'bg-background shadow text-foreground' : 'text-muted-foreground'
                                    }`}
                            >
                                JPY
                            </button>
                            <button
                                onClick={() => setCurrency('USD')}
                                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${currency === 'USD' ? 'bg-background shadow text-foreground' : 'text-muted-foreground'
                                    }`}
                            >
                                USD
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Data Section */}
            <section className="space-y-3">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">データ管理</h2>
                <div className="bg-card rounded-2xl overflow-hidden border border-border shadow-sm">
                    <button
                        onClick={handleClearData}
                        className="w-full flex items-center justify-between p-4 hover:bg-red-500/5 transition-colors group"
                    >
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-red-500/10 rounded-full text-red-500 group-hover:bg-red-500 group-hover:text-white transition-colors">
                                <Trash2 size={20} />
                            </div>
                            <span className="font-medium text-red-500">すべてのデータを削除</span>
                        </div>
                    </button>
                </div>
                <p className="text-xs text-muted-foreground px-2">
                    現在はブラウザ内にのみデータが保存されています。キャッシュをクリアするとデータが消える可能性があります。
                </p>
            </section>
        </div>
    );
};

export default Settings;
