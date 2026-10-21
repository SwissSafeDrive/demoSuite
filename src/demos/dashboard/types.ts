export type Estado = 'pendiente' | 'revisado' | 'confirmato' | 'descartato';

export interface Registro {
  id: number;
  inf_id: string;
  timestamp: Date;
  confianza: number;
  ubicacion: string;
  identificatore_demo: string;
  imagen_path: string | null;
  estado: Estado;
  agente_id: string | null;
  fecha_decision: Date | null;
  origen: 'simulato' | 'camara';
  nota_legal: string;
}
