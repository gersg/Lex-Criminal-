import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { CONNECTIONS, NODES_3D, STAGES, StageItem } from '../data/stages';
import {
  createClusterPedestal,
  createCompositeNode,
  NodeAssembly,
} from '../three/nodeBuilder';
import {
  createContactShadowTexture,
  createObservatoryFloorTexture,
} from '../three/textures';
import {
  Bell,
  Brain,
  Calculator,
  ChartPie,
  Cpu,
  Database,
  Gavel,
  Gauge,
  IdCard,
  Landmark,
  Lock,
  Scale,
  Shield,
  Tablet,
  Timer,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';

interface LexScene3DProps {
  currentStage: number;
  selectedNodeId: string | null;
  isDrawerCollapsed: boolean;
  cameraResetSignal: number;
  onSelectNode: (stageId: number, nodeId: string, label: string) => void;
}

// Pre-allocated math helpers (Zero GC in animation loop)
const _projVec = new THREE.Vector3();
const _scaleVec = new THREE.Vector3();
const _targetLook = new THREE.Vector3();
const _currentLook = new THREE.Vector3(0, 0.4, 0);
const _camRight = new THREE.Vector3();

function detectSoftwareWebGL(): boolean {
  try {
    const probeCanvas = document.createElement('canvas');
    const gl = probeCanvas.getContext('webgl2') || probeCanvas.getContext('webgl');
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

function renderNodeIcon(iconName: StageItem['iconName']) {
  const cls = 'w-3 h-3 text-amber-400 shrink-0';
  switch (iconName) {
    case 'id-card':
      return <IdCard className={cls} />;
    case 'shield':
      return <Shield className={cls} />;
    case 'lock':
      return <Lock className={cls} />;
    case 'gauge':
      return <Gauge className={cls} />;
    case 'chart':
      return <ChartPie className={cls} />;
    case 'bell':
      return <Bell className={cls} />;
    case 'user-plus':
      return <UserPlus className={cls} />;
    case 'brain':
      return <Brain className={cls} />;
    case 'stopwatch':
      return <Timer className={cls} />;
    case 'landmark':
      return <Landmark className={cls} />;
    case 'scale':
      return <Scale className={cls} />;
    case 'calculator':
      return <Calculator className={cls} />;
    case 'users':
      return <Users className={cls} />;
    case 'tablet':
      return <Tablet className={cls} />;
    case 'user-check':
      return <UserCheck className={cls} />;
    case 'database':
      return <Database className={cls} />;
    case 'cpu':
      return <Cpu className={cls} />;
    case 'gavel':
      return <Gavel className={cls} />;
    default:
      return <Shield className={cls} />;
  }
}

export const LexScene3D: React.FC<LexScene3DProps> = ({
  currentStage,
  selectedNodeId,
  isDrawerCollapsed,
  cameraResetSignal,
  onSelectNode,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const labelRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // Mutable refs so React updates never re-initialize the WebGL scene
  const stageRef = useRef(currentStage);
  const selectedNodeRef = useRef(selectedNodeId);
  const collapsedRef = useRef(isDrawerCollapsed);
  const onSelectNodeRef = useRef(onSelectNode);

  const cameraPresetRef = useRef({
    radius: STAGES[0].cameraSpherical.radius,
    theta: STAGES[0].cameraSpherical.theta,
    phi: STAGES[0].cameraSpherical.phi,
    targetX: STAGES[0].cameraTarget.x,
    targetY: STAGES[0].cameraTarget.y,
    targetZ: STAGES[0].cameraTarget.z,
    userInteracted: false,
  });

  const [webglError, setWebglError] = useState(false);

  useEffect(() => {
    stageRef.current = currentStage;
    const stageData = STAGES[currentStage] ?? STAGES[0];
    cameraPresetRef.current = {
      radius: stageData.cameraSpherical.radius,
      theta: stageData.cameraSpherical.theta,
      phi: stageData.cameraSpherical.phi,
      targetX: stageData.cameraTarget.x,
      targetY: stageData.cameraTarget.y,
      targetZ: stageData.cameraTarget.z,
      userInteracted: false,
    };
  }, [currentStage, cameraResetSignal]);

  useEffect(() => {
    selectedNodeRef.current = selectedNodeId;
  }, [selectedNodeId]);

  useEffect(() => {
    collapsedRef.current = isDrawerCollapsed;
  }, [isDrawerCollapsed]);

  useEffect(() => {
    onSelectNodeRef.current = onSelectNode;
  }, [onSelectNode]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareWebGL();
    let renderer: THREE.WebGLRenderer;

    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
        alpha: false,
      });
    } catch {
      setWebglError(true);
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth || window.innerWidth, container.clientHeight || window.innerHeight);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x070b14, 1);

    container.appendChild(renderer.domElement);

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      setWebglError(true);
    };
    const handleContextRestored = () => {
      setWebglError(false);
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070b14);
    scene.fog = new THREE.FogExp2(0x070b14, 0.016);

    // Studio Environment Reflections (Mandatory for metallic & physical crystal highlights)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envTarget = pmremGenerator.fromScene(roomEnv, 0.04);
    scene.environment = envTarget.texture;
    roomEnv.dispose();
    pmremGenerator.dispose();

    const aspect = (container.clientWidth || window.innerWidth) / (container.clientHeight || window.innerHeight);
    const camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 180);

    // 3-Point Studio Lighting with Warm/Cool Contrast
    const hemiFill = new THREE.HemisphereLight(0x93c5fd, 0x0f172a, 0.85);
    scene.add(hemiFill);

    const keyLight = new THREE.DirectionalLight(0xfef3c7, 2.1);
    keyLight.position.set(10, 18, 12);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 2;
    keyLight.shadow.camera.far = 48;
    keyLight.shadow.camera.left = -16;
    keyLight.shadow.camera.right = 16;
    keyLight.shadow.camera.top = 12;
    keyLight.shadow.camera.bottom = -12;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.15);
    rimLight.position.set(-14, 8, -14);
    scene.add(rimLight);

    const hubAccentLight = new THREE.PointLight(0xa855f7, 2.2, 24, 1.5);
    hubAccentLight.position.set(2.5, 5.5, -2);
    scene.add(hubAccentLight);

    // Procedural Ground Observatory Floor + Concentric Calibration Rings
    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const floorTex = createObservatoryFloorTexture(maxAniso);
    const shadowTex = createContactShadowTexture();

    const floorY = -3.4;
    const floorGeo = new THREE.PlaneGeometry(54, 54);
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.86,
      metalness: 0.15,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = floorY;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    const ringGeo1 = new THREE.RingGeometry(11.4, 11.54, 96);
    const ringMat1 = new THREE.MeshBasicMaterial({
      color: 0xd97706,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.24,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    const coreRing = new THREE.Mesh(ringGeo1, ringMat1);
    coreRing.rotation.x = -Math.PI / 2;
    coreRing.position.y = floorY + 0.02;
    scene.add(coreRing);

    const ringGeo2 = new THREE.RingGeometry(14.6, 14.7, 96);
    const ringMat2 = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.15,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    const outerRing = new THREE.Mesh(ringGeo2, ringMat2);
    outerRing.rotation.x = -Math.PI / 2;
    outerRing.position.y = floorY + 0.03;
    scene.add(outerRing);

    // Grounded Stage Pedestals (4 Operational Zones)
    const stagePedestals = [
      createClusterPedestal(-7.5, 0, 2.7, 0xd97706, floorY + 0.01, shadowTex),
      createClusterPedestal(-2.7, 0, 3.0, 0xf59e0b, floorY + 0.01, shadowTex),
      createClusterPedestal(2.5, 0, 3.4, 0xa855f7, floorY + 0.01, shadowTex),
      createClusterPedestal(7.4, 0, 2.7, 0x10b981, floorY + 0.01, shadowTex),
    ];
    stagePedestals.forEach((p) => scene.add(p));

    // Instanced Background Starfield (Zero-allocation instancing)
    const starCount = 340;
    const starGeo = new THREE.OctahedronGeometry(0.065, 0);
    const starMat = new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      transparent: true,
      opacity: 0.48,
    });
    const starsInstanced = new THREE.InstancedMesh(starGeo, starMat, starCount);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < starCount; i++) {
      dummy.position.set(
        (Math.random() - 0.5) * 62,
        Math.random() * 24 - 2,
        (Math.random() - 0.5) * 62
      );
      const scale = 0.55 + Math.random() * 0.9;
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      starsInstanced.setMatrixAt(i, dummy.matrix);
    }
    starsInstanced.instanceMatrix.needsUpdate = true;
    starsInstanced.computeBoundingSphere();
    scene.add(starsInstanced);

    // Shared Node Trim Materials (high roughness contrast against glossy crystal)
    const goldTrimMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      metalness: 0.92,
      roughness: 0.18,
    });
    const obsidianMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.25,
      roughness: 0.72,
    });

    // Build Composite 3D Nodes
    const nodeAssemblies: NodeAssembly[] = [];
    const nodeMap: Record<string, NodeAssembly> = {};
    const clickableProxies: THREE.Object3D[] = [];

    NODES_3D.forEach((n) => {
      const assembly = createCompositeNode(n, goldTrimMat, obsidianMat);
      scene.add(assembly.group);
      nodeAssemblies.push(assembly);
      nodeMap[n.id] = assembly;
      clickableProxies.push(assembly.hitProxy);
    });

    // Build Connections & Travelling Data Pulses
    interface PulseItem {
      mesh: THREE.Mesh;
      start: THREE.Vector3;
      end: THREE.Vector3;
      fromStage: number;
      toStage: number;
      progress: number;
      speed: number;
      lineMat: THREE.LineBasicMaterial;
    }

    const pulseItems: PulseItem[] = [];
    const pulseGeo = new THREE.SphereGeometry(0.095, 10, 10);
    const pulseMat = new THREE.MeshBasicMaterial({ color: 0xfde68a });

    CONNECTIONS.forEach(([fromId, toId]) => {
      const fromNode = nodeMap[fromId];
      const toNode = nodeMap[toId];
      if (!fromNode || !toNode) return;

      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        fromNode.group.position.clone(),
        toNode.group.position.clone(),
      ]);
      const lineMat = new THREE.LineBasicMaterial({
        color: 0xf59e0b,
        transparent: true,
        opacity: 0.28,
      });
      const line = new THREE.Line(lineGeo, lineMat);
      scene.add(line);

      const pulseMesh = new THREE.Mesh(pulseGeo, pulseMat);
      scene.add(pulseMesh);

      pulseItems.push({
        mesh: pulseMesh,
        start: fromNode.group.position,
        end: toNode.group.position,
        fromStage: fromNode.data.stage,
        toStage: toNode.data.stage,
        progress: Math.random(),
        speed: 0.26 + Math.random() * 0.22,
        lineMat,
      });
    });

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Camera spherical state
    const spherical = {
      radius: STAGES[0].cameraSpherical.radius,
      theta: STAGES[0].cameraSpherical.theta,
      phi: STAGES[0].cameraSpherical.phi,
    };

    // Raycaster & Interaction state
    const raycaster = new THREE.Raycaster();
    raycaster.layers.set(1);
    const pointerNdc = new THREE.Vector2();
    let hoveredNodeId: string | null = null;
    let lastRaycastMs = 0;

    let isDragging = false;
    let pointerDownPos = { x: 0, y: 0 };
    let prevPointer = { x: 0, y: 0 };
    let initialPinchDist: number | null = null;

    const canvasEl = renderer.domElement;

    const updateNdc = (clientX: number, clientY: number) => {
      const rect = canvasEl.getBoundingClientRect();
      pointerNdc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointerNdc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    };

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      pointerDownPos = { x: e.clientX, y: e.clientY };
      prevPointer = { x: e.clientX, y: e.clientY };
      canvasEl.style.cursor = 'grabbing';
    };

    const onPointerMove = (e: PointerEvent) => {
      if (isDragging) {
        const dx = e.clientX - prevPointer.x;
        const dy = e.clientY - prevPointer.y;
        prevPointer = { x: e.clientX, y: e.clientY };

        if (Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y) > 4) {
          cameraPresetRef.current.userInteracted = true;
        }

        cameraPresetRef.current.theta -= dx * 0.0055;
        cameraPresetRef.current.phi = THREE.MathUtils.clamp(
          cameraPresetRef.current.phi - dy * 0.0055,
          0.32,
          1.46
        );
        return;
      }

      const now = performance.now();
      if (now - lastRaycastMs < 55) return;
      lastRaycastMs = now;

      updateNdc(e.clientX, e.clientY);
      raycaster.setFromCamera(pointerNdc, camera);
      const hits = raycaster.intersectObjects(clickableProxies, false);
      if (hits.length > 0) {
        const hitId = hits[0].object.userData.nodeId as string;
        hoveredNodeId = hitId;
        canvasEl.style.cursor = 'pointer';
      } else {
        hoveredNodeId = null;
        canvasEl.style.cursor = 'grab';
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!isDragging) return;
      isDragging = false;
      canvasEl.style.cursor = hoveredNodeId ? 'pointer' : 'grab';

      const travel = Math.hypot(
        e.clientX - pointerDownPos.x,
        e.clientY - pointerDownPos.y
      );
      if (travel < 6) {
        updateNdc(e.clientX, e.clientY);
        raycaster.setFromCamera(pointerNdc, camera);
        const hits = raycaster.intersectObjects(clickableProxies, false);
        if (hits.length > 0) {
          const { stage, nodeId, label } = hits[0].object.userData as {
            stage: number;
            nodeId: string;
            label: string;
          };
          onSelectNodeRef.current(stage, nodeId, label);
        }
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      cameraPresetRef.current.userInteracted = true;
      cameraPresetRef.current.radius = THREE.MathUtils.clamp(
        cameraPresetRef.current.radius + e.deltaY * 0.015,
        8.5,
        34
      );
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        isDragging = false;
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        initialPinchDist = Math.hypot(dx, dy);
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && initialPinchDist) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        const diff = initialPinchDist - dist;
        initialPinchDist = dist;
        cameraPresetRef.current.userInteracted = true;
        cameraPresetRef.current.radius = THREE.MathUtils.clamp(
          cameraPresetRef.current.radius + diff * 0.04,
          8.5,
          34
        );
      }
    };

    const onTouchEnd = () => {
      initialPinchDist = null;
    };

    const onResize = () => {
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    canvasEl.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    canvasEl.addEventListener('wheel', onWheel, { passive: false });
    canvasEl.addEventListener('touchstart', onTouchStart, { passive: true });
    canvasEl.addEventListener('touchmove', onTouchMove, { passive: true });
    canvasEl.addEventListener('touchend', onTouchEnd);
    window.addEventListener('resize', onResize);

    // Animation Loop with Clock + Software WebGL Pacing
    const clock = new THREE.Clock();
    let frameId = 0;
    let isDisposed = false;

    const afterDraw = (cb: () => void) => {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (typeof gl.fenceSync === 'function') {
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        const poll = () => {
          if (isDisposed) {
            if (sync) gl.deleteSync(sync);
            return;
          }
          const state = sync ? gl.getSyncParameter(sync, gl.SYNC_STATUS) : gl.SIGNALED;
          if (state === gl.UNSIGNALED) {
            frameId = window.setTimeout(poll, 5);
          } else {
            if (sync) gl.deleteSync(sync);
            frameId = window.setTimeout(cb, 80);
          }
        };
        frameId = window.setTimeout(poll, 5);
      } else {
        frameId = window.setTimeout(cb, 80);
      }
    };

    const tick = () => {
      if (isDisposed) return;

      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.elapsedTime;
      const activeStage = stageRef.current;
      const preset = cameraPresetRef.current;

      // Gentle ambient orbit only on Overview when user is not dragging
      if (activeStage === 0 && !isDragging && !preset.userInteracted) {
        preset.theta += delta * 0.085;
      }

      // Smooth frame-rate independent camera damping
      spherical.radius = THREE.MathUtils.damp(spherical.radius, preset.radius, 5.5, delta);
      spherical.theta = THREE.MathUtils.damp(spherical.theta, preset.theta, 5.5, delta);
      spherical.phi = THREE.MathUtils.damp(spherical.phi, preset.phi, 5.5, delta);

      // Offset camera target right on desktop when right narrative drawer is open
      // so the focused 3D cluster frames cleanly in the unobstructed left/center viewport
      const isDesktopDrawerOpen = window.innerWidth >= 1024 && !collapsedRef.current;
      const rightBias = isDesktopDrawerOpen ? (activeStage === 0 ? 2.4 : 1.9) : 0;

      _camRight.set(Math.cos(spherical.theta), 0, -Math.sin(spherical.theta));
      _targetLook.set(preset.targetX, preset.targetY, preset.targetZ).addScaledVector(_camRight, rightBias);

      _currentLook.x = THREE.MathUtils.damp(_currentLook.x, _targetLook.x, 5.5, delta);
      _currentLook.y = THREE.MathUtils.damp(_currentLook.y, _targetLook.y, 5.5, delta);
      _currentLook.z = THREE.MathUtils.damp(_currentLook.z, _targetLook.z, 5.5, delta);

      const sinPhi = Math.sin(spherical.phi);
      camera.position.set(
        _currentLook.x + spherical.radius * sinPhi * Math.sin(spherical.theta),
        _currentLook.y + spherical.radius * Math.cos(spherical.phi),
        _currentLook.z + spherical.radius * sinPhi * Math.cos(spherical.theta)
      );
      camera.lookAt(_currentLook);

      // Animate decorative observatory rings
      coreRing.rotation.z = elapsed * 0.14;
      outerRing.rotation.z = -elapsed * 0.09;

      // Animate composite nodes
      for (let i = 0; i < nodeAssemblies.length; i++) {
        const item = nodeAssemblies[i];
        item.group.position.y = item.baseY + Math.sin(elapsed * 1.65 + item.phase) * 0.13;
        item.crystalMesh.rotation.y += delta * 0.45;
        item.gimbalRing.rotation.z += delta * 0.32;

        const isFocused = activeStage === 0 || item.data.stage === activeStage;
        const isHighlighted =
          item.data.id === hoveredNodeId || item.data.id === selectedNodeRef.current;

        const desiredScale = isHighlighted
          ? 1.28
          : isFocused
          ? activeStage === item.data.stage
            ? 1.16
            : 1.0
          : 0.72;

        _scaleVec.setScalar(desiredScale);
        item.group.scale.x = THREE.MathUtils.damp(item.group.scale.x, _scaleVec.x, 7, delta);
        item.group.scale.y = THREE.MathUtils.damp(item.group.scale.y, _scaleVec.y, 7, delta);
        item.group.scale.z = THREE.MathUtils.damp(item.group.scale.z, _scaleVec.z, 7, delta);

        const targetEmissive = isHighlighted ? 0.65 : isFocused ? 0.36 : 0.08;
        item.crystalMaterial.emissiveIntensity = THREE.MathUtils.damp(
          item.crystalMaterial.emissiveIntensity,
          targetEmissive,
          7,
          delta
        );
      }

      // Animate data-flow pulses along connections
      for (let i = 0; i < pulseItems.length; i++) {
        const p = pulseItems[i];
        p.progress = (p.progress + delta * p.speed) % 1;
        p.mesh.position.lerpVectors(p.start, p.end, p.progress);

        const activeConnection =
          activeStage === 0 || p.fromStage === activeStage || p.toStage === activeStage;
        p.lineMat.opacity = activeConnection ? 0.34 : 0.08;
        p.mesh.visible = activeConnection;
      }

      // Project 2D floating labels without React re-renders
      const halfW = (container.clientWidth || window.innerWidth) / 2;
      const halfH = (container.clientHeight || window.innerHeight) / 2;

      for (let i = 0; i < nodeAssemblies.length; i++) {
        const item = nodeAssemblies[i];
        const labelEl = labelRefs.current[item.data.id];
        if (!labelEl) continue;

        _projVec.copy(item.group.position);
        _projVec.y += item.data.isHub ? item.data.size * 1.45 : item.data.size * 1.15;
        _projVec.project(camera);

        if (_projVec.z > 1) {
          labelEl.style.opacity = '0';
          labelEl.style.pointerEvents = 'none';
          continue;
        }

        const sx = _projVec.x * halfW + halfW;
        const sy = -_projVec.y * halfH + halfH;
        const isFocused = activeStage === 0 || item.data.stage === activeStage;
        const isSelected = item.data.id === selectedNodeRef.current;

        labelEl.style.transform = `translate3d(${sx.toFixed(1)}px, ${sy.toFixed(1)}px, 0) translate(-50%, -50%)`;
        labelEl.style.opacity = isFocused ? '1' : '0.25';
        labelEl.style.pointerEvents = isFocused ? 'auto' : 'none';
        labelEl.style.borderColor =
          isSelected || (item.data.stage === activeStage && activeStage !== 0)
            ? 'rgba(245, 158, 11, 0.72)'
            : 'rgba(51, 65, 85, 0.75)';
      }

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    if (isSoftwareGl) {
      tick();
    } else {
      frameId = requestAnimationFrame(tick);
    }

    return () => {
      isDisposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);

      canvasEl.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      canvasEl.removeEventListener('wheel', onWheel);
      canvasEl.removeEventListener('touchstart', onTouchStart);
      canvasEl.removeEventListener('touchmove', onTouchMove);
      canvasEl.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('resize', onResize);

      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', handleContextRestored);

      // Dispose Three.js resources
      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh || (obj as THREE.Line).isLine) {
          const renderable = obj as THREE.Mesh | THREE.Line;
          renderable.geometry?.dispose();
          if (Array.isArray(renderable.material)) {
            renderable.material.forEach((m) => m.dispose());
          } else {
            renderable.material?.dispose();
          }
        }
      });

      floorTex.dispose();
      shadowTex.dispose();
      envTarget.dispose();
      renderer.dispose();
      if (canvasEl.parentNode === container) {
        container.removeChild(canvasEl);
      }
    };
  }, []);

  if (webglError) {
    return (
      <div className="fixed inset-0 bg-[#070B14] flex items-center justify-center p-6 z-0">
        <div className="max-w-md rounded-2xl bg-[#0B111E] border border-amber-500/25 p-6 text-center space-y-3">
          <Shield className="w-8 h-8 text-amber-400 mx-auto" />
          <h2 className="font-display text-lg font-bold text-slate-100">
            Visualização 2D de Segurança Ativada
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            O contexto WebGL não está disponível neste dispositivo. Utilize a navegação por etapas e o painel narrativo para explorar toda a arquitetura LexRamon.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        ref={mountRef}
        className="fixed inset-0 w-full h-full z-0 cursor-grab select-none"
        aria-label="Cena 3D interativa da arquitetura LexRamon"
      />
      {/* Camada de Rótulos Flutuantes 3D em DOM semântico */}
      <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden">
        {NODES_3D.map((node) => (
          <button
            key={node.id}
            ref={(el) => {
              labelRefs.current[node.id] = el;
            }}
            type="button"
            onClick={() => onSelectNode(node.stage, node.id, node.label)}
            className="absolute top-0 left-0 px-2.5 py-1 rounded-lg bg-[#0B111E]/92 border border-slate-700/80 text-[11px] font-medium text-slate-100 shadow-lg flex items-center gap-1.5 whitespace-nowrap transition-opacity duration-200 hover:border-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            style={{ opacity: 0 }}
          >
            {renderNodeIcon(node.iconName)}
            <span>{node.label}</span>
          </button>
        ))}
      </div>
    </>
  );
};
