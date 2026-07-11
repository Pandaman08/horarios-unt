const CATEGORIA_LABELS: Record<string, string> = {
  principal: "Principal",
  asociado: "Asociado",
  auxiliar: "Auxiliar",
  jefe_practica: "Jefe de Práctica",
};

const MODALIDAD_LABELS: Record<string, string> = {
  nombrado: "Nombrado",
  contratado: "Contratado",
};

export function formatVentanaCategoria(modalidad: string, categoria: string): string {
  const cat = CATEGORIA_LABELS[categoria] || categoria;
  const mod = MODALIDAD_LABELS[modalidad] || modalidad;
  return `${cat} ${mod}`;
}

export const DIAS_SEMANA = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export const HORAS_MAPA_CALOR = [
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
];

export function formatRangoHora(hora: string): string {
  const [h, m] = hora.split(":").map(Number);
  const finH = h + 1;
  return `${hora} - ${String(finH).padStart(2, "0")}:${String(m ?? 0).padStart(2, "0")}`;
}
