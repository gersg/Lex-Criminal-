import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Compass,
  Crosshair,
  Gavel,
  Landmark,
  Lock,
  MessageCircleHeart,
  RotateCcw,
  Siren,
  SlidersHorizontal,
  UserPlus,
} from 'lucide-react';
import { CaseRecord, ForumDocument, RolePermissions } from '../types/lex';
import {
  createContactShadowTexture,
  createObservatoryFloorTexture,
} from '../three/textures';

export type CriminalJusticeStageId =
  | 'apf'
  | 'custodia'
  | 'aij'
  | 'tribunais'
  | 'forum'
  | 'tradutor';

interface StageBlueprint {
  id: CriminalJusticeStageId;
  step: string;
  shortLabel: string;
  title: string;
  phaseSubtitle: string;
  legalNote: string;
  ctaLabel: string;
  position: [number, number, number];
  accentHex: number;
  accentTextClass: string;
  accentBgClass: string;
  accentBorderClass: string;
  icon: React.FC<{ className?: string }>;
}

const STAGE_BLUEPRINTS: StageBlueprint[] = [
  {
    id: 'apf',
    step: '01',
    shortLabel: 'APF',
    title: 'Entrada & Auto de Prisão (APF)',
    phaseSubtitle: 'Captação em 3 linhas, triagem inicial e extração do flagrante.',
    legalNote: 'Art. 306 CPP · Nota de culpa e mapeamento da comarca.',
    ctaLabel: 'Abrir Captação / APF',
    position: [-7.2, 0, 1.8],
    accentHex: 0x38bdf8,
    accentTextClass: 'text-sky-400',
    accentBgClass: 'bg-sky-500/15',
    accentBorderClass: 'border-sky-500/40',
    icon: UserPlus,
  },
  {
    id: 'custodia',
    step: '02',
    shortLabel: 'Custódia',
    title: 'Flagrante & Custódia (M1)',
    phaseSubtitle: 'Atuação na hora zero: árvore Cenário A / B e relaxamento.',
    legalNote: 'Art. 310 CPP · Audiência em 24h e combate à prisão preventiva.',
    ctaLabel: 'Abrir Central de Flagrantes',
    position: [-4.3, 0, -1.6],
    accentHex: 0xef4444,
    accentTextClass: 'text-red-400',
    accentBgClass: 'bg-red-500/15',
    accentBorderClass: 'border-red-500/40',
    icon: Siren,
  },
  {
    id: 'aij',
    step: '03',
    shortLabel: 'AIJ',
    title: 'Instrução & Cadeia de Custódia (M2)',
    phaseSubtitle: 'Matriz de contradições policiais e memoriais do Art. 403 §3º.',
    legalNote: 'Art. 158-A CPP · Quebra de cadeia e nulidades probatórias.',
    ctaLabel: 'Abrir Matriz de AIJ',
    position: [-1.4, 0, 1.8],
    accentHex: 0xf59e0b,
    accentTextClass: 'text-amber-400',
    accentBgClass: 'bg-amber-500/15',
    accentBorderClass: 'border-amber-500/40',
    icon: Crosshair,
  },
  {
    id: 'tribunais',
    step: '04',
    shortLabel: 'Tribunais',
    title: 'STJ / STF & Execução SEEU (M3)',
    phaseSubtitle: 'Filtro Anti-Súmula 7, Habeas Corpus e calculadora Art. 112 LEP.',
    legalNote: 'Súmula 7 STJ · Prequestionamento e progressão de regime.',
    ctaLabel: 'Abrir STJ/STF & SEEU',
    position: [1.5, 0, -1.6],
    accentHex: 0x3b82f6,
    accentTextClass: 'text-blue-400',
    accentBgClass: 'bg-blue-500/15',
    accentBorderClass: 'border-blue-500/40',
    icon: Landmark,
  },
  {
    id: 'forum',
    step: '05',
    shortLabel: 'Fórum',
    title: 'Modo Fórum & Curadoria OAB',
    phaseSubtitle: 'Teleprompter de sustentação oral e validação ética assinada.',
    legalNote: 'Zero alucinação · Assinatura nominal OAB e despacho rápido.',
    ctaLabel: 'Abrir Modo Fórum',
    position: [4.4, 0, 1.8],
    accentHex: 0xfbbf24,
    accentTextClass: 'text-amber-300',
    accentBgClass: 'bg-amber-500/15',
    accentBorderClass: 'border-amber-400/40',
    icon: Gavel,
  },
  {
    id: 'tradutor',
    step: '06',
    shortLabel: 'Família',
    title: 'WhatsApp Família & Governança (M4)',
    phaseSubtitle: 'Tradução humanizada de andamentos e regras do escritório.',
    legalNote: 'LGPD ativa · Comunicação acolhedora e proteção ao sigilo.',
    ctaLabel: 'Abrir Tradutor Família',
    position: [7.3, 0, -1.4],
    accentHex: 0x10b981,
    accentTextClass: 'text-emerald-400',
    accentBgClass: 'bg-emerald-500/15',
    accentBorderClass: 'border-emerald-500/40',
    icon: MessageCircleHeart,
  },
];

// Pre-allocated math objects outside render loop (Zero GC)
const _overviewCamPos = new THREE.Vector3(0, 7.8, 13.8);
const _overviewTarget = new THREE.Vector3(0, 0.85, 0);
const _tmpCamGoal = new THREE.Vector3();
const _tmpTargetGoal = new THREE.Vector3();
const _projVec = new THREE.Vector3();
const _pulsePos = new THREE.Vector3();
const _pulseTangent = new THREE.Vector3();
const _upAxis = new THREE.Vector3(0, 1, 0);

function detectSoftwareWebGL(): boolean {
  try {
    const probeCanvas = document.createElement('canvas');
    const gl =
      probeCanvas.getContext('webgl2') || probeCanvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) ?? '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

interface PavilionEntry {
  id: CriminalJusticeStageId;
  group: THREE.Group;
  beaconGroup: THREE.Group;
  haloMesh: THREE.Mesh;
  beaconMat: THREE.MeshStandardMaterial;
  haloMat: THREE.MeshBasicMaterial;
  basePos: THREE.Vector3;
  accentHex: number;
}

function buildPavilionArchitecture(
  stage: StageBlueprint,
  shadowTex: THREE.CanvasTexture
): PavilionEntry {
  const group = new THREE.Group();
  const [px, py, pz] = stage.position;
  group.position.set(px, py, pz);

  // Materials with realistic roughness & metalness contrast
  const obsidianMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.42,
    metalness: 0.25,
  });
  const slateMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.55,
    metalness: 0.18,
  });
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    roughness: 0.28,
    metalness: 0.86,
  });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x93c5fd,
    roughness: 0.25,
    metalness: 0.15,
    transparent: true,
    opacity: 0.52,
  });
  const beaconMat = new THREE.MeshStandardMaterial({
    color: stage.accentHex,
    emissive: new THREE.Color(stage.accentHex),
    emissiveIntensity: 0.7,
    roughness: 0.26,
    metalness: 0.45,
  });

  // Ground contact shadow (flush above floor)
  const contactGeo = new THREE.PlaneGeometry(3.2, 3.2);
  const contactMat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    depthWrite: false,
    opacity: 0.72,
  });
  const contactMesh = new THREE.Mesh(contactGeo, contactMat);
  contactMesh.rotation.x = -Math.PI / 2;
  contactMesh.position.y = 0.015;
  group.add(contactMesh);

  // Selection ground ring (polygonOffset prevents z-fighting)
  const haloGeo = new THREE.RingGeometry(1.18, 1.32, 48);
  const haloMat = new THREE.MeshBasicMaterial({
    color: stage.accentHex,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.35,
    polygonOffset: true,
    polygonOffsetFactor: -1,
  });
  const haloMesh = new THREE.Mesh(haloGeo, haloMat);
  haloMesh.rotation.x = -Math.PI / 2;
  haloMesh.position.y = 0.028;
  group.add(haloMesh);

  // Shared stepped foundation grounded cleanly at y = 0
  const baseCylinder = new THREE.Mesh(
    new THREE.CylinderGeometry(1.06, 1.18, 0.22, 8),
    obsidianMat
  );
  baseCylinder.position.y = 0.11;
  baseCylinder.castShadow = true;
  baseCylinder.receiveShadow = true;
  group.add(baseCylinder);

  const brassTrim = new THREE.Mesh(
    new THREE.CylinderGeometry(1.01, 1.03, 0.06, 8),
    brassMat
  );
  brassTrim.position.y = 0.25;
  group.add(brassTrim);

  // Floating/rotating upper architectural beacon group
  const beaconGroup = new THREE.Group();
  beaconGroup.position.y = 2.05;
  group.add(beaconGroup);

  if (stage.id === 'apf') {
    // 01: Intake Portal & Obsidian Dossier Monolith
    const deck = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.14, 1.2), slateMat);
    deck.position.y = 0.35;
    deck.castShadow = true;
    deck.receiveShadow = true;
    group.add(deck);

    const monolith = new THREE.Mesh(
      new THREE.BoxGeometry(0.48, 1.32, 0.24),
      obsidianMat
    );
    monolith.position.set(0, 1.08, 0);
    monolith.castShadow = true;
    group.add(monolith);

    const archL = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 1.48, 0.18),
      brassMat
    );
    archL.position.set(-0.56, 1.16, 0);
    archL.castShadow = true;
    group.add(archL);

    const archR = archL.clone();
    archR.position.x = 0.56;
    group.add(archR);

    const lintel = new THREE.Mesh(
      new THREE.BoxGeometry(1.32, 0.14, 0.22),
      brassMat
    );
    lintel.position.set(0, 1.92, 0);
    lintel.castShadow = true;
    group.add(lintel);

    const prism = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.28, 0),
      beaconMat
    );
    prism.position.y = 0.24;
    beaconGroup.add(prism);
  } else if (stage.id === 'custodia') {
    // 02: Flagrante & Custódia Bastion (Twin Pillars + Gavel Lintel + Crimson Beacon)
    const podium = new THREE.Mesh(
      new THREE.CylinderGeometry(0.76, 0.88, 0.2, 8),
      slateMat
    );
    podium.position.y = 0.38;
    podium.castShadow = true;
    group.add(podium);

    [-0.45, 0.45].forEach((offsetX) => {
      const col = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.15, 1.28, 12),
        obsidianMat
      );
      col.position.set(offsetX, 1.12, 0);
      col.castShadow = true;
      group.add(col);

      const cap = new THREE.Mesh(
        new THREE.BoxGeometry(0.32, 0.1, 0.32),
        brassMat
      );
      cap.position.set(offsetX, 1.78, 0);
      group.add(cap);
    });

    const crossBeam = new THREE.Mesh(
      new THREE.BoxGeometry(1.36, 0.16, 0.42),
      obsidianMat
    );
    crossBeam.position.y = 1.9;
    crossBeam.castShadow = true;
    group.add(crossBeam);

    const spire = new THREE.Mesh(
      new THREE.ConeGeometry(0.24, 0.52, 6),
      beaconMat
    );
    spire.position.y = 0.28;
    beaconGroup.add(spire);
  } else if (stage.id === 'aij') {
    // 03: AIJ Amphitheater & Evidence Lectern
    const tier1 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.84, 0.92, 0.18, 16, 1, false, 0, Math.PI * 1.45),
      slateMat
    );
    tier1.position.y = 0.37;
    tier1.rotation.y = Math.PI * 0.78;
    tier1.castShadow = true;
    group.add(tier1);

    const tier2 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.64, 0.72, 0.18, 16, 1, false, 0, Math.PI * 1.35),
      obsidianMat
    );
    tier2.position.y = 0.55;
    tier2.rotation.y = Math.PI * 0.82;
    tier2.castShadow = true;
    group.add(tier2);

    const lectern = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.24, 1.12, 8),
      obsidianMat
    );
    lectern.position.set(0, 0.84, 0.15);
    lectern.castShadow = true;
    group.add(lectern);

    const arch = new THREE.Mesh(
      new THREE.TorusGeometry(0.68, 0.055, 10, 32, Math.PI),
      brassMat
    );
    arch.position.set(0, 1.15, -0.15);
    arch.castShadow = true;
    group.add(arch);

    const gyroRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.32, 0.04, 10, 28),
      beaconMat
    );
    gyroRing.position.y = 0.12;
    beaconGroup.add(gyroRing);

    const core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.18, 0),
      brassMat
    );
    core.position.y = 0.12;
    beaconGroup.add(core);
  } else if (stage.id === 'tribunais') {
    // 04: STJ / STF Supreme Court Colonnade (4 Columns + Stepped Pediment)
    const stylobate = new THREE.Mesh(
      new THREE.BoxGeometry(1.48, 0.2, 1.18),
      slateMat
    );
    stylobate.position.y = 0.38;
    stylobate.castShadow = true;
    group.add(stylobate);

    const colCoords: [number, number][] = [
      [-0.5, 0.36],
      [0.5, 0.36],
      [-0.5, -0.36],
      [0.5, -0.36],
    ];
    colCoords.forEach(([cx, cz]) => {
      const pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.09, 0.11, 1.18, 12),
        obsidianMat
      );
      pillar.position.set(cx, 1.07, cz);
      pillar.castShadow = true;
      group.add(pillar);
    });

    const entablature = new THREE.Mesh(
      new THREE.BoxGeometry(1.44, 0.14, 1.06),
      brassMat
    );
    entablature.position.y = 1.72;
    entablature.castShadow = true;
    group.add(entablature);

    const pediment = new THREE.Mesh(
      new THREE.ConeGeometry(0.76, 0.36, 4),
      obsidianMat
    );
    pediment.rotation.y = Math.PI / 4;
    pediment.position.y = 1.97;
    pediment.castShadow = true;
    group.add(pediment);

    const crystal = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.24, 0),
      beaconMat
    );
    crystal.position.y = 0.42;
    beaconGroup.add(crystal);
  } else if (stage.id === 'forum') {
    // 05: Modo Fórum · Lectern Dais & Teleprompter Slab
    const dais = new THREE.Mesh(
      new THREE.CylinderGeometry(0.78, 0.9, 0.22, 6),
      slateMat
    );
    dais.position.y = 0.39;
    dais.castShadow = true;
    group.add(dais);

    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.22, 0.88, 6),
      brassMat
    );
    stem.position.y = 0.94;
    stem.castShadow = true;
    group.add(stem);

    const prompterFrame = new THREE.Mesh(
      new THREE.BoxGeometry(0.95, 0.62, 0.08),
      obsidianMat
    );
    prompterFrame.position.set(0, 1.48, 0);
    prompterFrame.rotation.x = -0.35;
    prompterFrame.castShadow = true;
    group.add(prompterFrame);

    const prompterGlass = new THREE.Mesh(
      new THREE.BoxGeometry(0.84, 0.5, 0.03),
      glassMat
    );
    prompterGlass.position.set(0, 1.49, 0.04);
    prompterGlass.rotation.x = -0.35;
    group.add(prompterGlass);

    const seal = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.24, 0.08, 24),
      beaconMat
    );
    seal.rotation.x = Math.PI / 2;
    seal.position.y = 0.2;
    beaconGroup.add(seal);
  } else {
    // 06: WhatsApp Família & Governança (Harmonic Rotunda + Canopy Dome)
    const rotundaBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.82, 0.92, 0.18, 24),
      slateMat
    );
    rotundaBase.position.y = 0.37;
    rotundaBase.castShadow = true;
    group.add(rotundaBase);

    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const fin = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.96, 0.16),
        brassMat
      );
      fin.position.set(Math.cos(a) * 0.64, 0.94, Math.sin(a) * 0.64);
      fin.rotation.y = -a;
      fin.castShadow = true;
      group.add(fin);
    }

    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(0.68, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.5),
      glassMat
    );
    dome.position.y = 1.42;
    group.add(dome);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.69, 0.045, 10, 32),
      brassMat
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 1.42;
    group.add(ring);

    const spireOrb = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 18, 18),
      beaconMat
    );
    spireOrb.position.y = 0.28;
    beaconGroup.add(spireOrb);
  }

  // Invisible raycast proxy cylinder on layer 1 for effortless picking
  const hitMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(1.22, 1.22, 2.75, 12),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  hitMesh.position.y = 1.38;
  hitMesh.layers.set(1);
  hitMesh.userData.stageId = stage.id;
  group.add(hitMesh);

  return {
    id: stage.id,
    group,
    beaconGroup,
    haloMesh,
    beaconMat,
    haloMat,
    basePos: new THREE.Vector3(px, py, pz),
    accentHex: stage.accentHex,
  };
}

interface CriminalFlowMap3DProps {
  cases: CaseRecord[];
  forumDocs: ForumDocument[];
  rolePermissions: RolePermissions;
  initialStageId?: CriminalJusticeStageId;
  onNavigateToStage: (stageId: CriminalJusticeStageId) => void;
  onOpenControlGovernance: () => void;
}

export const CriminalFlowMap3D: React.FC<CriminalFlowMap3DProps> = ({
  cases,
  forumDocs,
  rolePermissions,
  initialStageId = 'custodia',
  onNavigateToStage,
  onOpenControlGovernance,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const markerRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const selectedIdRef = useRef<CriminalJusticeStageId>(initialStageId);
  const hoveredIdRef = useRef<CriminalJusticeStageId | null>(null);
  const cameraMoveRequestedRef = useRef(false);
  const overviewRequestedRef = useRef(false);

  const [selectedStageId, setSelectedStageId] =
    useState<CriminalJusticeStageId>(initialStageId);
  const [hoveredStageId, setHoveredStageId] =
    useState<CriminalJusticeStageId | null>(null);
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [fallbackActive, setFallbackActive] = useState(false);

  useEffect(() => {
    setSelectedStageId(initialStageId);
  }, [initialStageId]);

  // Sync ref for animation loop without rebuilding scene
  useEffect(() => {
    selectedIdRef.current = selectedStageId;
  }, [selectedStageId]);

  const stageMetrics = useMemo(() => {
    const custodiaCount = cases.filter(
      (c) =>
        c.defaultModule === 'custodia' ||
        c.situacao === 'Preso em Flagrante' ||
        c.urgency === 'critica'
    ).length;
    const aijCount = cases.filter((c) => c.defaultModule === 'aij').length;
    const tribCount = cases.filter(
      (c) => c.defaultModule === 'tribunais'
    ).length;
    const pendingForum = forumDocs.filter((d) => d.status !== 'validado').length;

    return {
      apf: {
        metric: `${cases.length} caso(s)`,
        allowed: rolePermissions.canCreateCase,
        lockedText: 'Cadastro restrito ao perfil',
      },
      custodia: {
        metric: `${custodiaCount} urgente(s)`,
        allowed: true,
        lockedText: '',
      },
      aij: {
        metric: `${Math.max(aijCount, 1)} em pauta`,
        allowed: true,
        lockedText: '',
      },
      tribunais: {
        metric: `${Math.max(tribCount, 1)} recurso(s)`,
        allowed: true,
        lockedText: '',
      },
      forum: {
        metric: `${pendingForum} pendente(s)`,
        allowed: true,
        lockedText: '',
      },
      tradutor: {
        metric: 'Ativo · LGPD',
        allowed: true,
        lockedText: '',
      },
    } as Record<
      CriminalJusticeStageId,
      { metric: string; allowed: boolean; lockedText: string }
    >;
  }, [cases, forumDocs, rolePermissions.canCreateCase]);

  const activeBlueprint = useMemo(
    () =>
      STAGE_BLUEPRINTS.find((s) => s.id === selectedStageId) ??
      STAGE_BLUEPRINTS[1],
    [selectedStageId]
  );

  const selectStage = (id: CriminalJusticeStageId) => {
    setSelectedStageId(id);
    overviewRequestedRef.current = false;
    cameraMoveRequestedRef.current = true;
    if (dockCollapsed) {
      setDockCollapsed(false);
    }
  };

  const resetOverview = () => {
    cameraMoveRequestedRef.current = false;
    overviewRequestedRef.current = true;
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const isSoftwareGl = detectSoftwareWebGL();

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
        alpha: false,
      });
    } catch {
      setFallbackActive(true);
      return;
    }

    const getWidth = () => container.clientWidth || 640;
    const getHeight = () => container.clientHeight || 420;

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.14;
    renderer.setPixelRatio(
      isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2)
    );
    renderer.setSize(getWidth(), getHeight());
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x060b14, 1);

    container.appendChild(renderer.domElement);

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      setFallbackActive(true);
    };
    const handleContextRestored = () => {
      setFallbackActive(false);
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost);
    renderer.domElement.addEventListener(
      'webglcontextrestored',
      handleContextRestored
    );

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060b14);
    scene.fog = new THREE.FogExp2(0x060b14, 0.022);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envTarget = pmremGenerator.fromScene(roomEnv, 0.04);
    scene.environment = envTarget.texture;
    roomEnv.dispose();
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(
      42,
      getWidth() / getHeight(),
      0.1,
      120
    );
    camera.position.copy(_overviewCamPos);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(_overviewTarget);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.07;
    controls.enablePan = true;
    controls.panSpeed = 0.65;
    controls.minDistance = 6.5;
    controls.maxDistance = 24;
    controls.minPolarAngle = 0.28;
    controls.maxPolarAngle = Math.PI * 0.44;
    controls.update();

    const onControlStart = () => {
      cameraMoveRequestedRef.current = false;
      overviewRequestedRef.current = false;
    };
    controls.addEventListener('start', onControlStart);

    // Studio & Architectural Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0x60a5fa, 0x090d16, 0.85);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfef3c7, 2.15);
    keyLight.position.set(9, 14, 10);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.left = -12;
    keyLight.shadow.camera.right = 12;
    keyLight.shadow.camera.top = 8;
    keyLight.shadow.camera.bottom = -8;
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 36;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x3b82f6, 1.4);
    rimLight.position.set(-10, 7, -10);
    scene.add(rimLight);

    const focusSpot = new THREE.PointLight(0xf59e0b, 3.2, 8.5, 1.4);
    focusSpot.position.set(-4.3, 3.2, -1.6);
    scene.add(focusSpot);

    // Grounded Architectural Floor Plane at y = 0
    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const floorTex = createObservatoryFloorTexture(maxAniso);
    const shadowTex = createContactShadowTexture();

    const floorGeo = new THREE.PlaneGeometry(46, 46);
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.88,
      metalness: 0.14,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = 0;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    // Architectural Spline Causeway linking all 6 Criminal Justice stages
    const splinePoints = STAGE_BLUEPRINTS.map(
      (s) => new THREE.Vector3(s.position[0], 0.07, s.position[2])
    );
    const flowCurve = new THREE.CatmullRomCurve3(splinePoints);

    const roadGeo = new THREE.TubeGeometry(flowCurve, 120, 0.14, 8, false);
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.48,
      metalness: 0.45,
    });
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.receiveShadow = true;
    scene.add(roadMesh);

    const railGeo = new THREE.TubeGeometry(flowCurve, 120, 0.04, 6, false);
    const railMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: new THREE.Color(0xd97706),
      emissiveIntensity: 0.55,
      roughness: 0.3,
      metalness: 0.85,
    });
    const railMesh = new THREE.Mesh(railGeo, railMat);
    railMesh.position.y = 0.08;
    scene.add(railMesh);

    // Instanced energy packets traveling along the justice flow
    const pulseCount = 18;
    const pulseGeo = new THREE.CapsuleGeometry(0.055, 0.18, 4, 8);
    pulseGeo.rotateX(Math.PI / 2);
    const pulseMat = new THREE.MeshStandardMaterial({
      color: 0xfef3c7,
      emissive: new THREE.Color(0xf59e0b),
      emissiveIntensity: 1.1,
      roughness: 0.25,
      metalness: 0.3,
    });
    const pulseInstances = new THREE.InstancedMesh(
      pulseGeo,
      pulseMat,
      pulseCount
    );
    pulseInstances.frustumCulled = false;
    pulseInstances.computeBoundingSphere();
    scene.add(pulseInstances);

    // Build all 6 interactive pavilions
    const pavilions: PavilionEntry[] = STAGE_BLUEPRINTS.map((bp) => {
      const entry = buildPavilionArchitecture(bp, shadowTex);
      scene.add(entry.group);
      return entry;
    });

    // Raycaster configured strictly on layer 1 (hit cylinders only)
    const raycaster = new THREE.Raycaster();
    raycaster.layers.set(1);
    const pointerNdc = new THREE.Vector2();
    let downX = 0;
    let downY = 0;

    const getHitStage = (clientX: number, clientY: number) => {
      const rect = renderer.domElement.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return null;
      pointerNdc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointerNdc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointerNdc, camera);
      const hits = raycaster.intersectObjects(scene.children, true);
      if (hits.length === 0) return null;
      return (hits[0].object.userData.stageId as CriminalJusticeStageId) ?? null;
    };

    const onPointerDown = (e: PointerEvent) => {
      downX = e.clientX;
      downY = e.clientY;
    };

    const onPointerMove = (e: PointerEvent) => {
      const hitId = getHitStage(e.clientX, e.clientY);
      if (hoveredIdRef.current !== hitId) {
        hoveredIdRef.current = hitId;
        setHoveredStageId(hitId);
      }
      renderer.domElement.style.cursor = hitId ? 'pointer' : 'grab';
    };

    const onPointerUp = (e: PointerEvent) => {
      const dist = Math.hypot(e.clientX - downX, e.clientY - downY);
      if (dist >= 8) return; // Drag/orbit gesture — do not pick
      const hitId = getHitStage(e.clientX, e.clientY);
      if (hitId) {
        selectStage(hitId);
      }
    };

    const onPointerLeave = () => {
      if (hoveredIdRef.current !== null) {
        hoveredIdRef.current = null;
        setHoveredStageId(null);
      }
      renderer.domElement.style.cursor = 'grab';
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('pointerleave', onPointerLeave);

    // ResizeObserver keeps viewport crisp inside UserHomeScreen
    const handleResize = () => {
      const w = getWidth();
      const h = getHeight();
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    const pulseDummy = new THREE.Object3D();
    let lastTime = performance.now();
    let elapsed = 0;
    let frameId = 0;
    let isDisposed = false;

    const afterDraw = (cb: () => void) => {
      frameId = requestAnimationFrame(() => {
        setTimeout(cb, 0);
      });
    };

    const tick = () => {
      if (isDisposed) return;

      const now = performance.now();
      const delta = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      if (!prefersReducedMotion) {
        elapsed += delta;
      }

      const activeId = selectedIdRef.current;
      const hoverId = hoveredIdRef.current;

      // Animate pavilions, selection glow, and beacons
      pavilions.forEach((p, idx) => {
        const isActive = p.id === activeId;
        const isHovered = p.id === hoverId;

        if (!prefersReducedMotion) {
          p.beaconGroup.rotation.y += delta * (isActive ? 1.15 : 0.42);
          p.beaconGroup.position.y =
            2.05 + Math.sin(elapsed * 1.8 + idx * 1.1) * 0.08;
        }

        const targetScale = isActive ? 1.12 : isHovered ? 1.06 : 1.0;
        const s = THREE.MathUtils.damp(p.group.scale.x, targetScale, 8, delta);
        p.group.scale.setScalar(s);

        p.beaconMat.emissiveIntensity = THREE.MathUtils.damp(
          p.beaconMat.emissiveIntensity,
          isActive ? 1.35 : isHovered ? 0.95 : 0.45,
          8,
          delta
        );
        p.haloMat.opacity = THREE.MathUtils.damp(
          p.haloMat.opacity,
          isActive ? 0.92 : isHovered ? 0.68 : 0.24,
          8,
          delta
        );

        if (isActive) {
          focusSpot.color.setHex(p.accentHex);
          focusSpot.position.x = THREE.MathUtils.damp(
            focusSpot.position.x,
            p.basePos.x,
            6,
            delta
          );
          focusSpot.position.z = THREE.MathUtils.damp(
            focusSpot.position.z,
            p.basePos.z,
            6,
            delta
          );
        }
      });

      // Flow energy packets along justice curve
      for (let i = 0; i < pulseCount; i++) {
        const t = ((elapsed * 0.095 + i / pulseCount) % 1 + 1) % 1;
        flowCurve.getPointAt(t, _pulsePos);
        flowCurve.getTangentAt(t, _pulseTangent);
        pulseDummy.position.set(_pulsePos.x, _pulsePos.y + 0.09, _pulsePos.z);
        pulseDummy.lookAt(
          _pulsePos.x + _pulseTangent.x,
          _pulsePos.y + 0.09 + _pulseTangent.y,
          _pulsePos.z + _pulseTangent.z
        );
        pulseDummy.updateMatrix();
        pulseInstances.setMatrixAt(i, pulseDummy.matrix);
      }
      pulseInstances.instanceMatrix.needsUpdate = true;

      // Damped smooth camera glide when stage or overview button is triggered
      if (cameraMoveRequestedRef.current) {
        const activePavilion = pavilions.find((p) => p.id === activeId);
        if (activePavilion) {
          _tmpTargetGoal.set(
            activePavilion.basePos.x,
            1.1,
            activePavilion.basePos.z
          );
          _tmpCamGoal.set(
            activePavilion.basePos.x * 0.85 + 0.6,
            4.1,
            activePavilion.basePos.z + 6.9
          );
          controls.target.x = THREE.MathUtils.damp(
            controls.target.x,
            _tmpTargetGoal.x,
            4.8,
            delta
          );
          controls.target.y = THREE.MathUtils.damp(
            controls.target.y,
            _tmpTargetGoal.y,
            4.8,
            delta
          );
          controls.target.z = THREE.MathUtils.damp(
            controls.target.z,
            _tmpTargetGoal.z,
            4.8,
            delta
          );

          camera.position.x = THREE.MathUtils.damp(
            camera.position.x,
            _tmpCamGoal.x,
            4.4,
            delta
          );
          camera.position.y = THREE.MathUtils.damp(
            camera.position.y,
            _tmpCamGoal.y,
            4.4,
            delta
          );
          camera.position.z = THREE.MathUtils.damp(
            camera.position.z,
            _tmpCamGoal.z,
            4.4,
            delta
          );

          if (camera.position.distanceTo(_tmpCamGoal) < 0.06) {
            cameraMoveRequestedRef.current = false;
          }
        }
      } else if (overviewRequestedRef.current) {
        controls.target.x = THREE.MathUtils.damp(
          controls.target.x,
          _overviewTarget.x,
          4.8,
          delta
        );
        controls.target.y = THREE.MathUtils.damp(
          controls.target.y,
          _overviewTarget.y,
          4.8,
          delta
        );
        controls.target.z = THREE.MathUtils.damp(
          controls.target.z,
          _overviewTarget.z,
          4.8,
          delta
        );
        camera.position.x = THREE.MathUtils.damp(
          camera.position.x,
          _overviewCamPos.x,
          4.4,
          delta
        );
        camera.position.y = THREE.MathUtils.damp(
          camera.position.y,
          _overviewCamPos.y,
          4.4,
          delta
        );
        camera.position.z = THREE.MathUtils.damp(
          camera.position.z,
          _overviewCamPos.z,
          4.4,
          delta
        );
        if (camera.position.distanceTo(_overviewCamPos) < 0.08) {
          overviewRequestedRef.current = false;
        }
      }

      controls.update();
      renderer.render(scene, camera);

      // Update projected 2D stage markers via direct DOM transform (no React re-render per frame)
      const w = getWidth();
      const h = getHeight();
      pavilions.forEach((p) => {
        const el = markerRefs.current[p.id];
        if (!el) return;
        _projVec.set(p.basePos.x, 2.9, p.basePos.z);
        _projVec.project(camera);
        if (_projVec.z > 1 || _projVec.z < -1) {
          el.style.opacity = '0';
          el.style.pointerEvents = 'none';
          return;
        }
        const sx = (_projVec.x * 0.5 + 0.5) * w;
        const sy = (-_projVec.y * 0.5 + 0.5) * h;
        el.style.opacity = '1';
        el.style.pointerEvents = 'auto';
        el.style.transform = `translate3d(${sx}px, ${sy}px, 0) translate(-50%, -100%)`;
      });

      if (prefersReducedMotion && !cameraMoveRequestedRef.current && !overviewRequestedRef.current) {
        // Still allow pointer orbit frames cleanly via controls; continue loop lightly
      }

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    // Keep _upAxis referenced cleanly if needed for alignment
    void _upAxis;

    if (isSoftwareGl) {
      tick();
    } else {
      frameId = requestAnimationFrame(tick);
    }

    return () => {
      isDisposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      resizeObserver.disconnect();

      controls.removeEventListener('start', onControlStart);
      controls.dispose();

      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('pointerleave', onPointerLeave);
      renderer.domElement.removeEventListener(
        'webglcontextlost',
        handleContextLost
      );
      renderer.domElement.removeEventListener(
        'webglcontextrestored',
        handleContextRestored
      );

      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh;
          mesh.geometry?.dispose();
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => m.dispose());
          } else {
            mesh.material?.dispose();
          }
        }
      });

      floorTex.dispose();
      shadowTex.dispose();
      envTarget.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  const activeMetric = stageMetrics[activeBlueprint.id];
  const ActiveIcon = activeBlueprint.icon;

  return (
    <section
      aria-label="Mapa Arquitetônico 3D do Fluxo Criminal"
      className="relative rounded-2xl overflow-hidden border border-slate-800 bg-[#060B14] shadow-xl"
    >
      {/* Área do Canvas 3D ou Fallback Arquitetônico 2D */}
      <div className="relative h-[430px] sm:h-[470px] lg:h-[500px] w-full">
        {!fallbackActive ? (
          <div
            ref={containerRef}
            className="absolute inset-0 w-full h-full touch-none select-none"
          />
        ) : (
          <div className="absolute inset-0 bg-[#070B14] flex flex-col justify-center px-4 sm:px-8 pb-36 pt-16 overflow-x-auto">
            <div className="min-w-[600px] max-w-4xl mx-auto w-full relative">
              <div className="h-0.5 bg-slate-800 absolute left-8 right-8 top-8" />
              <div className="grid grid-cols-6 gap-2 relative">
                {STAGE_BLUEPRINTS.map((bp) => {
                  const Icon = bp.icon;
                  const isSel = bp.id === selectedStageId;
                  return (
                    <button
                      key={bp.id}
                      type="button"
                      onClick={() => selectStage(bp.id)}
                      className={`p-3 rounded-xl border text-left transition-colors flex flex-col items-center text-center gap-2 ${
                        isSel
                          ? 'bg-[#101829] border-amber-500/60'
                          : 'bg-[#0B111E] border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center border ${
                          isSel
                            ? `${bp.accentBgClass} ${bp.accentBorderClass}`
                            : 'bg-slate-900 border-slate-700'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${bp.accentTextClass}`} />
                      </div>
                      <span className="font-mono-tabular text-[11px] font-bold text-slate-300">
                        {bp.step} · {bp.shortLabel}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Marcadores Numéricos Projetados 3D->2D (Sem caixas pesadas, clique direto) */}
        {!fallbackActive && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {STAGE_BLUEPRINTS.map((bp) => {
              const isSelected = bp.id === selectedStageId;
              const isHovered = bp.id === hoveredStageId;
              return (
                <button
                  key={bp.id}
                  ref={(el) => {
                    markerRefs.current[bp.id] = el;
                  }}
                  type="button"
                  onClick={() => selectStage(bp.id)}
                  aria-label={`Selecionar fase ${bp.step}: ${bp.title}`}
                  style={{ opacity: 0 }}
                  className={`absolute top-0 left-0 px-2 py-1 rounded-md text-[11px] font-mono-tabular font-bold tracking-tight transition-colors whitespace-nowrap ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : isHovered
                      ? 'bg-[#131D33] text-white border border-amber-500/60'
                      : 'bg-[#0B111E]/90 text-slate-200 border border-slate-700/80'
                  }`}
                >
                  {bp.step} · {bp.shortLabel}
                </button>
              );
            })}
          </div>
        )}

        {/* Cabeçalho Minimalista Superior (Zero blur sobre WebGL) */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
          <div className="pointer-events-auto inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0B111E]/95 border border-slate-800">
            <Compass className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="leading-tight">
              <span className="text-[11px] sm:text-xs font-bold text-white block">
                Mapa Arquitetônico do Fluxo Criminal
              </span>
              <span className="text-[10px] text-slate-400 hidden sm:block">
                Arraste para orbitar · Toque nos edifícios para navegar aos módulos
              </span>
            </div>
          </div>

          <div className="pointer-events-auto flex items-center gap-1.5">
            <button
              type="button"
              onClick={resetOverview}
              className="min-h-[38px] px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#0B111E]/95 hover:bg-[#131D33] border border-slate-800 text-[11px] font-semibold text-slate-200 flex items-center gap-1.5 transition-colors"
              title="Restaurar enquadramento panorâmico"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="hidden sm:inline">Vista Geral</span>
            </button>

            <button
              type="button"
              onClick={() => setDockCollapsed((prev) => !prev)}
              className="min-h-[38px] px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#0B111E]/95 hover:bg-[#131D33] border border-slate-800 text-[11px] font-semibold text-slate-200 flex items-center gap-1.5 transition-colors"
            >
              {dockCollapsed ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span className="hidden sm:inline">Mostrar Painel</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="hidden sm:inline">Ocultar Painel</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Dock Unificado Inferior (Sem painéis laterais obstruindo a cena 3D) */}
        <div className="absolute bottom-3 left-3 right-3 pointer-events-none flex justify-center">
          <div className="pointer-events-auto w-full max-w-4xl rounded-2xl bg-[#0B111E]/95 border border-slate-800 shadow-2xl overflow-hidden">
            {/* Faixa de Seleção das 6 Fases */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar px-2.5 py-2 border-b border-slate-800/80">
              {STAGE_BLUEPRINTS.map((bp) => {
                const isSelected = bp.id === selectedStageId;
                return (
                  <button
                    key={bp.id}
                    type="button"
                    onClick={() => selectStage(bp.id)}
                    className={`min-h-[36px] px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-[#060B14] text-slate-300 hover:bg-[#131D33] hover:text-white border border-slate-800/90'
                    }`}
                  >
                    <span className="font-mono-tabular">{bp.step}</span>
                    <span>{bp.shortLabel}</span>
                  </button>
                );
              })}
            </div>

            {/* Resumo da Fase Selecionada + Ação de Navegação */}
            {!dockCollapsed && (
              <div className="p-3 sm:px-4 sm:py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${activeBlueprint.accentBgClass} ${activeBlueprint.accentBorderClass}`}
                  >
                    <ActiveIcon
                      className={`w-5 h-5 ${activeBlueprint.accentTextClass}`}
                    />
                  </div>

                  <div className="min-w-0 space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xs sm:text-sm font-bold text-white truncate">
                        {activeBlueprint.step} · {activeBlueprint.title}
                      </h3>
                      <span className="font-mono-tabular text-[11px] px-2 py-0.5 rounded bg-[#060B14] border border-slate-800 text-slate-300 shrink-0">
                        {activeMetric.metric}
                      </span>
                    </div>
                    <p className="text-[11px] sm:text-xs text-slate-400 leading-snug line-clamp-2 sm:line-clamp-1">
                      {activeBlueprint.phaseSubtitle}
                    </p>
                    <p className="text-[10px] font-mono-tabular text-slate-500 hidden sm:block">
                      {activeBlueprint.legalNote}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {activeBlueprint.id === 'tradutor' &&
                    rolePermissions.canViewControlPanel && (
                      <button
                        type="button"
                        onClick={onOpenControlGovernance}
                        className="min-h-[44px] px-3 py-2 rounded-xl bg-[#060B14] hover:bg-[#131D33] border border-slate-700 text-xs font-semibold text-blue-300 flex items-center gap-1.5 transition-colors"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
                        <span>Governança IA</span>
                      </button>
                    )}

                  <button
                    type="button"
                    disabled={!activeMetric.allowed}
                    onClick={() => onNavigateToStage(activeBlueprint.id)}
                    className={`min-h-[44px] flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors whitespace-nowrap ${
                      activeMetric.allowed
                        ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                        : 'bg-slate-800 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {!activeMetric.allowed ? (
                      <>
                        <Lock className="w-3.5 h-3.5 shrink-0" />
                        <span>{activeMetric.lockedText}</span>
                      </>
                    ) : (
                      <>
                        <span>{activeBlueprint.ctaLabel}</span>
                        <ArrowRight className="w-4 h-4 shrink-0" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
