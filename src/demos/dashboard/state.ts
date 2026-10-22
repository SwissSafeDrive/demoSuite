import type { Estado, Registro } from './types';

type FourImages = readonly [string, string, string, string];

const SEED_DATA = [
  {
    inf_id: 'INF-2024-0042',
    confianza: 0.91,
    ubicacion: 'Via Lugano 14, Bellinzona',
    nota_legal: 'Art. 31 LCStr — Guida distratta',
  },
  {
    inf_id: 'INF-2024-0041',
    confianza: 0.78,
    ubicacion: 'Piazza Grande, Locarno',
    nota_legal: 'Art. 31 LCStr — Guida distratta',
  },
  {
    inf_id: 'INF-2024-0040',
    confianza: 0.85,
    ubicacion: 'Corso Elvezia 12, Lugano',
    nota_legal: 'Art. 31 LCStr — Guida distratta',
  },
  {
    inf_id: 'INF-2024-0039',
    confianza: 0.62,
    ubicacion: 'Via San Gottardo 8, Airolo',
    nota_legal: 'Art. 31 LCStr — Guida distratta',
  },
] as const;

const OFFSETS_MIN = [8, 15, 27, 45] as const;

export function seedDataset(images?: FourImages): Registro[] {
  return SEED_DATA.map((s, i) => ({
    id: i + 1,
    inf_id: s.inf_id,
    timestamp: new Date(Date.now() - OFFSETS_MIN[i] * 60_000),
    confianza: s.confianza,
    ubicacion: s.ubicacion,
    identificatore_demo: s.inf_id,
    imagen_path: images ? images[i] : null,
    estado: 'pendiente' as const,
    agente_id: null,
    fecha_decision: null,
    origen: 'simulato' as const,
    nota_legal: s.nota_legal,
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
  const nextId = Math.max(0, ...registros.map((r) => r.id)) + 1;
  const inf_id = `INF-2024-${String(nextId + 38).padStart(4, '0')}`;
  const newRegistro: Registro = {
    id: nextId,
    inf_id,
    timestamp: new Date(),
    confianza: 0.75,
    ubicacion: 'Cattura dalla telecamera',
    identificatore_demo: inf_id,
    imagen_path: imageUrl,
    estado: 'pendiente',
    agente_id: null,
    fecha_decision: null,
    origen: 'camara',
    nota_legal: 'Art. 31 LCStr — Guida distratta',
  };
  return [newRegistro, ...registros];
}
