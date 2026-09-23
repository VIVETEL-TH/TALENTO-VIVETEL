// Tipos compartidos del expediente del trabajador.

export type Empresa = {
  id: string;
  nombre: string;
  riesgo_actividad: string | null;
};

export type Cargo = {
  id: string;
  empresa_id: string;
  nombre: string;
};

export type CentroTrabajo = {
  id: string;
  empresa_id: string;
  nombre: string;
};

export type CompetenciaCritica = {
  id: string;
  empresa_id: string;
  nombre: string;
  dias_alerta_previos: number;
};

export type Trabajador = {
  id: string;
  empresa_id: string;
  centro_trabajo_id: string | null;
  cargo_id: string | null;
  nombres: string;
  apellidos: string;
  documento: string;
  tipo_vinculacion: "directo" | "contratista";
  fecha_ingreso: string | null;
  activo: boolean;
};

export type TrabajadorCompetencia = {
  id: string;
  trabajador_id: string;
  competencia_id: string;
  fecha_obtencion: string | null;
  fecha_vencimiento: string | null;
  soporte_url: string | null;
};

export type EstadoCompetencia = "vencida" | "por_vencer" | "vigente" | "sin_registro";

export function calcularEstado(
  fechaVencimiento: string | null,
  diasAlertaPrevios: number
): EstadoCompetencia {
  if (!fechaVencimiento) return "sin_registro";
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const vencimiento = new Date(fechaVencimiento + "T00:00:00");
  const diffDias = Math.floor(
    (vencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diffDias < 0) return "vencida";
  if (diffDias <= diasAlertaPrevios) return "por_vencer";
  return "vigente";
}

export const ESTADO_LABEL: Record<EstadoCompetencia, string> = {
  vencida: "Vencida",
  por_vencer: "Por vencer",
  vigente: "Vigente",
  sin_registro: "Sin registro",
};

export const ESTADO_COLOR: Record<EstadoCompetencia, { bg: string; fg: string }> = {
  vencida: { bg: "#f8d7da", fg: "#842029" },
  por_vencer: { bg: "#fff2cc", fg: "#7a5b00" },
  vigente: { bg: "#e2efda", fg: "#1e7145" },
  sin_registro: { bg: "#e9ecef", fg: "#495057" },
};
