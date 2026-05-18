export const calcularMedia = (datos: number[]): number => {
  if (datos.length === 0) return 0;
  const sum = datos.reduce((a, b) => a + b, 0);
  return sum / datos.length;
};

export const calcularMediana = (datos: number[]): number => {
  if (datos.length === 0) return 0;
  const sorted = [...datos].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

export const calcularDesviacionEstandar = (datos: number[], media?: number): number => {
  if (datos.length === 0) return 0;
  const avg = media !== undefined ? media : calcularMedia(datos);
  const variance = datos.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) / datos.length;
  return Math.sqrt(variance);
};

export const calcularMinimo = (datos: number[]): number => {
  if (datos.length === 0) return 0;
  return Math.min(...datos);
};

export const calcularMaximo = (datos: number[]): number => {
  if (datos.length === 0) return 0;
  return Math.max(...datos);
};
