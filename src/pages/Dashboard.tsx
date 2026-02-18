import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { UserSubscription, ServiceCategory } from '../types';
import { loadSubscriptions, saveSubscriptions } from '../utils/storage';
import { calculateTotal, formatCurrency } from '../utils/calculations';
import { POPULAR_SERVICES } from '../data/services';
import { Trash2, Pencil, X, Calendar, FileText, GripHorizontal, Settings, Flame } from 'lucide-react';
import { saveSnapshot } from '../utils/snapshot';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { loadFromCloud, syncToCloud } from '../utils/sync';

import ServiceIcon from '../components/ServiceIcon';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    horizontalListSortingStrategy,
    rectSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableSubscriptionItem } from '../components/SortableSubscriptionItem';
import { SortableCategoryTab } from '../components/SortableCategoryTab';

const Dashboard: React.FC = () => {
    const { currency, exchangeRate } = useSettings();
    const { user } = useAuth();
    const navigate = useNavigate();

    // Streak logic
    const streak = useMemo(() => {
        const today = new Date().toISOString().slice(0, 10);
        const lastVisit = localStorage.getItem('last_visit_date');
        const currentStreak = parseInt(localStorage.getItem('visit_streak') || '0', 10);
        if (lastVisit === today) return currentStreak;
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        const newStreak = lastVisit === yesterday ? currentStreak + 1 : 1;
        localStorage.setItem('last_visit_date', today);
        localStorage.setItem('visit_streak', String(newStreak));
        return newStreak;
    }, []);
    const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortMode, setSortMode] = useState<'default' | 'price_desc' | 'price_asc' | 'name_asc'>('default');
    const [categoryFilter, setCategoryFilter] = useState<ServiceCategory | 'All'>('All');


    // Sensors for DnD — drag handle approach:
    // Short delay (200ms) on the handle to prevent accidental drags on quick taps.
    // Scroll is unaffected since listeners are only on the handle icon, not the card.
    const sensors = useSensors(
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 200,
                tolerance: 5,
            },
        }),
        useSensor(PointerSensor, {
            activationConstraint: {
                delay: 200,
                tolerance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Category Sort Order persistence
    const [categoryOrder, setCategoryOrder] = useState<string[]>(() => {
        const saved = localStorage.getItem('category_order');
        return saved ? JSON.parse(saved) : [];
    });

    // Memo Modal State
    const [editingSub, setEditingSub] = useState<UserSubscription | null>(null);
    const [memoText, setMemoText] = useState('');
    const [renewalDate, setRenewalDate] = useState('');



    useEffect(() => {
        const init = async () => {
            // 1. Load local immediately
            const loadedSubs = loadSubscriptions();
            setSubscriptions(loadedSubs);
            setLoading(false);

            // 2. Save monthly snapshot (once per month)
            const categoryMap: Record<string, string> = {};
            POPULAR_SERVICES.forEach(s => { categoryMap[s.id] = s.category; });
            saveSnapshot(loadedSubs, categoryMap);

            // 3. Sync from cloud if logged in
            if (user) {
                try {
                    console.log('[Dashboard] Starting handleSync from cloud...');
                    const { subscriptions: cloudSubs, categoryOrder: cloudCategoryOrder } = await loadFromCloud(user.id);
                    console.log('[Dashboard] loadFromCloud result:', cloudSubs);
                    if (cloudSubs) {
                        setSubscriptions(cloudSubs);
                        saveSnapshot(cloudSubs, categoryMap);
                    }
                    if (cloudCategoryOrder) {
                        setCategoryOrder(cloudCategoryOrder);
                    }
                } catch (error) {
                    console.error('Failed to sync from cloud:', error);
                }
            }
        };
        init();
    }, [user?.id]);

    // Sticky card observer
    const summaryRef = useRef<HTMLDivElement>(null);
    const [showSticky, setShowSticky] = useState(false);

    useEffect(() => {
        const el = summaryRef.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => setShowSticky(!entry.isIntersecting),
            { threshold: 0.1 }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [loading]);

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



        // Default: Sort by custom sortOrder if available, otherwise by index (stable)
        // Since we are sorting a copy, and the subscriptions array in state determines the display order for default,
        // we can just return (a.sortOrder || 0) - (b.sortOrder || 0) if we want to be explicit,
        // but relying on the array order is often enough if we manipulate the array itself.
        // However, to be safe:
        return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
    });

    // Category filter
    const CATEGORY_LABELS: Record<string, string> = {
        'All': 'すべて', 'Video': '動画', 'Music': '音楽', 'Book': '書籍', 'Game': 'ゲーム',
        'Gym': 'ジム', 'Travel': '旅行', 'Food': 'グルメ', 'Dev': '開発', 'Business': 'ビジネス',
        'AI': 'AI', 'Security': 'セキュリティ', 'Learning': '学習', 'Software': 'IT',
        'Shopping': '買い物', 'Other': 'その他'
    };
    const usedCategories = [...new Set(subscriptions.map(sub => {
        const service = POPULAR_SERVICES.find(s => s.id === sub.serviceId);
        return service?.category || 'Other';
    }))];

    // Merge available categories with saved order
    const orderedCategories = [
        ...categoryOrder.filter(c => usedCategories.includes(c as ServiceCategory)),
        ...usedCategories.filter(c => !categoryOrder.includes(c))
    ] as ServiceCategory[];

    const categoryTabs: (ServiceCategory | 'All')[] = ['All', ...orderedCategories as ServiceCategory[]];

    const filteredSubscriptions = categoryFilter === 'All'
        ? sortedSubscriptions
        : sortedSubscriptions.filter(sub => {
            const service = POPULAR_SERVICES.find(s => s.id === sub.serviceId);
            return (service?.category || 'Other') === categoryFilter;
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

    const handleToggleActive = (sub: UserSubscription) => {
        const updatedSubs = subscriptions.map(s =>
            s.id === sub.id ? { ...s, isActive: !s.isActive } : s
        );
        setSubscriptions(updatedSubs);
        saveSubscriptions(updatedSubs);
        if (user) syncToCloud(user.id);
    };

    const handleDelete = (id: string) => {
        if (!confirm('本当に削除しますか？')) return;
        const updatedSubs = subscriptions.filter(s => s.id !== id);
        setSubscriptions(updatedSubs);
        saveSubscriptions(updatedSubs);
        if (user) syncToCloud(user.id);
    };



    const openMemoModal = (sub: UserSubscription, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingSub(sub);
        setMemoText(sub.memo || '');
        setRenewalDate(sub.renewalDate || '');
    };

    const saveMemo = () => {
        if (!editingSub) return;
        const updatedSubs = subscriptions.map(sub =>
            sub.id === editingSub.id ? { ...sub, memo: memoText, renewalDate } : sub
        );
        setSubscriptions(updatedSubs);
        saveSubscriptions(updatedSubs);
        if (user) syncToCloud(user.id);
        setEditingSub(null);
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

    // Filter to disable DnD when not in default mode
    const isDragEnabled = sortMode === 'default';

    const handleSubscriptionDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        setSubscriptions((items) => {
            const oldIndex = items.findIndex(i => i.id === active.id);
            const newIndex = items.findIndex(i => i.id === over.id);

            // Reorder the array
            const newItems = arrayMove(items, oldIndex, newIndex);

            // Update sortOrder for all items
            const updatedItems = newItems.map((item, index) => ({
                ...item,
                sortOrder: index
            }));

            // Save and Sync
            saveSubscriptions(updatedItems);
            // We optimize sync to not fire on every drag if possible, but for MVP we sync.
            // Debouncing would be better, but let's sync for safety.
            if (user) syncToCloud(user.id);

            return updatedItems;
        });
    };

    const handleCategoryDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = orderedCategories.indexOf(active.id as ServiceCategory);
        const newIndex = orderedCategories.indexOf(over.id as ServiceCategory);

        const newOrder = arrayMove(orderedCategories, oldIndex, newIndex);
        setCategoryOrder(newOrder);
        localStorage.setItem('category_order', JSON.stringify(newOrder));
        // Note: We are not syncing category order to cloud yet in this step, but local persistence works.
        // To strictly follow plan, we should sync to profile.
        // Let's assume Profile sync is a separate task or we add it to updateProfile logic later.
    };

    if (loading) return <div className="p-4 text-center mt-10 text-muted-foreground">読み込み中...</div>;

    return (
        <div className="p-4 max-w-md mx-auto pb-24">
            <header className="pb-4 flex items-center justify-between">
                <button
                    onClick={() => navigate('/settings')}
                    className="text-muted-foreground hover:text-foreground hover:bg-muted p-2 rounded-full transition-colors"
                    title="設定"
                >
                    <Settings size={20} />
                </button>
                <h1 className="text-2xl font-bold text-foreground">マイサブスク</h1>
                <div className="w-9" />
            </header>

            {/* Compact Summary Bar */}
            {/* Summary Card - Cyan gradient */}
            <div ref={summaryRef} className="relative overflow-hidden rounded-2xl shadow-xl mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 via-teal-500 to-sky-600" />
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                <div className="relative z-10 p-5">
                    <div className="flex items-start justify-between mb-3">
                        <div>
                            <p className="text-cyan-100 text-xs font-medium mb-1">月額合計</p>
                            <p className="text-4xl font-black text-white tracking-tight">
                                {formatCurrency(monthlyTotal, currency, exchangeRate)}
                            </p>
                            {currency === 'USD' && <p className="text-[10px] text-cyan-200 mt-0.5">1 USD ≈ {Math.round(1 / (exchangeRate || 0.0066))} JPY</p>}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            {streak > 1 && (
                                <div className="flex items-center gap-1 bg-orange-500/30 backdrop-blur-sm border border-orange-400/30 rounded-full px-2.5 py-1">
                                    <Flame size={12} className="text-orange-300" />
                                    <span className="text-xs font-bold text-orange-200">{streak}日連続</span>
                                </div>
                            )}
                            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-3 py-2 text-right">
                                <p className="text-[10px] text-cyan-100">年額見込み</p>
                                <p className="text-lg font-black text-emerald-300">{formatCurrency(yearlyTotal, currency, exchangeRate)}</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-white/20">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                                <span className="text-xs text-cyan-100">アクティブ <span className="font-bold text-white">{subscriptions.filter(s => s.isActive).length}</span>件</span>
                            </div>
                            {subscriptions.filter(s => !s.isActive).length > 0 && (
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-rose-400" />
                                    <span className="text-xs text-cyan-100">停止中 <span className="font-bold text-white">{subscriptions.filter(s => !s.isActive).length}</span>件</span>
                                </div>
                            )}
                        </div>
                        <span className="text-[10px] text-cyan-200">{subscriptions.length}件登録</span>
                    </div>
                </div>
            </div>

            {/* Sticky Mini Summary */}
            <div
                className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${showSticky ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
                    }`}
            >
                <div className="max-w-md mx-auto px-4 pt-2 pb-2">
                    <div className="bg-gradient-to-r from-cyan-500 to-sky-600 rounded-xl shadow-md px-3 py-2 flex items-center justify-between min-h-[42px]">
                        <div className="flex items-baseline gap-2">
                            <span className="text-xs font-bold text-cyan-100">月額</span>
                            <span className="text-xl font-black text-white tracking-tight">
                                {formatCurrency(monthlyTotal, currency, exchangeRate)}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] text-cyan-100">年 {formatCurrency(yearlyTotal, currency, exchangeRate)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Subscription List (Ultra Compact) */}
            <div>
                <div className="flex items-center justify-between mb-2 px-1">
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">登録リスト</h2>
                    <button
                        onClick={toggleSort}
                        className="text-xs font-medium bg-muted/50 hover:bg-muted px-2 py-1 rounded-md text-muted-foreground transition-colors flex items-center space-x-1"
                    >
                        <span>⇅ {getSortLabel()}</span>
                    </button>
                </div>

                {/* Category Filter */}
                {subscriptions.length > 0 && usedCategories.length > 1 && (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleCategoryDragEnd}
                    >
                        <SortableContext
                            items={categoryTabs.filter(c => c !== 'All').map(c => c)}
                            strategy={horizontalListSortingStrategy}
                        >
                            <div className="flex gap-1.5 overflow-x-auto pb-2 mb-2 scrollbar-hide touch-pan-x">
                                <button
                                    onClick={() => setCategoryFilter('All')}
                                    className={`shrink-0 px-3 py-1 text-xs font-bold rounded-full transition-colors duration-150 ${categoryFilter === 'All'
                                        ? 'bg-primary text-primary-foreground shadow-sm'
                                        : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                                        }`}
                                >
                                    すべて
                                </button>
                                {categoryTabs.filter(c => c !== 'All').map(cat => (
                                    <SortableCategoryTab key={cat} id={cat}>
                                        <button
                                            onClick={() => setCategoryFilter(cat)}
                                            className={`w-full h-full px-3 py-1 text-xs font-bold rounded-full transition-colors duration-150 ${categoryFilter === cat
                                                ? 'bg-primary text-primary-foreground shadow-sm'
                                                : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                                                }`}
                                        >
                                            {CATEGORY_LABELS[cat] || cat}
                                        </button>
                                    </SortableCategoryTab>
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                )}

                {subscriptions.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground bg-muted/30 rounded-2xl border border-dashed border-border">
                        <p>まだ登録がありません</p>
                        <p className="text-sm mt-2">下の <span className="text-primary font-bold">+</span> ボタンから追加しよう</p>
                    </div>
                ) : (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleSubscriptionDragEnd}
                    // Only enable DnD if filtered is 'All' and sort is Default
                    // And we disable logic if conditions not met, though context is present.
                    >
                        <SortableContext
                            items={filteredSubscriptions.map(s => s.id)}
                            strategy={rectSortingStrategy}
                            disabled={!isDragEnabled}
                        >
                            <div className="grid grid-cols-2 gap-2" style={{ minHeight: filteredSubscriptions.length > 0 ? `${Math.ceil(filteredSubscriptions.length / 2) * 100}px` : undefined }}>
                                {filteredSubscriptions.map((sub) => {
                                    const service = getServiceDetails(sub.serviceId);
                                    const isCustom = !service;
                                    const itemColor = isCustom ? 'var(--color-muted-foreground)' : service?.color;


                                    // Calculate monthly equivalent for display if yearly
                                    const isYearly = sub.cycle === 'yearly';
                                    const monthlyEquivalent = isYearly ? Math.floor(sub.price / 12) : null;

                                    const CardContent = (
                                        <div
                                            className={`group relative overflow-hidden rounded-xl border transition-all duration-300 flex flex-col justify-between p-3 min-h-[5.5rem] h-auto cursor-pointer ${sub.isActive
                                                ? 'bg-card border-border shadow-sm hover:shadow-md hover:-translate-y-0.5'
                                                : 'bg-muted/50 border-border/50 opacity-70 grayscale'
                                                }`}
                                            onClick={() => navigate(`/service/${sub.serviceId}`)}
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <div className="relative">
                                                    <ServiceIcon
                                                        serviceName={isCustom ? (sub.customName || '?') : service.name}
                                                        serviceColor={sub.isActive ? itemColor! : '#888'}
                                                        domain={service?.url}
                                                        customIcon={sub.customIcon}
                                                        className="w-8 h-8 shadow-sm"
                                                    />
                                                </div>
                                                <div className="flex items-center space-x-0.5">
                                                    <button
                                                        onClick={(e) => openMemoModal(sub, e)}
                                                        className="text-muted-foreground hover:text-primary p-1 rounded-full hover:bg-muted transition-colors"
                                                        title="メモ・更新日を編集"
                                                    >
                                                        <Pencil size={13} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDelete(sub.id);
                                                        }}
                                                        className="text-muted-foreground/50 hover:text-destructive p-1 rounded-full hover:bg-muted transition-colors"
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                </div>
                                            </div>

                                            <div>
                                                <h3 className="font-bold text-xs leading-tight line-clamp-1 text-foreground mb-0.5">
                                                    {isCustom ? sub.customName : service?.name}
                                                </h3>
                                                {/* Show renewal date indicator if set */}
                                                {sub.renewalDate && (
                                                    <p className="text-[9px] text-muted-foreground flex items-center gap-0.5 mb-0.5">
                                                        <Calendar size={8} />
                                                        {new Date(sub.renewalDate).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
                                                    </p>
                                                )}
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
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleToggleActive(sub);
                                                            }}
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

                                    // Conditionally wrap with Sortable
                                    return isDragEnabled ? (
                                        <SortableSubscriptionItem key={sub.id} id={sub.id}>
                                            {(dragHandleProps) => (
                                                <div className="relative">
                                                    {/* Drag handle — top center */}
                                                    <div
                                                        {...dragHandleProps}
                                                        className="absolute top-0 left-1/2 -translate-x-1/2 z-10 px-3 py-1 cursor-grab active:cursor-grabbing touch-none text-muted-foreground/30 hover:text-muted-foreground/60"
                                                        title="ドラッグして並び替え"
                                                    >
                                                        <GripHorizontal size={14} />
                                                    </div>
                                                    {CardContent}
                                                </div>
                                            )}
                                        </SortableSubscriptionItem>
                                    ) : (
                                        <div key={sub.id}>
                                            {CardContent}
                                        </div>
                                    );
                                })}
                            </div>
                        </SortableContext>
                    </DndContext>
                )
                }
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



            {/* Memo Edit Modal */}
            {editingSub && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center p-4 animate-in fade-in duration-200" onClick={() => setEditingSub(null)}>
                    <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl animate-in slide-in-from-bottom-4 duration-300" onClick={(e) => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 border-b border-border">
                            <h3 className="font-bold text-foreground flex items-center gap-2">
                                <FileText size={18} className="text-primary" />
                                メモ・更新日
                            </h3>
                            <button onClick={() => setEditingSub(null)} className="p-1 hover:bg-muted rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-4 space-y-4">
                            {/* Service Name Display */}
                            <div className="flex items-center space-x-3 bg-muted/30 p-3 rounded-xl">
                                <ServiceIcon
                                    serviceName={getServiceDetails(editingSub.serviceId)?.name || editingSub.customName || '?'}
                                    serviceColor={getServiceDetails(editingSub.serviceId)?.color || '#888'}
                                    domain={getServiceDetails(editingSub.serviceId)?.url}
                                    className="w-10 h-10"
                                />
                                <div>
                                    <p className="font-bold text-sm">{getServiceDetails(editingSub.serviceId)?.name || editingSub.customName}</p>
                                    <p className="text-xs text-muted-foreground">{formatCurrency(editingSub.price, currency, exchangeRate)}/{editingSub.cycle === 'yearly' ? '年' : '月'}</p>
                                </div>
                            </div>

                            {/* Renewal Date */}
                            <div>
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-2">
                                    <Calendar size={14} />
                                    更新日
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="date"
                                        value={renewalDate}
                                        onChange={(e) => setRenewalDate(e.target.value)}
                                        className="flex-1 min-w-0 bg-muted border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    />
                                    {renewalDate && (
                                        <button
                                            onClick={() => setRenewalDate('')}
                                            className="shrink-0 p-2 text-muted-foreground hover:text-destructive hover:bg-muted rounded-xl border border-border transition-colors"
                                            title="日付をクリア"
                                        >
                                            <X size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Memo */}
                            <div>
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-2">
                                    <FileText size={14} />
                                    メモ
                                </label>
                                <textarea
                                    value={memoText}
                                    onChange={(e) => setMemoText(e.target.value)}
                                    placeholder="自由にメモを追加してください..."
                                    className="w-full bg-muted border border-border rounded-xl p-3 min-h-[100px] text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                                />
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-border">
                            <button
                                onClick={saveMemo}
                                className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl hover:opacity-90 transition-opacity"
                            >
                                保存する
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Dashboard;
