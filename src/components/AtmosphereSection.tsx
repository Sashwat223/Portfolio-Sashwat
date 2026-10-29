import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { PortfolioConfig } from '../data/portfolioData';
import {
  applyStudioEnvironment,
  cancelScheduledFrame,
  createStudioRenderer,
  scheduleNextFrame,
} from '../utils/webgl';

interface AtmosphereSectionProps {
  config: PortfolioConfig['atmosphere'];
  activeTheme: 'cinematic' | 'tea' | 'coffee';
  onSelectTheme: (theme: 'cinematic' | 'tea' | 'coffee') => void;
}

function createLiquidTexture(isCoffee: boolean): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(128, 128, 10, 128, 128, 128);
  if (isCoffee) {
    // Rich espresso crema radial gradient
    grad.addColorStop(0, '#5a2d14');
    grad.addColorStop(0.55, '#8c4b22');
    grad.addColorStop(0.85, '#c87d3b');
    grad.addColorStop(1, '#3b1b0a');
  } else {
    // Ceremonial sage/matcha green radial gradient
    grad.addColorStop(0, '#446846');
    grad.addColorStop(0.6, '#5c8459');
    grad.addColorStop(0.88, '#7ea476');
    grad.addColorStop(1, '#355237');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  // Subtle crema / tea foam micro-bubbles near rim
  for (let i = 0; i < 65; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 70 + Math.random() * 48;
    const x = 128 + Math.cos(angle) * dist;
    const y = 128 + Math.sin(angle) * dist;
    ctx.fillStyle = isCoffee ? 'rgba(245, 196, 138, 0.22)' : 'rgba(218, 240, 210, 0.22)';
    ctx.beginPath();
    ctx.arc(x, y, 1 + Math.random() * 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createRadialGradient(64, 64, 8, 64, 64, 60);
  g.addColorStop(0, 'rgba(0,0,0,0.65)');
  g.addColorStop(0.5, 'rgba(0,0,0,0.28)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(canvas);
}

const CupViewport: React.FC<{ isCoffee: boolean }> = ({ isCoffee }) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      34,
      (container.clientWidth || 400) / (container.clientHeight || 320),
      0.1,
      100
    );
    camera.position.set(0, 2.25, 5.15);
    camera.lookAt(0, 0.12, 0);

    const renderer = createStudioRenderer(container);
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const envTex = applyStudioEnvironment(renderer, scene);

    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // Contact shadow plane
    const shadowTex = createContactShadowTexture();
    const shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(4.4, 4.4),
      new THREE.MeshBasicMaterial({
        map: shadowTex,
        transparent: true,
        depthWrite: false,
        opacity: 0.7,
      })
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -0.68;
    rootGroup.add(shadowPlane);

    // Fine ceramic / porcelain material
    const ceramicMat = new THREE.MeshPhysicalMaterial({
      color: isCoffee ? 0x130d09 : 0xfaf6ee,
      roughness: isCoffee ? 0.11 : 0.06,
      metalness: isCoffee ? 0.08 : 0.02,
      clearcoat: 1.0,
      clearcoatRoughness: 0.03,
      reflectivity: 0.96,
      ior: 1.54,
      envMapIntensity: 1.35,
    });

    // 24K Brushed Gold Trim
    const goldRimMat = new THREE.MeshPhysicalMaterial({
      color: 0xf4bd62,
      metalness: 0.96,
      roughness: 0.16,
      clearcoat: 0.6,
      envMapIntensity: 1.6,
    });

    // 1. Saucer Lathe
    const saucerPoints = [
      new THREE.Vector2(0, -0.65),
      new THREE.Vector2(0.95, -0.65),
      new THREE.Vector2(1.02, -0.59),
      new THREE.Vector2(1.3, -0.56),
      new THREE.Vector2(1.86, -0.4),
      new THREE.Vector2(2.02, -0.29),
      new THREE.Vector2(1.96, -0.3),
      new THREE.Vector2(1.76, -0.41),
      new THREE.Vector2(1.2, -0.56),
      new THREE.Vector2(0.64, -0.59),
      new THREE.Vector2(0, -0.59),
    ];
    const saucerGeo = new THREE.LatheGeometry(saucerPoints, 72);
    saucerGeo.computeVertexNormals();
    const saucer = new THREE.Mesh(saucerGeo, ceramicMat);
    rootGroup.add(saucer);

    // 2. Saucer Gold Outer Rim & Inner Well Ring
    const saucerGold = new THREE.Mesh(new THREE.TorusGeometry(1.98, 0.022, 20, 96), goldRimMat);
    saucerGold.rotation.x = Math.PI / 2;
    saucerGold.position.y = -0.3;
    rootGroup.add(saucerGold);

    const innerWellGold = new THREE.Mesh(new THREE.TorusGeometry(0.68, 0.012, 16, 64), goldRimMat);
    innerWellGold.rotation.x = Math.PI / 2;
    innerWellGold.position.y = -0.58;
    rootGroup.add(innerWellGold);

    // 3. Cup Lathe
    const cupPoints = isCoffee
      ? [
          new THREE.Vector2(0, -0.52),
          new THREE.Vector2(0.48, -0.52),
          new THREE.Vector2(0.52, -0.45),
          new THREE.Vector2(0.56, -0.32),
          new THREE.Vector2(0.72, -0.08),
          new THREE.Vector2(0.95, 0.28),
          new THREE.Vector2(1.12, 0.68),
          new THREE.Vector2(1.18, 0.96),
          new THREE.Vector2(1.12, 1.02),
          new THREE.Vector2(1.03, 0.98),
          new THREE.Vector2(0.94, 0.65),
          new THREE.Vector2(0.78, 0.22),
          new THREE.Vector2(0.56, -0.12),
          new THREE.Vector2(0.38, -0.38),
          new THREE.Vector2(0, -0.42),
        ]
      : [
          new THREE.Vector2(0, -0.5),
          new THREE.Vector2(0.48, -0.5),
          new THREE.Vector2(0.52, -0.44),
          new THREE.Vector2(0.55, -0.32),
          new THREE.Vector2(0.72, -0.06),
          new THREE.Vector2(1.02, 0.32),
          new THREE.Vector2(1.35, 0.76),
          new THREE.Vector2(1.46, 1.02),
          new THREE.Vector2(1.4, 1.06),
          new THREE.Vector2(1.32, 1.03),
          new THREE.Vector2(1.22, 0.74),
          new THREE.Vector2(0.92, 0.3),
          new THREE.Vector2(0.65, -0.06),
          new THREE.Vector2(0.44, -0.34),
          new THREE.Vector2(0, -0.38),
        ];
    const cupGeo = new THREE.LatheGeometry(cupPoints, 72);
    cupGeo.computeVertexNormals();
    const cup = new THREE.Mesh(cupGeo, ceramicMat);
    rootGroup.add(cup);

    // 4. Cup Lip Gold Rim
    const rimRadius = isCoffee ? 1.13 : 1.39;
    const rimGold = new THREE.Mesh(new THREE.TorusGeometry(rimRadius, 0.024, 20, 96), goldRimMat);
    rimGold.rotation.x = Math.PI / 2;
    rimGold.position.y = isCoffee ? 1.0 : 1.045;
    rootGroup.add(rimGold);

    // 5. Swept Ergonomic Handle
    const curve = isCoffee
      ? new THREE.CatmullRomCurve3([
          new THREE.Vector3(0.95, 0.72, 0),
          new THREE.Vector3(1.58, 0.62, 0),
          new THREE.Vector3(1.62, 0.22, 0),
          new THREE.Vector3(1.25, 0.05, 0),
          new THREE.Vector3(0.76, 0.02, 0),
        ])
      : new THREE.CatmullRomCurve3([
          new THREE.Vector3(1.18, 0.82, 0),
          new THREE.Vector3(1.85, 0.68, 0),
          new THREE.Vector3(1.82, 0.22, 0),
          new THREE.Vector3(1.38, 0.02, 0),
          new THREE.Vector3(0.85, 0.05, 0),
        ]);
    const handleGeo = new THREE.TubeGeometry(curve, 40, isCoffee ? 0.088 : 0.078, 20, false);
    const handle = new THREE.Mesh(handleGeo, ceramicMat);
    rootGroup.add(handle);

    // 6. Realistic Beverage Liquid Surface with Crema / Matcha Texture
    const liquidTex = createLiquidTexture(isCoffee);
    const liquidMat = new THREE.MeshPhysicalMaterial({
      map: liquidTex,
      roughness: isCoffee ? 0.18 : 0.08,
      metalness: 0.02,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
      reflectivity: 0.95,
      ior: 1.36,
    });
    const liquid = new THREE.Mesh(
      new THREE.CylinderGeometry(
        isCoffee ? 1.01 : 1.24,
        isCoffee ? 0.95 : 1.14,
        0.045,
        64
      ),
      liquidMat
    );
    liquid.position.y = 0.8;
    rootGroup.add(liquid);

    // 7. Rising Aroma / Steam Particles (Matching Screenshot)
    const particleCount = 34;
    const pGeo = new THREE.BufferGeometry();
    const pPositions = new Float32Array(particleCount * 3);
    const pPhases: number[] = [];
    for (let i = 0; i < particleCount; i++) {
      const r = Math.random() * 0.65;
      const theta = Math.random() * Math.PI * 2;
      pPositions[i * 3] = Math.cos(theta) * r;
      pPositions[i * 3 + 1] = 0.9 + Math.random() * 1.1;
      pPositions[i * 3 + 2] = Math.sin(theta) * r;
      pPhases.push(Math.random() * Math.PI * 2);
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));

    const pMat = new THREE.PointsMaterial({
      color: isCoffee ? 0xf5b971 : 0xa7e3b0,
      size: 0.065,
      transparent: true,
      opacity: 0.68,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const aromaPoints = new THREE.Points(pGeo, pMat);
    rootGroup.add(aromaPoints);

    // Studio 3-Point Lighting Rig
    const hemiLight = new THREE.HemisphereLight(
      isCoffee ? 0xffe4c4 : 0xe8f5e9,
      0x18181b,
      1.1
    );
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(isCoffee ? 0xffb26b : 0xb8e0b8, 2.8);
    keyLight.position.set(4, 5.5, 4);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.6);
    rimLight.position.set(-4.5, 3.2, -3.5);
    scene.add(rimLight);

    let targetRotX = 0;
    let targetRotZ = 0;

    const onPointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      targetRotZ = -nx * 0.16;
      targetRotX = ny * 0.14;
    };

    const onPointerLeave = () => {
      targetRotX = 0;
      targetRotZ = 0;
    };

    container.addEventListener('pointermove', onPointerMove);
    container.addEventListener('pointerleave', onPointerLeave);

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || 400;
      const h = container.clientHeight || 320;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    const clock = new THREE.Clock();
    const frameHandle = { id: 0, isTimeout: false };

    const tick = () => {
      const dt = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.getElapsedTime();

      rootGroup.rotation.y += dt * 0.35;
      rootGroup.rotation.x = THREE.MathUtils.damp(rootGroup.rotation.x, targetRotX, 5, dt);
      rootGroup.rotation.z = THREE.MathUtils.damp(rootGroup.rotation.z, targetRotZ, 5, dt);

      // Subtle liquid swirl
      liquid.rotation.y = elapsed * 0.12;

      // Animate rising aroma particles
      const posAttr = pGeo.getAttribute('position') as THREE.BufferAttribute;
      for (let i = 0; i < particleCount; i++) {
        let py = posAttr.getY(i) + dt * 0.28;
        if (py > 2.05) py = 0.88;
        const px = posAttr.getX(i) + Math.sin(elapsed * 1.8 + pPhases[i]) * 0.0018;
        posAttr.setXY(i, px, py);
      }
      posAttr.needsUpdate = true;

      renderer.render(scene, camera);
      scheduleNextFrame(renderer, tick, frameHandle);
    };

    tick();

    return () => {
      cancelScheduledFrame(frameHandle);
      container.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('pointerleave', onPointerLeave);
      window.removeEventListener('resize', onResize);
      envTex.dispose();
      liquidTex.dispose();
      shadowTex.dispose();
      renderer.dispose();
    };
  }, [isCoffee]);

  return <div ref={mountRef} className="w-full h-72 sm:h-80 flex items-center justify-center mb-8" />;
};

export const AtmosphereSection: React.FC<AtmosphereSectionProps> = ({
  config,
  activeTheme,
  onSelectTheme,
}) => {
  return (
    <section id="atmosphere" className="relative w-full py-32 px-6 sm:px-12 lg:px-16">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-3xl mb-16 sm:mb-20">
          <span className="type-kicker text-cyan-400 block mb-4">
            {config.kicker.replace(/^\/?\d+\s*[—\-·/]+\s*/i, '')}
          </span>
          <h2 className="type-section-heading mb-5 text-balance">
            {config.headlinePrefix} <span className="italic font-normal">tea</span> or{' '}
            <span className="italic font-normal">coffee</span>?
          </h2>
          <p className="type-body-lead">
            {config.subtext}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Tea Card */}
          <div
            onClick={() => onSelectTheme('tea')}
            className={`cursor-pointer rounded-3xl p-8 sm:p-12 card-surface hover:brightness-105 transition-all group flex flex-col justify-between ${
              activeTheme === 'tea' ? 'ring-2 ring-[#466B54]' : ''
            }`}
          >
            <CupViewport isCoffee={false} />
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="type-card-heading">Tea</h3>
                {activeTheme === 'tea' && (
                  <span className="type-kicker text-[#466B54]">
                    Active Atmosphere
                  </span>
                )}
              </div>
              <p className="font-sans text-base sm:text-[1.0625rem] text-zinc-300 leading-relaxed mb-7 font-normal max-w-[52ch]">
                {config.teaDesc}
              </p>
              <button
                type="button"
                className="w-full py-3.5 rounded-full type-nav-button card-elevated group-hover:bg-[#466B54] group-hover:!text-white transition-colors"
              >
                Select Tea Atmosphere
              </button>
            </div>
          </div>

          {/* Coffee Card */}
          <div
            onClick={() => onSelectTheme('coffee')}
            className={`cursor-pointer rounded-3xl p-8 sm:p-12 card-surface hover:brightness-105 transition-all group flex flex-col justify-between ${
              activeTheme === 'coffee' ? 'ring-2 ring-[#D78B44]' : ''
            }`}
          >
            <CupViewport isCoffee={true} />
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="type-card-heading">Coffee</h3>
                {activeTheme === 'coffee' && (
                  <span className="type-kicker text-[#D78B44]">
                    Active Atmosphere
                  </span>
                )}
              </div>
              <p className="font-sans text-base sm:text-[1.0625rem] text-zinc-300 leading-relaxed mb-7 font-normal max-w-[52ch]">
                {config.coffeeDesc}
              </p>
              <button
                type="button"
                className="w-full py-3.5 rounded-full type-nav-button card-elevated group-hover:bg-[#D78B44] group-hover:!text-black transition-colors"
              >
                Select Coffee Atmosphere
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
