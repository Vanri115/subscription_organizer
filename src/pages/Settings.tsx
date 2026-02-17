import React from 'react';
import { Moon, Sun, CreditCard, ChevronRight, Trash2 } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

const Settings: React.FC = () => {
    const { theme, toggleTheme, currency, setCurrency } = useSettings();

    const handleClearData = () => {
        if (window.confirm('本当にすべてのデータを削除しますか？この操作は取り消せません。')) {
            localStorage.removeItem('subscriptions');
            window.location.reload();
        }
    };

    return (
        <div className="p-4 max-w-md mx-auto pb-24 space-y-6">
            <header className="pt-2 mb-6">
                <h1 className="text-2xl font-bold text-foreground">設定</h1>
            </header>

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
