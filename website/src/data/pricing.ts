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
  description: 'A one-off look at a recent month of orders.',
  cta: 'Start free',
  features: [
  '1 analysis per month',
  'Up to 500 orders per upload',
  '2 courier report formats',
  'Summary dashboard',
  'CSV export']

},
{
  id: 'growth',
  name: 'Growth',
  price: 'PKR 3,500',
  description: 'For stores shipping daily across several couriers.',
  cta: 'Choose Growth',
  featured: true,
  features: [
  'Up to 5,000 orders per month',
  'Unlimited uploads',
  'All supported courier formats',
  'Settlement tracking & overdue alerts',
  'Evidence-backed PDF & CSV reports',
  'Email support']

},
{
  id: 'business',
  name: 'Business',
  price: 'PKR 7,500',
  description: 'For high-volume brands with a finance team.',
  cta: 'Talk to us',
  features: [
  'Up to 25,000 orders per month',
  'Everything in Growth',
  '5 team members with review roles',
  'AI investigation assistant',
  'Scheduled reports & alerts',
  'Full audit trail & priority support']

}];