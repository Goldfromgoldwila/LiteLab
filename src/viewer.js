// src/viewer.js

const { mat4, vec3 } = glMatrix;
var webglContext;
var deepslateRenderer;
var cameraPitch;
var cameraYaw;
var cameraPos;
var resizeHandler = null;
var isRendering = false; // The master flag that controls the render loop

function setStructure(structure, reset_view=false) {
  if (!webglContext || !structure) return;
  deepslateRenderer = new deepslate.StructureRenderer(webglContext, structure, deepslateResources, {chunkSize: 8});

  if (deepslateRenderer && !deepslateRenderer.options) {
      console.warn("deepslateRenderer was created without an .options property. Initializing it to an empty object.");
      deepslateRenderer.options = {};
  }

  if (reset_view) {
    cameraPitch = 0.8; 
    cameraYaw = 0.5;
    const size = structure.getSize();
    vec3.set(cameraPos, -size[0] / 2, -size[1] / 2, -size[2] / 2);
  }

  // If the render loop isn't running, start it. This only happens once.
  if (!isRendering) {
    isRendering = true;
    render();
  }
}

function stopRendering() {
    isRendering = false;
    deepslateRenderer = null; // Cleanly dispose of the old renderer
}

function render() {
  // If the master flag is false, stop the loop immediately.
  if (!isRendering) return;

  // Continue the loop for the next frame.
  requestAnimationFrame(render);

  if (!webglContext) return;
  
  // Update camera angles from user input
  cameraYaw = cameraYaw % (Math.PI * 2);
  cameraPitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, cameraPitch));
  
  // Clear the canvas
  webglContext.clearColor(0.1, 0.1, 0.12, 1.0);
  webglContext.clear(webglContext.COLOR_BUFFER_BIT | webglContext.DEPTH_BUFFER_BIT);
  webglContext.enable(webglContext.DEPTH_TEST);
  webglContext.enable(webglContext.BLEND);
  webglContext.blendFunc(webglContext.SRC_ALPHA, webglContext.ONE_MINUS_SRC_ALPHA);

  // The definitive guard clause. It is now impossible to crash here.
  if (!deepslateRenderer) return;

  deepslateRenderer.options.showGrid = getSetting('show-grid', true);

  const view = mat4.create();
  mat4.rotateX(view, view, cameraPitch);
  mat4.rotateY(view, view, cameraYaw);
  mat4.translate(view, view, cameraPos);

  deepslateRenderer.drawStructure(view);
  
  if (deepslateRenderer.options.showGrid) {
    deepslateRenderer.drawGrid(view);
  }
}

function createRenderCanvas() {
  const overlay = document.getElementById('viewer-overlay');
  if (overlay) overlay.style.display = 'none';
  const viewer = document.getElementById('viewer');
  const existingCanvas = viewer.querySelector('canvas');
  if (existingCanvas) existingCanvas.remove();
  const canvas = document.createElement('canvas');
  viewer.appendChild(canvas);
  const rect = viewer.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
  webglContext = canvas.getContext('webgl');
  if (!webglContext) { console.error('WebGL not supported'); return; }
  cameraPitch = 0.8;
  cameraYaw = 0.5;
  cameraPos = vec3.create();
  setupCameraControls(canvas);

  if (resizeHandler) {
      window.removeEventListener('resize', resizeHandler);
  }
  resizeHandler = () => {
    if (!webglContext) return;
    const rect = viewer.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    webglContext.viewport(0, 0, canvas.width, canvas.height);
  };
  window.addEventListener('resize', resizeHandler);
  
  // DO NOT start the render loop here. It will be started by setStructure.
}

function setupCameraControls(canvas) {
  const crosshair = document.getElementById('crosshair');

  canvas.addEventListener('click', () => {
    canvas.requestPointerLock();
  });

  document.addEventListener('pointerlockchange', () => {
    if (document.pointerLockElement === canvas) {
      crosshair.style.display = 'block';
      document.addEventListener('mousemove', updateCameraPosition, false);
    } else {
      crosshair.style.display = 'none';
      document.removeEventListener('mousemove', updateCameraPosition, false);
    }
  });
  
  function updateCameraPosition(e) {
    const mouseSensitivity = getSetting('mouse-sensitivity', 1);
    const invertControls = getSetting('invert-controls', false);
    const multiplier = invertControls ? -1 : 1;
    
    cameraYaw += (e.movementX / 200) * mouseSensitivity;
    cameraPitch += (e.movementY / 200) * mouseSensitivity * multiplier;
  }

  canvas.addEventListener('wheel', evt => {
    evt.preventDefault();
    const movementSpeed = getSetting('movement-speed', 0.2);
    let zoomDirection = vec3.fromValues(0, 0, 1);
    vec3.rotateX(zoomDirection, zoomDirection, [0,0,0], -cameraPitch);
    vec3.rotateY(zoomDirection, zoomDirection, [0,0,0], -cameraYaw);
    vec3.scaleAndAdd(cameraPos, cameraPos, zoomDirection, evt.deltaY / 200 * movementSpeed * 5);
  });
  
  let pressedKeys = new Set();
  document.addEventListener('keydown', evt => {
    if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'ShiftLeft'].includes(evt.code)) {
      evt.preventDefault();
      pressedKeys.add(evt.code);
    }
  });
  document.addEventListener('keyup', evt => { pressedKeys.delete(evt.code); });
  window.addEventListener('blur', () => pressedKeys.clear());
  
  setInterval(() => {
    if (pressedKeys.size === 0) return;
    const movementSpeed = parseFloat(getSetting('movement-speed', 0.2));
    let horizontalDirection = vec3.create();
    if (pressedKeys.has('KeyW')) { horizontalDirection[2] += 1; }
    if (pressedKeys.has('KeyS')) { horizontalDirection[2] -= 1; }
    if (pressedKeys.has('KeyA')) { horizontalDirection[0] += 1; }
    if (pressedKeys.has('KeyD')) { horizontalDirection[0] -= 1; }
    let verticalMovement = 0;
    if (pressedKeys.has('Space')) { verticalMovement -= 1; }
    if (pressedKeys.has('ShiftLeft')) { verticalMovement += 1; }
    if (vec3.length(horizontalDirection) > 0 || verticalMovement !== 0) {
      if (vec3.length(horizontalDirection) > 0) vec3.normalize(horizontalDirection, horizontalDirection);
      vec3.scale(horizontalDirection, horizontalDirection, movementSpeed);
      vec3.rotateY(horizontalDirection, horizontalDirection, [0, 0, 0], -cameraYaw);
      vec3.add(cameraPos, cameraPos, horizontalDirection);
      cameraPos[1] += verticalMovement * movementSpeed;
    }
  }, 1000/60);
}