export const formatINR = (amount: number): string => {
  return `₹${amount.toLocaleString('en-IN')}`;
};

export const formatCurrency = (amount: number, currency: string = 'INR'): string => {
  if (currency === 'INR') {
    return formatINR(amount);
  }
  return `${amount.toLocaleString()}`;
};