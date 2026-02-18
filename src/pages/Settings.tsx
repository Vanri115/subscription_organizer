import React, { useEffect, useState } from 'react';
import { Moon, Sun, CreditCard, ChevronRight, Trash2, User, LogOut, Edit2, MessageSquare, Globe, RefreshCw, Eye, Send, Camera, ZoomIn, ZoomOut, Download } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { validateDisplayName } from '../utils/validator';
import { syncToCloud, setPublicProfile } from '../utils/sync';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import getCroppedImg from '../utils/cropImage';
import { loadSubscriptions } from '../utils/storage';
import { POPULAR_SERVICES } from '../data/services';

const Settings: React.FC = () => {
    const { theme, toggleTheme, currency, setCurrency } = useSettings();
    const { user, signOut } = useAuth();
    const navigate = useNavigate();

    // Profile State
    const [displayName, setDisplayName] = useState('');
    const [isEditingName, setIsEditingName] = useState(false);
    const [nameError, setNameError] = useState<string | null>(null);
    const [feedbackText, setFeedbackText] = useState('');
    const [sendingFeedback, setSendingFeedback] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    // Crop modal state
    const [cropImage, setCropImage] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

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
            .select('display_name, is_public, avatar_url')
            .eq('id', user.id)
            .single();

        if (data) {
            if (data.display_name) setDisplayName(data.display_name);
            if (data.is_public !== undefined) setIsPublic(data.is_public);
            if (data.avatar_url) setAvatarUrl(data.avatar_url);
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

    // CSV Import/Export Handlers
    const handleExportCSV = () => {
        const subscriptions = loadSubscriptions();
        if (subscriptions.length === 0) {
            alert('エクスポートするデータがありません。');
            return;
        }

        const headers = ['name', 'monthlyPrice', 'yearlyPrice', 'category', 'renewalDate', 'memo'];
        const csvContent =
            'data:text/csv;charset=utf-8,' +
            headers.join(',') +
            '\n' +
            subscriptions
                .map((sub) => {
                    // Resolve service details
                    const service = POPULAR_SERVICES.find(s => s.id === sub.serviceId);

                    // Calculate prices
                    let monthlyPrice = 0;
                    let yearlyPrice = 0;
                    if (sub.cycle === 'monthly') {
                        monthlyPrice = sub.price;
                        yearlyPrice = sub.price * 12;
                    } else {
                        monthlyPrice = Math.round(sub.price / 12);
                        yearlyPrice = sub.price;
                    }

                    const resolvedData = {
                        name: sub.customName || service?.name || '',
                        monthlyPrice,
                        yearlyPrice,
                        category: service?.category || 'Other',
                        renewalDate: sub.renewalDate || '',
                        memo: sub.memo || ''
                    };

                    return headers
                        .map((header) => {
                            const value = resolvedData[header as keyof typeof resolvedData];

                            // Handle comma in string
                            if (typeof value === 'string' && value.includes(',')) {
                                return `"${value}"`;
                            }
                            return value ?? '';
                        })
                        .join(',');
                })
                .join('\n');

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', 'subscriptions.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };



    return (
        <div className="p-4 max-w-md mx-auto pb-24 space-y-8">
            <header className="pt-2 mb-6 flex items-center justify-between">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    title="戻る"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
                </button>
                <h1 className="text-2xl font-bold text-foreground">設定</h1>
                <div className="w-9" />
            </header>

            {/* Profile Share Link */}
            {user && isPublic && (
                <button
                    onClick={async () => {
                        const url = `${window.location.origin}/user/${user.id}`;
                        if (navigator.share) {
                            try { await navigator.share({ title: 'マイサブスク', text: `${displayName || '名無しさん'}のサブスクリストを公開中！`, url }); } catch { /* cancelled */ }
                        } else {
                            await navigator.clipboard.writeText(url);
                            alert('プロフィールリンクをコピーしました！');
                        }
                    }}
                    className="w-full flex items-center justify-between bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-4 hover:from-primary/15 hover:to-primary/10 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                <User size={20} />
                            </div>
                        )}
                        <div className="text-left">
                            <p className="font-bold text-sm text-foreground">{displayName || '名無しさん'}</p>
                            <p className="text-xs text-primary">🔗 プロフィールをシェアする</p>
                        </div>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                        <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                    </svg>
                </button>
            )}

            {/* Account Section */}
            <section className="space-y-3">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">アカウント</h2>
                <div className="bg-card rounded-2xl overflow-hidden border border-border shadow-sm">
                    {user ? (
                        <div className="p-4 space-y-4">
                            {/* Profile Info */}
                            <div className="flex items-center space-x-3">
                                <div className="relative">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        id="avatar-upload"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            const reader = new FileReader();
                                            reader.onload = () => {
                                                setCropImage(reader.result as string);
                                                setCrop({ x: 0, y: 0 });
                                                setZoom(1);
                                            };
                                            reader.readAsDataURL(file);
                                            e.target.value = ''; // reset to allow re-select
                                        }}
                                    />
                                    <label htmlFor="avatar-upload" className="cursor-pointer block">
                                        {avatarUrl ? (
                                            <img src={avatarUrl} alt="avatar" className="w-12 h-12 rounded-full object-cover" />
                                        ) : (
                                            <div className="p-3 bg-primary/10 rounded-full text-primary">
                                                <User size={24} />
                                            </div>
                                        )}
                                        <div className="absolute -bottom-0.5 -right-0.5 bg-primary text-primary-foreground rounded-full p-0.5">
                                            <Camera size={10} />
                                        </div>
                                    </label>
                                    {uploadingAvatar && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full">
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        </div>
                                    )}
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

                            {/* Public Profile Section */}
                            <div className="mt-4 pt-4 border-t border-border">
                                <div className="flex items-center justify-between mb-2 px-1">
                                    <h3 className="text-sm font-bold flex items-center text-muted-foreground uppercase tracking-wider">
                                        <Globe size={14} className="mr-2" />
                                        公開プロフィール
                                    </h3>
                                    <div
                                        onClick={handleTogglePublic}
                                        className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-colors duration-300 ${isPublic ? 'bg-primary' : 'bg-muted'}`}
                                    >
                                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ${isPublic ? 'translate-x-4' : ''}`} />
                                    </div>
                                </div>

                                {isPublic ? (
                                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                        <div className="bg-primary/5 rounded-xl p-3 border border-primary/10">
                                            <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                                                <span className="font-bold text-primary">公開中</span><br />
                                                あなたのサブスクリスト全体が公開されています。
                                            </p>
                                            <div className="space-y-2">
                                                <button
                                                    onClick={() => navigate(`/user/${user.id}`)}
                                                    className="w-full flex items-center justify-center space-x-2 bg-primary text-primary-foreground py-2 rounded-lg text-sm font-bold hover:opacity-90 transition-opacity shadow-sm"
                                                >
                                                    <Eye size={16} />
                                                    <span>自分のページを見る</span>
                                                </button>

                                                <button
                                                    onClick={handleManualSync}
                                                    disabled={syncing}
                                                    className="w-full flex items-center justify-center space-x-2 bg-background border border-border hover:bg-muted text-foreground py-2 rounded-lg transition-colors text-sm font-medium"
                                                >
                                                    <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
                                                    <span>{syncing ? '同期中...' : 'クラウドと同期する'}</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-xs text-muted-foreground px-1">
                                        オフにすると、あなたのページは非公開になり、他のユーザーからは見えなくなります。
                                    </p>
                                )}
                            </div>

                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center justify-center space-x-2 bg-muted hover:bg-muted/80 text-foreground py-2 rounded-xl transition-colors text-sm font-medium mt-6"
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

            {/* Review Management Section */}
            {user && (
                <section className="space-y-3">
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">レビュー管理</h2>
                    <div className="bg-card rounded-2xl overflow-hidden border border-border shadow-sm">
                        <button
                            onClick={() => navigate('/settings/reviews')}
                            className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                        >
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-orange-500/10 rounded-full text-orange-500">
                                    <MessageSquare size={20} />
                                </div>
                                <div className="text-left">
                                    <span className="block font-medium text-foreground">投稿したレビュー</span>
                                    <span className="text-xs text-muted-foreground">過去の評価・コメントの確認</span>
                                </div>
                            </div>
                            <ChevronRight size={16} className="text-muted-foreground" />
                        </button>
                    </div>
                </section>
            )}

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

            {/* CSV Import/Export Section */}
            <section className="space-y-3">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">データ移行</h2>
                <div className="bg-card rounded-2xl overflow-hidden border border-border shadow-sm">
                    <button
                        onClick={handleExportCSV}
                        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                    >
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-500/10 rounded-full text-blue-500">
                                <Download size={20} />
                            </div>
                            <div>
                                <span className="block font-medium text-foreground text-left">CSVエクスポート</span>
                                <span className="text-xs text-muted-foreground block text-left">現在のデータをCSVファイルとして保存</span>
                            </div>
                        </div>
                    </button>
                </div>
            </section>

            {/* Feedback Section */}
            <section className="space-y-3">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">ご要望・フィードバック</h2>
                <div className="bg-card rounded-2xl overflow-hidden border border-border shadow-sm p-4 space-y-3">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        ほしい機能やご意見など、自由にお書きください！
                    </p>
                    <textarea
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        placeholder="例: 〇〇機能がほしいです、ここが使いにくいです..."
                        className="w-full bg-muted border border-border rounded-xl p-3 min-h-[80px] text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                    />
                    <button
                        onClick={async () => {
                            if (!feedbackText.trim()) {
                                alert('メッセージを入力してください。');
                                return;
                            }
                            if (!user) {
                                alert('フィードバックを送信するにはログインが必要です。');
                                return;
                            }
                            setSendingFeedback(true);
                            try {
                                const { error } = await supabase.from('feedback').insert({
                                    user_id: user.id,
                                    message: feedbackText.trim(),
                                });
                                if (error) throw error;
                                alert('ご意見ありがとうございます！フィードバックを送信しました。');
                                setFeedbackText('');
                            } catch (err) {
                                console.error(err);
                                alert('送信に失敗しました。時間をおいて再度お試しください。');
                            } finally {
                                setSendingFeedback(false);
                            }
                        }}
                        disabled={sendingFeedback || !feedbackText.trim()}
                        className={`w-full flex items-center justify-center space-x-2 py-3 rounded-xl font-bold text-sm transition-all ${feedbackText.trim() && !sendingFeedback
                            ? 'bg-primary text-primary-foreground hover:opacity-90 shadow-sm'
                            : 'bg-muted text-muted-foreground cursor-not-allowed'
                            }`}
                    >
                        <Send size={18} />
                        <span>{sendingFeedback ? '送信中...' : '送信する'}</span>
                    </button>
                    {!user && (
                        <p className="text-xs text-muted-foreground text-center">※ 送信にはログインが必要です</p>
                    )}
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

            {/* Crop Modal */}
            {cropImage && (
                <div className="fixed inset-0 z-50 bg-black/80 flex flex-col">
                    <div className="relative flex-1">
                        <Cropper
                            image={cropImage}
                            crop={crop}
                            zoom={zoom}
                            aspect={1}
                            cropShape="round"
                            showGrid={false}
                            onCropChange={setCrop}
                            onZoomChange={setZoom}
                            onCropComplete={(_, areaPixels) => setCroppedAreaPixels(areaPixels)}
                        />
                    </div>
                    <div className="bg-background p-4 space-y-4">
                        <div className="flex items-center gap-3">
                            <ZoomOut size={16} className="text-muted-foreground shrink-0" />
                            <input
                                type="range"
                                min={1}
                                max={3}
                                step={0.1}
                                value={zoom}
                                onChange={(e) => setZoom(Number(e.target.value))}
                                className="flex-1 accent-primary"
                            />
                            <ZoomIn size={16} className="text-muted-foreground shrink-0" />
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setCropImage(null)}
                                className="flex-1 py-3 rounded-xl bg-muted text-muted-foreground font-bold text-sm"
                            >
                                キャンセル
                            </button>
                            <button
                                disabled={uploadingAvatar}
                                onClick={async () => {
                                    if (!croppedAreaPixels || !user) return;
                                    setUploadingAvatar(true);
                                    try {
                                        const blob = await getCroppedImg(cropImage, croppedAreaPixels);
                                        const filePath = `${user.id}/avatar.jpg`;
                                        const { error: uploadError } = await supabase.storage
                                            .from('avatars')
                                            .upload(filePath, blob, { upsert: true, contentType: 'image/jpeg' });
                                        if (uploadError) throw uploadError;
                                        const { data: urlData } = supabase.storage
                                            .from('avatars')
                                            .getPublicUrl(filePath);
                                        const publicUrl = urlData.publicUrl + '?t=' + Date.now();
                                        await supabase.from('profiles').upsert({
                                            id: user.id, avatar_url: publicUrl, updated_at: new Date().toISOString()
                                        });
                                        setAvatarUrl(publicUrl);
                                        setCropImage(null);
                                    } catch (err) {
                                        console.error(err);
                                        alert('アップロードに失敗しました。');
                                    } finally {
                                        setUploadingAvatar(false);
                                    }
                                }}
                                className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm"
                            >
                                {uploadingAvatar ? '保存中...' : '保存する'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;
