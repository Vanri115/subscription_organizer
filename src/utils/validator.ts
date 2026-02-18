export const NG_WORDS = [
    '死ね', '殺す', '馬鹿', '阿呆', 'カス', 'クズ', 'ゴミ',
    'shit', 'fuck', 'bitch', 'asshole',
    '暴力', '差別', '誹謗中傷'
];

export const containsProfanity = (text: string): boolean => {
    return NG_WORDS.some(word => text.includes(word));
};

export const validateDisplayName = (name: string): string | null => {
    if (name.length > 20) return '名前は20文字以内で入力してください';
    if (containsProfanity(name)) return '使用できない言葉が含まれています';
    return null;
};
