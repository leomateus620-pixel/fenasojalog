import { describe, expect, it } from 'vitest';
import {
  labelBelongsToActiveMode,
  requiresSolidRendering,
  resolveGateAccessMode,
  resolveMarkerPresentationLift,
  resolveMapLabelMode,
} from '@/features/commercial-map/utils/mapPresentation';

describe('modelo de apresentação do mapa comercial', () => {
  it('mantém a navegação com múltiplos rótulos e torna o foco exclusivo', () => {
    const navigation = resolveMapLabelMode(null);
    expect(navigation).toEqual({ kind: 'navigation' });
    expect(labelBelongsToActiveMode(navigation, 'entity:a')).toBe(true);
    expect(labelBelongsToActiveMode(navigation, 'entity:b')).toBe(true);

    const focus = resolveMapLabelMode('entity:selected');
    expect(focus).toEqual({ kind: 'focus', selectedEntityId: 'entity:selected' });
    expect(labelBelongsToActiveMode(focus, 'entity:selected')).toBe(true);
    expect(labelBelongsToActiveMode(focus, 'entity:neighbour')).toBe(false);
  });

  it('deriva a iconografia de entrada e saída a partir da descrição oficial', () => {
    expect(resolveGateAccessMode('Portão 1 — entrada de veículos')).toBe('entry');
    expect(resolveGateAccessMode('Portão 5 — saída de visitantes')).toBe('exit');
    expect(resolveGateAccessMode('Portão 10 — entrada e saída de visitantes')).toBe('bidirectional');
    expect(resolveGateAccessMode('Acesso de serviço')).toBe('access');
  });

  it('reserva blending apenas para superfícies que podem ser atenuadas com segurança', () => {
    expect(requiresSolidRendering('PAVILION')).toBe(true);
    expect(requiresSolidRendering('GATE')).toBe(true);
    expect(requiresSolidRendering('RESTROOM')).toBe(true);
    expect(requiresSolidRendering('SELLABLE_LOT')).toBe(false);
    expect(requiresSolidRendering('ROAD')).toBe(false);
  });

  it('eleva somente marcadores sanitários acima de estruturas sem deslocar sua coordenada', () => {
    expect(resolveMarkerPresentationLift('RESTROOM')).toBeGreaterThan(1);
    expect(resolveMarkerPresentationLift('CHEMICAL_RESTROOM')).toBeGreaterThan(1);
    expect(resolveMarkerPresentationLift('PAVILION')).toBe(0);
    expect(resolveMarkerPresentationLift('GATE')).toBe(0);
  });
});
