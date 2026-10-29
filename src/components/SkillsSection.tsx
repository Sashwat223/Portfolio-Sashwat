import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Sparkles, Orbit, Zap } from 'lucide-react';
import { SkillNode } from '../data/portfolioData';
import {
  applyStudioEnvironment,
  cancelScheduledFrame,
  createStudioRenderer,
  scheduleNextFrame,
} from '../utils/webgl';

interface SkillsSectionProps {
  skills: SkillNode[];
}

/**
 * Generates a high-resolution 512x512 Apple-grade glossy icon texture with custom vector logos
 * for each engineering capability so every face of the 3D cube is colorful and unmistakable.
 */
function createSkillLogoTexture(skill: SkillNode): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const baseColor = skill.color || '#38BDF8';

  // 1. Vibrant Apple-style radial & diagonal gradient tile background
  const bgGrad = ctx.createLinearGradient(0, 0, 512, 512);
  bgGrad.addColorStop(0, baseColor);
  bgGrad.addColorStop(0.55, shadeHexColor(baseColor, -22));
  bgGrad.addColorStop(1, shadeHexColor(baseColor, -48));
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 512, 512);

  // Top-left specular studio highlight glow
  const glowGrad = ctx.createRadialGradient(120, 100, 10, 160, 140, 340);
  glowGrad.addColorStop(0, 'rgba(255, 255, 255, 0.38)');
  glowGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.08)');
  glowGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = glowGrad;
  ctx.fillRect(0, 0, 512, 512);

  // Soft inner bevel cushion (no harsh stroke)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.16)';
  roundRect(ctx, 28, 28, 456, 456, 72);
  ctx.fill();

  // 2. Draw authentic vector logo for each technology in the center
  ctx.save();
  ctx.translate(256, 224);
  ctx.strokeStyle = '#FFFFFF';
  ctx.fillStyle = '#FFFFFF';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 6;

  const id = skill.id.toLowerCase();

  if (id === 'ts' || skill.tag === 'TS') {
    // TypeScript official tile style
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    roundRect(ctx, -110, -110, 220, 220, 36);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 132px -apple-system, BlinkMacSystemFont, "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('TS', 0, 8);
  } else if (id === 'react' || skill.tag === 'REACT') {
    // React atomic orbits
    ctx.lineWidth = 14;
    for (let a = 0; a < 3; a++) {
      ctx.save();
      ctx.rotate((a * Math.PI) / 3);
      ctx.beginPath();
      ctx.ellipse(0, 0, 122, 46, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'nextjs' || skill.tag === 'NEXT') {
    // Next.js N monogram with diagonal slash
    ctx.beginPath();
    ctx.arc(0, 0, 112, 0, Math.PI * 2);
    ctx.fillStyle = '#090A0F';
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 22;
    ctx.beginPath();
    ctx.moveTo(-48, 58);
    ctx.lineTo(-48, -58);
    ctx.lineTo(58, 72);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(48, -58);
    ctx.lineTo(48, 28);
    ctx.stroke();
  } else if (id === 'threejs' || skill.tag === '3D') {
    // Three.js subdivided triangle lattice
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(0, -112);
    ctx.lineTo(106, 82);
    ctx.lineTo(-106, 82);
    ctx.closePath();
    ctx.stroke();
    // Inner inverted triangle
    ctx.beginPath();
    ctx.moveTo(-53, -15);
    ctx.lineTo(53, -15);
    ctx.lineTo(0, 82);
    ctx.closePath();
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.fill();
  } else if (id === 'gsap' || skill.tag === 'GSAP') {
    // GSAP high-voltage lightning bolt
    ctx.beginPath();
    ctx.moveTo(18, -115);
    ctx.lineTo(-68, 10);
    ctx.lineTo(4, 10);
    ctx.lineTo(-22, 115);
    ctx.lineTo(74, -14);
    ctx.lineTo(2, -14);
    ctx.closePath();
    ctx.fill();
  } else if (id === 'python' || skill.tag === 'PY') {
    // Python dual interlocking emblems
    ctx.fillStyle = '#3776AB';
    roundRect(ctx, -95, -95, 130, 110, 32);
    ctx.fill();
    ctx.fillStyle = '#FFD43B';
    roundRect(ctx, -35, -15, 130, 110, 32);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(-55, -60, 10, 0, Math.PI * 2);
    ctx.arc(55, 60, 10, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'pandas' || skill.tag === 'PD') {
    // pandas vertical data bars + accent blocks
    ctx.fillStyle = '#FFFFFF';
    roundRect(ctx, -78, -95, 34, 190, 14);
    ctx.fill();
    roundRect(ctx, 44, -95, 34, 190, 14);
    ctx.fill();
    roundRect(ctx, -17, -95, 34, 58, 12);
    ctx.fill();
    roundRect(ctx, -17, 37, 34, 58, 12);
    ctx.fill();
    ctx.fillStyle = '#FACC15';
    roundRect(ctx, -17, -22, 34, 44, 10);
    ctx.fill();
  } else if (id === 'numpy' || skill.tag === 'NP') {
    // NumPy isometric 3D cube
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(0, -108);
    ctx.lineTo(96, -54);
    ctx.lineTo(96, 54);
    ctx.lineTo(0, 108);
    ctx.lineTo(-96, 54);
    ctx.lineTo(-96, -54);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-96, -54);
    ctx.lineTo(0, 0);
    ctx.lineTo(96, -54);
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 108);
    ctx.stroke();
  } else if (id === 'sql' || skill.tag === 'SQL') {
    // SQL stacked database cylinders
    ctx.lineWidth = 13;
    for (const cy of [-62, 0, 62]) {
      ctx.beginPath();
      ctx.ellipse(0, cy, 88, 28, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.22)';
      ctx.fill();
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(-88, -62);
    ctx.lineTo(-88, 62);
    ctx.moveTo(88, -62);
    ctx.lineTo(88, 62);
    ctx.stroke();
  } else if (id === 'ml' || skill.tag === 'ML') {
    // Machine Learning neural network graph
    const pts: [number, number][] = [
      [-78, -64],
      [-78, 64],
      [0, -92],
      [0, 0],
      [0, 92],
      [82, -46],
      [82, 46],
    ];
    ctx.lineWidth = 9;
    ctx.strokeStyle = 'rgba(255,255,255,0.65)';
    for (let i = 0; i < 2; i++) {
      for (let j = 2; j < 5; j++) {
        ctx.beginPath();
        ctx.moveTo(pts[i][0], pts[i][1]);
        ctx.lineTo(pts[j][0], pts[j][1]);
        ctx.stroke();
      }
    }
    for (let j = 2; j < 5; j++) {
      for (let k = 5; k < 7; k++) {
        ctx.beginPath();
        ctx.moveTo(pts[j][0], pts[j][1]);
        ctx.lineTo(pts[k][0], pts[k][1]);
        ctx.stroke();
      }
    }
    ctx.fillStyle = '#FFFFFF';
    pts.forEach(([px, py]) => {
      ctx.beginPath();
      ctx.arc(px, py, 20, 0, Math.PI * 2);
      ctx.fill();
    });
  } else if (id === 'git' || skill.tag === 'GIT') {
    // Git branch graph
    ctx.lineWidth = 16;
    ctx.beginPath();
    ctx.moveTo(-54, -84);
    ctx.lineTo(-54, 84);
    ctx.moveTo(-54, -22);
    ctx.quadraticCurveTo(54, -22, 54, 48);
    ctx.stroke();
    for (const [gx, gy] of [
      [-54, -84],
      [-54, 84],
      [54, 48],
    ]) {
      ctx.beginPath();
      ctx.arc(gx, gy, 24, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // APIs interconnected hub
    ctx.lineWidth = 13;
    for (let a = 0; a < 6; a++) {
      const ang = (a * Math.PI) / 3;
      const nx = Math.cos(ang) * 88;
      const ny = Math.sin(ang) * 88;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(nx, ny);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(nx, ny, 18, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(0, 0, 34, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // 3. Crisp Title Label at Bottom of Tile
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '600 42px "Space Grotesk", "Satoshi", "Manrope", -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
  ctx.shadowBlur = 12;
  ctx.fillText(skill.name, 256, 422);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function shadeHexColor(hex: string, percent: number): string {
  const clean = hex.replace('#', '');
  const num = parseInt(clean.length === 3 ? clean.replace(/(.)/g, '$1$1') : clean, 16) || 0x38bdf8;
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, Math.min(255, (num >> 16) + amt));
  const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amt));
  const B = Math.max(0, Math.min(255, (num & 0x0000ff) + amt));
  return `#${((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1)}`;
}

/**
 * Builds a beveled 3D Rounded Cube geometry so light catches the glossy edges
 */
function createRoundedCubeGeometry(size: number, radius: number, smoothness: number): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  const eps = 0.00001;
  const r = radius - eps;
  shape.absarc(eps, eps, eps, -Math.PI / 2, -Math.PI, true);
  shape.absarc(eps, size - r * 2, eps, Math.PI, Math.PI / 2, true);
  shape.absarc(size - r * 2, size - r * 2, eps, Math.PI / 2, 0, true);
  shape.absarc(size - r * 2, eps, eps, 0, -Math.PI / 2, true);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: size - radius * 2,
    bevelEnabled: true,
    bevelSegments: smoothness * 2,
    steps: 1,
    bevelSize: r,
    bevelThickness: radius,
    curveSegments: smoothness,
  });
  geo.center();
  return geo;
}

export const SkillsSection: React.FC<SkillsSectionProps> = ({ skills }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [selectedSkill, setSelectedSkill] = useState<SkillNode>(skills[0]);
  const [physicsMode, setPhysicsMode] = useState<'constellation' | 'zerog'>('constellation');
  const physicsModeRef = useRef<'constellation' | 'zerog'>('constellation');
  physicsModeRef.current = physicsMode;

  const selectedIdRef = useRef<string>(skills[0]?.id || '');
  selectedIdRef.current = selectedSkill?.id || '';

  const impulseTriggerRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (skills.length > 0 && !skills.some((s) => s.id === selectedSkill?.id)) {
      setSelectedSkill(skills[0]);
    }
  }, [skills, selectedSkill]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container || skills.length === 0) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      38,
      (container.clientWidth || 800) / (container.clientHeight || 540),
      0.1,
      100
    );
    camera.position.set(0, 0, 15.2);

    const renderer = createStudioRenderer(container);
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const envTex = applyStudioEnvironment(renderer, scene);

    // Bright Apple-Studio 3-Point Lighting so colorful logo cubes pop vividly
    scene.add(new THREE.HemisphereLight(0xffffff, 0x181824, 1.85));
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.8);
    keyLight.position.set(8, 10, 12);
    scene.add(keyLight);

    const cyanRim = new THREE.DirectionalLight(0x38bdf8, 2.2);
    cyanRim.position.set(-9, 6, 8);
    scene.add(cyanRim);

    const warmRim = new THREE.DirectionalLight(0xf59e0b, 1.8);
    warmRim.position.set(6, -8, 7);
    scene.add(warmRim);

    // Ambient Colorful Stardust Field
    const starCount = 160;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      starPos[i * 3] = (Math.random() - 0.5) * 26;
      starPos[i * 3 + 1] = (Math.random() - 0.5) * 15;
      starPos[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xbae6fd,
      size: 0.08,
      transparent: true,
      opacity: 0.6,
    });
    scene.add(new THREE.Points(starGeo, starMat));

    const worldGroup = new THREE.Group();
    scene.add(worldGroup);

    // Shared Cube Geometry with UV mapping on all 6 faces
    const cubeGeo = new THREE.BoxGeometry(1.72, 1.72, 1.72);
    const bevelShellGeo = createRoundedCubeGeometry(1.88, 0.22, 4);

    const ringMat = new THREE.MeshPhysicalMaterial({
      color: 0xf8fafc,
      metalness: 0.9,
      roughness: 0.15,
      clearcoat: 1.0,
    });

    const hitMeshes: THREE.Object3D[] = [];
    const texturesToDispose: THREE.Texture[] = [];

    interface PhysicsNode {
      skill: SkillNode;
      group: THREE.Group;
      cubeMesh: THREE.Mesh;
      shellMesh: THREE.Mesh;
      ringMesh: THREE.Mesh;
      pos: THREE.Vector3;
      vel: THREE.Vector3;
      angVel: THREE.Vector3;
      homePos: THREE.Vector3;
      radius: number;
    }

    const nodes: PhysicsNode[] = [];

    // Arrange initial positions in an organic 2-row 3D grid / ellipse
    skills.forEach((s, i) => {
      const cols = 4;
      const row = Math.floor(i / cols);
      const col = i % cols;
      const homeX = (col - 1.5) * 3.6 + (row % 2 === 0 ? -0.35 : 0.35);
      const homeY = (1 - row) * 2.75;
      const homeZ = Math.sin(i * 1.1) * 1.1;

      const itemGroup = new THREE.Group();
      itemGroup.position.set(homeX, homeY, homeZ);

      const logoTex = createSkillLogoTexture(s);
      texturesToDispose.push(logoTex);

      // 1. High-visibility Colorful Logo Cube (logo mapped cleanly on all 6 sides)
      const cubeMat = new THREE.MeshPhysicalMaterial({
        map: logoTex,
        roughness: 0.14,
        metalness: 0.08,
        clearcoat: 1.0,
        clearcoatRoughness: 0.06,
        reflectivity: 0.95,
        envMapIntensity: 1.4,
      });
      const cubeMesh = new THREE.Mesh(cubeGeo, cubeMat);
      cubeMesh.userData = { skill: s, nodeIndex: i };
      itemGroup.add(cubeMesh);
      hitMeshes.push(cubeMesh);

      // 2. Optical Glass Rounded Bevel Casing around the Logo Cube
      const shellMat = new THREE.MeshPhysicalMaterial({
        color: s.color,
        roughness: 0.08,
        metalness: 0.05,
        transmission: 0.55,
        transparent: true,
        opacity: 0.28,
        clearcoat: 1.0,
      });
      const shellMesh = new THREE.Mesh(bevelShellGeo, shellMat);
      shellMesh.userData = { skill: s, nodeIndex: i };
      itemGroup.add(shellMesh);
      hitMeshes.push(shellMesh);

      // 3. Glowing Colored Gyroscopic Orbit Ring
      const coloredRingMat = ringMat.clone();
      coloredRingMat.color = new THREE.Color(s.color);
      coloredRingMat.emissive = new THREE.Color(s.color);
      coloredRingMat.emissiveIntensity = 0.45;
      const ringMesh = new THREE.Mesh(
        new THREE.TorusGeometry(1.48, 0.025, 16, 64),
        coloredRingMat
      );
      ringMesh.rotation.x = Math.PI / 3;
      ringMesh.rotation.y = Math.PI / 6;
      itemGroup.add(ringMesh);

      // Slight initial tilt so 3D depth and front logo are immediately readable
      cubeMesh.rotation.set(0.18, -0.22, 0);
      shellMesh.rotation.copy(cubeMesh.rotation);

      worldGroup.add(itemGroup);
      nodes.push({
        skill: s,
        group: itemGroup,
        cubeMesh,
        shellMesh,
        ringMesh,
        pos: new THREE.Vector3(homeX, homeY, homeZ),
        vel: new THREE.Vector3(
          (Math.random() - 0.5) * 1.8,
          (Math.random() - 0.5) * 1.8,
          (Math.random() - 0.5) * 0.8
        ),
        angVel: new THREE.Vector3(
          (Math.random() - 0.5) * 0.6,
          (Math.random() - 0.5) * 0.8,
          (Math.random() - 0.5) * 0.3
        ),
        homePos: new THREE.Vector3(homeX, homeY, homeZ),
        radius: 1.38,
      });
    });

    // Expose shockwave impulse trigger to React button
    impulseTriggerRef.current = () => {
      nodes.forEach((n) => {
        n.vel.set(
          (Math.random() - 0.5) * 14,
          (Math.random() - 0.5) * 12,
          (Math.random() - 0.5) * 6
        );
        n.angVel.set(
          (Math.random() - 0.5) * 6,
          (Math.random() - 0.5) * 6,
          (Math.random() - 0.5) * 4
        );
      });
    };

    // Interactive Raycasting, Cursor Repulsion & Drag/Fling Physics
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2(-10, -10);
    const cursorWorldPos = new THREE.Vector3(0, 0, -100);
    let isPointerInside = false;
    let draggedNode: PhysicsNode | null = null;
    let prevPointerWorld = new THREE.Vector3();

    const updatePointerWorld = (e: PointerEvent | MouseEvent) => {
      const rect = container.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      const vec = new THREE.Vector3(pointer.x, pointer.y, 0.5);
      vec.unproject(camera);
      const dir = vec.sub(camera.position).normalize();
      const distance = -camera.position.z / dir.z;
      cursorWorldPos.copy(camera.position).add(dir.multiplyScalar(distance));
    };

    const onPointerDown = (e: PointerEvent) => {
      isPointerInside = true;
      updatePointerWorld(e);
      raycaster.setFromCamera(pointer, camera);
      const intersects = raycaster.intersectObjects(hitMeshes, false);
      if (intersects.length > 0) {
        const hitData = intersects[0].object.userData;
        if (hitData?.skill) {
          setSelectedSkill(hitData.skill);
        }
        if (typeof hitData?.nodeIndex === 'number') {
          draggedNode = nodes[hitData.nodeIndex];
          prevPointerWorld.copy(cursorWorldPos);
          // Give clicked cube an immediate physical spin & pop impulse
          draggedNode.angVel.x += (Math.random() - 0.5) * 5;
          draggedNode.angVel.y += 4.2;
          draggedNode.vel.z += 2.2;
        }
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      isPointerInside = true;
      updatePointerWorld(e);

      if (draggedNode) {
        const delta = cursorWorldPos.clone().sub(prevPointerWorld);
        draggedNode.pos.x = cursorWorldPos.x;
        draggedNode.pos.y = cursorWorldPos.y;
        draggedNode.vel.copy(delta.multiplyScalar(28));
        draggedNode.angVel.y += delta.x * 1.5;
        draggedNode.angVel.x -= delta.y * 1.5;
        prevPointerWorld.copy(cursorWorldPos);
      }
    };

    const onPointerUp = () => {
      draggedNode = null;
    };

    const onPointerLeave = () => {
      isPointerInside = false;
      draggedNode = null;
      cursorWorldPos.set(0, 0, -100);
    };

    container.addEventListener('pointerdown', onPointerDown);
    container.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    container.addEventListener('pointerleave', onPointerLeave);

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || 800;
      const h = container.clientHeight || 540;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    const clock = new THREE.Clock();
    const frameHandle = { id: 0, isTimeout: false };
    const tempDiff = new THREE.Vector3();

    const tick = () => {
      const dt = Math.min(clock.getDelta(), 0.05);
      const elapsed = clock.getElapsedTime();
      const isZeroG = physicsModeRef.current === 'zerog';

      // 1. Physics integration per cube
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const isSelected = n.skill.id === selectedIdRef.current;

        if (n !== draggedNode) {
          if (!isZeroG) {
            // Spring tether force toward home position + gentle float wave
            const targetX = n.homePos.x + Math.sin(elapsed * 1.2 + i) * 0.22;
            const targetY = n.homePos.y + Math.cos(elapsed * 1.4 + i * 0.7) * 0.22;
            const targetZ = isSelected ? 1.4 : n.homePos.z;

            n.vel.x += (targetX - n.pos.x) * 6.5 * dt;
            n.vel.y += (targetY - n.pos.y) * 6.5 * dt;
            n.vel.z += (targetZ - n.pos.z) * 6.5 * dt;

            // Smooth velocity damping
            n.vel.multiplyScalar(Math.pow(0.18, dt));
          } else {
            // Zero-G mode: subtle buoyancy + arena wall bounds
            n.vel.y += Math.sin(elapsed * 1.5 + i) * 0.4 * dt;
            n.vel.z += (0 - n.pos.z) * 2.0 * dt;
            n.vel.multiplyScalar(Math.pow(0.75, dt));

            const boundX = 7.4;
            const boundY = 3.6;
            if (n.pos.x > boundX) {
              n.pos.x = boundX;
              n.vel.x = -Math.abs(n.vel.x) * 0.9;
              n.angVel.y += 2;
            } else if (n.pos.x < -boundX) {
              n.pos.x = -boundX;
              n.vel.x = Math.abs(n.vel.x) * 0.9;
              n.angVel.y -= 2;
            }
            if (n.pos.y > boundY) {
              n.pos.y = boundY;
              n.vel.y = -Math.abs(n.vel.y) * 0.9;
              n.angVel.x += 2;
            } else if (n.pos.y < -boundY) {
              n.pos.y = -boundY;
              n.vel.y = Math.abs(n.vel.y) * 0.9;
              n.angVel.x -= 2;
            }
          }

          // Interactive cursor magnetic repulsion / bumper impulse
          if (isPointerInside) {
            const dx = n.pos.x - cursorWorldPos.x;
            const dy = n.pos.y - cursorWorldPos.y;
            const distSq = dx * dx + dy * dy;
            const minCursorDist = 2.55;
            if (distSq < minCursorDist * minCursorDist && distSq > 0.0001) {
              const dist = Math.sqrt(distSq);
              const push = (minCursorDist - dist) * 16.0 * dt;
              n.vel.x += (dx / dist) * push;
              n.vel.y += (dy / dist) * push;
              n.angVel.x += (dy / dist) * push * 0.9;
              n.angVel.y -= (dx / dist) * push * 0.9;
            }
          }

          n.pos.addScaledVector(n.vel, dt);
        }

        // Integrate angular velocity + gentle self-righting so front logo stays readable
        n.cubeMesh.rotation.x += n.angVel.x * dt;
        n.cubeMesh.rotation.y += n.angVel.y * dt;
        n.cubeMesh.rotation.z += n.angVel.z * dt;
        n.angVel.multiplyScalar(Math.pow(0.22, dt));

        // Subtle continuous rotation so all 6 logo faces catch the studio light
        n.cubeMesh.rotation.y += dt * (isSelected ? 0.55 : 0.24);
        n.cubeMesh.rotation.x = THREE.MathUtils.damp(
          n.cubeMesh.rotation.x,
          Math.sin(elapsed + i) * 0.22,
          2.2,
          dt
        );
        n.cubeMesh.rotation.z = THREE.MathUtils.damp(n.cubeMesh.rotation.z, 0, 2.5, dt);

        n.shellMesh.rotation.copy(n.cubeMesh.rotation);
        n.ringMesh.rotation.z += dt * 0.85;
        n.ringMesh.rotation.x += dt * 0.35;

        const targetScale = isSelected ? 1.24 : 1.0;
        n.group.scale.setScalar(THREE.MathUtils.damp(n.group.scale.x, targetScale, 7, dt));
        n.group.position.copy(n.pos);
      }

      // 2. Elastic Cube-to-Cube Collision Resolution
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          tempDiff.subVectors(b.pos, a.pos);
          const dist = tempDiff.length();
          const minDist = a.radius + b.radius;
          if (dist < minDist && dist > 0.001) {
            const normal = tempDiff.divideScalar(dist);
            const overlap = minDist - dist;

            // Separate overlapping cubes
            a.pos.addScaledVector(normal, -overlap * 0.5);
            b.pos.addScaledVector(normal, overlap * 0.5);

            // Relative velocity impulse
            const relVelX = b.vel.x - a.vel.x;
            const relVelY = b.vel.y - a.vel.y;
            const relVelZ = b.vel.z - a.vel.z;
            const velAlongNormal =
              relVelX * normal.x + relVelY * normal.y + relVelZ * normal.z;

            if (velAlongNormal < 0) {
              const restitution = 0.86;
              const impulse = -(1 + restitution) * velAlongNormal * 0.5;
              a.vel.addScaledVector(normal, -impulse);
              b.vel.addScaledVector(normal, impulse);

              // Impart rotational spin on collision
              a.angVel.x += normal.y * impulse * 0.45;
              a.angVel.y -= normal.x * impulse * 0.45;
              b.angVel.x -= normal.y * impulse * 0.45;
              b.angVel.y += normal.x * impulse * 0.45;
            }
          }
        }
      }

      renderer.render(scene, camera);
      scheduleNextFrame(renderer, tick, frameHandle);
    };

    tick();

    return () => {
      cancelScheduledFrame(frameHandle);
      container.removeEventListener('pointerdown', onPointerDown);
      container.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      container.removeEventListener('pointerleave', onPointerLeave);
      window.removeEventListener('resize', onResize);
      texturesToDispose.forEach((t) => t.dispose());
      envTex.dispose();
      renderer.dispose();
    };
  }, [skills]);

  return (
    <section id="skills" className="relative w-full py-32 px-6 sm:px-12 lg:px-16">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16 sm:mb-20">
          <div className="max-w-3xl">
            <span className="type-kicker text-cyan-400 block mb-4">
              Engineering Capabilities
            </span>
            <h2 className="type-section-heading mb-5">
              The tools behind the ideas.
            </h2>
            <p className="type-body-lead">
              Grab, toss, or collide any 3D logo cube with your cursor — or click to inspect
              production architecture and real-world implementation context.
            </p>
          </div>

          {/* Interactive Physics Controls */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() =>
                setPhysicsMode((m) => (m === 'constellation' ? 'zerog' : 'constellation'))
              }
              className={`px-5 py-3 rounded-full type-nav-button inline-flex items-center gap-2 transition-all ${
                physicsMode === 'zerog'
                  ? 'bg-cyan-400 !text-black shadow-lg'
                  : 'card-elevated text-zinc-200 hover:text-white'
              }`}
            >
              <Orbit className="w-4 h-4" />
              <span>{physicsMode === 'zerog' ? 'Zero-G Bounce Active' : 'Switch to Zero-G Physics'}</span>
            </button>

            <button
              type="button"
              onClick={() => impulseTriggerRef.current?.()}
              className="px-5 py-3 rounded-full type-nav-button bg-white !text-black hover:bg-zinc-200 shadow-lg inline-flex items-center gap-2 transition-all"
            >
              <Zap className="w-4 h-4" />
              <span>Physics Shockwave</span>
            </button>
          </div>
        </div>

        {/* 3D Interactive Logo Cubes Physics Viewport */}
        <div className="relative w-full h-[500px] sm:h-[580px] rounded-3xl card-surface overflow-hidden mb-10 flex items-center justify-center">
          <div
            id="skills-canvas-box"
            ref={mountRef}
            className="w-full h-full cursor-grab active:cursor-grabbing touch-none"
          />

          {/* Top-left Physics Hint Pill */}
          <div className="absolute top-5 left-6 pointer-events-none hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-black/55 backdrop-blur-xl text-xs font-medium text-zinc-300">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Drag & fling 3D logo cubes · Elastic collision physics active</span>
          </div>

          {/* Bottom Unified Inspector Bar for Selected 3D Logo Cube */}
          {selectedSkill && (
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-[92%] max-w-3xl rounded-3xl bg-black/80 backdrop-blur-2xl p-5 sm:p-6 shadow-2xl pointer-events-auto">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-3">
                  <span
                    className="w-3.5 h-3.5 rounded-full shrink-0 shadow-md"
                    style={{ backgroundColor: selectedSkill.color }}
                  />
                  <span className="font-display font-semibold text-xl sm:text-2xl tracking-[-0.025em] text-white">
                    {selectedSkill.name}
                  </span>
                  <span className="text-zinc-600">·</span>
                  <span className="text-sm font-medium text-cyan-400">
                    {selectedSkill.proficiency}
                  </span>
                </div>
                <span className="type-kicker text-zinc-400">
                  {selectedSkill.category}
                </span>
              </div>
              <p className="font-sans text-sm sm:text-base text-zinc-200 leading-relaxed">
                {selectedSkill.context}
              </p>
              {selectedSkill.projectsUsed && selectedSkill.projectsUsed.length > 0 && (
                <div className="mt-3 pt-3 text-xs font-medium text-zinc-400">
                  Production Usage: <span className="text-zinc-200">{selectedSkill.projectsUsed.join(' · ')}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 12-Skill Colorful Interactive Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4" id="skills-grid">
          {skills.map((s) => {
            const isSelected = selectedSkill?.id === s.id;
            return (
              <div
                key={s.id}
                onClick={() => {
                  setSelectedSkill(s);
                  impulseTriggerRef.current?.();
                }}
                className={`p-5 rounded-2xl card-surface hover:brightness-110 transition-all cursor-pointer ${
                  isSelected ? 'ring-2 ring-cyan-400' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ background: s.color }}
                  />
                  <span className="text-xs font-semibold tracking-wider text-zinc-400">
                    {s.tag}
                  </span>
                </div>
                <h4 className="font-sans font-semibold text-base tracking-[-0.015em] text-white truncate">
                  {s.name}
                </h4>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
