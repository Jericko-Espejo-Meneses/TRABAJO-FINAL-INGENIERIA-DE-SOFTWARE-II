export const formatMoney = (n) => `S/ ${Number(n).toFixed(2)}`;
export const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
