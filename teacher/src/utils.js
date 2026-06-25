// Shared UI helpers
export function fmtDate(iso) {
  if (!iso) return '';
  const d = iso.split('T')[0]; // "2026-06-12"
  const parts = d.split('-');
  if (parts.length !== 3) return iso;
  return parseInt(parts[1]) + '月' + parseInt(parts[2]) + '日';
}
