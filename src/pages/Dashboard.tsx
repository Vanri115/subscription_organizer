import React, { useState, useEffect } from 'react';
import type { UserSubscription } from '../types';
import { loadSubscriptions, saveSubscriptions } from '../utils/storage';
import { calculateTotal, formatCurrency } from '../utils/calculations';
import { POPULAR_SERVICES } from '../data/services';
import { Trash2 } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import ServiceIcon from '../components/ServiceIcon';

const Dashboard: React.FC = () => {
    const { currency, exchangeRate } = useSettings();
    const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortMode, setSortMode] = useState<'default' | 'price_desc' | 'price_asc' | 'name_asc'>('default');

    useEffect(() => {
        const loadedSubs = loadSubscriptions();
        setSubscriptions(loadedSubs);
        setLoading(false);
    }, []);

    // Helper to get numeric value for sorting (defined before use)
    const formatCurrencyNumeric = (amount: number, fromCurrency: string, toCurrency: string, rate: number | null) => {
        if (fromCurrency === toCurrency) return amount;
        // If one is missing, assume JPY or just return amount
        const from = fromCurrency || 'JPY';
        const to = toCurrency || 'JPY';

        if (from === to) return amount;
        if (from === 'JPY' && to === 'USD') return amount * (rate || 0.0066);
        if (from === 'USD' && to === 'JPY') return amount / (rate || 0.0066);
        return amount;
    };

    const sortedSubscriptions = [...subscriptions].sort((a, b) => {
        // Helper to get service name
        const getServiceDetails = (id: string) => POPULAR_SERVICES.find(s => s.id === id);
        const nameA = a.customName || getServiceDetails(a.serviceId)?.name || '';
        const nameB = b.customName || getServiceDetails(b.serviceId)?.name || '';

        // Normalize price for sorting (convert all to JPY equivalent approx)
        const getNormalizedMonthlyPrice = (sub: UserSubscription) => {
            let price = sub.price;
            if (sub.cycle === 'yearly') price /= 12;

            return formatCurrencyNumeric(price, sub.currency || 'JPY', currency, exchangeRate);
        };

        const priceA = getNormalizedMonthlyPrice(a);
        const priceB = getNormalizedMonthlyPrice(b);

        if (sortMode === 'price_desc') return priceB - priceA;
        if (sortMode === 'price_asc') return priceA - priceB;
        if (sortMode === 'name_asc') return nameA.localeCompare(nameB);

        // Default: Just creation/index order (stable)
        return 0;
    });

    const toggleSort = () => {
        const modes: ('default' | 'price_desc' | 'price_asc' | 'name_asc')[] = ['default', 'price_desc', 'price_asc', 'name_asc'];
        const nextIndex = (modes.indexOf(sortMode) + 1) % modes.length;
        setSortMode(modes[nextIndex]);
    };

    const getSortLabel = () => {
        switch (sortMode) {
            case 'price_desc': return '高い順';
            case 'price_asc': return '安い順';
            case 'name_asc': return '名前順';
            default: return '標準';
        }
    };

    const handleToggleActive = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const updatedSubs = subscriptions.map(sub =>
            sub.id === id ? { ...sub, isActive: !sub.isActive } : sub
        );
        setSubscriptions(updatedSubs);
        saveSubscriptions(updatedSubs);
    };

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm('本当に削除しますか？')) {
            const updatedSubs = subscriptions.filter(sub => sub.id !== id);
            setSubscriptions(updatedSubs);
            saveSubscriptions(updatedSubs);
        }
    };

    const getServiceDetails = (serviceId: string) => {
        return POPULAR_SERVICES.find(s => s.id === serviceId);
    };

    const monthlyTotal = calculateTotal(subscriptions, 'monthly');
    const yearlyTotal = calculateTotal(subscriptions, 'yearly');

    // Calculate Savings from Inactive Subscriptions
    const inactiveSubs = subscriptions.filter(s => !s.isActive);
    const savedMonthlyTotal = inactiveSubs.reduce((total, sub) => {
        let cost = sub.price;
        if (sub.cycle === 'monthly') {
            return total + cost;
        } else {
            return total + Math.floor(cost / 12);
        }
    }, 0);

    if (loading) return <div className="p-4 text-center mt-10 text-muted-foreground">読み込み中...</div>;

    return (
        <div className="p-4 max-w-md mx-auto space-y-6 pb-24">
            <header className="pt-2 pb-6 text-center text-foreground">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-400 dark:to-purple-400 inline-block">
                    マイサブスク
                </h1>
                <div className="w-16 h-1 bg-gradient-to-r from-blue-500 to-purple-600 mx-auto mt-2 rounded-full opacity-80"></div>
            </header>

            {/* Summary Card */}
            <div className="relative overflow-hidden rounded-2xl p-6 shadow-xl border border-border/50 bg-gradient-to-br from-card to-background">
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-primary/10 blur-3xl opacity-50" />
                <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl opacity-50" />

                <div className="relative z-10 space-y-4">
                    <div>
                        <p className="text-muted-foreground text-sm font-medium mb-1">月額合計</p>
                        <p className="text-4xl font-extrabold text-foreground tracking-tight drop-shadow-sm">
                            {formatCurrency(monthlyTotal, currency, exchangeRate)}
                        </p>
                        {currency === 'USD' && <p className="text-xs text-muted-foreground mt-1">1 USD ≈ {Math.round(1 / (exchangeRate || 0.0066))} JPY</p>}
                    </div>
                    <div className="pt-4 border-t border-border/50">
                        <div className="flex justify-between items-end mb-2">
                            <div>
                                <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-1">年額見込み</p>
                                <p className="text-xl font-semibold text-emerald-500">
                                    {formatCurrency(yearlyTotal, currency, exchangeRate)}
                                </p>
                            </div>
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full border border-border">
                                契約中: {subscriptions.filter(s => s.isActive).length}
                            </span>
                        </div>

                        {/* Savings moved to floating display */}
                    </div>
                </div>
            </div>

            {/* Subscription List (Ultra Compact) */}
            <div>
                <div className="flex items-center justify-between mb-3 px-1">
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">登録リスト</h2>
                    <button
                        onClick={toggleSort}
                        className="text-xs font-medium bg-muted/50 hover:bg-muted px-2 py-1 rounded-md text-muted-foreground transition-colors flex items-center space-x-1"
                    >
                        <span>⇅ {getSortLabel()}</span>
                    </button>
                </div>

                {subscriptions.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground bg-muted/30 rounded-2xl border border-dashed border-border">
                        <p>まだ登録がありません</p>
                        <p className="text-sm mt-2">下の <span className="text-primary font-bold">+</span> ボタンから追加しよう</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-2">
                        {sortedSubscriptions.map((sub) => {
                            const service = getServiceDetails(sub.serviceId);
                            const isCustom = !service;
                            const itemColor = isCustom ? 'var(--color-muted-foreground)' : service?.color;


                            // Calculate monthly equivalent for display if yearly
                            const isYearly = sub.cycle === 'yearly';
                            const monthlyEquivalent = isYearly ? Math.floor(sub.price / 12) : null;

                            return (
                                <div
                                    key={sub.id}
                                    className={`group relative overflow-hidden rounded-xl border transition-all duration-300 flex flex-col justify-between p-3 min-h-[5.5rem] h-auto ${sub.isActive
                                        ? 'bg-card border-border shadow-sm hover:shadow-md hover:-translate-y-0.5'
                                        : 'bg-muted/50 border-border/50 opacity-70 grayscale'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="relative">
                                            <ServiceIcon
                                                serviceName={isCustom ? (sub.customName || '?') : service.name}
                                                serviceColor={sub.isActive ? itemColor! : '#888'}
                                                domain={service?.url}
                                                className="w-8 h-8 shadow-sm"
                                            />
                                        </div>
                                        <button
                                            onClick={(e) => handleDelete(sub.id, e)}
                                            className="text-muted-foreground hover:text-destructive p-1 rounded-full hover:bg-muted transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    </div>

                                    <div>
                                        <h3 className="font-bold text-xs leading-tight line-clamp-1 text-foreground mb-1">
                                            {isCustom ? sub.customName : service?.name}
                                        </h3>
                                        <div className="flex items-end justify-between">
                                            <div className="flex flex-wrap items-baseline gap-x-1 mr-1 min-w-0">
                                                <div className="flex items-baseline space-x-0.5">
                                                    <p className="font-bold text-sm text-foreground leading-none">
                                                        {formatCurrency(sub.price, currency, exchangeRate)}
                                                    </p>
                                                    <span className="text-[10px] text-muted-foreground font-medium scale-90 origin-left">
                                                        /{isYearly ? '年' : '月'}
                                                    </span>
                                                </div>
                                                {isYearly && monthlyEquivalent && (
                                                    <span className="text-[10px] text-muted-foreground/70 font-normal whitespace-nowrap">
                                                        (月{formatCurrency(monthlyEquivalent, currency, exchangeRate)})
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center mb-0.5 shrink-0">
                                                {/* Tiny Toggle */}
                                                <button
                                                    onClick={(e) => handleToggleActive(sub.id, e)}
                                                    className={`w-9 h-5 flex items-center rounded-full transition-colors focus:outline-none p-1 ${sub.isActive ? 'bg-emerald-500/20' : 'bg-muted-foreground/30'
                                                        }`}
                                                >
                                                    <div
                                                        className={`bg-current w-3 h-3 rounded-full shadow-sm transform duration-200 ${sub.isActive ? 'translate-x-4 text-emerald-500' : 'translate-x-0 text-muted-foreground'
                                                            }`}
                                                    />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Floating Savings Display */}
            {savedMonthlyTotal > 0 && (
                <div className="fixed bottom-24 left-4 right-4 z-40 animate-in slide-in-from-bottom-4 duration-500 pointer-events-none flex justify-center">
                    <div className="bg-emerald-500/95 dark:bg-emerald-600/95 backdrop-blur-md shadow-lg shadow-emerald-500/20 text-white py-2 px-4 rounded-full flex items-center space-x-3 border border-emerald-400/50 pointer-events-auto max-w-[90%]">
                        <div className="flex items-center space-x-1.5 shrink-0">
                            <span className="text-lg leading-none">💰</span>
                            <span className="text-xs font-bold whitespace-nowrap">節約中</span>
                        </div>
                        <div className="h-4 w-px bg-white/30 shrink-0"></div>
                        <div className="flex items-baseline space-x-1 overflow-hidden">
                            <span className="text-base font-extrabold tracking-tight truncate">
                                {formatCurrency(savedMonthlyTotal, currency, exchangeRate)}
                            </span>
                            <span className="text-[10px] opacity-90 font-medium whitespace-nowrap">/月</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
