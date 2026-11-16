export type PlanId = 'free' | 'growth' | 'business';

export type PricingTier = {
  id: PlanId;
  name: string;
  price: string;
  description: string;
  cta: string;
  featured?: boolean;
  features: string[];
};

export const pricingTiers: PricingTier[] = [
  {
    id: 'free',
    name: 'Free',
    price: 'PKR 0',
    description: 'Run your first reconciliation and see where your COD money stands.',
    cta: 'Start free',
    features: [
      'Upload orders, shipments & settlements',
      'Expected vs verified payment summary',
      'Outstanding receivables & exceptions view',
      'Seller-scoped run history',
      'CSV export-ready results',
    ],
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 'PKR 3,500',
    description: 'For growing stores shipping daily across multiple couriers.',
    cta: 'Request Growth demo',
    featured: true,
    features: [
      'Higher monthly order volumes',
      'Unlimited reconciliation runs',
      'Settlement tracking & overdue visibility',
      'Detailed exception evidence and filters',
      'Priority onboarding support',
    ],
  },
  {
    id: 'business',
    name: 'Business',
    price: 'PKR 7,500',
    description: 'For high-volume brands and finance teams that need control and visibility.',
    cta: 'Talk to sales',
    features: [
      'Large-volume reconciliation workflows',
      'Everything in Growth',
      'Team access and review workflows',
      'Advanced reporting & audit-friendly history',
      'Dedicated support and rollout assistance',
    ],
  },
];
