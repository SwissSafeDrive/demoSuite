import type { Estado, Registro } from './types';

let nextId = 5;

const SEED: Array<Omit<Registro, 'id' | 'timestamp'>> = [
  {
    inf_id: 'INF-2024-0042',
    confianza: 0.91,
    ubicacion: 'Via Lugano 14, Bellinzona',
    identificatore_demo: 'INF-2024-0042',
    imagen_path: null,
    estado: 'pendiente',
    agente_id: null,
    fecha_decision: null,
    origen: 'simulato',
    nota_legal: 'Art. 31 LCStr — Guida distratta',
  },
  {
    inf_id: 'INF-2024-0041',
    confianza: 0.78,
    ubicacion: 'Piazza Grande, Locarno',
    identificatore_demo: 'INF-2024-0041',
    imagen_path: null,
    estado: 'pendiente',
    agente_id: null,
    fecha_decision: null,
    origen: 'simulato',
    nota_legal: 'Art. 31 LCStr — Guida distratta',
  },
  {
    inf_id: 'INF-2024-0040',
    confianza: 0.85,
    ubicacion: 'Corso Elvezia 12, Lugano',
    identificatore_demo: 'INF-2024-0040',
    imagen_path: null,
    estado: 'pendiente',
    agente_id: null,
    fecha_decision: null,
    origen: 'simulato',
    nota_legal: 'Art. 31 LCStr — Guida distratta',
  },
  {
    inf_id: 'INF-2024-0039',
    confianza: 0.62,
    ubicacion: 'Via San Gottardo 8, Airolo',
    identificatore_demo: 'INF-2024-0039',
    imagen_path: null,
    estado: 'pendiente',
    agente_id: null,
    fecha_decision: null,
    origen: 'simulato',
    nota_legal: 'Art. 31 LCStr — Guida distratta',
  },
];

const OFFSETS_MIN = [8, 15, 27, 45];

export function seedDataset(): Registro[] {
  return SEED.map((s, i) => ({
    ...s,
    id: i + 1,
    timestamp: new Date(Date.now() - OFFSETS_MIN[i] * 60_000),
  }));
}

export function applyDecision(
  registros: Registro[],
  id: number,
  estado: Estado,
  agenteId: string,
): Registro[] {
  return registros.map((r) =>
    r.id === id
      ? { ...r, estado, agente_id: agenteId, fecha_decision: new Date() }
      : r,
  );
}

export function addSimulatedRegistro(
  registros: Registro[],
  imageUrl: string,
): Registro[] {
  const id = nextId++;
  const newRegistro: Registro = {
    id,
    inf_id: `INF-2024-${String(id + 38).padStart(4, '0')}`,
    timestamp: new Date(),
    confianza: 0.75 + Math.random() * 0.2,
    ubicacion: 'Cattura dalla telecamera',
    identificatore_demo: `INF-2024-${String(id + 38).padStart(4, '0')}`,
    imagen_path: imageUrl,
    estado: 'pendiente',
    agente_id: null,
    fecha_decision: null,
    origen: 'camara',
    nota_legal: 'Art. 31 LCStr — Guida distratta',
  };
  return [newRegistro, ...registros];
}
