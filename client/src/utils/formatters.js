export function formatCurrency(amount, currency = 'GHS') {
  return `${currency} ${Number(amount).toFixed(2)}`;
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatNumber(num) {
  return Number(num).toLocaleString();
}
