import React, { useEffect, useState } from 'react';
import { Moon, Sun, CreditCard, ChevronRight, Trash2, User, LogOut, Edit2, MessageSquare, Globe, RefreshCw, Eye } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { validateDisplayName } from '../utils/validator';
import { syncToCloud, setPublicProfile } from '../utils/sync';

const Settings: React.FC = () => {
    const { theme, toggleTheme, currency, setCurrency } = useSettings();
    const { user, signOut } = useAuth();
    const navigate = useNavigate();

    // Profile State
    const [displayName, setDisplayName] = useState('');
    const [isEditingName, setIsEditingName] = useState(false);
    const [nameError, setNameError] = useState<string | null>(null);

    // Public Profile State
    const [isPublic, setIsPublic] = useState(false);
    const [syncing, setSyncing] = useState(false);

    useEffect(() => {
        if (user) {
            fetchProfile();
        }
    }, [user]);

    const fetchProfile = async () => {
        if (!user) return;
        const { data } = await supabase
            .from('profiles')
            .select('display_name, is_public')
            .eq('id', user.id)
            .single();

        if (data) {
            if (data.display_name) setDisplayName(data.display_name);
            if (data.is_public !== undefined) setIsPublic(data.is_public);
        }
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
            .upsert({ id: user.id, display_name: displayName, updated_at: new Date().toISOString() });

        if (upsertError) {
            alert('プロフィールの保存に失敗しました');
        } else {
            setIsEditingName(false);
            setNameError(null);
        }
    };

    const handleTogglePublic = async () => {
        if (!user) return;
        const newValue = !isPublic;

        try {
            setSyncing(true);
            // 1. Update Profile Visibility
            await setPublicProfile(user.id, newValue);
            setIsPublic(newValue);

            // 2. If turning ON, auto-sync data
            if (newValue) {
                await syncToCloud(user.id);
            }
        } catch (error) {
            console.error(error);
            alert('設定の変更に失敗しました');
            setIsPublic(!newValue); // Revert
        } finally {
            setSyncing(false);
        }
    };

    const handleManualSync = async () => {
        if (!user) return;
        try {
            setSyncing(true);
            await syncToCloud(user.id);
            alert('クラウドと同期しました！');
        } catch (error) {
            console.error(error);
            alert('同期に失敗しました');
        } finally {
            setSyncing(false);
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

                            {/* My Reviews Link */}
                            <button
                                onClick={() => navigate('/settings/reviews')}
                                className="w-full flex items-center justify-between p-3 mt-4 bg-muted/30 hover:bg-muted/50 rounded-xl transition-colors border border-border/50"
                            >
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-blue-500/10 rounded-full text-blue-500">
                                        <MessageSquare size={18} />
                                    </div>
                                    <div className="text-left">
                                        <span className="block font-bold text-sm text-foreground">投稿したレビュー</span>
                                        <span className="text-xs text-muted-foreground">過去の評価・コメントを確認</span>
                                    </div>
                                </div>
                                <ChevronRight size={16} className="text-muted-foreground" />
                            </button>

                            {/* Public Profile Section */}
                            <div className="pt-4 border-t border-border mt-4">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-sm font-bold flex items-center">
                                        <Globe size={16} className="mr-2" />
                                        公開プロフィール
                                    </h3>
                                    <div
                                        onClick={handleTogglePublic}
                                        className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-colors duration-300 ${isPublic ? 'bg-primary' : 'bg-muted'}`}
                                    >
                                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ${isPublic ? 'translate-x-4' : ''}`} />
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground mb-3">
                                    オンにすると、あなたのサブスクリストが他のユーザーに公開されます。
                                </p>

                                {isPublic && (
                                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                        <button
                                            onClick={() => navigate(`/user/${user.id}`)}
                                            className="w-full flex items-center justify-center space-x-2 bg-primary/10 text-primary py-2 rounded-xl text-sm font-bold hover:bg-primary/20 transition-colors"
                                        >
                                            <Eye size={16} />
                                            <span>自分のページを見る</span>
                                        </button>

                                        <button
                                            onClick={handleManualSync}
                                            disabled={syncing}
                                            className="w-full flex items-center justify-center space-x-2 bg-muted hover:bg-muted/80 text-foreground py-2 rounded-xl transition-colors text-sm font-medium"
                                        >
                                            <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
                                            <span>{syncing ? '同期中...' : 'クラウドと同期する'}</span>
                                        </button>
                                        <p className="text-[10px] text-center text-muted-foreground">
                                            ※ ローカルのデータをクラウドに上書きします
                                        </p>
                                    </div>
                                )}
                            </div>

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
