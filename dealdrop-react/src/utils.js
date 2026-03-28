export function getTimeLeft(expiryDate) {
  const diff = expiryDate - new Date();
  if (diff <= 0) return 'Expired';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  if (h === 0 && m === 0) return `${s}s`;
  if (h === 0) return `${m}m ${s}s`;
  return `${h}h ${m}m`;
}

export function getUrgencyBadge(expiryDate) {
  const hours = (expiryDate - new Date()) / 3600000;
  if (hours < 1) return { class: 'badge-ending', label: '🔥 Ending Soon!', isUrgent: true };
  if (hours < 3) return { class: 'badge-hot', label: '⚡ Hot Deal', isUrgent: false };
  return { class: 'badge-active', label: '✅ Active', isUrgent: false };
}

export const categoryIcons = {
  Groceries: '🥬',
  Bakery: '🍞',
  Dairy: '🥛',
  Electronics: '📱',
  Clothing: '👕',
  Other: '📦',
};
