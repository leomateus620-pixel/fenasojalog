import type { MapClassification } from '../types';

export type MapLabelMode =
  | { kind: 'navigation' }
  | { kind: 'focus'; selectedEntityId: string };

export type GateAccessMode = 'entry' | 'exit' | 'bidirectional' | 'access';

export const RESTROOM_PRESENTATION_LIFT = 1.08;

const SOLID_RENDER_CLASSIFICATIONS = new Set<MapClassification>([
  'PAVILION',
  'BUILDING',
  'ADMINISTRATION',
  'GATE',
  'RESTROOM',
  'CHEMICAL_RESTROOM',
]);

function normalize(value: string) {
  return value
    .toLocaleLowerCase('pt-BR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function resolveMapLabelMode(selectedEntityId: string | null): MapLabelMode {
  return selectedEntityId
    ? { kind: 'focus', selectedEntityId }
    : { kind: 'navigation' };
}

export function labelBelongsToActiveMode(mode: MapLabelMode, entityId: string) {
  return mode.kind === 'navigation' || mode.selectedEntityId === entityId;
}

export function resolveGateAccessMode(name: string): GateAccessMode {
  const normalized = normalize(name);
  const hasEntry = normalized.includes('entrada');
  const hasExit = normalized.includes('saida');
  if (hasEntry && hasExit) return 'bidirectional';
  if (hasEntry) return 'entry';
  if (hasExit) return 'exit';
  return 'access';
}

export function requiresSolidRendering(classification: MapClassification) {
  return SOLID_RENDER_CLASSIFICATIONS.has(classification);
}

export function resolveMarkerPresentationLift(classification: MapClassification) {
  return classification === 'RESTROOM' || classification === 'CHEMICAL_RESTROOM'
    ? RESTROOM_PRESENTATION_LIFT
    : 0;
}
