import { mat4, vec3 } from 'gl-matrix';
import { getSetting } from './settings.js';

// These variables are defined in viewer.js, but we need to access them here.
// In a larger refactor, they would be passed as arguments or managed in a shared state.
let deepslateRenderer = window.deepslateRenderer; 

/**
 * Block Hover Effect (Transparency) for LiteLab
 * This script handles ray-casting to find the block under the crosshair
 * and renders a transparent overlay on it.
 */


// Stores the WebGL resources (shader program, buffers) for the hover effect
let hoverEffectMesh = null; 
// Stores the coordinates of the currently hovered block, e.g., {x, y, z}
let hoveredBlock = null;

/**
 * Initializes the shaders and buffers for rendering the hover effect.
 * @param {WebGLRenderingContext} gl - The WebGL context
 */
function initHoverEffect(gl) {
    console.log('Initializing hover effect...');
    if (!gl) {
        console.error("WebGL context not provided for hover effect initialization.");
        return;
    }

    const vertexShaderSource = `
        attribute vec3 aPosition;
        uniform mat4 uModelViewMatrix;
        uniform mat4 uProjectionMatrix;
        
        void main() {
            vec3 pos = aPosition - 0.5;
            pos *= 1.002;
            pos += 0.5;
            gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(pos, 1.0);
        }
    `;
    
    const fragmentShaderSource = `
        precision mediump float;
        uniform vec4 uColor;
        
        void main() {
            gl_FragColor = uColor;
        }
    `;
    
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        console.error('An error occurred compiling the hover vertex shader: ' + gl.getShaderInfoLog(vertexShader));
        gl.deleteShader(vertexShader);
        return;
    }
    
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        console.error('An error occurred compiling the hover fragment shader: ' + gl.getShaderInfoLog(fragmentShader));
        gl.deleteShader(fragmentShader);
        return;
    }
    
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Unable to initialize the hover shader program: ' + gl.getProgramInfoLog(program));
        return;
    }

    const vertices = new Float32Array([
        0, 0, 0,  1, 0, 0,  1, 1, 0,  0, 1, 0, // back face
        0, 0, 1,  1, 0, 1,  1, 1, 1,  0, 1, 1  // front face
    ]);

    const indices = new Uint16Array([
        0, 1, 2,  0, 2, 3, // front
        4, 5, 6,  4, 6, 7, // back
        7, 6, 2,  7, 2, 3, // top
        4, 5, 1,  4, 1, 0, // bottom
        4, 7, 3,  4, 3, 0, // left
        5, 6, 2,  5, 2, 1, // right
    ]);

    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    
    hoverEffectMesh = {
        program: program,
        buffers: {
            vertex: vertexBuffer,
            index: indexBuffer,
            count: indices.length,
        },
        attributes: {
            position: gl.getAttribLocation(program, 'aPosition')
        },
        uniforms: {
            modelViewMatrix: gl.getUniformLocation(program, 'uModelViewMatrix'),
            projectionMatrix: gl.getUniformLocation(program, 'uProjectionMatrix'),
            color: gl.getUniformLocation(program, 'uColor')
        }
    };
    console.log('Block hover effect initialized successfully');
}

/**
 * Casts a ray from the camera to find the block being pointed at.
 * @param {mat4} viewMatrix - The camera's view matrix.
 * @param {mat4} projectionMatrix - The camera's projection matrix.
 * @param {deepslate.Structure} structure - The structure to raycast against.
 * @returns {Object|null} The intersected block position {x, y, z} or null.
 */
function castRayForHover(viewMatrix, projectionMatrix, structure) {
    if (!structure || !projectionMatrix) return null;

    // Get camera position from inverse view matrix
    const invView = mat4.create();
    mat4.invert(invView, viewMatrix);
    const cameraPos = vec3.fromValues(invView[12], invView[13], invView[14]);

    // Create ray direction from screen center (0,0 in NDC)
    const invProj = mat4.create();
    mat4.invert(invProj, projectionMatrix);
    
    const invViewProj = mat4.create();
    mat4.multiply(invViewProj, invView, invProj);
    
    // Transform screen center to world space
    const nearPoint = vec3.fromValues(0, 0, -1);
    const farPoint = vec3.fromValues(0, 0, 1);
    
    vec3.transformMat4(nearPoint, nearPoint, invViewProj);
    vec3.transformMat4(farPoint, farPoint, invViewProj);
    
    const direction = vec3.create();
    vec3.subtract(direction, farPoint, nearPoint);
    vec3.normalize(direction, direction);

    const maxDistance = 15;
    const stepSize = 0.05;
    const size = structure.getSize();

    for (let dist = 0.1; dist < maxDistance; dist += stepSize) {
        const checkPos = vec3.create();
        vec3.scaleAndAdd(checkPos, cameraPos, direction, dist);

        const x = Math.floor(checkPos[0]);
        const y = Math.floor(checkPos[1]);
        const z = Math.floor(checkPos[2]);

        if (x >= 0 && x < size[0] && y >= 0 && y < size[1] && z >= 0 && z < size[2]) {
            const block = structure.getBlock([x, y, z]);
            if (block && block.name !== 'minecraft:air') {
                return { x, y, z };
            }
        }
    }
    return null;
}

/**
 * Updates the currently hovered block by casting a ray from the camera center.
 * @param {mat4} viewMatrix - The current camera view matrix.
 * @param {mat4} projectionMatrix - The current projection matrix.
 */
function updateHoveredBlock(viewMatrix, projectionMatrix) {
    deepslateRenderer = window.deepslateRenderer; 
    if (!deepslateRenderer || !deepslateRenderer.structure) {
        hoveredBlock = null;
        updateBlockInfo(null);
        return;
    }
    const newHoveredBlock = castRayForHover(viewMatrix, projectionMatrix, deepslateRenderer.structure);

    if (newHoveredBlock) {
        if (!hoveredBlock || 
            hoveredBlock.x !== newHoveredBlock.x || 
            hoveredBlock.y !== newHoveredBlock.y || 
            hoveredBlock.z !== newHoveredBlock.z) {
            hoveredBlock = newHoveredBlock;
            const block = deepslateRenderer.structure.getBlock([hoveredBlock.x, hoveredBlock.y, hoveredBlock.z]);
            updateBlockInfo(block, hoveredBlock);
        }
    } else {
        hoveredBlock = null;
        updateBlockInfo(null);
    }
}

function updateBlockInfo(block, position) {
    let blockInfoElement = document.getElementById('block-info');
    if (!blockInfoElement) {
        blockInfoElement = document.createElement('div');
        blockInfoElement.id = 'block-info';
        blockInfoElement.style.cssText = `
            position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%);
            background: rgba(0,0,0,0.8); color: white; padding: 8px 12px;
            border-radius: 6px; font-size: 14px; z-index: 1001;
            text-align: center; border: 1px solid rgba(255,255,255,0.3);
            pointer-events: none;
        `;
        document.getElementById('viewer').appendChild(blockInfoElement);
    }
    
    if (block && position) {
        let blockName = 'Unknown Block';
        
        // Get block name from litematic structure
        if (window.AppState && window.AppState.structureLitematic && window.AppState.structureLitematic.regions) {
            const region = window.AppState.structureLitematic.regions[0];
            if (region && region.blocks && region.blockPalette) {
                const blockId = region.blocks[position.x]?.[position.y]?.[position.z];
                if (blockId && region.blockPalette[blockId]) {
                    blockName = region.blockPalette[blockId].Name.replace('minecraft:', '');
                }
            }
        }
        
        // Fallback to deepslate structure
        if (blockName === 'Unknown Block' && block && block.name) {
            blockName = block.name.replace('minecraft:', '');
        }
        
        // Format the block name
        const formattedName = blockName.replace(/_/g, ' ');
        const capitalizedName = formattedName.split(' ').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
        
        // Store current hovered block for edit mode
        window.currentHoveredBlock = { block, position };
        
        blockInfoElement.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 4px; color: #ffdd44;">${capitalizedName}</div>
            <div style="color: #bbb; font-size: 10px;">X: ${position.x} Y: ${position.y} Z: ${position.z}</div>
        `;
        blockInfoElement.style.display = 'block';
    } else {
        window.currentHoveredBlock = null;
        blockInfoElement.style.display = 'none';
    }
}


/**
 * Draws a transparent overlay on the currently hovered block.
 * @param {WebGLRenderingContext} gl - The WebGL context
 * @param {mat4} viewMatrix - The camera view matrix
 * @param {mat4} projectionMatrix - The camera projection matrix
 */
function drawHoverEffect(gl, viewMatrix, projectionMatrix) {
    if (!getSetting('show-block-border', true) || !hoveredBlock) return;
    
    if (!gl) return;
    
    // Check if context is valid and objects belong to this context
    if (hoverEffectMesh && !gl.isProgram(hoverEffectMesh.program)) {
        hoverEffectMesh = null;
    }
    
    if (!hoverEffectMesh) {
        try {
            initHoverEffect(gl);
            if (!hoverEffectMesh) return;
        } catch (e) {
            return; // Silently fail to prevent spam
        }
    }

    if (!projectionMatrix) return;
    
    try {
        const wasBlending = gl.getParameter(gl.BLEND);
        const wasCulling = gl.getParameter(gl.CULL_FACE);

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.disable(gl.CULL_FACE);
        gl.disable(gl.DEPTH_TEST);

        gl.useProgram(hoverEffectMesh.program);
        gl.bindBuffer(gl.ARRAY_BUFFER, hoverEffectMesh.buffers.vertex);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, hoverEffectMesh.buffers.index);
        gl.enableVertexAttribArray(hoverEffectMesh.attributes.position);
        gl.vertexAttribPointer(hoverEffectMesh.attributes.position, 3, gl.FLOAT, false, 0, 0);
        
        const modelMatrix = mat4.create();
        mat4.translate(modelMatrix, modelMatrix, [hoveredBlock.x, hoveredBlock.y, hoveredBlock.z]);
        
        const modelViewMatrix = mat4.create();
        mat4.multiply(modelViewMatrix, viewMatrix, modelMatrix);
        
        gl.uniformMatrix4fv(hoverEffectMesh.uniforms.modelViewMatrix, false, modelViewMatrix);
        gl.uniformMatrix4fv(hoverEffectMesh.uniforms.projectionMatrix, false, projectionMatrix);
        gl.uniform4fv(hoverEffectMesh.uniforms.color, [0.0, 0.0, 0.0, 0.3]);
        
        gl.drawElements(gl.TRIANGLES, hoverEffectMesh.buffers.count, gl.UNSIGNED_SHORT, 0);
        
        gl.enable(gl.DEPTH_TEST);
        if (!wasBlending) gl.disable(gl.BLEND);
        if (wasCulling) gl.enable(gl.CULL_FACE);
        gl.disableVertexAttribArray(hoverEffectMesh.attributes.position);
    } catch (e) {
        // Silently handle WebGL errors to prevent spam
        return;
    }
}

/**
 * A single function to be called from the main render loop.
 * @param {WebGLRenderingContext} gl - The WebGL context.
 * @param {mat4} viewMatrix - The current camera view matrix.
 * @param {mat4} projectionMatrix - The camera's projection matrix.
 */
export function applyBlockHoverEffect(gl, viewMatrix, projectionMatrix) {
    updateHoveredBlock(viewMatrix, projectionMatrix);
    drawHoverEffect(gl, viewMatrix, projectionMatrix);
}

/**
 * Setup function to be called once the canvas and GL context are available.
 */
export function initializeBlockHover() {
    // This is now called implicitly on first use, so the export is mainly for consistency.
}