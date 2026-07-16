// Colores institucionales y del proyecto
export const Colors = {
  PRIMARY: '#003366',
  SECONDARY: '#0055a5',
  HEADER_GREEN: '#0f766e',
  BORDER: '#cbd5e1',
  TEXT: '#1e293b',
  TEXT_LIGHT: '#64748b',
  BACKGROUND: '#f8fafc',
  WHITE: '#ffffff',
  DARK: '#1e293b',
  SUCCESS: '#0f766e',
  DANGER: '#ef4444',
  // Colores por curso (de CSS_VISUAL)
  COURSE_1: { bg: '#dbeafe', border: '#3b82f6', text: '#1d4ed8' },
  COURSE_2: { bg: '#fce7f3', border: '#ec4899', text: '#be185d' },
  COURSE_3: { bg: '#fef9c3', border: '#eab308', text: '#854d0e' },
  COURSE_4: { bg: '#dcfce7', border: '#22c55e', text: '#15803d' },
  COURSE_5: { bg: '#ede9fe', border: '#8b5cf6', text: '#6d28d9' },
  COURSE_6: { bg: '#ffedd5', border: '#f97316', text: '#c2410c' },
  COURSE_7: { bg: '#cffafe', border: '#06b6d4', text: '#0e7490' },
  COURSE_8: { bg: '#fef2f2', border: '#ef4444', text: '#b91c1c' },
  COURSE_9: { bg: '#f0fdf4', border: '#4ade80', text: '#166534' },
  COURSE_10: { bg: '#fdf4ff', border: '#d946ef', text: '#86198f' },
} as const;

export const getCourseColor = (index: number) => {
  const colors = [
    Colors.COURSE_1,
    Colors.COURSE_2,
    Colors.COURSE_3,
    Colors.COURSE_4,
    Colors.COURSE_5,
    Colors.COURSE_6,
    Colors.COURSE_7,
    Colors.COURSE_8,
    Colors.COURSE_9,
    Colors.COURSE_10,
  ];
  return colors[index % colors.length];
};
