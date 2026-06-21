// Hằng số/tiện ích dùng chung cho biểu đồ (tách riêng để Fast Refresh hoạt động).
export const COLORS = ['#4f46e5', '#059669', '#d97706', '#db2777', '#2563eb', '#7c3aed', '#0891b2', '#ea580c'];

export function getMonthLabel(ym) {
  if (!ym) return '';
  const [, m] = ym.split('-');
  return `Th${parseInt(m, 10)}`;
}
