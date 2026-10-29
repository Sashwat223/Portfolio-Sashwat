import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export const isSoftwareGl = (() => {
  if (typeof document === 'undefined') return false;
  try {
    const gl = document.createElement('canvas').getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
})();

export function createStudioRenderer(container: HTMLElement): THREE.WebGLRenderer {
  const renderer = new THREE.WebGLRenderer({
    antialias: !isSoftwareGl,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;
  renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(container.clientWidth || 300, container.clientHeight || 300);
  renderer.shadowMap.enabled = !isSoftwareGl;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  return renderer;
}

export function applyStudioEnvironment(renderer: THREE.WebGLRenderer, scene: THREE.Scene): THREE.Texture {
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const envTexture = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTexture;
  pmremGenerator.dispose();
  return envTexture;
}

export function scheduleNextFrame(
  renderer: THREE.WebGLRenderer,
  cb: () => void,
  handleRef: { id: number; isTimeout: boolean }
) {
  if (!isSoftwareGl) {
    handleRef.isTimeout = false;
    handleRef.id = requestAnimationFrame(cb);
    return;
  }
  const gl = renderer.getContext() as WebGL2RenderingContext;
  if (!gl || typeof gl.fenceSync !== 'function') {
    handleRef.isTimeout = true;
    handleRef.id = window.setTimeout(cb, 80);
    return;
  }
  const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
  gl.flush();
  const poll = () => {
    const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
    if (state === gl.UNSIGNALED) {
      handleRef.isTimeout = true;
      handleRef.id = window.setTimeout(poll, 5);
    } else {
      if (sync) gl.deleteSync(sync);
      handleRef.isTimeout = true;
      handleRef.id = window.setTimeout(cb, 80);
    }
  };
  handleRef.isTimeout = true;
  handleRef.id = window.setTimeout(poll, 5);
}

export function cancelScheduledFrame(handleRef: { id: number; isTimeout: boolean }) {
  if (handleRef.isTimeout) {
    clearTimeout(handleRef.id);
  } else {
    cancelAnimationFrame(handleRef.id);
  }
}
