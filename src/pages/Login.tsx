import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
    const { user, signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [isSignUp, setIsSignUp] = React.useState(false);
    const [loading, setLoading] = React.useState(false);

    useEffect(() => {
        if (user) {
            navigate('/');
        }
    }, [user, navigate]);

    const handleGoogleLogin = async () => {
        try {
            await signInWithGoogle();
        } catch (error) {
            console.error('Google login failed:', error);
            alert('Googleログインに失敗しました。');
        }
    };

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isSignUp) {
                await signUpWithEmail(email, password);
                alert('確認メールを送信しました。メール内のリンクをクリックして登録を完了してください。');
            } else {
                await signInWithEmail(email, password);
            }
        } catch (error: any) {
            console.error('Email auth failed:', error);
            alert(error.message || '認証に失敗しました。');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
            <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 shadow-xl text-center space-y-6">
                <div>
                    <h1 className="text-3xl font-bold mb-2">
                        {isSignUp ? 'アカウント作成' : 'ログイン'}
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        クラウド同期とランキング機能を利用するにはログインしてください
                    </p>
                </div>

                <form onSubmit={handleEmailAuth} className="space-y-4 text-left">
                    <div>
                        <label className="text-sm font-medium ml-1">メールアドレス</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full mt-1 p-3 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary outline-none transition-all"
                            placeholder="name@example.com"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium ml-1">パスワード</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full mt-1 p-3 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary outline-none transition-all"
                            placeholder="••••••••"
                            minLength={6}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                        {loading ? '処理中...' : (isSignUp ? '登録する' : 'ログイン')}
                    </button>
                </form>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">または</span>
                    </div>
                </div>

                <button
                    onClick={handleGoogleLogin}
                    className="w-full flex items-center justify-center space-x-3 bg-white text-black hover:bg-gray-100 font-medium py-3 px-4 rounded-xl transition-colors border border-gray-200 shadow-sm"
                >
                    <img
                        src="https://www.google.com/favicon.ico"
                        alt="Google"
                        className="w-5 h-5"
                    />
                    <span>Googleで続ける</span>
                </button>

                <div className="pt-2 text-sm">
                    <button
                        onClick={() => setIsSignUp(!isSignUp)}
                        className="text-primary hover:underline font-medium"
                    >
                        {isSignUp
                            ? 'すでにアカウントをお持ちの方はこちら'
                            : 'アカウントをお持ちでない方はこちら'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login;
