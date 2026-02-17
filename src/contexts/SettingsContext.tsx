import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';
export type Currency = 'JPY' | 'USD';

interface SettingsContextType {
    theme: Theme;
    toggleTheme: () => void;
    currency: Currency;
    setCurrency: (currency: Currency) => void;
    exchangeRate: number | null; // JPY to USD rate
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setTheme] = useState<Theme>(() => {
        const saved = localStorage.getItem('theme') as Theme;
        return saved || 'dark';
    });

    const [currency, setCurrency] = useState<Currency>(() => {
        const saved = localStorage.getItem('currency') as Currency;
        return saved || 'JPY';
    });

    const [exchangeRate, setExchangeRate] = useState<number | null>(null);

    useEffect(() => {
        localStorage.setItem('theme', theme);
        const root = window.document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    }, [theme]);

    useEffect(() => {
        localStorage.setItem('currency', currency);
    }, [currency]);

    // Fetch Exchange Rate on Mount
    useEffect(() => {
        const fetchRate = async () => {
            try {
                // Using a public API for JPY -> USD
                const res = await fetch('https://api.exchangerate-api.com/v4/latest/JPY');
                const data = await res.json();
                if (data && data.rates && data.rates.USD) {
                    setExchangeRate(data.rates.USD);
                    console.log('Fetched Exchange Rate JPY/USD:', data.rates.USD);
                }
            } catch (error) {
                console.error('Failed to fetch exchange rate:', error);
                // Fallback rate: 1 JPY approx 0.0066 USD (1 USD = 150 JPY)
                setExchangeRate(0.0066);
            }
        };

        fetchRate();
    }, []);

    const toggleTheme = () => {
        setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
    };

    return (
        <SettingsContext.Provider value={{ theme, toggleTheme, currency, setCurrency, exchangeRate }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
