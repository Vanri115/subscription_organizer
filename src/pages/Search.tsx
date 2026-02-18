import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { POPULAR_SERVICES } from '../data/services';
import type { Plan, Service, ServiceCategory, UserSubscription } from '../types';
import { loadSubscriptions, saveSubscriptions } from '../utils/storage';
import { Search as SearchIcon, X, Check, ChevronDown, Plus, Info, Camera, ZoomIn, ZoomOut, Upload, ChevronLeft } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../utils/calculations';
import ServiceIcon from '../components/ServiceIcon';
import { supabase } from '../lib/supabase';
import { syncToCloud } from '../utils/sync';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import getCroppedImg from '../utils/cropImage';

const CATEGORIES: { id: ServiceCategory | 'All', label: string }[] = [
    { id: 'All', label: 'すべて' },
    { id: 'Video', label: '動画配信' },
    { id: 'Music', label: '音楽' },
    { id: 'Book', label: '書籍' },
    { id: 'Game', label: 'ゲーム' },
    { id: 'Gym', label: 'ジム・健康' },
    { id: 'Travel', label: '旅行・交通' },
    { id: 'Food', label: 'グルメ' },
    { id: 'Dev', label: '開発・サーバー' },
    { id: 'Business', label: 'ビジネス・SaaS' },
    { id: 'AI', label: 'AI' },
    { id: 'Security', label: 'セキュリティ' },
    { id: 'Learning', label: '学習・教育' },
    { id: 'Software', label: 'IT・ソフト' },
    { id: 'Shopping', label: 'ショッピング' },
    { id: 'Other', label: 'その他' },
];

const Search: React.FC = () => {
    const navigate = useNavigate();
    const { currency, exchangeRate } = useSettings();
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | 'All'>('All');

    // Custom sub state
    const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
    const [customName, setCustomName] = useState('');
    const [customPrice, setCustomPrice] = useState('');
    const [customCycle, setCustomCycle] = useState<'monthly' | 'yearly'>('monthly');
    const [customIconUrl, setCustomIconUrl] = useState('');

    // Crop modal state
    const [cropImage, setCropImage] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [uploadingIcon, setUploadingIcon] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Manual Price State for Preset Services
    const [isManualPriceMode, setIsManualPriceMode] = useState(false);
    const [manualPrice, setManualPrice] = useState('');
    const [manualCycle, setManualCycle] = useState<'monthly' | 'yearly'>('monthly');

    // Selection state
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

    const handleSelectService = (service: Service) => {
        if (selectedService?.id === service.id) {
            setSelectedService(null);
            setSelectedPlan(null);
            setIsManualPriceMode(false);
            setManualPrice('');
            setManualCycle('monthly');
        } else {
            setSelectedService(service);
            setSelectedPlan(null);
            setIsManualPriceMode(false);
            setManualPrice('');
            setManualCycle('monthly');
        }
    };

    // Load registered subscriptions to grey them out
    const registeredServiceIds = new Set(loadSubscriptions().map(s => s.serviceId));

    const filteredServices = POPULAR_SERVICES.filter(service => {
        const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || service.category === selectedCategory;
        return matchesSearch && matchesCategory;
    }).sort((a, b) => {
        // Registered services go to the bottom
        const aReg = registeredServiceIds.has(a.id) ? 1 : 0;
        const bReg = registeredServiceIds.has(b.id) ? 1 : 0;
        if (aReg !== bReg) return aReg - bReg;
        return a.name.localeCompare(b.name);
    });

    const handleAddSubscription = async () => {
        if (!selectedService || (!selectedPlan && !isManualPriceMode)) return;

        setIsSaving(true);
        try {
            const subs = loadSubscriptions();

            const price = isManualPriceMode ? Number(manualPrice) : selectedPlan!.price;
            const cycle = isManualPriceMode ? manualCycle : selectedPlan!.cycle;
            const planId = isManualPriceMode ? 'custom_price' : selectedPlan!.id;
            const currency = isManualPriceMode ? 'JPY' : selectedPlan!.currency;

            const newSub: UserSubscription = {
                id: crypto.randomUUID(),
                serviceId: selectedService.id,
                planId: planId,
                price: price,
                currency: currency,
                cycle: cycle,
                startDate: new Date().toISOString(),
                isActive: true,
            };
            saveSubscriptions([...subs, newSub]);

            if (user) {
                await syncToCloud(user.id);
            }

            navigate('/');
        } catch (error: any) {
            console.error('Save failed:', error);
            alert(`保存に失敗しました: ${error.message || JSON.stringify(error)}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddCustomSubscription = async () => {
        if (!customName || !customPrice) return;

        setIsSaving(true);
        try {
            const subs = loadSubscriptions();
            const newSub: UserSubscription = {
                id: crypto.randomUUID(),
                serviceId: 'custom',
                planId: 'custom',
                customName,
                price: parseInt(customPrice),
                currency: 'JPY',
                cycle: customCycle,
                startDate: new Date().toISOString(),
                isActive: true,
                customIcon: customIconUrl || undefined,
            };
            saveSubscriptions([...subs, newSub]);

            if (user) {
                await syncToCloud(user.id);
            }

            navigate('/');
        } catch (error: any) {
            console.error('Save failed:', error);
            alert(`保存に失敗しました: ${error.message || JSON.stringify(error)}`);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-4 max-w-md mx-auto min-h-screen pb-24 bg-background text-foreground transition-colors duration-300">
            <header className="pb-4 flex items-center justify-between">
                <button
                    onClick={() => navigate('/')}
                    className="text-muted-foreground hover:text-foreground hover:bg-muted p-2 rounded-full transition-colors"
                    title="戻る"
                >
                    <ChevronLeft size={20} />
                </button>
                <h1 className="text-2xl font-bold text-foreground">新しいサブスクを追加</h1>
                <div className="w-9" />
            </header>

            {/* Search Section */}
            <div className="mb-6">
                {/* Search Bar */}
                <div className="relative mb-4">
                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
                    <input
                        type="text"
                        placeholder="サービス名で検索..."
                        className="w-full bg-muted border border-border rounded-xl py-3 pl-10 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Category Filter */}
                <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-medium transition-all ${selectedCategory === cat.id
                                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                                : 'bg-muted text-muted-foreground border border-border hover:bg-muted/80'
                                }`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Service List */}
            <div className="space-y-3">
                <button
                    onClick={() => setIsCustomModalOpen(true)}
                    className="w-full bg-muted/30 hover:bg-muted border border-dashed border-border rounded-xl p-4 flex items-center justify-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                    <Plus size={20} />
                    <span>リストにないサービスを手動追加</span>
                </button>

                {filteredServices.map((service) => (
                    <div
                        key={service.id}
                        className={`bg-card rounded-xl border transition-all duration-200 overflow-hidden ${registeredServiceIds.has(service.id)
                            ? 'border-border opacity-50 grayscale-[30%]'
                            : selectedService?.id === service.id
                                ? 'border-primary ring-1 ring-primary shadow-lg shadow-primary/10'
                                : 'border-border hover:border-gray-400'
                            }`}
                    >
                        {/* Service Header */}
                        <div
                            className="p-4 flex items-center justify-between cursor-pointer"
                            onClick={() => handleSelectService(service)}
                        >
                            <div className="flex items-center space-x-4">
                                <ServiceIcon
                                    serviceName={service.name}
                                    serviceColor={service.color}
                                    domain={service.url}
                                    className="w-10 h-10 shadow-sm"
                                />
                                <span className="font-bold text-foreground">{service.name}</span>
                                {registeredServiceIds.has(service.id) && (
                                    <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-bold">登録済み</span>
                                )}
                            </div>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/service/${service.id}`);
                                    }}
                                    className="p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-full transition-colors"
                                >
                                    <Info size={20} />
                                </button>
                                <ChevronDown
                                    size={20}
                                    className={`text-muted-foreground transition-transform ${selectedService?.id === service.id ? 'rotate-180' : ''}`}
                                />
                            </div>
                        </div>

                        {/* Plan Selection (Expandable) */}
                        {selectedService?.id === service.id && (
                            <div className="px-4 pb-4 space-y-2 animate-in slide-in-from-top-2 duration-200">
                                <div className="h-px bg-border w-full mb-3" />

                                {/* Manual Price Toggle */}
                                <div className="flex items-center justify-between mb-4 bg-muted/30 p-2 rounded-lg">
                                    <span className="text-xs font-bold text-muted-foreground">金額を自分で入力</span>
                                    <button
                                        onClick={() => {
                                            setIsManualPriceMode(!isManualPriceMode);
                                            setSelectedPlan(null);
                                        }}
                                        className={`w-11 h-6 flex items-center rounded-full transition-colors focus:outline-none p-1 ${isManualPriceMode ? 'bg-primary' : 'bg-muted-foreground/30'
                                            }`}
                                    >
                                        <div
                                            className={`bg-white w-4 h-4 rounded-full shadow-sm transform duration-200 ${isManualPriceMode ? 'translate-x-5' : 'translate-x-0'
                                                }`}
                                        />
                                    </button>
                                </div>

                                {isManualPriceMode ? (
                                    <div className="space-y-3 animate-in fade-in duration-200">
                                        <div>
                                            <label className="block text-xs text-muted-foreground mb-1">金額 (円)</label>
                                            <input
                                                type="number"
                                                className="w-full bg-muted border border-border rounded-lg p-3 text-foreground focus:outline-none focus:border-primary"
                                                value={manualPrice}
                                                onChange={(e) => setManualPrice(e.target.value)}
                                                placeholder="例: 980"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-muted-foreground mb-1">支払いサイクル</label>
                                            <div className="flex bg-muted p-1 rounded-lg">
                                                <button
                                                    onClick={() => setManualCycle('monthly')}
                                                    className={`flex-1 py-2 text-sm rounded-md transition-all ${manualCycle === 'monthly' ? 'bg-background text-foreground shadow' : 'text-muted-foreground'}`}
                                                >
                                                    月額
                                                </button>
                                                <button
                                                    onClick={() => setManualCycle('yearly')}
                                                    className={`flex-1 py-2 text-sm rounded-md transition-all ${manualCycle === 'yearly' ? 'bg-background text-foreground shadow' : 'text-muted-foreground'}`}
                                                >
                                                    年額
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <p className="text-xs text-muted-foreground mb-2">プランを選択してください:</p>
                                        {service.plans.map((plan) => (
                                            <button
                                                key={plan.id}
                                                onClick={() => setSelectedPlan(plan)}
                                                className={`w-full flex items-center justify-between p-3 rounded-lg text-sm border transition-all ${selectedPlan?.id === plan.id
                                                    ? 'bg-primary/10 border-primary text-primary'
                                                    : 'bg-muted border-border text-foreground hover:bg-muted/80'
                                                    }`}
                                            >
                                                <span>{plan.name}</span>
                                                <div className="flex items-center space-x-3">
                                                    <span className="font-bold">
                                                        {formatCurrency(plan.price, currency, exchangeRate)}
                                                    </span>
                                                    {selectedPlan?.id === plan.id && <Check size={16} />}
                                                </div>
                                            </button>
                                        ))}
                                    </>
                                )}

                                <button
                                    disabled={(!selectedPlan && !isManualPriceMode) || (isManualPriceMode && !manualPrice) || isSaving}
                                    onClick={handleAddSubscription}
                                    className="w-full mt-4 py-3 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/25 transition-all flex items-center justify-center"
                                >
                                    {isSaving ? '保存中...' : '追加する'}
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Custom Subscription Modal */}
            {isCustomModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-card border border-border rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-foreground">手動で追加</h3>
                            <button onClick={() => setIsCustomModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs text-muted-foreground mb-1">サービス名</label>
                                <input
                                    type="text"
                                    className="w-full bg-muted border border-border rounded-lg p-3 text-foreground focus:outline-none focus:border-primary"
                                    value={customName}
                                    onChange={(e) => setCustomName(e.target.value)}
                                    placeholder="例: 家賃"
                                />
                            </div>

                            <div>
                                <label className="block text-xs text-muted-foreground mb-1">アイコン (タップして変更)</label>
                                <div className="flex items-center gap-4">
                                    <div className="relative group">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            id="custom-icon-upload"
                                            disabled={!user}
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
                                                e.target.value = '';
                                            }}
                                        />
                                        <label
                                            htmlFor="custom-icon-upload"
                                            className={`block w-16 h-16 rounded-2xl overflow-hidden border-2 border-dashed border-border hover:border-primary transition-colors cursor-pointer relative ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            {customIconUrl ? (
                                                <img src={customIconUrl} alt="Icon" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-muted">
                                                    <Camera size={20} className="text-muted-foreground" />
                                                </div>
                                            )}
                                            {user && (
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Upload size={16} className="text-white" />
                                                </div>
                                            )}
                                        </label>
                                    </div>
                                    <div className="flex-1">
                                        {!user ? (
                                            <p className="text-xs text-orange-500">
                                                画像アップロードにはログインが必要です。
                                                （URL入力は可能です）
                                            </p>
                                        ) : (
                                            <p className="text-xs text-muted-foreground">
                                                オリジナルのアイコンを設定できます。
                                                JPG/PNG形式に対応。
                                            </p>
                                        )}
                                        {/* Fallback URL input */}
                                        <input
                                            type="url"
                                            className="w-full mt-2 bg-muted border border-border rounded-lg p-2 text-xs focus:outline-none focus:border-primary"
                                            value={customIconUrl}
                                            onChange={(e) => setCustomIconUrl(e.target.value)}
                                            placeholder="または画像のURLを直接入力"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs text-muted-foreground mb-1">金額 (自動で日本円として保存されます)</label>
                                <input
                                    type="number"
                                    className="w-full bg-muted border border-border rounded-lg p-3 text-foreground focus:outline-none focus:border-primary"
                                    value={customPrice}
                                    onChange={(e) => setCustomPrice(e.target.value)}
                                    placeholder="0 (円)"
                                />
                            </div>

                            <div>
                                <label className="block text-xs text-muted-foreground mb-1">支払いサイクル</label>
                                <div className="flex bg-muted p-1 rounded-lg">
                                    <button
                                        onClick={() => setCustomCycle('monthly')}
                                        className={`flex-1 py-2 text-sm rounded-md transition-all ${customCycle === 'monthly' ? 'bg-background text-foreground shadow' : 'text-muted-foreground'
                                            }`}
                                    >
                                        月額
                                    </button>
                                    <button
                                        onClick={() => setCustomCycle('yearly')}
                                        className={`flex-1 py-2 text-sm rounded-md transition-all ${customCycle === 'yearly' ? 'bg-background text-foreground shadow' : 'text-muted-foreground'
                                            }`}
                                    >
                                        年額
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={handleAddCustomSubscription}
                                disabled={!customName || !customPrice || isSaving}
                                className="w-full py-3 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/25 transition-all flex items-center justify-center"
                            >
                                {isSaving ? '保存中...' : '追加する'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Crop Modal */}
            {cropImage && (
                <div className="fixed inset-0 z-[60] bg-black/80 flex flex-col">
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
                                disabled={uploadingIcon}
                                onClick={async () => {
                                    if (!croppedAreaPixels || !user) return;
                                    setUploadingIcon(true);
                                    try {
                                        const blob = await getCroppedImg(cropImage, croppedAreaPixels);
                                        const fileName = `custom-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
                                        const filePath = `${user.id}/${fileName}`;

                                        const { error: uploadError } = await supabase.storage
                                            .from('avatars')
                                            .upload(filePath, blob, { upsert: true, contentType: 'image/jpeg' });

                                        if (uploadError) throw uploadError;

                                        const { data: urlData } = supabase.storage
                                            .from('avatars')
                                            .getPublicUrl(filePath);

                                        const publicUrl = urlData.publicUrl;
                                        setCustomIconUrl(publicUrl);
                                        setCropImage(null);
                                    } catch (err) {
                                        console.error(err);
                                        alert('アップロードに失敗しました。');
                                    } finally {
                                        setUploadingIcon(false);
                                    }
                                }}
                                className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm"
                            >
                                {uploadingIcon ? '保存中...' : '保存する'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Search;
