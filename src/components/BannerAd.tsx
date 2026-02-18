import React from 'react';

interface BannerAdProps {
    slot?: string; // Future use for AdSense slot ID
    format?: 'auto' | 'rectangle';
    className?: string;
}

const BannerAd: React.FC<BannerAdProps> = ({ className = '' }) => {
    return (
        <div className={`w-full bg-muted/50 border border-border border-dashed rounded-lg p-4 flex flex-col items-center justify-center text-center overflow-hidden my-4 ${className}`}>
            <span className="text-xs font-bold text-muted-foreground/50 tracking-widest uppercase mb-1">Advertisement</span>
            <div className="w-full h-12 bg-muted/50 rounded flex items-center justify-center">
                <span className="text-[10px] text-muted-foreground/40">Ad Space</span>
            </div>
            {/* 
                TODO: Replace this component's content with actual AdSense code later.
                Example:
                <ins className="adsbygoogle"
                     style={{ display: 'block' }}
                     data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
                     data-ad-slot="1234567890"
                     data-ad-format="auto"
                     data-full-width-responsive="true"></ins>
            */}
        </div>
    );
};

export default BannerAd;
