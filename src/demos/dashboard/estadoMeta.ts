import type { Estado } from './types';

interface EstadoMeta {
  label: string;
  badgeClass: string;
}

const META: Record<Estado, EstadoMeta> = {
  pendiente:  { label: 'In attesa',     badgeClass: 'db-badge--pendiente' },
  revisado:   { label: 'Revisionato',   badgeClass: 'db-badge--revisado' },
  confirmato: { label: 'Confermato',    badgeClass: 'db-badge--confirmato' },
  descartato: { label: 'Scartato',      badgeClass: 'db-badge--descartato' },
};

export function estadoLabel(estado: Estado): string {
  return META[estado].label;
}

export function estadoBadgeClass(estado: Estado): string {
  return `db-badge ${META[estado].badgeClass}`;
}
