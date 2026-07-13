import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { type ThreeEvent, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useCommercialMapStore } from '../../state/useCommercialMapStore';
import type { MapEntity } from '../../types';
import { withoutClosingPoint } from '../../utils/geometry';
import { isMapSelectionClick } from '../../utils/interaction';
import {
  resolveStrategicLandmarkKind,
  strategicLandmarkBounds,
  strategicLandmarkFacingRadians,
  strategicLandmarkVisualHeight,
  type StrategicLandmarkBounds,
  type StrategicLandmarkKind,
} from '../../utils/landmarks';

const NO_RAYCAST = () => undefined;
const MAP_BACKGROUND_COLOR = new THREE.Color('#dfe8de');
const SELECTION_COLOR = '#f7d56a';
const UNIT_BOX = new THREE.BoxGeometry(1, 1, 1);
const UNIT_CYLINDER = new THREE.CylinderGeometry(0.5, 0.5, 1, 10);
const UNIT_CONE = new THREE.ConeGeometry(0.5, 1, 16);
const UNIT_SHRUB = new THREE.IcosahedronGeometry(0.5, 1);
const UNIT_PLANE = new THREE.PlaneGeometry(1, 1);
const SHARED_INVISIBLE_HIT_MATERIAL = new THREE.MeshBasicMaterial({ visible: false });
const SHARED_SELECTED_SURFACE_MATERIAL = new THREE.MeshBasicMaterial({
  color: SELECTION_COLOR,
  transparent: true,
  opacity: 0.12,
  depthWrite: false,
  toneMapped: false,
  polygonOffset: true,
  polygonOffsetFactor: -1,
  polygonOffsetUnits: -1,
});
const SHARED_HOVERED_SURFACE_MATERIAL = new THREE.MeshBasicMaterial({
  color: SELECTION_COLOR,
  transparent: true,
  opacity: 0.055,
  depthWrite: false,
  toneMapped: false,
  polygonOffset: true,
  polygonOffsetFactor: -1,
  polygonOffsetUnits: -1,
});
const SHARED_SELECTED_LINE_MATERIAL = new THREE.LineBasicMaterial({ color: '#ffe797', toneMapped: false });
const SHARED_HOVERED_LINE_MATERIAL = new THREE.LineBasicMaterial({ color: '#f0d36a', toneMapped: false });
const SHARED_GERMAN_RED_MATERIAL = new THREE.MeshStandardMaterial({ color: '#ba2c35', roughness: 0.8 });
const SHARED_GERMAN_GOLD_MATERIAL = new THREE.MeshStandardMaterial({ color: '#e5b82f', roughness: 0.82 });
const SHARED_BRAZIL_YELLOW_MATERIAL = new THREE.MeshStandardMaterial({ color: '#f1ce3f', roughness: 0.82 });
const SHARED_BRAZIL_BLUE_MATERIAL = new THREE.MeshStandardMaterial({ color: '#225aa8', roughness: 0.74 });
const SHARED_PLANTER_RED_MATERIAL = new THREE.MeshStandardMaterial({ color: '#8d3026', roughness: 0.86 });
const SHARED_INTERIOR_LIGHT_MATERIAL = new THREE.MeshStandardMaterial({
  color: '#ffe0a6',
  emissive: '#ffb45a',
  emissiveIntensity: 0.72,
  roughness: 0.66,
});

type Vector3Tuple = [number, number, number];

interface InstanceTransform {
  position: Vector3Tuple;
  scale: Vector3Tuple;
  rotation?: Vector3Tuple;
}

interface LandmarkMaterialSet {
  wall: THREE.MeshStandardMaterial;
  accent: THREE.MeshStandardMaterial;
  roof: THREE.MeshStandardMaterial;
  trim: THREE.MeshStandardMaterial;
  dark: THREE.MeshStandardMaterial;
  glass: THREE.MeshStandardMaterial;
  green: THREE.MeshStandardMaterial;
  white: THREE.MeshStandardMaterial;
  platform: THREE.MeshStandardMaterial;
  metal: THREE.MeshStandardMaterial;
}

type LandmarkPalette = Record<keyof LandmarkMaterialSet, string>;

const LANDMARK_PALETTES: Record<StrategicLandmarkKind, LandmarkPalette> = {
  'fenasoja-headquarters': {
    wall: '#353c3f',
    accent: '#9a7254',
    roof: '#aaa59d',
    trim: '#b7aa96',
    dark: '#171d1f',
    glass: '#38535d',
    green: '#386b48',
    white: '#f3f3ee',
    platform: '#77716a',
    metal: '#626969',
  },
  'german-pavilion': {
    wall: '#eee7d9',
    accent: '#b8946d',
    roof: '#a84d2f',
    trim: '#4a3329',
    dark: '#253130',
    glass: '#3f5960',
    green: '#2f6b40',
    white: '#f5f1e6',
    platform: '#9b8b74',
    metal: '#424a47',
  },
  'fenasoja-restaurant': {
    wall: '#ded2bc',
    accent: '#aa916e',
    roof: '#51473e',
    trim: '#58493f',
    dark: '#242a29',
    glass: '#43565b',
    green: '#16834d',
    white: '#f3efe4',
    platform: '#9f9585',
    metal: '#5c615d',
  },
  'sicredi-arena': {
    wall: '#d8ddd8',
    accent: '#aeb9b2',
    roof: '#efeee7',
    trim: '#0a7b4c',
    dark: '#151b1b',
    glass: '#263537',
    green: '#079255',
    white: '#f5f5ee',
    platform: '#797d75',
    metal: '#727b78',
  },
};

function material(color: string, roughness: number, metalness = 0) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness,
    depthTest: true,
    depthWrite: true,
  });
}

function useLandmarkMaterials(
  kind: StrategicLandmarkKind,
  toneDown: number,
  selected: boolean,
  hovered: boolean,
): LandmarkMaterialSet {
  const invalidate = useThree((state) => state.invalidate);
  const materials = useMemo<LandmarkMaterialSet>(() => {
    const palette = LANDMARK_PALETTES[kind];
    const result = {
      wall: material(palette.wall, 0.84),
      accent: material(palette.accent, 0.8),
      roof: material(palette.roof, 0.88),
      trim: material(palette.trim, 0.74),
      dark: material(palette.dark, 0.86),
      glass: material(palette.glass, 0.38, 0.03),
      green: material(palette.green, 0.78),
      white: material(palette.white, 0.86),
      platform: material(palette.platform, 0.94),
      metal: material(palette.metal, 0.62, 0.16),
    };
    result.white.side = THREE.DoubleSide;
    return result;
  }, [kind]);

  useEffect(() => {
    const palette = LANDMARK_PALETTES[kind];
    (Object.keys(materials) as Array<keyof LandmarkMaterialSet>).forEach((key) => {
      const item = materials[key];
      const baseColor = new THREE.Color(palette[key]);
      item.color.copy(baseColor).lerp(MAP_BACKGROUND_COLOR, THREE.MathUtils.clamp(toneDown, 0, 0.9) * 0.82);
      if (selected) item.color.lerp(new THREE.Color('#fff1bd'), 0.06);
      item.emissive.copy(baseColor);
      item.emissiveIntensity = selected ? 0.04 : hovered ? 0.012 : 0;
    });
    invalidate();
  }, [hovered, invalidate, kind, materials, selected, toneDown]);

  useEffect(() => () => {
    Object.values(materials).forEach((item) => item.dispose());
  }, [materials]);

  return materials;
}

function ScaledInstances({
  geometry = UNIT_BOX,
  material: meshMaterial,
  items,
  castShadow = false,
  receiveShadow = false,
}: {
  geometry?: THREE.BufferGeometry;
  material: THREE.Material;
  items: InstanceTransform[];
  castShadow?: boolean;
  receiveShadow?: boolean;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const object = new THREE.Object3D();
    items.forEach((item, index) => {
      object.position.set(...item.position);
      object.rotation.set(...(item.rotation ?? [0, 0, 0]));
      object.scale.set(...item.scale);
      object.updateMatrix();
      mesh.setMatrixAt(index, object.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingBox();
    mesh.computeBoundingSphere();
  }, [items]);

  useEffect(() => {
    const mesh = ref.current;
    return () => mesh?.dispose();
  }, []);

  if (items.length === 0) return null;
  return (
    <instancedMesh
      ref={ref}
      args={[geometry, meshMaterial, items.length]}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
      raycast={NO_RAYCAST}
    />
  );
}

function createLocalFootprintShape(entity: MapEntity, bounds: StrategicLandmarkBounds) {
  const outer = withoutClosingPoint(entity.geometry.coordinates[0] ?? []);
  const shape = new THREE.Shape();
  outer.forEach(([x, z], index) => {
    const localX = x - bounds.centerX;
    const localZ = z - bounds.centerZ;
    if (index === 0) shape.moveTo(localX, -localZ);
    else shape.lineTo(localX, -localZ);
  });
  entity.geometry.coordinates.slice(1).forEach((sourceRing) => {
    const hole = new THREE.Path();
    withoutClosingPoint(sourceRing).forEach(([x, z], index) => {
      const localX = x - bounds.centerX;
      const localZ = z - bounds.centerZ;
      if (index === 0) hole.moveTo(localX, -localZ);
      else hole.lineTo(localX, -localZ);
    });
    shape.holes.push(hole);
  });
  return shape;
}

function createLocalFootprintGeometry(entity: MapEntity, bounds: StrategicLandmarkBounds) {
  const geometry = new THREE.ShapeGeometry(createLocalFootprintShape(entity, bounds), 2);
  geometry.rotateX(-Math.PI / 2);
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

function createLocalHitVolumeGeometry(
  entity: MapEntity,
  bounds: StrategicLandmarkBounds,
  height: number,
) {
  const geometry = new THREE.ExtrudeGeometry(createLocalFootprintShape(entity, bounds), {
    depth: Math.max(0.2, height),
    bevelEnabled: false,
    curveSegments: 1,
    steps: 1,
  });
  geometry.rotateX(-Math.PI / 2);
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

function createLocalFootprintOutline(entity: MapEntity, bounds: StrategicLandmarkBounds) {
  const vertices: number[] = [];
  entity.geometry.coordinates.forEach((sourceRing) => {
    const ring = withoutClosingPoint(sourceRing);
    ring.forEach(([x, z], index) => {
      const [nextX, nextZ] = ring[(index + 1) % ring.length] ?? [x, z];
      vertices.push(
        x - bounds.centerX, 0.108, z - bounds.centerZ,
        nextX - bounds.centerX, 0.108, nextZ - bounds.centerZ,
      );
    });
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

function createGableBodyGeometry(width: number, depth: number, wallHeight: number, roofRise: number) {
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, 0);
  shape.lineTo(width / 2, 0);
  shape.lineTo(width / 2, wallHeight);
  shape.lineTo(0, wallHeight + roofRise);
  shape.lineTo(-width / 2, wallHeight);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: false,
    curveSegments: 1,
    steps: 1,
  });
  geometry.translate(0, 0, -depth / 2);
  geometry.computeVertexNormals();
  return geometry;
}

function createGableFacadeGeometry(width: number, rise: number) {
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, 0);
  shape.lineTo(width / 2, 0);
  shape.lineTo(0, rise);
  shape.closePath();
  const geometry = new THREE.ShapeGeometry(shape, 1);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

function createCurvedFacadeBandGeometry(
  width: number,
  height: number,
  depth: number,
  bulge: number,
) {
  const segments = 24;
  const positions: number[] = [];
  const indices: number[] = [];
  for (let index = 0; index <= segments; index += 1) {
    const ratio = index / segments;
    const normalizedX = ratio * 2 - 1;
    const x = normalizedX * width / 2;
    const curve = bulge * (1 - normalizedX * normalizedX);
    const frontZ = depth / 2 + curve;
    const backZ = frontZ - depth;
    positions.push(
      x, -height / 2, frontZ,
      x, height / 2, frontZ,
      x, -height / 2, backZ,
      x, height / 2, backZ,
    );
  }
  for (let index = 0; index < segments; index += 1) {
    const current = index * 4;
    const next = current + 4;
    const frontBottom = current;
    const frontTop = current + 1;
    const backBottom = current + 2;
    const backTop = current + 3;
    const nextFrontBottom = next;
    const nextFrontTop = next + 1;
    const nextBackBottom = next + 2;
    const nextBackTop = next + 3;
    indices.push(
      frontBottom, nextFrontBottom, nextFrontTop,
      frontBottom, nextFrontTop, frontTop,
      backBottom, backTop, nextBackTop,
      backBottom, nextBackTop, nextBackBottom,
      frontTop, nextFrontTop, nextBackTop,
      frontTop, nextBackTop, backTop,
      frontBottom, backBottom, nextBackBottom,
      frontBottom, nextBackBottom, nextFrontBottom,
    );
  }
  const last = segments * 4;
  indices.push(
    0, 1, 3, 0, 3, 2,
    last, last + 2, last + 3, last, last + 3, last + 1,
  );
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  const crispGeometry = geometry.toNonIndexed();
  geometry.dispose();
  crispGeometry.computeVertexNormals();
  crispGeometry.computeBoundingBox();
  crispGeometry.computeBoundingSphere();
  return crispGeometry;
}

function createCurvedIdentityGeometry(
  panelWidth: number,
  panelHeight: number,
  marqueeWidth: number,
  marqueeDepth: number,
  marqueeBulge: number,
) {
  const segments = 24;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  for (let index = 0; index <= segments; index += 1) {
    const ratio = index / segments;
    const x = (ratio - 0.5) * panelWidth;
    const marqueeRatio = x / (marqueeWidth / 2);
    const z = marqueeDepth / 2 + marqueeBulge * (1 - marqueeRatio * marqueeRatio) + 0.012;
    positions.push(
      x, -panelHeight / 2, z,
      x, panelHeight / 2, z,
    );
    uvs.push(ratio, 0, ratio, 1);
  }
  for (let index = 0; index < segments; index += 1) {
    const current = index * 2;
    const next = current + 2;
    indices.push(
      current, next, next + 1,
      current, next + 1, current + 1,
    );
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

function createHipRoofGeometry(width: number, depth: number, rise: number) {
  const ridgeHalf = Math.max(width * 0.08, (width - depth) * 0.42);
  const leftFront = [-width / 2, 0, depth / 2] as Vector3Tuple;
  const rightFront = [width / 2, 0, depth / 2] as Vector3Tuple;
  const rightBack = [width / 2, 0, -depth / 2] as Vector3Tuple;
  const leftBack = [-width / 2, 0, -depth / 2] as Vector3Tuple;
  const ridgeLeft = [-ridgeHalf, rise, 0] as Vector3Tuple;
  const ridgeRight = [ridgeHalf, rise, 0] as Vector3Tuple;
  const vertices = [
    leftFront, rightFront, ridgeRight, leftFront, ridgeRight, ridgeLeft,
    rightFront, rightBack, ridgeRight,
    rightBack, leftBack, ridgeLeft, rightBack, ridgeLeft, ridgeRight,
    leftBack, leftFront, ridgeLeft,
    leftBack, rightBack, rightFront, leftBack, rightFront, leftFront,
  ].flat();
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

function createArenaShellGeometry(halfWidth: number, rise: number, depth: number) {
  const segments = 32;
  const positions: number[] = [];
  const indices: number[] = [];
  for (let index = 0; index <= segments; index += 1) {
    const angle = Math.PI - index / segments * Math.PI;
    const x = Math.cos(angle) * halfWidth;
    const y = Math.sin(angle) * rise;
    positions.push(x, y, depth / 2, x, y, -depth / 2);
  }
  for (let index = 0; index < segments; index += 1) {
    const front = index * 2;
    const back = front + 1;
    const nextFront = front + 2;
    const nextBack = front + 3;
    indices.push(front, nextFront, back, nextFront, nextBack, back);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

function createArchedFacadeGeometry(halfWidth: number, rise: number) {
  const shape = new THREE.Shape();
  shape.moveTo(-halfWidth, 0);
  for (let index = 0; index <= 32; index += 1) {
    const angle = Math.PI - index / 32 * Math.PI;
    shape.lineTo(Math.cos(angle) * halfWidth, Math.sin(angle) * rise);
  }
  shape.lineTo(-halfWidth, 0);
  shape.closePath();
  const geometry = new THREE.ShapeGeometry(shape, 1);
  geometry.computeVertexNormals();
  return geometry;
}

function createEllipticalArchBandGeometry(
  halfWidth: number,
  rise: number,
  thickness: number,
) {
  const innerHalfWidth = Math.max(0.1, halfWidth - thickness);
  const innerRise = Math.max(0.1, rise - thickness * 0.82);
  const shape = new THREE.Shape();
  shape.moveTo(-halfWidth, 0);
  for (let index = 0; index <= 32; index += 1) {
    const angle = Math.PI - index / 32 * Math.PI;
    shape.lineTo(Math.cos(angle) * halfWidth, Math.sin(angle) * rise);
  }
  for (let index = 32; index >= 0; index -= 1) {
    const angle = Math.PI - index / 32 * Math.PI;
    shape.lineTo(Math.cos(angle) * innerHalfWidth, Math.sin(angle) * innerRise);
  }
  shape.closePath();
  const geometry = new THREE.ShapeGeometry(shape, 1);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

function SignagePanel({
  title,
  subtitle,
  position,
  size,
  background,
  foreground = '#ffffff',
}: {
  title: string;
  subtitle?: string;
  position: Vector3Tuple;
  size: [number, number];
  background: string;
  foreground?: string;
}) {
  const { texture, signMaterial } = useMemo(() => {
    let canvasTexture: THREE.CanvasTexture | null = null;
    if (typeof document !== 'undefined') {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 160;
      const context = canvas.getContext('2d');
      if (context) {
        context.fillStyle = background;
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = foreground;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.font = '700 58px Arial, sans-serif';
        context.fillText(title, canvas.width / 2, subtitle ? 68 : 82);
        if (subtitle) {
          context.globalAlpha = 0.86;
          context.font = '600 28px Arial, sans-serif';
          context.fillText(subtitle, canvas.width / 2, 120);
        }
        canvasTexture = new THREE.CanvasTexture(canvas);
        canvasTexture.colorSpace = THREE.SRGBColorSpace;
        canvasTexture.anisotropy = 4;
      }
    }
    return {
      texture: canvasTexture,
      signMaterial: new THREE.MeshBasicMaterial({
        color: canvasTexture ? '#ffffff' : foreground,
        map: canvasTexture,
        toneMapped: false,
      }),
    };
  }, [background, foreground, subtitle, title]);

  useEffect(() => () => {
    texture?.dispose();
    signMaterial.dispose();
  }, [signMaterial, texture]);

  return (
    <mesh
      geometry={UNIT_PLANE}
      material={signMaterial}
      position={position}
      scale={[size[0], size[1], 1]}
      raycast={NO_RAYCAST}
      dispose={null}
    />
  );
}

function HeadquartersIdentityPanel({
  position,
  width,
  height,
  marqueeWidth,
  marqueeDepth,
  marqueeBulge,
}: {
  position: Vector3Tuple;
  width: number;
  height: number;
  marqueeWidth: number;
  marqueeDepth: number;
  marqueeBulge: number;
}) {
  const identityGeometry = useMemo(
    () => createCurvedIdentityGeometry(
      width,
      height,
      marqueeWidth,
      marqueeDepth,
      marqueeBulge,
    ),
    [height, marqueeBulge, marqueeDepth, marqueeWidth, width],
  );
  const { texture, signMaterial } = useMemo(() => {
    let canvasTexture: THREE.CanvasTexture | null = null;
    if (typeof document !== 'undefined') {
      const canvas = document.createElement('canvas');
      canvas.width = 768;
      canvas.height = 192;
      const context = canvas.getContext('2d');
      if (context) {
        context.fillStyle = '#f3f3ee';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = '#30383b';
        context.textBaseline = 'middle';
        context.textAlign = 'center';
        context.font = '800 62px Arial, sans-serif';
        context.fillText('FENASOJA', 194, 96);

        context.save();
        context.beginPath();
        context.arc(390, 96, 58, 0, Math.PI * 2);
        context.clip();
        context.fillStyle = '#89c8df';
        context.fillRect(328, 34, 124, 52);
        context.fillStyle = '#df9736';
        context.fillRect(328, 82, 124, 32);
        context.fillStyle = '#4c935b';
        context.fillRect(328, 110, 124, 54);
        context.strokeStyle = '#f3f3ee';
        context.lineWidth = 10;
        context.lineCap = 'round';
        [344, 372, 400, 428].forEach((x, index) => {
          context.beginPath();
          context.moveTo(x, 166);
          context.quadraticCurveTo(x + index * 4, 116, x + 38, 82);
          context.stroke();
        });
        context.restore();
        context.strokeStyle = '#30383b';
        context.lineWidth = 3;
        context.beginPath();
        context.arc(390, 96, 58, 0, Math.PI * 2);
        context.stroke();

        context.fillStyle = '#30383b';
        context.textAlign = 'left';
        context.font = '800 42px Arial, sans-serif';
        context.fillText('Comissão', 486, 72);
        context.fillText('Central', 486, 122);
        canvasTexture = new THREE.CanvasTexture(canvas);
        canvasTexture.colorSpace = THREE.SRGBColorSpace;
        canvasTexture.anisotropy = 4;
        canvasTexture.minFilter = THREE.LinearMipmapLinearFilter;
        canvasTexture.magFilter = THREE.LinearFilter;
      }
    }
    return {
      texture: canvasTexture,
      signMaterial: new THREE.MeshBasicMaterial({
        color: canvasTexture ? '#ffffff' : '#30383b',
        map: canvasTexture,
        toneMapped: false,
      }),
    };
  }, []);

  useEffect(() => () => {
    identityGeometry.dispose();
    texture?.dispose();
    signMaterial.dispose();
  }, [identityGeometry, signMaterial, texture]);

  return (
    <mesh
      geometry={identityGeometry}
      material={signMaterial}
      position={position}
      raycast={NO_RAYCAST}
      dispose={null}
    />
  );
}

function useArchitecturalDetail(
  kind: StrategicLandmarkKind,
  bounds: StrategicLandmarkBounds,
  selected: boolean,
) {
  const reducedGraphics = useCommercialMapStore((state) => state.reducedGraphics);
  const invalidate = useThree((state) => state.invalidate);
  const [near, setNear] = useState(selected);
  const nearRef = useRef(near);
  const center = useMemo(
    () => new THREE.Vector3(bounds.centerX, 0, bounds.centerZ),
    [bounds.centerX, bounds.centerZ],
  );

  useEffect(() => {
    if (!selected || nearRef.current) return;
    nearRef.current = true;
    setNear(true);
    invalidate();
  }, [invalidate, selected]);

  useFrame(({ camera }) => {
    if (selected) return;
    const threshold = kind === 'sicredi-arena'
      ? Math.max(30, bounds.width * 3.1)
      : kind === 'fenasoja-restaurant'
        ? Math.max(20, bounds.width * 5)
        : kind === 'fenasoja-headquarters'
          ? Math.max(19, bounds.width * 6.4)
        : Math.max(18, bounds.width * 6.2);
    const distance = camera.position.distanceTo(center);
    const nextNear = distance <= threshold * (nearRef.current ? 1.12 : 1);
    if (nearRef.current === nextNear) return;
    nearRef.current = nextNear;
    setNear(nextNear);
    invalidate();
  });

  return {
    showDetail: selected || near && !reducedGraphics,
    showFocusDetail: selected && !reducedGraphics,
  };
}

function FenasojaHeadquarters({
  bounds,
  height,
  materials,
  showDetail,
  showFocusDetail,
}: LandmarkModelProps) {
  const width = bounds.width;
  const depth = bounds.depth;
  const bodyWidth = width * 0.86;
  const bodyDepth = depth * 0.67;
  const bodyZ = -depth * 0.08;
  const wallHeight = height * 0.46;
  const roofRise = height * 0.42;
  const frontZ = bodyZ + bodyDepth / 2;
  const roofPitch = Math.atan2(roofRise, bodyWidth / 2);
  const roofLength = Math.hypot(bodyWidth / 2 + width * 0.055, roofRise);
  const marqueeWidth = width * 0.92;
  const marqueeHeight = height * 0.17;
  const marqueeDepth = depth * 0.08;
  const marqueeBulge = depth * 0.075;
  const marqueeY = wallHeight * 0.74;
  const doorHeight = wallHeight * 0.59;
  const doorY = 0.11 + doorHeight / 2;
  const doorZ = frontZ + 0.078;
  const bodyGeometry = useMemo(
    () => createGableBodyGeometry(bodyWidth, bodyDepth, wallHeight, roofRise),
    [bodyDepth, bodyWidth, roofRise, wallHeight],
  );
  const gableRecess = useMemo(
    () => createGableFacadeGeometry(bodyWidth * 0.74, roofRise * 0.72),
    [bodyWidth, roofRise],
  );
  const marqueeGeometry = useMemo(
    () => createCurvedFacadeBandGeometry(
      marqueeWidth,
      marqueeHeight,
      marqueeDepth,
      marqueeBulge,
    ),
    [marqueeBulge, marqueeDepth, marqueeHeight, marqueeWidth],
  );
  const entranceGlass = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#4a6872',
    roughness: 0.28,
    metalness: 0.025,
    transparent: true,
    opacity: 0.42,
    depthTest: true,
    depthWrite: false,
    side: THREE.FrontSide,
  }), []);
  const upperWindows: InstanceTransform[] = [-0.36, -0.12, 0.12, 0.36].map((x) => ({
    position: [x * bodyWidth, wallHeight * 0.91, frontZ + 0.052] as Vector3Tuple,
    scale: [bodyWidth * 0.19, wallHeight * 0.19, 0.026] as Vector3Tuple,
  }));
  const sideWindows: InstanceTransform[] = [-0.23, 0, 0.23].flatMap((ratio) => ([
    {
      position: [-bodyWidth / 2 - 0.018, wallHeight * 0.48, bodyZ + ratio * bodyDepth] as Vector3Tuple,
      scale: [0.024, wallHeight * 0.28, bodyDepth * 0.17] as Vector3Tuple,
    },
    {
      position: [bodyWidth / 2 + 0.018, wallHeight * 0.48, bodyZ + ratio * bodyDepth] as Vector3Tuple,
      scale: [0.024, wallHeight * 0.28, bodyDepth * 0.17] as Vector3Tuple,
    },
  ]));
  const doorPanels: InstanceTransform[] = [-0.3, -0.1, 0.1, 0.3].map((x) => ({
    position: [x * bodyWidth, doorY, doorZ] as Vector3Tuple,
    scale: [bodyWidth * 0.19, doorHeight, 0.018] as Vector3Tuple,
  }));
  const facadeFrames: InstanceTransform[] = [
    ...[-0.4, -0.2, 0, 0.2, 0.4].map((x) => ({
      position: [x * bodyWidth, doorY, doorZ + 0.014] as Vector3Tuple,
      scale: [0.026, doorHeight + 0.035, 0.026] as Vector3Tuple,
    })),
    { position: [0, 0.105, doorZ + 0.014], scale: [bodyWidth * 0.82, 0.028, 0.026] },
    { position: [0, doorHeight + 0.115, doorZ + 0.014], scale: [bodyWidth * 0.82, 0.028, 0.026] },
    { position: [0, wallHeight * 0.805, frontZ + 0.068], scale: [bodyWidth * 0.82, 0.026, 0.026] },
    { position: [0, wallHeight * 1.015, frontZ + 0.068], scale: [bodyWidth * 0.82, 0.026, 0.026] },
    ...[-0.48, -0.24, 0, 0.24, 0.48].map((x) => ({
      position: [x * bodyWidth * 0.82, wallHeight * 0.91, frontZ + 0.069] as Vector3Tuple,
      scale: [0.024, wallHeight * 0.22, 0.025] as Vector3Tuple,
    })),
  ];
  const roofStructure: InstanceTransform[] = [
    { position: [-bodyWidth * 0.245, wallHeight + roofRise * 0.51, frontZ + 0.055], scale: [roofLength * 0.92, 0.045, 0.045], rotation: [0, 0, roofPitch] },
    { position: [bodyWidth * 0.245, wallHeight + roofRise * 0.51, frontZ + 0.055], scale: [roofLength * 0.92, 0.045, 0.045], rotation: [0, 0, -roofPitch] },
    { position: [0, wallHeight + roofRise * 0.13, frontZ + 0.058], scale: [bodyWidth * 0.71, 0.045, 0.045] },
    { position: [-bodyWidth * 0.18, wallHeight + roofRise * 0.31, frontZ + 0.059], scale: [bodyWidth * 0.35, 0.04, 0.04], rotation: [0, 0, 0.72] },
    { position: [bodyWidth * 0.18, wallHeight + roofRise * 0.31, frontZ + 0.059], scale: [bodyWidth * 0.35, 0.04, 0.04], rotation: [0, 0, -0.72] },
  ];
  const gablePosts = [-0.32, -0.16, 0, 0.16, 0.32].map((ratio) => {
    const x = ratio * bodyWidth;
    const postHeight = roofRise * Math.max(0.2, 0.74 - Math.abs(ratio) * 1.25);
    return {
      position: [x, wallHeight + postHeight / 2 + roofRise * 0.04, frontZ + 0.061] as Vector3Tuple,
      scale: [0.04, postHeight, 0.04] as Vector3Tuple,
    };
  });
  const paving: InstanceTransform[] = [
    { position: [0, 0.09, frontZ + depth * 0.13], scale: [width * 0.78, 0.045, depth * 0.16] },
    { position: [0, 0.075, depth * 0.44], scale: [width * 0.48, 0.035, depth * 0.2] },
  ];

  useEffect(() => () => {
    bodyGeometry.dispose();
    gableRecess.dispose();
    marqueeGeometry.dispose();
    entranceGlass.dispose();
  }, [bodyGeometry, entranceGlass, gableRecess, marqueeGeometry]);

  useEffect(() => {
    entranceGlass.opacity = showFocusDetail ? 0.28 : 0.42;
    entranceGlass.emissive.set(showFocusDetail ? '#2e454a' : '#000000');
    entranceGlass.emissiveIntensity = showFocusDetail ? 0.08 : 0;
    entranceGlass.needsUpdate = true;
  }, [entranceGlass, showFocusDetail]);

  return (
    <group dispose={null}>
      <mesh geometry={UNIT_BOX} material={materials.platform} position={[0, 0.045, 0]} scale={[width * 0.98, 0.09, depth * 0.98]} receiveShadow raycast={NO_RAYCAST} dispose={null} />
      <mesh geometry={bodyGeometry} material={materials.wall} position={[0, 0.09, bodyZ]} castShadow receiveShadow raycast={NO_RAYCAST} />
      <mesh geometry={UNIT_BOX} material={materials.dark} position={[0, wallHeight * 0.32, frontZ + 0.025]} scale={[bodyWidth * 0.84, wallHeight * 0.62, 0.028]} raycast={NO_RAYCAST} dispose={null} />
      <mesh geometry={gableRecess} material={materials.dark} position={[0, wallHeight + 0.09, frontZ + 0.026]} raycast={NO_RAYCAST} />
      <ScaledInstances material={materials.roof} castShadow receiveShadow items={[
        { position: [-bodyWidth * 0.25, wallHeight + roofRise * 0.52 + 0.09, bodyZ], scale: [roofLength, 0.095, bodyDepth + depth * 0.13], rotation: [0, 0, roofPitch] },
        { position: [bodyWidth * 0.25, wallHeight + roofRise * 0.52 + 0.09, bodyZ], scale: [roofLength, 0.095, bodyDepth + depth * 0.13], rotation: [0, 0, -roofPitch] },
      ]} />
      <ScaledInstances material={materials.trim} items={roofStructure} />
      <ScaledInstances material={materials.glass} items={upperWindows} />
      <ScaledInstances material={materials.glass} items={sideWindows} />
      <ScaledInstances material={materials.white} items={facadeFrames} />
      <mesh geometry={marqueeGeometry} material={materials.white} position={[0, marqueeY, frontZ + 0.035]} castShadow receiveShadow raycast={NO_RAYCAST} />
      <ScaledInstances geometry={UNIT_PLANE} material={entranceGlass} items={doorPanels} />
      <ScaledInstances material={materials.platform} items={paving} receiveShadow />

      {showDetail && (
        <>
          <ScaledInstances material={materials.trim} items={gablePosts} />
          <HeadquartersIdentityPanel
            position={[0, marqueeY, frontZ + 0.035]}
            width={marqueeWidth * 0.82}
            height={marqueeHeight * 0.76}
            marqueeWidth={marqueeWidth}
            marqueeDepth={marqueeDepth}
            marqueeBulge={marqueeBulge}
          />
          <ScaledInstances geometry={UNIT_CYLINDER} material={materials.metal} receiveShadow items={[
            { position: [width * 0.34, 0.15, depth * 0.37], scale: [width * 0.25, 0.19, width * 0.25] },
          ]} />
          <ScaledInstances geometry={UNIT_CYLINDER} material={SHARED_PLANTER_RED_MATERIAL} castShadow items={[
            { position: [-width * 0.36, 0.19, depth * 0.34], scale: [width * 0.12, 0.3, width * 0.12] },
            { position: [width * 0.13, 0.16, depth * 0.44], scale: [width * 0.1, 0.24, width * 0.1] },
          ]} />
          <ScaledInstances geometry={UNIT_SHRUB} material={materials.green} items={[
            { position: [width * 0.29, 0.31, depth * 0.37], scale: [width * 0.18, 0.34, width * 0.18] },
            { position: [width * 0.39, 0.34, depth * 0.37], scale: [width * 0.2, 0.4, width * 0.2] },
            { position: [-width * 0.36, 0.39, depth * 0.34], scale: [width * 0.13, 0.32, width * 0.13] },
            { position: [width * 0.13, 0.33, depth * 0.44], scale: [width * 0.11, 0.28, width * 0.11] },
          ]} />
          <ScaledInstances geometry={UNIT_CONE} material={materials.green} items={[
            { position: [-width * 0.36, 0.52, depth * 0.34], scale: [width * 0.07, 0.38, width * 0.07] },
            { position: [width * 0.14, 0.45, depth * 0.44], scale: [width * 0.06, 0.3, width * 0.06] },
          ]} />
          <ScaledInstances material={materials.trim} items={[
            { position: [-bodyWidth * 0.47, wallHeight * 0.46, frontZ + 0.11], scale: [0.045, wallHeight * 0.92, 0.045] },
            { position: [bodyWidth * 0.47, wallHeight * 0.46, frontZ + 0.11], scale: [0.045, wallHeight * 0.92, 0.045] },
          ]} castShadow />
        </>
      )}

      {showFocusDetail && (
        <>
          <mesh geometry={UNIT_BOX} material={materials.accent} position={[0, doorY, frontZ + 0.034]} scale={[bodyWidth * 0.78, doorHeight * 0.92, 0.018]} raycast={NO_RAYCAST} dispose={null} />
          <mesh geometry={UNIT_BOX} material={SHARED_INTERIOR_LIGHT_MATERIAL} position={[0, doorY * 0.92, frontZ + 0.048]} scale={[bodyWidth * 0.46, doorHeight * 0.34, 0.008]} raycast={NO_RAYCAST} dispose={null} />
          <mesh geometry={UNIT_BOX} material={materials.accent} position={[0, doorHeight * 0.22, frontZ + 0.058]} scale={[bodyWidth * 0.62, doorHeight * 0.15, 0.01]} raycast={NO_RAYCAST} dispose={null} />
          <ScaledInstances material={materials.white} items={[
            { position: [-bodyWidth * 0.23, doorY * 0.57, frontZ + 0.054], scale: [bodyWidth * 0.22, doorHeight * 0.24, 0.025] },
            { position: [bodyWidth * 0.23, doorY * 0.57, frontZ + 0.054], scale: [bodyWidth * 0.22, doorHeight * 0.24, 0.025] },
          ]} />
          <ScaledInstances material={materials.trim} items={[
            { position: [-bodyWidth * 0.23, doorY * 0.79, frontZ + 0.055], scale: [bodyWidth * 0.22, doorHeight * 0.22, 0.026] },
            { position: [bodyWidth * 0.23, doorY * 0.79, frontZ + 0.055], scale: [bodyWidth * 0.22, doorHeight * 0.22, 0.026] },
          ]} />
          <ScaledInstances geometry={UNIT_CYLINDER} material={materials.accent} items={[
            { position: [0, doorY * 0.48, frontZ + 0.061], scale: [bodyWidth * 0.2, 0.045, bodyWidth * 0.13] },
          ]} />
          <ScaledInstances material={materials.green} items={[-0.31, -0.2, -0.09].map((x, index) => ({
            position: [x * bodyWidth, doorY * (1.28 + index * 0.04), frontZ + 0.057] as Vector3Tuple,
            scale: [bodyWidth * 0.075, doorHeight * 0.2, 0.024] as Vector3Tuple,
          }))} />
          <ScaledInstances geometry={UNIT_PLANE} material={entranceGlass} items={[
            { position: [bodyWidth * 0.34, doorY, frontZ + 0.057], scale: [bodyWidth * 0.12, doorHeight * 0.62, 0.022] },
          ]} />
          <ScaledInstances material={SHARED_INTERIOR_LIGHT_MATERIAL} items={[
            { position: [-bodyWidth * 0.12, doorHeight * 0.93, frontZ + 0.059], scale: [bodyWidth * 0.17, 0.035, 0.024] },
            { position: [bodyWidth * 0.12, doorHeight * 0.93, frontZ + 0.059], scale: [bodyWidth * 0.17, 0.035, 0.024] },
          ]} />
          <ScaledInstances material={materials.metal} items={[
            { position: [-bodyWidth * 0.045, doorY, doorZ + 0.025], scale: [0.018, doorHeight * 0.32, 0.02] },
            { position: [bodyWidth * 0.045, doorY, doorZ + 0.025], scale: [0.018, doorHeight * 0.32, 0.02] },
          ]} />
        </>
      )}
    </group>
  );
}

function GermanPavilion({
  bounds,
  height,
  materials,
  showDetail,
  showFocusDetail,
}: LandmarkModelProps) {
  const width = bounds.width;
  const depth = bounds.depth;
  const bodyWidth = width * 0.84;
  const bodyDepth = depth * 0.57;
  const wallHeight = height * 0.48;
  const roofRise = height * 0.27;
  const frontZ = bodyDepth / 2;
  const porchDepth = depth * 0.27;
  const bodyGeometry = useMemo(
    () => createGableBodyGeometry(bodyWidth, bodyDepth, wallHeight, roofRise),
    [bodyDepth, bodyWidth, roofRise, wallHeight],
  );
  const roofPitch = Math.atan2(roofRise, bodyWidth / 2);
  const roofLength = Math.hypot(bodyWidth / 2 + width * 0.045, roofRise);
  const windows: InstanceTransform[] = [
    { position: [-bodyWidth * 0.31, wallHeight * 0.53, frontZ + 0.026], scale: [bodyWidth * 0.18, wallHeight * 0.36, 0.035] },
    { position: [bodyWidth * 0.31, wallHeight * 0.53, frontZ + 0.026], scale: [bodyWidth * 0.18, wallHeight * 0.36, 0.035] },
    { position: [-bodyWidth * 0.075, wallHeight * 0.42, frontZ + 0.03], scale: [bodyWidth * 0.12, wallHeight * 0.58, 0.04] },
    { position: [bodyWidth * 0.075, wallHeight * 0.42, frontZ + 0.03], scale: [bodyWidth * 0.12, wallHeight * 0.58, 0.04] },
  ];
  const frames: InstanceTransform[] = [
    ...[-0.44, -0.21, 0, 0.21, 0.44].map((x) => ({
      position: [x * bodyWidth, wallHeight * 0.57, frontZ + 0.048] as Vector3Tuple,
      scale: [0.042, wallHeight * 1.02, 0.044] as Vector3Tuple,
    })),
    { position: [0, wallHeight * 0.78, frontZ + 0.05], scale: [bodyWidth * 0.88, 0.045, 0.045] },
    { position: [0, wallHeight * 0.18, frontZ + 0.05], scale: [bodyWidth * 0.88, 0.04, 0.045] },
    { position: [-bodyWidth * 0.24, wallHeight + roofRise * 0.48, frontZ + 0.052], scale: [bodyWidth * 0.49, 0.042, 0.042], rotation: [0, 0, roofPitch] },
    { position: [bodyWidth * 0.24, wallHeight + roofRise * 0.48, frontZ + 0.052], scale: [bodyWidth * 0.49, 0.042, 0.042], rotation: [0, 0, -roofPitch] },
  ];
  const porchColumns = [-0.42, -0.2, 0.2, 0.42].map((x) => ({
    position: [x * width, wallHeight * 0.3, frontZ + porchDepth * 0.62] as Vector3Tuple,
    scale: [0.052, wallHeight * 0.6, 0.052] as Vector3Tuple,
  }));
  const stairItems = [0, 1, 2, 3].map((index) => ({
    position: [width * 0.17, 0.028 + index * 0.035, depth * (0.46 - index * 0.035)] as Vector3Tuple,
    scale: [width * 0.28, 0.056, depth * 0.085] as Vector3Tuple,
  }));
  const diagonalFrames: InstanceTransform[] = [
    { position: [-bodyWidth * 0.33, wallHeight * 0.48, frontZ + 0.052], scale: [bodyWidth * 0.23, 0.038, 0.038], rotation: [0, 0, 0.62] },
    { position: [bodyWidth * 0.33, wallHeight * 0.48, frontZ + 0.052], scale: [bodyWidth * 0.23, 0.038, 0.038], rotation: [0, 0, -0.62] },
  ];

  useEffect(() => () => bodyGeometry.dispose(), [bodyGeometry]);

  return (
    <group dispose={null}>
      <mesh geometry={UNIT_BOX} material={materials.platform} position={[0, 0.055, 0]} scale={[width * 0.98, 0.11, depth * 0.98]} receiveShadow raycast={NO_RAYCAST} dispose={null} />
      <mesh geometry={bodyGeometry} material={materials.wall} castShadow receiveShadow raycast={NO_RAYCAST} />
      <ScaledInstances material={materials.roof} castShadow receiveShadow items={[
        { position: [-bodyWidth * 0.25, wallHeight + roofRise * 0.52, 0], scale: [roofLength, 0.085, bodyDepth + depth * 0.09], rotation: [0, 0, roofPitch] },
        { position: [bodyWidth * 0.25, wallHeight + roofRise * 0.52, 0], scale: [roofLength, 0.085, bodyDepth + depth * 0.09], rotation: [0, 0, -roofPitch] },
      ]} />
      <mesh geometry={UNIT_BOX} material={materials.accent} position={[0, 0.15, frontZ + porchDepth * 0.52]} scale={[width * 0.94, 0.12, porchDepth]} receiveShadow raycast={NO_RAYCAST} dispose={null} />
      <mesh geometry={UNIT_BOX} material={materials.roof} position={[0, wallHeight * 0.69, frontZ + porchDepth * 0.43]} rotation={[0.12, 0, 0]} scale={[width * 0.97, 0.07, porchDepth * 1.12]} castShadow raycast={NO_RAYCAST} dispose={null} />
      <ScaledInstances material={materials.glass} items={windows} />
      <ScaledInstances material={materials.trim} items={frames} />
      <ScaledInstances material={materials.trim} items={porchColumns} />
      {showDetail && (
        <>
          <ScaledInstances material={materials.trim} items={diagonalFrames} />
          <ScaledInstances material={materials.trim} items={[
            { position: [0, wallHeight * 0.25, frontZ + porchDepth * 0.68], scale: [width * 0.85, 0.042, 0.04] },
            ...[-0.4, -0.3, -0.2, -0.1, 0.1, 0.2, 0.3, 0.4].map((x) => ({
              position: [x * width, wallHeight * 0.19, frontZ + porchDepth * 0.68] as Vector3Tuple,
              scale: [0.025, wallHeight * 0.28, 0.034] as Vector3Tuple,
            })),
          ]} />
          <ScaledInstances material={materials.platform} items={stairItems} receiveShadow />
          <mesh geometry={UNIT_BOX} material={materials.platform} position={[-width * 0.24, height * 0.105, depth * 0.47]} scale={[width * 0.38, height * 0.14, depth * 0.06]} receiveShadow raycast={NO_RAYCAST} dispose={null} />
          <SignagePanel title="ETNIA ALEMÃ" position={[-width * 0.24, height * 0.11, depth * 0.502]} size={[width * 0.32, height * 0.065]} background="#4b362d" />
          <ScaledInstances geometry={UNIT_CYLINDER} material={materials.metal} items={[
            { position: [-width * 0.08, height * 0.51, depth * 0.43], scale: [0.03, height * 0.96, 0.03] },
            { position: [width * 0.08, height * 0.51, depth * 0.43], scale: [0.03, height * 0.96, 0.03] },
          ]} />
          <ScaledInstances material={materials.green} items={[
            { position: [-width * 0.025, height * 0.76, depth * 0.437], scale: [width * 0.105, height * 0.07, 0.022] },
          ]} />
          <ScaledInstances material={SHARED_BRAZIL_YELLOW_MATERIAL} items={[
            { position: [-width * 0.025, height * 0.76, depth * 0.451], scale: [width * 0.036, height * 0.032, 0.023] },
          ]} />
          <ScaledInstances material={SHARED_BRAZIL_BLUE_MATERIAL} items={[
            { position: [-width * 0.025, height * 0.76, depth * 0.465], scale: [width * 0.014, height * 0.014, 0.024] },
          ]} />
          <ScaledInstances material={materials.dark} items={[
            { position: [width * 0.135, height * 0.785, depth * 0.437], scale: [width * 0.105, height * 0.022, 0.022] },
          ]} />
          <ScaledInstances material={SHARED_GERMAN_RED_MATERIAL} items={[
            { position: [width * 0.135, height * 0.758, depth * 0.437], scale: [width * 0.105, height * 0.022, 0.022] },
          ]} />
          <ScaledInstances material={SHARED_GERMAN_GOLD_MATERIAL} items={[
            { position: [width * 0.135, height * 0.731, depth * 0.437], scale: [width * 0.105, height * 0.022, 0.022] },
          ]} />
        </>
      )}
      {showFocusDetail && (
        <ScaledInstances material={materials.trim} items={[
          { position: [-bodyWidth * 0.31, wallHeight * 0.53, frontZ + 0.054], scale: [0.025, wallHeight * 0.36, 0.025] },
          { position: [bodyWidth * 0.31, wallHeight * 0.53, frontZ + 0.054], scale: [0.025, wallHeight * 0.36, 0.025] },
          { position: [0, wallHeight * 0.42, frontZ + 0.056], scale: [0.025, wallHeight * 0.58, 0.025] },
        ]} />
      )}
    </group>
  );
}

function FenasojaRestaurant({
  bounds,
  height,
  materials,
  showDetail,
  showFocusDetail,
}: LandmarkModelProps) {
  const width = bounds.width;
  const depth = bounds.depth;
  const wallHeight = height * 0.34;
  const bodyDepth = depth * 0.7;
  const frontZ = bodyDepth / 2;
  const mainRoof = useMemo(
    () => createHipRoofGeometry(width * 0.98, depth * 0.88, height * 0.28),
    [depth, height, width],
  );
  const upperRoof = useMemo(
    () => createHipRoofGeometry(width * 0.44, depth * 0.36, height * 0.14),
    [depth, height, width],
  );
  const entranceBody = useMemo(
    () => createGableBodyGeometry(width * 0.27, depth * 0.18, wallHeight * 0.82, height * 0.14),
    [depth, height, wallHeight, width],
  );
  const windowTransforms = [-0.4, -0.27, 0.27, 0.4].map((x) => ({
    position: [x * width, wallHeight * 0.5, frontZ + 0.035] as Vector3Tuple,
    scale: [width * 0.105, wallHeight * 0.5, 0.04] as Vector3Tuple,
  }));
  const facadePosts = [-0.48, -0.34, -0.2, 0.2, 0.34, 0.48].map((x) => ({
    position: [x * width, wallHeight * 0.53, frontZ + 0.058] as Vector3Tuple,
    scale: [0.036, wallHeight * 0.98, 0.043] as Vector3Tuple,
  }));
  const doorTransforms: InstanceTransform[] = [
    { position: [-width * 0.055, wallHeight * 0.42, frontZ + depth * 0.105], scale: [width * 0.09, wallHeight * 0.62, 0.035] },
    { position: [width * 0.055, wallHeight * 0.42, frontZ + depth * 0.105], scale: [width * 0.09, wallHeight * 0.62, 0.035] },
  ];
  const umbrellaPositions = [-0.28, 0.28].map((x) => x * width);

  useEffect(() => () => {
    mainRoof.dispose();
    upperRoof.dispose();
    entranceBody.dispose();
  }, [entranceBody, mainRoof, upperRoof]);

  return (
    <group dispose={null}>
      <mesh geometry={UNIT_BOX} material={materials.platform} position={[0, 0.045, 0]} scale={[width * 0.98, 0.09, depth * 0.98]} receiveShadow raycast={NO_RAYCAST} dispose={null} />
      <mesh geometry={UNIT_BOX} material={materials.wall} position={[0, wallHeight / 2 + 0.08, -depth * 0.04]} scale={[width * 0.92, wallHeight, bodyDepth]} castShadow receiveShadow raycast={NO_RAYCAST} dispose={null} />
      <mesh geometry={UNIT_BOX} material={materials.trim} position={[0, wallHeight + 0.055, -depth * 0.04]} scale={[width * 0.96, 0.07, depth * 0.84]} castShadow raycast={NO_RAYCAST} dispose={null} />
      <mesh geometry={mainRoof} material={materials.roof} position={[0, wallHeight + 0.08, -depth * 0.04]} castShadow receiveShadow raycast={NO_RAYCAST} />
      <mesh geometry={UNIT_BOX} material={materials.accent} position={[0, wallHeight + height * 0.265, -depth * 0.08]} scale={[width * 0.36, height * 0.11, depth * 0.23]} castShadow raycast={NO_RAYCAST} dispose={null} />
      <mesh geometry={upperRoof} material={materials.roof} position={[0, wallHeight + height * 0.325, -depth * 0.08]} castShadow raycast={NO_RAYCAST} />
      <mesh geometry={entranceBody} material={materials.white} position={[0, 0.08, frontZ + depth * 0.04]} castShadow receiveShadow raycast={NO_RAYCAST} />
      <ScaledInstances material={materials.glass} items={windowTransforms} />
      <ScaledInstances material={materials.glass} items={doorTransforms} />
      <ScaledInstances material={materials.trim} items={facadePosts} />
      <mesh geometry={UNIT_BOX} material={materials.roof} position={[0, wallHeight * 0.8, frontZ + depth * 0.13]} rotation={[0.05, 0, 0]} scale={[width * 0.34, 0.055, depth * 0.16]} castShadow raycast={NO_RAYCAST} dispose={null} />
      <ScaledInstances material={materials.green} items={[
        { position: [-width * 0.31, 0.16, frontZ + depth * 0.12], scale: [width * 0.23, 0.14, depth * 0.07] },
        { position: [width * 0.31, 0.16, frontZ + depth * 0.12], scale: [width * 0.23, 0.14, depth * 0.07] },
      ]} />
      {showDetail && (
        <>
          <SignagePanel title="FENASOJA" subtitle="RESTAURANTE" position={[0, wallHeight * 0.72, frontZ + depth * 0.222]} size={[width * 0.23, height * 0.085]} background="#176f43" />
          <ScaledInstances material={materials.trim} items={[
            { position: [-width * 0.4, wallHeight * 0.5, frontZ + 0.062], scale: [0.023, wallHeight * 0.5, 0.023] },
            { position: [-width * 0.27, wallHeight * 0.5, frontZ + 0.062], scale: [0.023, wallHeight * 0.5, 0.023] },
            { position: [width * 0.27, wallHeight * 0.5, frontZ + 0.062], scale: [0.023, wallHeight * 0.5, 0.023] },
            { position: [width * 0.4, wallHeight * 0.5, frontZ + 0.062], scale: [0.023, wallHeight * 0.5, 0.023] },
            { position: [0, wallHeight * 0.42, frontZ + depth * 0.126], scale: [0.025, wallHeight * 0.62, 0.025] },
          ]} />
        </>
      )}
      {showFocusDetail && (
        <>
          <ScaledInstances geometry={UNIT_CYLINDER} material={materials.metal} items={umbrellaPositions.map((x) => ({
            position: [x, height * 0.2, depth * 0.43] as Vector3Tuple,
            scale: [0.025, height * 0.38, 0.025] as Vector3Tuple,
          }))} />
          <ScaledInstances geometry={UNIT_CONE} material={materials.green} items={umbrellaPositions.map((x) => ({
            position: [x, height * 0.37, depth * 0.43] as Vector3Tuple,
            scale: [width * 0.068, height * 0.075, width * 0.068] as Vector3Tuple,
          }))} />
          <ScaledInstances material={materials.trim} items={[
            { position: [-width * 0.31, 0.12, depth * 0.47], scale: [width * 0.15, 0.065, 0.065] },
            { position: [width * 0.31, 0.12, depth * 0.47], scale: [width * 0.15, 0.065, 0.065] },
          ]} />
        </>
      )}
    </group>
  );
}

function SicrediArena({
  bounds,
  height,
  materials,
  showDetail,
  showFocusDetail,
}: LandmarkModelProps) {
  const width = bounds.width;
  const depth = bounds.depth;
  const halfWidth = Math.min(width * 0.455, height * 0.92);
  const rise = Math.min(height * 0.83, halfWidth * 0.98);
  const shellDepth = depth * 0.54;
  const shellZ = -depth * 0.08;
  const shellFrontZ = shellZ + shellDepth / 2;
  const shellGeometry = useMemo(
    () => createArenaShellGeometry(halfWidth, rise, shellDepth),
    [halfWidth, rise, shellDepth],
  );
  const rearArch = useMemo(
    () => createArchedFacadeGeometry(halfWidth * 0.86, rise * 0.84),
    [halfWidth, rise],
  );
  const greenArch = useMemo(
    () => createEllipticalArchBandGeometry(halfWidth, rise, width * 0.038),
    [halfWidth, rise, width],
  );
  const innerArch = useMemo(
    () => createEllipticalArchBandGeometry(
      halfWidth - width * 0.056,
      rise - width * 0.045,
      width * 0.012,
    ),
    [halfWidth, rise, width],
  );
  const interiorRib = useMemo(
    () => createEllipticalArchBandGeometry(
      halfWidth - width * 0.075,
      rise - width * 0.06,
      width * 0.012,
    ),
    [halfWidth, rise, width],
  );
  const trussItems: InstanceTransform[] = [
    ...[-0.62, -0.35, 0.35, 0.62].map((x) => ({
      position: [x * halfWidth, rise * 0.36, shellFrontZ + 0.07] as Vector3Tuple,
      scale: [0.065, rise * 0.72, 0.065] as Vector3Tuple,
    })),
    { position: [0, rise * 0.69, shellFrontZ + 0.07], scale: [halfWidth * 1.22, 0.065, 0.065] },
  ];

  useEffect(() => () => {
    shellGeometry.dispose();
    rearArch.dispose();
    greenArch.dispose();
    innerArch.dispose();
    interiorRib.dispose();
  }, [greenArch, innerArch, interiorRib, rearArch, shellGeometry]);

  return (
    <group dispose={null}>
      <mesh geometry={UNIT_BOX} material={materials.platform} position={[0, 0.065, depth * 0.345]} scale={[width * 0.94, 0.13, depth * 0.29]} receiveShadow raycast={NO_RAYCAST} dispose={null} />
      <mesh geometry={UNIT_BOX} material={materials.dark} position={[0, 0.15, shellZ]} scale={[halfWidth * 1.74, 0.23, shellDepth * 0.87]} receiveShadow raycast={NO_RAYCAST} dispose={null} />
      <mesh geometry={shellGeometry} material={materials.white} position={[0, 0.18, shellZ]} castShadow receiveShadow raycast={NO_RAYCAST} />
      <mesh geometry={rearArch} material={materials.dark} position={[0, 0.18, shellZ - shellDepth * 0.492]} raycast={NO_RAYCAST} />
      <mesh geometry={UNIT_BOX} material={materials.glass} position={[0, rise * 0.31, shellZ - shellDepth * 0.485]} scale={[halfWidth * 1.34, rise * 0.51, 0.045]} raycast={NO_RAYCAST} dispose={null} />
      <mesh geometry={greenArch} material={materials.green} position={[0, 0.18, shellFrontZ + 0.06]} castShadow raycast={NO_RAYCAST} />
      <mesh geometry={innerArch} material={materials.white} position={[0, 0.18, shellFrontZ + 0.082]} raycast={NO_RAYCAST} />
      <ScaledInstances material={materials.green} items={[
        { position: [-halfWidth * 0.93, rise * 0.27, shellZ], scale: [width * 0.064, rise * 0.54, shellDepth * 0.86], rotation: [0, 0, -0.1] },
        { position: [halfWidth * 0.93, rise * 0.27, shellZ], scale: [width * 0.064, rise * 0.54, shellDepth * 0.86], rotation: [0, 0, 0.1] },
      ]} castShadow />
      <ScaledInstances material={materials.dark} items={[
        { position: [-halfWidth * 0.72, rise * 0.34, shellFrontZ + 0.1], scale: [width * 0.078, rise * 0.44, depth * 0.065] },
        { position: [halfWidth * 0.72, rise * 0.34, shellFrontZ + 0.1], scale: [width * 0.078, rise * 0.44, depth * 0.065] },
      ]} />
      {showDetail && (
        <>
          <ScaledInstances material={materials.metal} items={trussItems} />
          <SignagePanel title="SICREDI  |  ICATU" subtitle="COOPERA" position={[0, rise * 0.765, shellFrontZ + 0.14]} size={[halfWidth * 1.04, rise * 0.13]} background="#164936" />
          <ScaledInstances material={materials.accent} items={[
            { position: [0, 0.155, depth * 0.255], scale: [width * 0.68, 0.05, depth * 0.038] },
            { position: [0, 0.115, depth * 0.302], scale: [width * 0.75, 0.04, depth * 0.038] },
            { position: [0, 0.08, depth * 0.348], scale: [width * 0.81, 0.035, depth * 0.038] },
          ]} />
        </>
      )}
      {showFocusDetail && (
        <>
          <ScaledInstances geometry={interiorRib} material={materials.accent} items={[
            { position: [0, 0.18, shellFrontZ - shellDepth * 0.25], scale: [1, 1, 1] },
            { position: [0, 0.18, shellFrontZ - shellDepth * 0.52], scale: [1, 1, 1] },
          ]} />
          <ScaledInstances material={materials.metal} items={[-0.82, -0.55, 0.55, 0.82].map((x) => ({
            position: [x * halfWidth, rise * 0.19, shellZ - shellDepth * 0.18] as Vector3Tuple,
            scale: [0.042, rise * 0.38, 0.042] as Vector3Tuple,
          }))} />
          <ScaledInstances material={materials.dark} items={[
            { position: [-halfWidth * 0.43, rise * 0.18, shellZ - shellDepth * 0.27], scale: [width * 0.09, rise * 0.27, depth * 0.055] },
            { position: [halfWidth * 0.43, rise * 0.18, shellZ - shellDepth * 0.27], scale: [width * 0.09, rise * 0.27, depth * 0.055] },
          ]} />
        </>
      )}
    </group>
  );
}

interface LandmarkModelProps {
  bounds: StrategicLandmarkBounds;
  height: number;
  materials: LandmarkMaterialSet;
  showDetail: boolean;
  showFocusDetail: boolean;
}

export interface StrategicLandmarkMeshProps {
  entity: MapEntity;
  selected: boolean;
  hovered: boolean;
  filtersActive: boolean;
  isMatch: boolean;
  layerOpacity: number;
  cameraNavigating: boolean;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
  onFocus: () => void;
  onCursor: (cursor: 'grab' | 'grabbing' | 'pointer') => void;
}

export function StrategicLandmarkMesh({
  entity,
  selected,
  hovered,
  filtersActive,
  isMatch,
  layerOpacity,
  cameraNavigating,
  onSelect,
  onHover,
  onFocus,
  onCursor,
}: StrategicLandmarkMeshProps) {
  const kind = resolveStrategicLandmarkKind(entity);
  const bounds = useMemo(() => strategicLandmarkBounds(entity), [entity]);
  const height = strategicLandmarkVisualHeight(entity) ?? entity.geometry.extrusionHeight;
  const footprint = useMemo(() => createLocalFootprintGeometry(entity, bounds), [bounds, entity]);
  const hitVolume = useMemo(
    () => createLocalHitVolumeGeometry(entity, bounds, height),
    [bounds, entity, height],
  );
  const outline = useMemo(() => createLocalFootprintOutline(entity, bounds), [bounds, entity]);
  const filterStrength = filtersActive && !isMatch && !selected ? 0.42 : 1;
  const toneDown = 1 - THREE.MathUtils.clamp(layerOpacity * filterStrength, 0, 1);
  const materials = useLandmarkMaterials(kind ?? 'german-pavilion', toneDown, selected, hovered);
  const { showDetail, showFocusDetail } = useArchitecturalDetail(
    kind ?? 'german-pavilion',
    bounds,
    selected,
  );
  const facingRadians = strategicLandmarkFacingRadians(entity);
  const modelBounds = useMemo(() => {
    const quarterTurn = Math.abs(Math.sin(facingRadians)) > 0.7;
    if (!quarterTurn) return bounds;
    return {
      ...bounds,
      width: bounds.depth,
      depth: bounds.width,
    };
  }, [bounds, facingRadians]);
  const gl = useThree((state) => state.gl);
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => () => {
    footprint.dispose();
    hitVolume.dispose();
    outline.dispose();
  }, [footprint, hitVolume, outline]);

  useEffect(() => {
    gl.shadowMap.needsUpdate = true;
    invalidate();
  }, [gl, invalidate, selected, showDetail, showFocusDetail]);

  if (!kind) return null;

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    if (!isMapSelectionClick(event.delta)) return;
    onSelect(entity.id);
  };
  const handleDoubleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    if (!isMapSelectionClick(event.delta)) return;
    onSelect(entity.id);
    onFocus();
  };

  const modelProps: LandmarkModelProps = {
    bounds: modelBounds,
    height,
    materials,
    showDetail,
    showFocusDetail,
  };

  return (
    <group
      position={[bounds.centerX, entity.geometry.elevation, bounds.centerZ]}
      visible={selected || layerOpacity > 0.015}
      dispose={null}
    >
      <mesh
        geometry={hitVolume}
        material={SHARED_INVISIBLE_HIT_MATERIAL}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onPointerOver={(event) => {
          event.stopPropagation();
          if (cameraNavigating) return;
          onCursor('pointer');
          onHover(entity.id);
        }}
        onPointerOut={() => {
          onCursor(cameraNavigating ? 'grabbing' : 'grab');
          onHover(null);
        }}
        dispose={null}
      />
      <group rotation={[0, facingRadians, 0]} dispose={null}>
        {kind === 'fenasoja-headquarters' && <FenasojaHeadquarters {...modelProps} />}
        {kind === 'german-pavilion' && <GermanPavilion {...modelProps} />}
        {kind === 'fenasoja-restaurant' && <FenasojaRestaurant {...modelProps} />}
        {kind === 'sicredi-arena' && <SicrediArena {...modelProps} />}
      </group>
      {(selected || hovered) && (
        <>
          <mesh
            geometry={footprint}
            material={selected ? SHARED_SELECTED_SURFACE_MATERIAL : SHARED_HOVERED_SURFACE_MATERIAL}
            position={[0, 0.104, 0]}
            raycast={NO_RAYCAST}
            dispose={null}
          />
          <lineSegments
            geometry={outline}
            material={selected ? SHARED_SELECTED_LINE_MATERIAL : SHARED_HOVERED_LINE_MATERIAL}
            raycast={NO_RAYCAST}
            renderOrder={5}
            dispose={null}
          />
        </>
      )}
    </group>
  );
}
