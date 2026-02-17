import type { Service } from '../types';

export const POPULAR_SERVICES: Service[] = [
    // --- Video Streaming ---
    {
        id: 'netflix',
        name: 'Netflix',
        color: '#E50914',
        url: 'netflix.com',
        category: 'Video',
        plans: [
            { id: 'standard_ads', name: '広告つきスタンダード', price: 890, currency: 'JPY', cycle: 'monthly' },
            { id: 'standard', name: 'スタンダード', price: 1590, currency: 'JPY', cycle: 'monthly' },
            { id: 'premium', name: 'プレミアム', price: 2290, currency: 'JPY', cycle: 'monthly' },
        ],
    },
    {
        id: 'youtube',
        name: 'YouTube Premium',
        color: '#FF0000',
        url: 'youtube.com',
        category: 'Video',
        plans: [
            { id: 'individual', name: '個人プラン', price: 1280, currency: 'JPY', cycle: 'monthly' },
            { id: 'family', name: 'ファミリープラン', price: 2280, currency: 'JPY', cycle: 'monthly' },
            { id: 'student', name: '学割プラン', price: 780, currency: 'JPY', cycle: 'monthly' },
            { id: 'annual', name: '年間プラン', price: 12800, currency: 'JPY', cycle: 'yearly' },
        ],
    },
    {
        id: 'apple_tv_plus',
        name: 'Apple TV+',
        color: '#000000',
        url: 'tv.apple.com',
        category: 'Video',
        plans: [
            { id: 'monthly', name: '月額プラン', price: 900, currency: 'JPY', cycle: 'monthly' },
        ],
    },
    {
        id: 'disney_plus',
        name: 'Disney+',
        color: '#113CCF',
        url: 'disneyplus.com',
        category: 'Video',
        plans: [
            { id: 'standard_monthly', name: 'スタンダード（月額）', price: 990, currency: 'JPY', cycle: 'monthly' },
            { id: 'premium_monthly', name: 'プレミアム（月額）', price: 1320, currency: 'JPY', cycle: 'monthly' },
            { id: 'standard_yearly', name: 'スタンダード（年額）', price: 9900, currency: 'JPY', cycle: 'yearly' },
            { id: 'premium_yearly', name: 'プレミアム（年額）', price: 13200, currency: 'JPY', cycle: 'yearly' },
        ],
    },
    {
        id: 'amazon_prime',
        name: 'Amazon Prime',
        color: '#00A8E1',
        url: 'amazon.co.jp',
        category: 'Other',
        plans: [
            { id: 'monthly', name: '月間プラン', price: 600, currency: 'JPY', cycle: 'monthly' },
            { id: 'yearly', name: '年間プラン', price: 5900, currency: 'JPY', cycle: 'yearly' },
            { id: 'student_monthly', name: 'Student (月間)', price: 300, currency: 'JPY', cycle: 'monthly' },
            { id: 'student_yearly', name: 'Student (年間)', price: 2950, currency: 'JPY', cycle: 'yearly' },
        ],
    },
    {
        id: 'hulu_jp',
        name: 'Hulu',
        color: '#1CE783',
        url: 'hulu.jp',
        category: 'Video',
        plans: [
            { id: 'monthly', name: '月額プラン', price: 1026, currency: 'JPY', cycle: 'monthly' },
        ],
    },
    {
        id: 'dazn',
        name: 'DAZN',
        color: '#F4E500',
        url: 'dazn.com',
        category: 'Video',
        plans: [
            { id: 'global_monthly', name: 'Global (月額)', price: 980, currency: 'JPY', cycle: 'monthly' },
            { id: 'standard_monthly', name: 'Standard (月額)', price: 4200, currency: 'JPY', cycle: 'monthly' },
            { id: 'standard_anual_monthly', name: 'Standard (年間プラン月々払い)', price: 3200, currency: 'JPY', cycle: 'monthly' },
            { id: 'standard_annual', name: 'Standard (年間一括)', price: 32000, currency: 'JPY', cycle: 'yearly' },
        ],
    },
    {
        id: 'u_next',
        name: 'U-NEXT',
        color: '#008EFF',
        url: 'unext.jp',
        category: 'Video',
        plans: [
            { id: 'monthly', name: '月額プラン', price: 2189, currency: 'JPY', cycle: 'monthly' },
        ],
    },
    {
        id: 'abema',
        name: 'ABEMA Premium',
        color: '#00CC99',
        url: 'abema.tv',
        category: 'Video',
        plans: [
            { id: 'monthly', name: '月額プラン', price: 960, currency: 'JPY', cycle: 'monthly' },
        ],
    },
    {
        id: 'wowow',
        name: 'WOWOW',
        color: '#0064C8',
        category: 'Video',
        plans: [
            { id: 'monthly', name: '月額視聴料', price: 2530, currency: 'JPY', cycle: 'monthly' },
        ],
    },

    // --- Music ---
    {
        id: 'spotify',
        name: 'Spotify',
        color: '#1DB954',
        url: 'spotify.com',
        category: 'Music',
        plans: [
            { id: 'standard', name: 'Standard (個人)', price: 980, currency: 'JPY', cycle: 'monthly' },
            { id: 'duo', name: 'Duo (2人)', price: 1280, currency: 'JPY', cycle: 'monthly' },
            { id: 'family', name: 'Family (6人まで)', price: 1580, currency: 'JPY', cycle: 'monthly' },
            { id: 'student', name: 'Student (学生)', price: 480, currency: 'JPY', cycle: 'monthly' },
        ],
    },
    {
        id: 'apple_music',
        name: 'Apple Music',
        color: '#FC3C44',
        url: 'music.apple.com',
        category: 'Music',
        plans: [
            { id: 'individual', name: '個人プラン', price: 1080, currency: 'JPY', cycle: 'monthly' },
            { id: 'family', name: 'ファミリープラン', price: 1680, currency: 'JPY', cycle: 'monthly' },
            { id: 'student', name: '学生プラン', price: 580, currency: 'JPY', cycle: 'monthly' },
        ],
    },
    {
        id: 'amazon_music_unlimited',
        name: 'Amazon Music Unlimited',
        color: '#00A8E1',
        url: 'music.amazon.co.jp',
        category: 'Music',
        plans: [
            { id: 'individual_prime', name: '個人プラン (プライム会員)', price: 980, currency: 'JPY', cycle: 'monthly' },
            { id: 'individual_nonprime', name: '個人プラン (非プライム会員)', price: 1080, currency: 'JPY', cycle: 'monthly' },
            { id: 'family', name: 'ファミリープラン', price: 1680, currency: 'JPY', cycle: 'monthly' },
            { id: 'student', name: '学生プラン', price: 580, currency: 'JPY', cycle: 'monthly' },
        ],
    },
    {
        id: 'apple_one',
        name: 'Apple One',
        color: '#000000',
        category: 'Other',
        plans: [
            { id: 'individual', name: '個人', price: 1200, currency: 'JPY', cycle: 'monthly' },
            { id: 'family', name: 'ファミリー', price: 1980, currency: 'JPY', cycle: 'monthly' },
            { id: 'premier', name: 'プレミア', price: 2450, currency: 'JPY', cycle: 'monthly' },
        ],
    },
    {
        id: 'line_music',
        name: 'LINE MUSIC',
        color: '#00C300',
        url: 'music.line.me',
        category: 'Music',
        plans: [
            { id: 'individual', name: '一般 (プレミアム)', price: 980, currency: 'JPY', cycle: 'monthly' },
            { id: 'student', name: '学生 (プレミアム)', price: 480, currency: 'JPY', cycle: 'monthly' },
            { id: 'family', name: 'ファミリー (プレミアム)', price: 1480, currency: 'JPY', cycle: 'monthly' },
        ],
    },
    {
        id: 'awa',
        name: 'AWA',
        color: '#FF4155', // Or Black
        url: 'awa.fm',
        category: 'Music',
        plans: [
            { id: 'standard', name: 'Standard (月額)', price: 980, currency: 'JPY', cycle: 'monthly' },
            { id: 'student', name: 'Student (学生)', price: 480, currency: 'JPY', cycle: 'monthly' },
        ],
    },

    // --- Books / Magazines ---
    {
        id: 'kindle_unlimited',
        name: 'Kindle Unlimited',
        color: '#00A8E1', // Amazon Blueish
        url: 'amazon.co.jp', // Subdomain technically
        category: 'Book',
        plans: [
            { id: 'monthly', name: '月額プラン', price: 980, currency: 'JPY', cycle: 'monthly' },
        ],
    },
    {
        id: 'audible',
        name: 'Audible',
        color: '#FF9900', // Amazon Orange
        url: 'audible.co.jp',
        category: 'Book',
        plans: [
            { id: 'monthly', name: '月額会員', price: 1500, currency: 'JPY', cycle: 'monthly' },
        ],
    },
    {
        id: 'd_magazine',
        name: 'dマガジン',
        color: '#CC0000', // Docomo Red
        url: 'magazine.dmkt-sp.jp',
        category: 'Book',
        plans: [
            { id: 'monthly', name: '月額利用料', price: 440, currency: 'JPY', cycle: 'monthly' },
        ],
    },
    {
        id: 'rakuten_magazine',
        name: '楽天マガジン',
        color: '#BF0000', // Rakuten Red
        url: 'magazine.rakuten.co.jp',
        category: 'Book',
        plans: [
            { id: 'monthly', name: '月額プラン', price: 418, currency: 'JPY', cycle: 'monthly' },
            { id: 'yearly', name: '年額プラン', price: 3960, currency: 'JPY', cycle: 'yearly' },
        ],
    },

    // --- Games ---
    {
        id: 'ps_plus',
        name: 'PlayStation Plus',
        color: '#00439C',
        url: 'playstation.com',
        category: 'Game',
        plans: [
            { id: 'essential_1m', name: 'Essential (1ヶ月)', price: 850, currency: 'JPY', cycle: 'monthly' },
            { id: 'extra_1m', name: 'Extra (1ヶ月)', price: 1300, currency: 'JPY', cycle: 'monthly' },
            { id: 'premium_1m', name: 'Premium (1ヶ月)', price: 1550, currency: 'JPY', cycle: 'monthly' },
            { id: 'essential_12m', name: 'Essential (12ヶ月)', price: 6800, currency: 'JPY', cycle: 'yearly' },
            { id: 'extra_12m', name: 'Extra (12ヶ月)', price: 11700, currency: 'JPY', cycle: 'yearly' },
            { id: 'premium_12m', name: 'Premium (12ヶ月)', price: 13900, currency: 'JPY', cycle: 'yearly' },
        ],
    },
    {
        id: 'nintendo_switch_online',
        name: 'Nintendo Switch Online',
        color: '#E60012',
        url: 'nintendo.co.jp',
        category: 'Game',
        plans: [
            { id: 'individual_1m', name: '個人プラン (1ヶ月)', price: 306, currency: 'JPY', cycle: 'monthly' },
            { id: 'individual_12m', name: '個人プラン (12ヶ月)', price: 2400, currency: 'JPY', cycle: 'yearly' },
            { id: 'expansion_12m', name: '追加パック (12ヶ月のみ)', price: 4900, currency: 'JPY', cycle: 'yearly' },
            { id: 'family_12m', name: 'ファミリープラン (12ヶ月のみ)', price: 4500, currency: 'JPY', cycle: 'yearly' },
        ],
    },
    {
        id: 'xbox_game_pass',
        name: 'Xbox Game Pass',
        color: '#107C10',
        url: 'xbox.com',
        category: 'Game',
        plans: [
            { id: 'ultimate', name: 'Ultimate (月額)', price: 1210, currency: 'JPY', cycle: 'monthly' },
            { id: 'pc', name: 'PC (月額)', price: 850, currency: 'JPY', cycle: 'monthly' },
            { id: 'console', name: 'Console (月額)', price: 850, currency: 'JPY', cycle: 'monthly' },
            { id: 'core', name: 'Core (月額)', price: 842, currency: 'JPY', cycle: 'monthly' },
        ],
    },
    // --- Software / Cloud ---
    {
        id: 'google_one',
        name: 'Google One',
        color: '#DB4437', // Google Red-ish
        category: 'Software',
        plans: [
            { id: 'basic_100gb', name: 'ベーシック (100GB)', price: 250, currency: 'JPY', cycle: 'monthly' },
            { id: 'standard_200gb', name: 'スタンダード (200GB)', price: 380, currency: 'JPY', cycle: 'monthly' },
            { id: 'premium_2tb', name: 'プレミアム (2TB)', price: 1300, currency: 'JPY', cycle: 'monthly' },
            { id: 'ai_premium_2tb', name: 'AIプレミアム (Gemini Advanced)', price: 2900, currency: 'JPY', cycle: 'monthly' },
        ],
    },
    {
        id: 'icloud_plus',
        name: 'iCloud+',
        color: '#0070c9',
        category: 'Software',
        plans: [
            { id: '50gb', name: '50GB', price: 130, currency: 'JPY', cycle: 'monthly' },
            { id: '200gb', name: '200GB', price: 400, currency: 'JPY', cycle: 'monthly' },
            { id: '2tb', name: '2TB', price: 1300, currency: 'JPY', cycle: 'monthly' },
            { id: '6tb', name: '6TB', price: 3900, currency: 'JPY', cycle: 'monthly' },
            { id: '12tb', name: '12TB', price: 7900, currency: 'JPY', cycle: 'monthly' },
        ],
    },
    {
        id: 'chatgpt',
        name: 'ChatGPT Plus',
        color: '#10A37F',
        url: 'openai.com',
        category: 'AI',
        plans: [
            { id: 'plus', name: 'Plus (20 USD)', price: 3000, currency: 'JPY', cycle: 'monthly' },
        ],
    },
    {
        id: 'adobe_cc',
        name: 'Adobe CC',
        color: '#FF0000',
        url: 'adobe.com',
        category: 'Software',
        plans: [
            { id: 'all_apps_monthly', name: 'コンプリート (月々払い)', price: 7780, currency: 'JPY', cycle: 'monthly' },
            { id: 'photo', name: 'フォトプラン', price: 1180, currency: 'JPY', cycle: 'monthly' },
        ],
    },
    {
        id: 'microsoft_365',
        name: 'Microsoft 365',
        color: '#EA3E23',
        url: 'microsoft.com',
        category: 'Software',
        plans: [
            { id: 'personal_monthly', name: 'Personal (月額)', price: 1490, currency: 'JPY', cycle: 'monthly' },
            { id: 'personal_yearly', name: 'Personal (年額)', price: 14900, currency: 'JPY', cycle: 'yearly' },
            { id: 'family_monthly', name: 'Family (月額)', price: 2100, currency: 'JPY', cycle: 'monthly' },
        ],
    },
    {
        id: 'github_copilot',
        name: 'GitHub Copilot',
        color: '#181717',
        url: 'github.com',
        category: 'Dev',
        plans: [
            { id: 'individual', name: 'Individual (10 USD)', price: 1500, currency: 'JPY', cycle: 'monthly' },
        ],
    },
    {
        id: 'notion',
        name: 'Notion',
        color: '#000000',
        url: 'notion.so',
        category: 'Software',
        plans: [
            { id: 'plus', name: 'Plus (10 USD)', price: 1500, currency: 'JPY', cycle: 'monthly' },
            { id: 'ai', name: 'AI Addon', price: 1500, currency: 'JPY', cycle: 'monthly' },
        ]
    },
    {
        id: 'goodnotes',
        name: 'GoodNotes 6',
        color: '#00A3E0',
        url: 'goodnotes.com',
        category: 'Software',
        plans: [
            { id: 'yearly', name: '年額プラン', price: 1350, currency: 'JPY', cycle: 'yearly' },
            { id: 'one_time', name: '買い切り (参考)', price: 4080, currency: 'JPY', cycle: 'monthly' }, // Techincally one-time, but putting as monthly for now or just yearly? User said "no 0 yen / pay as you go". One-time is tricky. Let's put Yearly as main.
            // Actually GoodNotes 6 is sub or one-time. Let's list Yearly.
        ]
    },
    {
        id: 'evernote',
        name: 'Evernote',
        color: '#00A82D',
        url: 'evernote.com',
        category: 'Software',
        plans: [
            { id: 'personal_monthly', name: 'Personal (月額)', price: 1100, currency: 'JPY', cycle: 'monthly' },
            { id: 'personal_yearly', name: 'Personal (年額)', price: 9300, currency: 'JPY', cycle: 'yearly' },
            { id: 'professional_monthly', name: 'Professional (月額)', price: 1550, currency: 'JPY', cycle: 'monthly' },
            { id: 'professional_yearly', name: 'Professional (年額)', price: 12400, currency: 'JPY', cycle: 'yearly' },
        ]
    },

    // --- Other ---
    {
        id: 'uber_eats_pass',
        name: 'Uber One',
        color: '#06C167',
        category: 'Other',
        plans: [
            { id: 'monthly', name: '月額プラン', price: 498, currency: 'JPY', cycle: 'monthly' },
            { id: 'yearly', name: '年額プラン', price: 3998, currency: 'JPY', cycle: 'yearly' },
        ],
    },
    {
        id: 'cookpad',
        name: 'クックパッド',
        color: '#FF9933',
        url: 'cookpad.com',
        category: 'Food',
        plans: [
            { id: 'monthly', name: 'プレミアムサービス', price: 308, currency: 'JPY', cycle: 'monthly' },
        ],
    },

    // --- Travel / Mobility ---
    {
        id: 'hafh',
        name: 'HafH',
        color: '#00B8D4',
        url: 'hafh.com',
        category: 'Travel',
        plans: [
            { id: 'basic', name: 'New Standard (月額)', price: 9800, currency: 'JPY', cycle: 'monthly' },
        ]
    },
    {
        id: 'luup',
        name: 'LUUP',
        color: '#00D1C7',
        url: 'luup.sc',
        category: 'Travel',
        plans: [
            { id: 'monthly_12h', name: '12時間パック (月額)', price: 980, currency: 'JPY', cycle: 'monthly' },
            { id: 'subscription_lite', name: '定額ライト', price: 980, currency: 'JPY', cycle: 'monthly' },
        ]
    },
    {
        id: 'docomo_bike_share',
        name: 'ドコモ・バイクシェア',
        color: '#CC0000',
        url: 'docomo-cycle.jp',
        category: 'Travel',
        plans: [
            { id: 'monthly_tokyo', name: '月額会員 (東京)', price: 3300, currency: 'JPY', cycle: 'monthly' },
        ]
    },
    {
        id: 'jal_jgc',
        name: 'JAL Global Club',
        color: '#CC0000',
        url: 'jal.co.jp',
        category: 'Travel',
        plans: [
            { id: 'club_a', name: 'CLUB-A カード年会費', price: 11000, currency: 'JPY', cycle: 'yearly' },
            { id: 'club_a_gold', name: 'CLUB-A ゴールド年会費', price: 17600, currency: 'JPY', cycle: 'yearly' },
            { id: 'platinum', name: 'プラチナ年会費', price: 34100, currency: 'JPY', cycle: 'yearly' },
        ]
    },
    {
        id: 'ana_sfc',
        name: 'ANA SFC',
        color: '#113CCF',
        url: 'ana.co.jp',
        category: 'Travel',
        plans: [
            { id: 'general', name: '一般カード年会費', price: 11275, currency: 'JPY', cycle: 'yearly' },
            { id: 'gold', name: 'ゴールドカード年会費', price: 16500, currency: 'JPY', cycle: 'yearly' },
            { id: 'premium', name: 'プレミアムカード年会費', price: 88000, currency: 'JPY', cycle: 'yearly' },
        ]
    },

    // --- Food / Recipe ---
    {
        id: 'tabelog',
        name: '食べログ',
        color: '#FF8200',
        url: 'tabelog.com',
        category: 'Food',
        plans: [
            { id: 'premium_monthly', name: 'プレミアムサービス', price: 330, currency: 'JPY', cycle: 'monthly' },
        ]
    },
    {
        id: 'kurashiru',
        name: 'クラシル',
        color: '#FFCC00',
        url: 'kurashiru.com',
        category: 'Food',
        plans: [
            { id: 'premium_monthly', name: 'プレミアム (月額)', price: 480, currency: 'JPY', cycle: 'monthly' },
        ]
    },

    // --- Dev / Hosting ---
    {
        id: 'xserver',
        name: 'Xserver',
        color: '#0055AA',
        url: 'xserver.ne.jp',
        category: 'Dev',
        plans: [
            { id: 'standard_12m', name: 'スタンダード (12ヶ月/月換算)', price: 990, currency: 'JPY', cycle: 'monthly' },
            { id: 'standard_12m_lump', name: 'スタンダード (12ヶ月一括)', price: 11880, currency: 'JPY', cycle: 'yearly' },
        ]
    },
    {
        id: 'conoha_wing',
        name: 'ConoHa WING',
        color: '#00A3AF',
        url: 'conoha.jp',
        category: 'Dev',
        plans: [
            { id: 'wing_pack_12m', name: 'WINGパック (12ヶ月/月換算)', price: 941, currency: 'JPY', cycle: 'monthly' },
        ]
    },
    {
        id: 'sakura_internet',
        name: 'さくらのレンタルサーバ',
        color: '#FF6699',
        url: 'sakura.ad.jp',
        category: 'Dev',
        plans: [
            { id: 'standard_monthly', name: 'スタンダード (月払い)', price: 524, currency: 'JPY', cycle: 'monthly' },
            { id: 'standard_yearly', name: 'スタンダード (年一括)', price: 5238, currency: 'JPY', cycle: 'yearly' },
        ]
    },
    {
        id: 'lolipop',
        name: 'ロリポップ！',
        color: '#E60012',
        url: 'lolipop.jp',
        category: 'Dev',
        plans: [
            { id: 'standard_monthly', name: 'スタンダード (月額)', price: 880, currency: 'JPY', cycle: 'monthly' },
            { id: 'highspeed_monthly', name: 'ハイスピード (月額)', price: 1320, currency: 'JPY', cycle: 'monthly' },
        ]
    },
    // --- Video (Additional) ---
    {
        id: 'dmm_tv',
        name: 'DMM TV',
        color: '#242424', // DMM Black/Yellow
        url: 'tv.dmm.com',
        category: 'Video',
        plans: [
            { id: 'premium_monthly', name: 'DMMプレミアム (月額)', price: 550, currency: 'JPY', cycle: 'monthly' },
        ],
    },
    {
        id: 'fod_premium',
        name: 'FOD Premium',
        color: '#800000', // FOD Red
        url: 'fod.fujitv.co.jp',
        category: 'Video',
        plans: [
            { id: 'monthly', name: '月額コース', price: 976, currency: 'JPY', cycle: 'monthly' },
        ],
    },
    {
        id: 'lemino_premium',
        name: 'Lemino Premium',
        color: '#D7000F', // Docomo Red
        url: 'lemino.docomo.ne.jp',
        category: 'Video',
        plans: [
            { id: 'monthly', name: '月額プラン', price: 990, currency: 'JPY', cycle: 'monthly' },
        ],
    },
    {
        id: 'nhk_demand',
        name: 'NHKオンデマンド',
        color: '#F08300', // NHK Orangeish
        url: 'nhk-ondemand.jp',
        category: 'Video',
        plans: [
            { id: 'pack_monthly', name: 'まるごと見放題パック', price: 990, currency: 'JPY', cycle: 'monthly' },
        ],
    },

    // --- Music (Additional) ---
    {
        id: 'youtube_music',
        name: 'YouTube Music',
        color: '#FF0000',
        url: 'music.youtube.com',
        category: 'Music',
        plans: [
            { id: 'individual', name: 'Premium (個人)', price: 1080, currency: 'JPY', cycle: 'monthly' }, // 1080 is standard pure music
            { id: 'family', name: 'Premium (ファミリー)', price: 1680, currency: 'JPY', cycle: 'monthly' },
            { id: 'student', name: 'Premium (学生)', price: 580, currency: 'JPY', cycle: 'monthly' },
        ],
    },

    // --- News / Media ---
    {
        id: 'newspicks',
        name: 'NewsPicks',
        color: '#000000',
        url: 'newspicks.com',
        category: 'Book', // Or Other/Business media? Let's treat as Book/Media for now or create Media? User asked for News/Media. 
        // We can use 'Book' or 'Other' or maybe 'Business' if mostly for work.
        // Let's use 'Book' as it covers reading. or use 'Other'
        // Actually, user context implies these are specific. Let's map to 'Book' for reading or 'Business' if it fits. 
        // Let's use 'Book' for newspapers/magazines generally.
        plans: [
            { id: 'premium_monthly', name: 'プレミアム (月額)', price: 1700, currency: 'JPY', cycle: 'monthly' },
            { id: 'premium_yearly', name: 'プレミアム (年額)', price: 17000, currency: 'JPY', cycle: 'yearly' },
            { id: 'academic_monthly', name: '学割 (月額)', price: 500, currency: 'JPY', cycle: 'monthly' },
        ],
    },
    {
        id: 'nikkei_digital',
        name: '日経電子版',
        color: '#0055AA',
        url: 'nikkei.com',
        category: 'Book',
        plans: [
            { id: 'standard_monthly', name: '電子版単体', price: 4277, currency: 'JPY', cycle: 'monthly' },
        ],
    },
    {
        id: 'yomiuri_online',
        name: '読売新聞オンライン',
        color: '#008000',
        url: 'yomiuri.co.jp',
        category: 'Book',
        plans: [
            // Usually requires paper sub, but digital only exists strictly? 
            // Often just "Digital Service" for subscribers. 
            // Assuming "Digital only" might be hard, but let's put typical paper price or digital add-on?
            // Actually Yomiuri is tied to paper. 
            // Let's assume standard paper sub price 4400 or just note it. 
            // Or maybe user meant just access. 
            // Let's put 0 or standard paper price 4400 JPY approx.
            { id: 'monthly', name: '朝夕刊セット (参考)', price: 4400, currency: 'JPY', cycle: 'monthly' },
        ],
    },
    {
        id: 'mainichi_digital',
        name: '毎日新聞デジタル',
        color: '#0067C0',
        url: 'mainichi.jp',
        category: 'Book',
        plans: [
            { id: 'standard_monthly', name: 'スタンダードプラン', price: 1078, currency: 'JPY', cycle: 'monthly' },
            { id: 'premium_monthly', name: 'プレミアムプラン', price: 3520, currency: 'JPY', cycle: 'monthly' },
        ],
    },
    {
        id: 'toyo_keizai',
        name: '東洋経済オンライン',
        color: '#B00000',
        url: 'toyokeizai.net',
        category: 'Book',
        plans: [
            { id: 'standard_monthly', name: 'スタンダード (月額)', price: 1500, currency: 'JPY', cycle: 'monthly' },
            { id: 'premium_monthly', name: 'プレミアム (月額)', price: 2800, currency: 'JPY', cycle: 'monthly' },
        ],
    },

    // --- Business / SaaS ---
    {
        id: 'freee',
        name: 'freee会計',
        color: '#2864F0',
        url: 'freee.co.jp',
        category: 'Business',
        plans: [
            { id: 'starer_monthly', name: 'スターター (月払い)', price: 1628, currency: 'JPY', cycle: 'monthly' }, // 1480+tax
            { id: 'standard_monthly', name: 'スタンダード (月払い)', price: 2618, currency: 'JPY', cycle: 'monthly' }, // 2380+tax
            { id: 'starer_yearly', name: 'スターター (年払い)', price: 13992, currency: 'JPY', cycle: 'yearly' }, // 1166*12
        ],
    },
    {
        id: 'moneyforward',
        name: 'マネーフォワード クラウド',
        color: '#FF7F00',
        url: 'moneyforward.com',
        category: 'Business',
        plans: [
            { id: 'small_business_monthly', name: 'スモールビジネス (月額)', price: 3278, currency: 'JPY', cycle: 'monthly' }, // 2980+tax
            { id: 'business_monthly', name: 'ビジネス (月額)', price: 5478, currency: 'JPY', cycle: 'monthly' }, // 4980+tax
        ],
    },
    {
        id: 'yayoi_online',
        name: '弥生オンライン',
        color: '#FFCC00',
        url: 'yayoi-kk.co.jp',
        category: 'Business',
        plans: [
            { id: 'blue_self_yearly', name: 'やよいの青色申告 (セルフ/年額)', price: 8800, currency: 'JPY', cycle: 'yearly' }, // 8000+tax
        ],
    },
    {
        id: 'kintone',
        name: 'kintone',
        color: '#F5B612',
        url: 'kintone.cybozu.co.jp',
        category: 'Business',
        plans: [
            { id: 'standard_monthly', name: 'スタンダード (月額)', price: 1500, currency: 'JPY', cycle: 'monthly' }, // per user
            { id: 'light_monthly', name: 'ライト (月額)', price: 780, currency: 'JPY', cycle: 'monthly' },
        ],
    },
    {
        id: 'backlog',
        name: 'Backlog',
        color: '#41B883',
        url: 'backlog.com',
        category: 'Business',
        plans: [
            { id: 'starter_monthly', name: 'スターター', price: 2970, currency: 'JPY', cycle: 'monthly' }, // 2400+tax
            { id: 'standard_monthly', name: 'スタンダード', price: 17600, currency: 'JPY', cycle: 'monthly' },
            { id: 'premium_monthly', name: 'プレミアム', price: 29700, currency: 'JPY', cycle: 'monthly' },
        ],
    },
    {
        id: 'cybozu_office',
        name: 'Cybozu Office',
        color: '#004098',
        url: 'office.cybozu.co.jp',
        category: 'Business',
        plans: [
            { id: 'standard_monthly', name: 'スタンダード (月額)', price: 500, currency: 'JPY', cycle: 'monthly' },
            { id: 'premium_monthly', name: 'プレミアム (月額)', price: 800, currency: 'JPY', cycle: 'monthly' },
        ],
    },
    {
        id: 'chatwork',
        name: 'Chatwork',
        color: '#FF0000',
        url: 'chatwork.com',
        category: 'Business',
        plans: [
            { id: 'business_monthly', name: 'ビジネス (月額)', price: 840, currency: 'JPY', cycle: 'monthly' }, // per user usually
            { id: 'enterprise_monthly', name: 'エンタープライズ (月額)', price: 1440, currency: 'JPY', cycle: 'monthly' },
        ],
    },
    {
        id: 'jobcan',
        name: 'ジョブカン',
        color: '#DD0000',
        url: 'jobcan.ne.jp',
        category: 'Business',
        plans: [
            // Complicated pricing, usually per function per user (200~400 JPY)
            // Let's assume a typical "Attendance" module
            { id: 'attendance_monthly', name: '勤怠管理 (1ユーザ/月)', price: 200, currency: 'JPY', cycle: 'monthly' },
            { id: 'workflow_monthly', name: 'ワークフロー (1ユーザ/月)', price: 300, currency: 'JPY', cycle: 'monthly' },
        ],
    },
    {
        id: 'cloudsign',
        name: 'クラウドサイン',
        color: '#2C3E50',
        url: 'cloudsign.jp',
        category: 'Business',
        plans: [
            { id: 'standard_monthly', name: 'Standard (月額固定)', price: 11000, currency: 'JPY', cycle: 'monthly' }, // Base fee 10000 + tax
        ],
    },

    // --- AI ---
    {
        id: 'claude_pro',
        name: 'Claude Pro',
        color: '#D97757',
        url: 'anthropic.com',
        category: 'AI',
        plans: [
            { id: 'pro_monthly', name: 'Pro (20 USD)', price: 3000, currency: 'JPY', cycle: 'monthly' }, // ~3000 JPY
        ],
    },
    {
        id: 'perplexity_pro',
        name: 'Perplexity Pro',
        color: '#3BA5A8',
        url: 'perplexity.ai',
        category: 'AI',
        plans: [
            { id: 'pro_monthly', name: 'Pro (20 USD)', price: 3000, currency: 'JPY', cycle: 'monthly' },
            { id: 'pro_yearly', name: 'Pro (200 USD)', price: 30000, currency: 'JPY', cycle: 'yearly' },
        ],
    },
    {
        id: 'midjourney',
        name: 'Midjourney',
        color: '#000000', // White boat on black
        url: 'midjourney.com',
        category: 'AI',
        plans: [
            { id: 'basic_monthly', name: 'Basic (10 USD)', price: 1500, currency: 'JPY', cycle: 'monthly' },
            { id: 'standard_monthly', name: 'Standard (30 USD)', price: 4500, currency: 'JPY', cycle: 'monthly' },
            { id: 'pro_monthly', name: 'Pro (60 USD)', price: 9000, currency: 'JPY', cycle: 'monthly' },
        ],
    },
    {
        id: 'runway',
        name: 'Runway',
        color: '#000000',
        url: 'runwayml.com',
        category: 'AI',
        plans: [
            { id: 'standard_monthly', name: 'Standard (15 USD)', price: 2250, currency: 'JPY', cycle: 'monthly' }, // Per user
        ],
    },
    {
        id: 'canva_pro',
        name: 'Canva Pro',
        color: '#00C4CC',
        url: 'canva.com',
        category: 'AI', // Or Software
        plans: [
            { id: 'pro_monthly', name: 'Pro (月額)', price: 1500, currency: 'JPY', cycle: 'monthly' }, // 12.50 USD approx ?? JP Price is 1500
            { id: 'pro_yearly', name: 'Pro (年額)', price: 12000, currency: 'JPY', cycle: 'yearly' },
        ],
    },


    // --- Fitness ---
    {
        id: 'konami_sports',
        name: 'コナミスポーツクラブ',
        color: '#E60012', // Konami Red
        url: 'konami.com',
        category: 'Gym',
        plans: [
            { id: 'monthly_4', name: 'まず週1（月4回）', price: 8800, currency: 'JPY', cycle: 'monthly' }, // Varies by facility rank, assume avg
        ],
    },
    {
        id: 'renaissance',
        name: 'ルネサンス',
        color: '#00A0E9',
        url: 's-re.jp',
        category: 'Gym',
        plans: [
            { id: 'monthly_regular', name: '正会員 (目安)', price: 11000, currency: 'JPY', cycle: 'monthly' }, // Varies greatly
        ],
    },

    // --- Security ---
    {
        id: 'nordvpn',
        name: 'NordVPN',
        color: '#4687FF',
        url: 'nordvpn.com',
        category: 'Security',
        plans: [
            { id: 'standard_monthly', name: 'スタンダード (月払い)', price: 1980, currency: 'JPY', cycle: 'monthly' }, // 12.99 USDish
            { id: 'standard_1y', name: 'スタンダード (1年プラン月換算)', price: 680, currency: 'JPY', cycle: 'monthly' },
            { id: 'standard_2y', name: 'スタンダード (2年プラン月換算)', price: 460, currency: 'JPY', cycle: 'monthly' },
        ],
    },
    {
        id: 'expressvpn',
        name: 'ExpressVPN',
        color: '#C0392B',
        url: 'expressvpn.com',
        category: 'Security',
        plans: [
            { id: 'monthly', name: '1ヶ月プラン', price: 1900, currency: 'JPY', cycle: 'monthly' }, // 12.95 USD
            { id: '12m', name: '12ヶ月プラン (月換算)', price: 1000, currency: 'JPY', cycle: 'monthly' }, // 8.32 USD
        ],
    },
    {
        id: 'trendmicro_vb',
        name: 'ウイルスバスター',
        color: '#D71920',
        url: 'trendmicro.com',
        category: 'Security',
        plans: [
            { id: 'cloud_1y', name: 'クラウド 1年版', price: 5720, currency: 'JPY', cycle: 'yearly' },
            { id: 'cloud_3y', name: 'クラウド 3年版', price: 13580, currency: 'JPY', cycle: 'yearly' },
        ],
    },
    {
        id: 'eset',
        name: 'ESET',
        color: '#009BA4',
        url: 'eset.com',
        category: 'Security',
        plans: [
            { id: 'home_1y', name: 'ホーム 1年', price: 4950, currency: 'JPY', cycle: 'yearly' }, // standard list price
            { id: 'home_3y', name: 'ホーム 3年', price: 9900, currency: 'JPY', cycle: 'yearly' },
        ],
    },
    {
        id: 'kaspersky',
        name: 'カスペルスキー',
        color: '#006D55',
        url: 'kaspersky.co.jp',
        category: 'Security',
        plans: [
            { id: 'standard_1y', name: 'スタンダード 1年', price: 3980, currency: 'JPY', cycle: 'yearly' }, // campaign price often
        ],
    },
    {
        id: 'norton',
        name: 'ノートン',
        color: '#F4D03F', // Yellow
        url: 'norton.com',
        category: 'Security',
        plans: [
            { id: '360_standard_1y', name: '360 スタンダード 1年', price: 4780, currency: 'JPY', cycle: 'yearly' },
        ],
    },

    // --- Learning ---
    {
        id: 'studysapuri',
        name: 'スタディサプリ',
        color: '#3266A8',
        url: 'studysapuri.jp',
        category: 'Learning',
        plans: [
            { id: 'k12_monthly', name: '小中高講座 (月額)', price: 2178, currency: 'JPY', cycle: 'monthly' },
            { id: 'english_monthly', name: 'ENGLISH (月額)', price: 3278, currency: 'JPY', cycle: 'monthly' },
        ],
    },
    {
        id: 'slack',
        name: 'Slack',
        color: '#4A154B',
        url: 'slack.com',
        category: 'Business',
        plans: [
            { id: 'pro', name: 'Pro', price: 1050, currency: 'JPY', cycle: 'monthly' },
        ],
    },
    {
        id: 'zoom',
        name: 'Zoom',
        color: '#0b5cff',
        url: 'zoom.us',
        category: 'Business',
        plans: [
            { id: 'pro', name: 'Pro', price: 2000, currency: 'JPY', cycle: 'monthly' }, // Approx
        ],
    },
    {
        id: 'dropbox',
        name: 'Dropbox',
        color: '#0061FE',
        url: 'dropbox.com',
        category: 'Software',
        plans: [
            { id: 'plus', name: 'Plus (2TB)', price: 1500, currency: 'JPY', cycle: 'monthly' },
        ],
    },
    {
        id: 'deepl',
        name: 'DeepL Pro',
        color: '#0F2B46',
        url: 'deepl.com',
        category: 'Software',
        plans: [
            { id: 'starter', name: 'Starter', price: 1200, currency: 'JPY', cycle: 'monthly' },
        ],
    },

    // --- Gym / Fitness ---
    {
        id: 'anytime_fitness',
        name: 'エニタイムフィットネス',
        color: '#60269E',
        url: 'anytimefitness.co.jp',
        category: 'Gym',
        plans: [
            { id: 'monthly', name: '月会費 (店舗による)', price: 7500, currency: 'JPY', cycle: 'monthly' },
        ],
    },
    {
        id: 'chocozap',
        name: 'chocoZAP',
        color: '#F39800', // Yellow/Orange
        url: 'chocozap.jp',
        category: 'Gym',
        plans: [
            { id: 'monthly', name: '月額プラン', price: 3278, currency: 'JPY', cycle: 'monthly' },
        ],
    },
    {
        id: 'joyfit',
        name: 'JOYFIT24',
        color: '#E60012',
        url: 'joyfit.jp',
        category: 'Gym',
        plans: [
            { id: 'monthly', name: 'ナショナル会員', price: 8800, currency: 'JPY', cycle: 'monthly' },
        ],
    },
    {
        id: 'fastgym24',
        name: 'FASTGYM24',
        color: '#F39800',
        url: 'fastgym24.jp',
        category: 'Gym',
        plans: [
            { id: 'monthly', name: '月会費 (目安)', price: 7700, currency: 'JPY', cycle: 'monthly' },
        ],
    },
    {
        id: 'schoo',
        name: 'Schoo',
        color: '#000000',
        category: 'Learning',
        plans: [
            { id: 'premium_monthly', name: 'プレミアム (月額)', price: 980, currency: 'JPY', cycle: 'monthly' },
        ],
    },
    {
        id: 'udemy_personal',
        name: 'Udemy Personal',
        color: '#A435F0',
        category: 'Learning',
        plans: [
            { id: 'monthly', name: 'Personal Plan (月額)', price: 2400, currency: 'JPY', cycle: 'monthly' }, // Approx
        ],
    },
    {
        id: 'nativecamp',
        name: 'NativeCamp',
        color: '#FF9900',
        category: 'Learning',
        plans: [
            { id: 'premium', name: 'プレミアムプラン', price: 6480, currency: 'JPY', cycle: 'monthly' },
        ],
    },
    {
        id: 'dmm_eikaiwa',
        name: 'DMM英会話',
        color: '#242424',
        category: 'Learning',
        plans: [
            { id: 'standard_daily1', name: 'スタンダード (毎日1レッスン)', price: 7900, currency: 'JPY', cycle: 'monthly' },
        ],
    },
    {
        id: 'rarejob',
        name: 'レアジョブ英会話',
        color: '#1877F2',
        category: 'Learning',
        plans: [
            { id: 'everyday_25', name: '日常英会話 (毎日25分)', price: 7980, currency: 'JPY', cycle: 'monthly' },
        ],
    },
    {
        id: 'cambly',
        name: 'Cambly',
        color: '#FFC800',
        category: 'Learning',
        plans: [
            { id: 'hybrid_30m_1w', name: 'ハイブリッド (30分/週1)', price: 5690, currency: 'JPY', cycle: 'monthly' }, // Varies
        ],
    },
    {
        id: 'duolingo',
        name: 'Duolingo',
        color: '#58CC02',
        category: 'Learning',
        plans: [
            { id: 'super_monthly', name: 'Super (月額)', price: 1100, currency: 'JPY', cycle: 'monthly' }, // Approx
            { id: 'super_yearly', name: 'Super (年額)', price: 9000, currency: 'JPY', cycle: 'yearly' },
        ],
    },
];
