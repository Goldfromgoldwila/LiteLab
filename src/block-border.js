// src/block-border.js

/**
 * Block Hover Effect (Transparency) for LiteLab
 * This script handles ray-casting to find the block under the crosshair
 * and renders a transparent overlay on it.
 */

const { mat4, vec3 } = glMatrix;

// Stores the WebGL resources (shader program, buffers) for the hover effect
let hoverEffectMesh = null; 
// Stores the coordinates of the currently hovered block, e.g., {x, y, z}
let hoveredBlock = null;

/**
 * Initializes the shaders and buffers for rendering the hover effect.
 * This should be called once when the WebGL context is ready.
 * @param {WebGLRenderingContext} gl - The WebGL context
 */
function initBlockBorder(gl) {
    if (!gl) {
        console.error("WebGL context not provided for hover effect initialization.");
        return;
    }

    // Shader to draw a simple, colored cube
    const vertexShaderSource = `
        attribute vec3 aPosition;
        uniform mat4 uModelViewMatrix;
        uniform mat4 uProjectionMatrix;
        
        void main() {
            // The cube vertices are from 0 to 1. We scale it slightly to avoid z-fighting with the actual block.
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
    
    // Compile shaders
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
    
    // Create and link shader program
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Unable to initialize the hover shader program: ' + gl.getProgramInfoLog(program));
        return;
    }

    // Define vertices for a 1x1x1 cube
    const vertices = new Float32Array([
        // Front face
        0.0, 0.0, 1.0,  1.0, 0.0, 1.0,  1.0, 1.0, 1.0,  0.0, 1.0, 1.0,
        // Back face
        0.0, 0.0, 0.0,  1.0, 0.0, 0.0,  1.0, 1.0, 0.0,  0.0, 1.0, 0.0,
    ]);

    // Define indices to draw the cube's 12 triangles from the 8 vertices
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
    
    // Store all the WebGL objects for later use
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
 * @param {deepslate.Structure} structure - The structure to raycast against.
 * @returns {Object|null} The intersected block position {x, y, z} or null.
 */
function castRayForHover(viewMatrix, structure) {
    if (!structure) return null;

    // The camera's world position is found in the inverted view matrix.
    const invView = mat4.create();
    mat4.invert(invView, viewMatrix);
    const cameraPosition = vec3.fromValues(invView[12], invView[13], invView[14]);

    // The camera's forward direction is the negative Z-axis of its local space.
    // We transform this into world space to get the ray direction.
    const direction = vec3.fromValues(-viewMatrix[8], -viewMatrix[9], -viewMatrix[10]);
    vec3.normalize(direction, direction);

    // Ray-march from the camera position to find the first non-air block.
    const maxDistance = 15; // Max reach in blocks
    const stepSize = 0.1; 
    const size = structure.getSize();

    for (let dist = 0.1; dist < maxDistance; dist += stepSize) {
        const checkPos = vec3.create();
        vec3.scaleAndAdd(checkPos, cameraPosition, direction, dist);

        const x = Math.floor(checkPos[0]);
        const y = Math.floor(checkPos[1]);
        const z = Math.floor(checkPos[2]);

        // Check if the point is within the structure's bounds
        if (x >= 0 && x < size[0] && y >= 0 && y < size[1] && z >= 0 && z < size[2]) {
            const block = structure.getBlock([x, y, z]);
            if (block && block.name !== 'minecraft:air') {
                return { x, y, z }; // Found a block
            }
        }
    }
    return null; // No block found
}


/**
 * Updates the currently hovered block by casting a ray from the camera center.
 * This should be called every frame before drawing the hover effect.
 * @param {mat4} viewMatrix - The current camera view matrix.
 */
function updateHoveredBlock(viewMatrix) {
    if (!deepslateRenderer || !deepslateRenderer.structure) {
        hoveredBlock = null;
        return;
    }
    
    // Find the block currently being looked at
    hoveredBlock = castRayForHover(viewMatrix, deepslateRenderer.structure);
}

/**
 * Draws a transparent overlay on the currently hovered block.
 * This should be called in the main render loop after drawing the main structure.
 * @param {WebGLRenderingContext} gl - The WebGL context
 * @param {mat4} viewMatrix - The camera view matrix
 */
function drawBlockBorder(gl, viewMatrix) {
    if (!getSetting('show-block-border', true) || !hoveredBlock) return;
    
    if (!gl) return;
    if (!hoverEffectMesh) {
        initBlockBorder(gl); // Initialize on first use if not already done
        if (!hoverEffectMesh) return; // Initialization failed
    }
    
    gl.useProgram(hoverEffectMesh.program);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, hoverEffectMesh.buffers.vertex);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, hoverEffectMesh.buffers.index);

    gl.enableVertexAttribArray(hoverEffectMesh.attributes.position);
    gl.vertexAttribPointer(hoverEffectMesh.attributes.position, 3, gl.FLOAT, false, 0, 0);
    
    const modelMatrix = mat4.create();
    mat4.translate(modelMatrix, modelMatrix, [hoveredBlock.x, hoveredBlock.y, hoveredBlock.z]);
    
    const modelViewMatrix = mat4.create();
    mat4.multiply(modelViewMatrix, viewMatrix, modelMatrix);
    
    const projectionMatrix = deepslateRenderer.projectionMatrix || mat4.create();
    
    gl.uniformMatrix4fv(hoverEffectMesh.uniforms.modelViewMatrix, false, modelViewMatrix);
    gl.uniformMatrix4fv(hoverEffectMesh.uniforms.projectionMatrix, false, projectionMatrix);
    
    // Set the color to a semi-transparent white
    gl.uniform4fv(hoverEffectMesh.uniforms.color, [1.0, 1.0, 1.0, 0.3]);
    
    // --- IMPORTANT: Transparency Setup ---
    // Disable writing to the depth buffer. This allows the transparent cube to be drawn
    // over the opaque block without z-fighting, and without occluding other objects behind it.
    gl.depthMask(false); 

    // Draw the transparent cube
    gl.drawElements(gl.TRIANGLES, hoverEffectMesh.buffers.count, gl.UNSIGNED_SHORT, 0);
    
    // --- Restore GL State ---
    // Re-enable depth writing so that subsequent objects in the scene render correctly.
    gl.depthMask(true); 
    
    gl.disableVertexAttribArray(hoverEffectMesh.attributes.position);
}

/**
 * A single function to be called from the main render loop.
 * It updates the hover position and then draws the effect.
 * 
 * In your main render() function, you should call this function like so:
 * applyBlockHoverEffect(webglContext, view);
 * 
 * @param {WebGLRenderingContext} gl - The WebGL context.
 * @param {mat4} viewMatrix - The current camera view matrix.
 */
function applyBlockHoverEffect(gl, viewMatrix) {
    updateHoveredBlock(viewMatrix);
    drawBlockBorder(gl, viewMatrix);
}

/**
 * Setup function to be called once the canvas and GL context are available.
 */
function initializeBlockHover() {
    try {
        if (!webglContext) {
            console.warn('WebGL context not available, hover effect will initialize on first use.');
            return;
        }
        initBlockBorder(webglContext);
    } catch (error) {
        console.error('Error initializing block hover effect:', error);
    }
}