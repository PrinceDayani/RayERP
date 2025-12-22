export const formatCurrency = (amount: number | undefined | null): string => {
  if (amount === undefined || amount === null) return '₹0.00';
  return `₹${amount.toFixed(2)}`;
};

export const formatNumber = (num: number | undefined | null, decimals: number = 2): string => {
  if (num === undefined || num === null) return '0.00';
  return num.toFixed(decimals);
};
