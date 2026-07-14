
// In-memory storage for forced results
const forcedResults = new Map<string, any>();

export function setForcedResult(docenteId: number | string, tipo: string, resultado: any) {
  const key = `${docenteId}-${tipo}`;
  forcedResults.set(key, resultado);
  return { key, resultado };
}

export function getForcedResult(docenteId: number | string, tipo: string) {
  const key = `${docenteId}-${tipo}`;
  return forcedResults.get(key);
}
