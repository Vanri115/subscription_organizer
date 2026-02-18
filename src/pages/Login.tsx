import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
    const { user, signInWithGoogle } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            navigate('/');
        }
    }, [user, navigate]);

    const handleLogin = async () => {
        try {
            await signInWithGoogle();
        } catch (error) {
            console.error('Login failed:', error);
            alert('ログインに失敗しました。');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
            <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 shadow-xl text-center space-y-6">
                <div>
                    <h1 className="text-3xl font-bold mb-2">ログイン</h1>
                    <p className="text-muted-foreground text-sm">
                        クラウド同期とランキング機能を利用するにはログインしてください
                    </p>
                </div>

                <button
                    onClick={handleLogin}
                    className="w-full flex items-center justify-center space-x-3 bg-white text-black hover:bg-gray-100 font-medium py-3 px-4 rounded-xl transition-colors border border-gray-200 shadow-sm"
                >
                    <img
                        src="https://www.google.com/favicon.ico"
                        alt="Google"
                        className="w-5 h-5"
                    />
                    <span>Googleで続ける</span>
                </button>

                <div className="pt-4 text-xs text-muted-foreground">
                    <p>※アカウント作成により利用規約に同意したものとみなされます</p>
                </div>
            </div>
        </div>
    );
};

export default Login;
