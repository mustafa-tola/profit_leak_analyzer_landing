export function formatPKR(amount: number): string {
  return `PKR ${amount.toLocaleString('en-US')}`;
}

export function formatPercent(part: number, total: number, digits = 1): string {
  if (total === 0) return 'N/A';
  return `${(part / total * 100).toFixed(digits)}%`;
}