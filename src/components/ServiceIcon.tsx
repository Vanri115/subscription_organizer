import React, { useState } from 'react';

interface ServiceIconProps {
    serviceName: string;
    serviceColor: string;
    domain?: string;
    customIcon?: string;
    className?: string;
}

const ServiceIcon: React.FC<ServiceIconProps> = ({ serviceName, serviceColor, domain, customIcon, className = "w-10 h-10" }) => {
    const [imageError, setImageError] = useState(false);

    // Use unavatar.io with fallback=false to trigger onError when no icon is found
    // instead of showing a generic default icon
    const iconUrl = customIcon || (domain ? `https://unavatar.io/${domain}?fallback=false` : null);

    if (imageError || !iconUrl) {
        return (
            <div
                className={`${className} rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0`}
                style={{ backgroundColor: serviceColor }}
            >
                {serviceName.charAt(0)}
            </div>
        );
    }

    return (
        <img
            src={iconUrl}
            alt={serviceName}
            className={`${className} rounded-full object-cover bg-white shrink-0`}
            onError={() => setImageError(true)}
        />
    );
};

export default ServiceIcon;
