import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { POPULAR_SERVICES } from '../data/services';
import type { Plan, Service, ServiceCategory } from '../types';
import { loadSubscriptions, saveSubscriptions } from '../utils/storage';
import { Search as SearchIcon, X, Check, ChevronDown, Plus, Info } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { formatCurrency } from '../utils/calculations';
import ServiceIcon from '../components/ServiceIcon';

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
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | 'All'>('All');

    // Custom sub state
    const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
    const [customName, setCustomName] = useState('');
    const [customPrice, setCustomPrice] = useState('');
    const [customCycle, setCustomCycle] = useState<'monthly' | 'yearly'>('monthly');
    const [customIconUrl, setCustomIconUrl] = useState('');

    // Selection state
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

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

    const handleAddSubscription = () => {
        if (!selectedService || !selectedPlan) return;

        const subs = loadSubscriptions();
        const newSub = {
            id: crypto.randomUUID(),
            serviceId: selectedService.id,
            planId: selectedPlan.id,
            price: selectedPlan.price,
            currency: selectedPlan.currency, // storing original currency
            cycle: selectedPlan.cycle,
            startDate: new Date().toISOString(),
            isActive: true,
        };
        saveSubscriptions([...subs, newSub]);
        navigate('/');
    };

    const handleAddCustomSubscription = () => {
        if (!customName || !customPrice) return;

        const subs = loadSubscriptions();
        const newSub: any = {
            id: crypto.randomUUID(),
            serviceId: 'custom',
            planId: 'custom_plan',
            customName,
            price: Number(customPrice),
            currency: 'JPY',
            cycle: customCycle,
            startDate: new Date().toISOString(),
            isActive: true,
        };
        if (customIconUrl.trim()) {
            newSub.customIcon = customIconUrl.trim();
        }
        saveSubscriptions([...subs, newSub]);
        navigate('/');
    };

    return (
        <div className="p-4 max-w-md mx-auto min-h-screen pb-24 bg-background text-foreground transition-colors duration-300">
            <header className="mb-6 pt-2 text-center">
                <h1 className="text-2xl font-bold mb-4 text-foreground">新しいサブスクを追加</h1>

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
            </header>

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
                            onClick={() => {
                                if (selectedService?.id === service.id) {
                                    setSelectedService(null);
                                    setSelectedPlan(null);
                                } else {
                                    setSelectedService(service);
                                    setSelectedPlan(null);
                                }
                            }}
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

                                <button
                                    disabled={!selectedPlan}
                                    onClick={handleAddSubscription}
                                    className="w-full mt-4 py-3 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/25 transition-all"
                                >
                                    追加する
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
                                <label className="block text-xs text-muted-foreground mb-1">アイコンURL（任意）</label>
                                <input
                                    type="url"
                                    className="w-full bg-muted border border-border rounded-lg p-3 text-foreground focus:outline-none focus:border-primary text-sm"
                                    value={customIconUrl}
                                    onChange={(e) => setCustomIconUrl(e.target.value)}
                                    placeholder="https://example.com/icon.png"
                                />
                                {customIconUrl && (
                                    <div className="mt-2 flex items-center gap-2">
                                        <img src={customIconUrl} alt="preview" className="w-8 h-8 rounded-full object-cover bg-muted" onError={(e) => (e.currentTarget.style.display = 'none')} />
                                        <span className="text-[10px] text-muted-foreground">プレビュー</span>
                                    </div>
                                )}
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
                                className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/25 mt-2"
                            >
                                定額リストに追加
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Search;
