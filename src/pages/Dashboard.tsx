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

    useEffect(() => {
        const loadedSubs = loadSubscriptions();
        setSubscriptions(loadedSubs.sort((a, b) => (a.isActive === b.isActive ? 0 : a.isActive ? -1 : 1)));
        setLoading(false);
    }, []);

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

    if (loading) return <div className="p-4 text-center mt-10 text-muted-foreground">読み込み中...</div>;

    return (
        <div className="p-4 max-w-md mx-auto space-y-6 pb-24">
            <header className="pt-2 pb-6 text-center">
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
                        <div className="flex justify-between items-end">
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
                    </div>
                </div>
            </div>

            {/* Subscription List (Ultra Compact) */}
            <div>
                <h2 className="text-sm font-semibold text-muted-foreground px-1 mb-3 uppercase tracking-wider">登録リスト</h2>

                {subscriptions.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground bg-muted/30 rounded-2xl border border-dashed border-border">
                        <p>まだ登録がありません</p>
                        <p className="text-sm mt-2">下の <span className="text-primary font-bold">+</span> ボタンから追加しよう</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-2">
                        {subscriptions.map((sub) => {
                            const service = getServiceDetails(sub.serviceId);
                            const isCustom = !service;
                            const itemColor = isCustom ? 'var(--color-muted-foreground)' : service?.color;

                            return (
                                <div
                                    key={sub.id}
                                    className={`group relative overflow-hidden rounded-xl border transition-all duration-300 flex flex-col justify-between p-3 h-32 ${sub.isActive
                                        ? 'bg-card border-border shadow-sm hover:shadow-md hover:-translate-y-0.5'
                                        : 'bg-muted/50 border-border/50 opacity-70 grayscale'
                                        }`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="relative">
                                            <ServiceIcon
                                                serviceName={isCustom ? (sub.customName || '?') : service.name}
                                                serviceColor={sub.isActive ? itemColor! : '#888'}
                                                domain={service?.url}
                                                className="w-10 h-10 shadow-sm"
                                            />
                                        </div>
                                        <button
                                            onClick={(e) => handleDelete(sub.id, e)}
                                            className="text-muted-foreground hover:text-destructive p-1 rounded-full hover:bg-muted transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>

                                    <div className="mt-1">
                                        <h3 className="font-bold text-sm leading-tight line-clamp-1 text-foreground">
                                            {isCustom ? sub.customName : service?.name}
                                        </h3>
                                        <div className="flex items-baseline justify-between mt-1">
                                            <p className="font-bold text-base text-foreground">
                                                {formatCurrency(sub.price, currency, exchangeRate)}
                                            </p>
                                            <div className="flex items-center">
                                                {/* Tiny Toggle */}
                                                <button
                                                    onClick={(e) => handleToggleActive(sub.id, e)}
                                                    className={`w-6 h-3.5 flex items-center rounded-full transition-colors focus:outline-none p-0.5 ${sub.isActive ? 'bg-emerald-500/20' : 'bg-muted-foreground/30'
                                                        }`}
                                                >
                                                    <div
                                                        className={`bg-current w-2.5 h-2.5 rounded-full shadow-sm transform duration-200 ${sub.isActive ? 'translate-x-2.5 text-emerald-500' : 'translate-x-0 text-muted-foreground'
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
        </div>
    );
};

export default Dashboard;
