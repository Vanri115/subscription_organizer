import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Settings, Plus } from 'lucide-react';

const Layout: React.FC = () => {
    const location = useLocation();

    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden font-sans">
            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto pb-20">
                <Outlet />
            </div>

            {/* Bottom Navigation */}
            <div className="fixed bottom-0 left-0 right-0 border-t border-gray-800 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
                <div className="flex justify-around items-center h-16 max-w-md mx-auto">
                    <Link
                        to="/"
                        className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive('/') ? 'text-primary' : 'text-gray-400 hover:text-gray-200'
                            }`}
                    >
                        <Home size={24} />
                        <span className="text-[10px] font-medium">サブスク</span>
                    </Link>

                    <Link
                        to="/search"
                        className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive('/search') ? 'text-primary' : 'text-gray-400 hover:text-gray-200'
                            }`}
                    >
                        <Plus size={24} />
                        <span className="text-[10px] font-medium">登録</span>
                    </Link>

                    <Link
                        to="/settings"
                        className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive('/settings') ? 'text-primary' : 'text-gray-400 hover:text-gray-200'
                            }`}
                    >
                        <Settings size={24} />
                        <span className="text-[10px] font-medium">設定</span>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Layout;
