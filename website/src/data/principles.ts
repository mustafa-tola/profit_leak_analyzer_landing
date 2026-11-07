export type PrincipleIcon = 'source' | 'provisional' | 'precision' | 'privacy';

export type Principle = {icon: PrincipleIcon;title: string;description: string;};

export const principles: Principle[] = [
{
  icon: 'source',
  title: 'Every number shows its source',
  description: 'Each finding cites the rule applied and the exact upload rows behind it.'
},
{
  icon: 'provisional',
  title: 'Provisional until proven',
  description: 'Missing fees or settlement terms keep results provisional — never auto-labeled as losses.'
},
{
  icon: 'precision',
  title: 'PKR-precise calculations',
  description: 'Decimal arithmetic to the paisa, reproducible every time you re-run an analysis.'
},
{
  icon: 'privacy',
  title: 'Your data stays yours',
  description: 'The planned product is designed around merchant-isolated storage, encrypted transfer and masked customer details.'
}];