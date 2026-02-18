import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';

const Onboarding: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState<'welcome' | 'tutorial'>('welcome');
    const [slideIndex, setSlideIndex] = useState(0);

    const handleStartGuest = () => {
        localStorage.setItem('hasVisited', 'true');
        setStep('tutorial');
    };

    const handleLogin = () => {
        localStorage.setItem('hasVisited', 'true');
        navigate('/auth');
    };

    const finishTutorial = () => {
        navigate('/');
    };

    const slides = [
        {
            title: "サブスクを登録",
            desc: "あなたが契約しているサブスクリプションをリストに追加しましょう。",
            icon: "📝",
            color: "bg-blue-500"
        },
        {
            title: "節約額をチェック",
            desc: "使っていないサブスクをオフにすると、いくら節約できるか一目でわかります。",
            icon: "💰",
            color: "bg-emerald-500"
        },
        {
            title: "ランキングで発見",
            desc: "みんなの「神サブスク」や「無駄だったサブスク」を見て、賢く選びましょう。",
            icon: "🏆",
            color: "bg-amber-500"
        }
    ];

    if (step === 'welcome') {
        return (
            <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
                <div className="mb-8">
                    <div className="w-20 h-20 bg-primary/20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary/10">
                        <span className="text-4xl">💎</span>
                    </div>
                    <h1 className="text-3xl font-extrabold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-500">
                        Volatile Photon
                    </h1>
                    <p className="text-muted-foreground">
                        あなたのサブスクリプションを<br />
                        もっと賢く、シンプルに管理。
                    </p>
                </div>

                <div className="w-full max-w-sm space-y-4">
                    <button
                        onClick={handleLogin}
                        className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-2xl shadow-lg shadow-primary/25 hover:opacity-90 transition-all flex items-center justify-center gap-2"
                    >
                        ログインして始める
                        <span className="text-xs font-normal opacity-80">(クラウド同期・プロフィール公開)</span>
                    </button>

                    <button
                        onClick={handleStartGuest}
                        className="w-full py-4 bg-muted text-foreground font-bold rounded-2xl border border-border hover:bg-muted/80 transition-all"
                    >
                        ゲストとして利用
                        <span className="block text-[10px] font-normal text-muted-foreground mt-0.5">
                            ※データは端末にのみ保存されます
                        </span>
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col p-6 animate-in slide-in-from-right duration-300">
            <div className="flex-1 flex flex-col items-center justify-center text-center">
                <div
                    className={`w-32 h-32 ${slides[slideIndex].color} rounded-full flex items-center justify-center mb-8 shadow-2xl transition-colors duration-500`}
                >
                    <span className="text-6xl animate-bounce">{slides[slideIndex].icon}</span>
                </div>

                <h2 className="text-2xl font-bold mb-4 px-4 min-h-[4rem] flex items-center justify-center">
                    {slides[slideIndex].title}
                </h2>

                <p className="text-muted-foreground leading-relaxed px-4 min-h-[5rem]">
                    {slides[slideIndex].desc}
                </p>
            </div>

            <div className="py-8">
                <div className="flex justify-center gap-2 mb-8">
                    {slides.map((_, i) => (
                        <div
                            key={i}
                            className={`h-2 rounded-full transition-all duration-300 ${i === slideIndex ? 'w-8 bg-primary' : 'w-2 bg-muted-foreground/30'
                                }`}
                        />
                    ))}
                </div>

                <button
                    onClick={() => {
                        if (slideIndex < slides.length - 1) {
                            setSlideIndex(prev => prev + 1);
                        } else {
                            finishTutorial();
                        }
                    }}
                    className="w-full py-4 bg-foreground text-background font-bold rounded-2xl shadow-xl hover:opacity-90 transition-all flex items-center justify-center gap-2"
                >
                    {slideIndex < slides.length - 1 ? (
                        <>
                            次へ <ArrowRight size={20} />
                        </>
                    ) : (
                        <>
                            はじめる <Check size={20} />
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default Onboarding;
