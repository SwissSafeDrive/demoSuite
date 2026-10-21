import { describe, it, expect, beforeEach } from 'vitest';
import { seedDataset, applyDecision, addSimulatedRegistro } from './state';
import type { Registro } from './types';

describe('seedDataset', () => {
  it('returns exactly 4 Registros', () => {
    expect(seedDataset()).toHaveLength(4);
  });

  it('all records have estado pendiente', () => {
    for (const r of seedDataset()) {
      expect(r.estado).toBe('pendiente');
    }
  });

  it('all timestamps are within the last 60 minutes', () => {
    const now = Date.now();
    for (const r of seedDataset()) {
      const age = now - r.timestamp.getTime();
      expect(age).toBeGreaterThan(0);
      expect(age).toBeLessThanOrEqual(60 * 60_000);
    }
  });
});

describe('applyDecision', () => {
  let registros: Registro[];

  beforeEach(() => {
    registros = seedDataset();
  });

  it('updates the target Registro estado', () => {
    const updated = applyDecision(registros, 1, 'confirmato', 'agente-01');
    const target = updated.find((r) => r.id === 1)!;
    expect(target.estado).toBe('confirmato');
  });

  it('sets agente_id on the target Registro', () => {
    const updated = applyDecision(registros, 2, 'descartato', 'agente-02');
    const target = updated.find((r) => r.id === 2)!;
    expect(target.agente_id).toBe('agente-02');
  });

  it('sets fecha_decision to a recent date', () => {
    const before = new Date();
    const updated = applyDecision(registros, 1, 'revisado', 'agente-01');
    const after = new Date();
    const target = updated.find((r) => r.id === 1)!;
    expect(target.fecha_decision).not.toBeNull();
    expect(target.fecha_decision!.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(target.fecha_decision!.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it('leaves all other Registros unchanged', () => {
    const updated = applyDecision(registros, 1, 'confirmato', 'agente-01');
    const others = updated.filter((r) => r.id !== 1);
    const origOthers = registros.filter((r) => r.id !== 1);
    for (let i = 0; i < others.length; i++) {
      expect(others[i].estado).toBe(origOthers[i].estado);
      expect(others[i].agente_id).toBe(origOthers[i].agente_id);
    }
  });

  it('does not mutate the original array', () => {
    const original = [...registros];
    applyDecision(registros, 1, 'confirmato', 'agente-01');
    expect(registros[0].estado).toBe(original[0].estado);
  });
});

describe('addSimulatedRegistro', () => {
  let registros: Registro[];

  beforeEach(() => {
    registros = seedDataset();
  });

  it('prepends a new Registro at index 0', () => {
    const updated = addSimulatedRegistro(registros, 'blob:test');
    expect(updated).toHaveLength(registros.length + 1);
    expect(updated[0].origen).toBe('camara');
  });

  it('new Registro has the supplied imagen_path', () => {
    const updated = addSimulatedRegistro(registros, 'blob:abc123');
    expect(updated[0].imagen_path).toBe('blob:abc123');
  });

  it('new Registro has estado pendiente', () => {
    const updated = addSimulatedRegistro(registros, 'blob:test');
    expect(updated[0].estado).toBe('pendiente');
  });

  it('does not mutate the original array', () => {
    const originalLength = registros.length;
    addSimulatedRegistro(registros, 'blob:test');
    expect(registros).toHaveLength(originalLength);
  });
});
