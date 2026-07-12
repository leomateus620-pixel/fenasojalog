import type { MapClassification } from '../types';

export const MAP_CLICK_MAX_DELTA = 6;
export const CAMERA_NAVIGATION_MIN_DELTA = 0.025;

const NON_SELECTABLE_CLASSIFICATIONS = new Set<MapClassification>(['ROAD', 'PEDESTRIAN_PATH']);

export interface SelectionFocusProfile {
  contextRatio: number;
  fitPadding: number;
  minDistanceRatio: number;
  maxDistanceRatio: number;
  minimumDirectionY: number;
}

export function isMapSelectionClick(delta: number | undefined) {
  return delta === undefined || (Number.isFinite(delta) && delta >= 0 && delta <= MAP_CLICK_MAX_DELTA);
}

export function isCameraNavigationMovement(cameraDelta: number, targetDelta: number) {
  return Math.max(cameraDelta, targetDelta) >= CAMERA_NAVIGATION_MIN_DELTA;
}

export function isSelectableMapClassification(classification: MapClassification) {
  return !NON_SELECTABLE_CLASSIFICATIONS.has(classification);
}

export function selectionFocusProfile(classification: MapClassification): SelectionFocusProfile {
  if (classification === 'SELLABLE_LOT' || classification === 'INTERNAL_STAND') {
    return { contextRatio: 0.1, fitPadding: 1.6, minDistanceRatio: 0.085, maxDistanceRatio: 0.54, minimumDirectionY: 0.5 };
  }
  if (classification === 'QUADRA') {
    return { contextRatio: 0.24, fitPadding: 1.3, minDistanceRatio: 0.12, maxDistanceRatio: 0.72, minimumDirectionY: 0.56 };
  }
  if (classification === 'PAVILION' || classification === 'BUILDING' || classification === 'ADMINISTRATION') {
    return { contextRatio: 0.18, fitPadding: 1.46, minDistanceRatio: 0.1, maxDistanceRatio: 0.62, minimumDirectionY: 0.53 };
  }
  if (['PARKING', 'EVENT_VENUE', 'LIVESTOCK_AREA', 'RURAL_EXHIBITION', 'ATTRACTION'].includes(classification)) {
    return { contextRatio: 0.26, fitPadding: 1.34, minDistanceRatio: 0.14, maxDistanceRatio: 0.76, minimumDirectionY: 0.58 };
  }
  if (['RESTAURANT', 'FOOD_AREA', 'SERVICE', 'GATE', 'RESTROOM', 'CHEMICAL_RESTROOM', 'EMERGENCY', 'SECURITY'].includes(classification)) {
    return { contextRatio: 0.14, fitPadding: 1.5, minDistanceRatio: 0.09, maxDistanceRatio: 0.58, minimumDirectionY: 0.51 };
  }
  return { contextRatio: 0.15, fitPadding: 1.45, minDistanceRatio: 0.09, maxDistanceRatio: 0.62, minimumDirectionY: 0.52 };
}
