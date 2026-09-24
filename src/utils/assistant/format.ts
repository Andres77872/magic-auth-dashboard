const integer = new Intl.NumberFormat(undefined);
const compact = new Intl.NumberFormat(undefined, {
  notation: 'compact',
  maximumFractionDigits: 1,
});
const currency = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 6,
});
const compactCurrency = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 2,
});
export function formatInteger(value: number): string {
  return integer.format(value);
}
export function formatCompactInteger(value: number): string {
  return compact.format(value);
}
export function formatCurrency(value: number): string {
  return currency.format(value);
}
export function formatCompactCurrency(value: number): string {
  return compactCurrency.format(value);
}
