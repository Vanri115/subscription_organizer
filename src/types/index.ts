export type ServiceCategory = 'Video' | 'Music' | 'Book' | 'Game' | 'Gym' | 'Salon' | 'Travel' | 'Food' | 'Dev' | 'Business' | 'AI' | 'Security' | 'Learning' | 'Software' | 'School' | 'Other';

export interface Plan {
    id: string;
    name: string;
    price: number;
    currency: string;
    cycle: BillingCycle;
}

export interface Service {
    id: string;
    name: string;
    icon?: string;
    color: string;
    url?: string;
    category: ServiceCategory;
    plans: Plan[];
}

export interface UserSubscription {
    id: string;
    serviceId: string;
    planId: string;
    customName?: string; // For custom added services
    price: number;
    currency: string;
    cycle: BillingCycle;
    startDate?: string;
    isActive: boolean; // For simulation toggling
}

export interface Servicelibrary {
    [key: string]: Service;
}
