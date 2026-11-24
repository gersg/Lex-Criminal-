import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  createContactShadowTexture,
  createObservatoryFloorTexture,
} from '../three/textures';

// Zero-GC math helpers outside render loop
const _camTarget = new THREE.Vector3(0, 0.15, 0);

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

export const HeroAnimation3D: React.FC = () => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [fallbackActive, setFallbackActive] = useState(false);

  useEffect(() => {
    const container = mountRef.current;
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

    const getWidth = () => container.clientWidth || window.innerWidth;
    const getHeight = () => container.clientHeight || 620;

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
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
    scene.fog = new THREE.FogExp2(0x060b14, 0.036);

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
    camera.position.set(0, 1.35, 11.4);
    camera.lookAt(0, 0.15, 0);

    // 3-Point Warm Gold / Cool Cobalt Studio Rig
    const hemiFill = new THREE.HemisphereLight(0x60a5fa, 0x090d16, 0.9);
    scene.add(hemiFill);

    const keyLight = new THREE.DirectionalLight(0xfef3c7, 2.2);
    keyLight.position.set(8, 13, 10);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x3b82f6, 1.5);
    rimLight.position.set(-10, 6, -9);
    scene.add(rimLight);

    const amberCoreLight = new THREE.PointLight(0xf59e0b, 2.8, 16, 1.4);
    amberCoreLight.position.set(2.4, 1.2, 2.5);
    scene.add(amberCoreLight);

    // Observatory Ground + Calibration Rings
    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const floorTex = createObservatoryFloorTexture(maxAniso);
    const shadowTex = createContactShadowTexture();

    const floorY = -3.35;
    const floorGeo = new THREE.PlaneGeometry(42, 42);
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.88,
      metalness: 0.16,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = floorY;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    const contactGeo = new THREE.PlaneGeometry(7.2, 7.2);
    const contactMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.65,
    });
    const contactShadow = new THREE.Mesh(contactGeo, contactMat);
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.set(0, floorY + 0.02, 0);
    scene.add(contactShadow);

    const ringFloorGeo = new THREE.RingGeometry(4.4, 4.48, 96);
    const ringFloorMat = new THREE.MeshBasicMaterial({
      color: 0xd97706,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.3,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    const floorRing = new THREE.Mesh(ringFloorGeo, ringFloorMat);
    floorRing.rotation.x = -Math.PI / 2;
    floorRing.position.set(0, floorY + 0.03, 0);
    scene.add(floorRing);

    // -------------------------------------------------------------------------
    // Composite Hero Sculpture: Crystalline Prism, Gold Gyroscopes & Justice Beam
    // -------------------------------------------------------------------------
    const sculptureGroup = new THREE.Group();
    sculptureGroup.position.set(0, 0.25, 0);
    scene.add(sculptureGroup);

    // Materials with high contrast in metalness & roughness
    const brushedGoldMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      metalness: 0.94,
      roughness: 0.18,
    });
    const titaniumSlateMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.72,
      roughness: 0.34,
    });
    const darkObsidianMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.28,
      roughness: 0.76,
    });

    // 1. Primary Crystal Prism Core
    const prismGeo = new THREE.IcosahedronGeometry(1.22, 0);
    const prismMat = new THREE.MeshPhysicalMaterial({
      color: 0x1d4ed8,
      emissive: 0x1e3a8a,
      emissiveIntensity: 0.35,
      roughness: 0.12,
      metalness: 0.08,
      clearcoat: 1.0,
      ior: 1.72,
      thickness: 1.4,
      attenuationColor: new THREE.Color(0x60a5fa),
      transmission: isSoftwareGl ? 0 : 0.65,
      transparent: true,
      opacity: isSoftwareGl ? 0.62 : 0.94,
      depthWrite: isSoftwareGl ? true : false,
    });
    const prismCore = new THREE.Mesh(prismGeo, prismMat);
    prismCore.renderOrder = 2;
    sculptureGroup.add(prismCore);

    // 2. Inner Golden Nucleus
    const nucleusGeo = new THREE.OctahedronGeometry(0.56, 0);
    const nucleusMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 0.48,
      metalness: 0.9,
      roughness: 0.18,
    });
    const nucleus = new THREE.Mesh(nucleusGeo, nucleusMat);
    nucleus.renderOrder = 1;
    sculptureGroup.add(nucleus);

    // 3. Precision Outer Gyroscopic Rings (3 orthogonal concentric rings)
    const outerRingGeo = new THREE.TorusGeometry(2.65, 0.048, 20, 120);
    const outerGyro = new THREE.Mesh(outerRingGeo, brushedGoldMat);
    outerGyro.rotation.x = Math.PI * 0.32;
    outerGyro.castShadow = !isSoftwareGl;
    sculptureGroup.add(outerGyro);

    const midRingGeo = new THREE.TorusGeometry(2.18, 0.04, 18, 108);
    const midGyro = new THREE.Mesh(midRingGeo, titaniumSlateMat);
    midGyro.rotation.y = Math.PI * 0.28;
    midGyro.rotation.x = -Math.PI * 0.18;
    sculptureGroup.add(midGyro);

    const innerRingGeo = new THREE.TorusGeometry(1.76, 0.032, 16, 96);
    const innerGyro = new THREE.Mesh(innerRingGeo, brushedGoldMat);
    innerGyro.rotation.z = Math.PI * 0.25;
    sculptureGroup.add(innerGyro);

    // 4. Sculptural Justice Balance Assembly (Vertical Pillar + Oscillating Beam + Pans)
    const pillarGroup = new THREE.Group();
    const stemGeo = new THREE.CylinderGeometry(0.055, 0.095, 3.6, 20);
    const stemMesh = new THREE.Mesh(stemGeo, darkObsidianMat);
    stemMesh.position.y = -1.65;
    pillarGroup.add(stemMesh);

    const plinthGeo = new THREE.CylinderGeometry(0.65, 0.88, 0.28, 32);
    const plinthMesh = new THREE.Mesh(plinthGeo, titaniumSlateMat);
    plinthMesh.position.y = -3.4;
    pillarGroup.add(plinthMesh);

    const beamGroup = new THREE.Group();
    beamGroup.position.y = 0.05;
    const beamGeo = new THREE.CylinderGeometry(0.035, 0.035, 4.1, 16);
    const beamBar = new THREE.Mesh(beamGeo, brushedGoldMat);
    beamBar.rotation.z = Math.PI / 2;
    beamGroup.add(beamBar);

    const panGeo = new THREE.ConeGeometry(0.42, 0.18, 24);
    const leftPan = new THREE.Mesh(panGeo, brushedGoldMat);
    leftPan.position.set(-2.0, -0.52, 0);
    leftPan.rotation.x = Math.PI;
    beamGroup.add(leftPan);

    const rightPan = new THREE.Mesh(panGeo, brushedGoldMat);
    rightPan.position.set(2.0, -0.52, 0);
    rightPan.rotation.x = Math.PI;
    beamGroup.add(rightPan);

    const cordGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.52, 8);
    const leftCord = new THREE.Mesh(cordGeo, titaniumSlateMat);
    leftCord.position.set(-2.0, -0.26, 0);
    beamGroup.add(leftCord);

    const rightCord = new THREE.Mesh(cordGeo, titaniumSlateMat);
    rightCord.position.set(2.0, -0.26, 0);
    beamGroup.add(rightCord);

    sculptureGroup.add(pillarGroup);
    sculptureGroup.add(beamGroup);

    // 5. Instanced Orbital Particle Constellation (260 nodes, zero GC)
    const particleCount = 260;
    const pGeo = new THREE.OctahedronGeometry(0.048, 0);
    const pMat = new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      transparent: true,
      opacity: 0.58,
    });
    const particles = new THREE.InstancedMesh(pGeo, pMat, particleCount);
    const particleOrbits: {
      radius: number;
      angle: number;
      speed: number;
      y: number;
      scale: number;
    }[] = [];
    const dummy = new THREE.Object3D();

    for (let i = 0; i < particleCount; i++) {
      const radius = 3.2 + Math.random() * 7.8;
      const angle = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 5.2;
      const scale = 0.55 + Math.random() * 0.9;
      particleOrbits.push({
        radius,
        angle,
        speed: (0.04 + Math.random() * 0.09) * (i % 2 === 0 ? 1 : -1),
        y,
        scale,
      });

      dummy.position.set(
        Math.cos(angle) * radius,
        y,
        Math.sin(angle) * radius
      );
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      particles.setMatrixAt(i, dummy.matrix);
    }
    particles.instanceMatrix.needsUpdate = true;
    particles.frustumCulled = false;
    particles.computeBoundingSphere();
    scene.add(particles);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Subtle pointer parallax (does not capture wheel or click events)
    const pointerTarget = { x: 0, y: 0 };
    const pointerSmooth = { x: 0, y: 0 };

    const onPointerMove = (e: PointerEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      pointerTarget.x = nx * 0.85;
      pointerTarget.y = -ny * 0.45;
    };

    const onResize = () => {
      const w = getWidth();
      const h = getHeight();
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('resize', onResize);

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
          const state = sync
            ? gl.getSyncParameter(sync, gl.SYNC_STATUS)
            : gl.SIGNALED;
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

      if (!prefersReducedMotion) {
        // Gentle orbital rotation & sculptural breathing
        prismCore.rotation.y += delta * 0.24;
        prismCore.rotation.x = Math.sin(elapsed * 0.35) * 0.14;
        nucleus.rotation.y -= delta * 0.42;
        nucleus.rotation.z += delta * 0.18;

        outerGyro.rotation.y += delta * 0.28;
        outerGyro.rotation.z += delta * 0.08;
        midGyro.rotation.x += delta * 0.21;
        midGyro.rotation.z -= delta * 0.19;
        innerGyro.rotation.y -= delta * 0.35;

        beamGroup.rotation.z = Math.sin(elapsed * 0.72) * 0.065;
        beamGroup.rotation.y = Math.sin(elapsed * 0.25) * 0.18;
        floorRing.rotation.z = elapsed * 0.08;

        sculptureGroup.position.y = 0.25 + Math.sin(elapsed * 0.9) * 0.12;

        for (let i = 0; i < particleCount; i++) {
          const item = particleOrbits[i];
          item.angle += delta * item.speed;
          dummy.position.set(
            Math.cos(item.angle) * item.radius,
            item.y + Math.sin(elapsed * 0.8 + i) * 0.12,
            Math.sin(item.angle) * item.radius
          );
          dummy.scale.setScalar(item.scale);
          dummy.updateMatrix();
          particles.setMatrixAt(i, dummy.matrix);
        }
        particles.instanceMatrix.needsUpdate = true;
      }

      // Smooth damped pointer parallax
      pointerSmooth.x = THREE.MathUtils.damp(
        pointerSmooth.x,
        pointerTarget.x,
        3.5,
        delta
      );
      pointerSmooth.y = THREE.MathUtils.damp(
        pointerSmooth.y,
        pointerTarget.y,
        3.5,
        delta
      );

      // Frame sculpture gracefully toward right on wide viewports so left hero headline stays airy
      const desktopOffset = window.innerWidth >= 1024 ? -2.35 : 0;
      camera.position.x = desktopOffset + pointerSmooth.x;
      camera.position.y = 1.25 + pointerSmooth.y;
      _camTarget.set(desktopOffset * 0.85, 0.1, 0);
      camera.lookAt(_camTarget);

      renderer.render(scene, camera);

      if (prefersReducedMotion) return;
      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    if (isSoftwareGl || prefersReducedMotion) {
      tick();
    } else {
      frameId = requestAnimationFrame(tick);
    }

    return () => {
      isDisposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);

      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('resize', onResize);
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

  if (fallbackActive) {
    return (
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_72%_38%,rgba(245,158,11,0.16),transparent_48%),radial-gradient(circle_at_24%_70%,rgba(37,99,235,0.18),transparent_52%)] pointer-events-none"
      />
    );
  }

  return (
    <div
      ref={mountRef}
      aria-hidden="true"
      className="absolute inset-0 w-full h-full pointer-events-none select-none overflow-hidden"
    />
  );
};
