import * as THREE from 'three';
import { Node3DConfig } from '../data/stages';

export interface NodeAssembly {
  data: Node3DConfig;
  group: THREE.Group;
  crystalMesh: THREE.Mesh;
  crystalMaterial: THREE.MeshPhysicalMaterial;
  gimbalRing: THREE.Mesh;
  hitProxy: THREE.Mesh;
  baseY: number;
  phase: number;
}

export function createCompositeNode(
  config: Node3DConfig,
  goldTrimMat: THREE.MeshStandardMaterial,
  obsidianMat: THREE.MeshStandardMaterial
): NodeAssembly {
  const group = new THREE.Group();
  group.position.set(config.x, config.y, config.z);

  const s = config.size;

  // 1. Primary Silhouette: Faceted Crystalline Core
  const coreGeo = config.isHub
    ? new THREE.IcosahedronGeometry(s * 0.86, 1)
    : new THREE.OctahedronGeometry(s * 0.88, 0);

  const crystalMaterial = new THREE.MeshPhysicalMaterial({
    color: config.color,
    emissive: config.color,
    emissiveIntensity: 0.25,
    metalness: 0.35,
    roughness: 0.16,
    clearcoat: 0.9,
    clearcoatRoughness: 0.12,
  });

  const crystalMesh = new THREE.Mesh(coreGeo, crystalMaterial);
  crystalMesh.castShadow = true;
  crystalMesh.receiveShadow = true;
  group.add(crystalMesh);

  // 2. Secondary Read: Brushed Gold Equatorial Gimbal Collar
  const gimbalGeo = new THREE.TorusGeometry(s * 1.08, s * 0.045, 12, 40);
  const gimbalRing = new THREE.Mesh(gimbalGeo, goldTrimMat);
  gimbalRing.rotation.x = Math.PI / 2.25;
  gimbalRing.rotation.y = config.stage * 0.3;
  gimbalRing.castShadow = true;
  group.add(gimbalRing);

  // 3. Accent Detail: Precision Faceted Wireframe Cage
  const wireGeo = new THREE.EdgesGeometry(coreGeo);
  const wireMat = new THREE.LineBasicMaterial({
    color: 0xfef3c7,
    transparent: true,
    opacity: 0.35,
  });
  const wireCage = new THREE.LineSegments(wireGeo, wireMat);
  wireCage.scale.setScalar(1.06);
  group.add(wireCage);

  // 4. Grounded Base Collar: Matte Obsidian Octagonal Plinth Ring
  const collarGeo = new THREE.CylinderGeometry(s * 0.42, s * 0.56, s * 0.22, 8);
  const collarMesh = new THREE.Mesh(collarGeo, obsidianMat);
  collarMesh.position.y = -s * 0.92;
  collarMesh.castShadow = true;
  collarMesh.receiveShadow = true;
  group.add(collarMesh);

  // 5. Optional Hub Crown Spire for Primary Architectural Command Hubs
  if (config.isHub) {
    const spireGeo = new THREE.ConeGeometry(s * 0.2, s * 0.58, 6);
    const spireMesh = new THREE.Mesh(spireGeo, goldTrimMat);
    spireMesh.position.y = s * 1.18;
    spireMesh.castShadow = true;
    group.add(spireMesh);
  }

  // Invisible simplified raycast proxy sphere on Layer 1 for crisp clicking/hovering
  const proxyGeo = new THREE.SphereGeometry(s * 1.25, 12, 12);
  const proxyMat = new THREE.MeshBasicMaterial({ visible: false });
  const hitProxy = new THREE.Mesh(proxyGeo, proxyMat);
  hitProxy.layers.set(1);
  hitProxy.userData = { nodeId: config.id, stage: config.stage, label: config.label };
  group.add(hitProxy);

  return {
    data: config,
    group,
    crystalMesh,
    crystalMaterial,
    gimbalRing,
    hitProxy,
    baseY: config.y,
    phase: (config.x * 0.7 + config.z * 0.5) % (Math.PI * 2),
  };
}

export function createClusterPedestal(
  x: number,
  z: number,
  radius: number,
  accentColor: number,
  floorY: number,
  shadowTexture: THREE.CanvasTexture
): THREE.Group {
  const pedestalGroup = new THREE.Group();
  pedestalGroup.position.set(x, floorY, z);

  // Ground contact shadow plane
  const shadowGeo = new THREE.PlaneGeometry(radius * 2.5, radius * 2.5);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTexture,
    transparent: true,
    opacity: 0.6,
    depthWrite: false,
  });
  const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = 0.01;
  pedestalGroup.add(shadowPlane);

  // Matte slate octagonal dais
  const daisGeo = new THREE.CylinderGeometry(radius, radius * 1.06, 0.14, 8);
  const daisMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.78,
    metalness: 0.2,
  });
  const dais = new THREE.Mesh(daisGeo, daisMat);
  dais.position.y = 0.07;
  dais.receiveShadow = true;
  pedestalGroup.add(dais);

  // Subtle accent bevel ring
  const ringGeo = new THREE.RingGeometry(radius * 0.94, radius * 0.99, 48);
  const ringMat = new THREE.MeshBasicMaterial({
    color: accentColor,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.45,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.15;
  pedestalGroup.add(ring);

  return pedestalGroup;
}
