// src/compass.js
import { mat4, vec3 } from 'gl-matrix';

let compassProgram = null;
let compassBuffers = null;
let compassTextElement = null;

function updateCompassText(viewMatrix) {
    if (!compassTextElement) {
        compassTextElement = document.createElement('div');
        compassTextElement.id = 'compass-text';
        compassTextElement.style.cssText = `
            position: fixed; top: 120px; right: 25px;
            background: rgba(0,0,0,0.7); color: white; padding: 4px 8px;
            border-radius: 4px; font-size: 12px; z-index: 1002;
            text-align: center; font-family: monospace;
        `;
        document.body.appendChild(compassTextElement);
    }
    
    // Calculate camera direction from view matrix
    const forward = vec3.fromValues(-viewMatrix[2], -viewMatrix[6], -viewMatrix[10]);
    const angle = Math.atan2(forward[0], forward[2]) * 180 / Math.PI;
    let direction = 'North';
    
    if (angle >= -22.5 && angle < 22.5) direction = 'North';
    else if (angle >= 22.5 && angle < 67.5) direction = 'Northeast';
    else if (angle >= 67.5 && angle < 112.5) direction = 'East';
    else if (angle >= 112.5 && angle < 157.5) direction = 'Southeast';
    else if (angle >= 157.5 || angle < -157.5) direction = 'South';
    else if (angle >= -157.5 && angle < -112.5) direction = 'Southwest';
    else if (angle >= -112.5 && angle < -67.5) direction = 'West';
    else if (angle >= -67.5 && angle < -22.5) direction = 'Northwest';
    
    compassTextElement.textContent = direction;
}

function initCompass(gl) {
    const vertexShaderSource = `
        attribute vec3 aPosition;
        attribute vec3 aColor;
        uniform mat4 uModelViewMatrix;
        uniform mat4 uProjectionMatrix;
        varying vec3 vColor;
        
        void main() {
            gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, 1.0);
            vColor = aColor;
        }
    `;

    const fragmentShaderSource = `
        precision mediump float;
        varying vec3 vColor;
        
        void main() {
            gl_FragColor = vec4(vColor, 1.0);
        }
    `;

    function createShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('Error compiling shader:', gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    compassProgram = gl.createProgram();
    gl.attachShader(compassProgram, vertexShader);
    gl.attachShader(compassProgram, fragmentShader);
    gl.linkProgram(compassProgram);

    if (!gl.getProgramParameter(compassProgram, gl.LINK_STATUS)) {
        console.error('Unable to initialize compass shader program:', gl.getProgramInfoLog(compassProgram));
        return;
    }

    // Create minimalistic modern compass with arrows
    const vertices = new Float32Array([
        // North line (Z+)
        0, 0, 0,  0, 0, 0.9,
        // North arrow head (left)
        0, 0, 0.9,  -0.1, 0, 0.8,
        // North arrow head (right)
        0, 0, 0.9,  0.1, 0, 0.8,
        // South line (Z-)
        0, 0, 0,  0, 0, -0.9,
        // South arrow head (left)
        0, 0, -0.9,  -0.1, 0, -0.8,
        // South arrow head (right)
        0, 0, -0.9,  0.1, 0, -0.8,
        // East line (X+)
        0, 0, 0,  0.9, 0, 0,
        // East arrow head (top)
        0.9, 0, 0,  0.8, 0, 0.1,
        // East arrow head (bottom)
        0.9, 0, 0,  0.8, 0, -0.1,
        // West line (X-)
        0, 0, 0,  -0.9, 0, 0,
        // West arrow head (top)
        -0.9, 0, 0,  -0.8, 0, 0.1,
        // West arrow head (bottom)
        -0.9, 0, 0,  -0.8, 0, -0.1,
    ]);

    const colors = new Float32Array([
        // North line (blue)
        0.3, 0.7, 1,  0.3, 0.7, 1,
        // North arrow head (left)
        0.3, 0.7, 1,  0.3, 0.7, 1,
        // North arrow head (right)
        0.3, 0.7, 1,  0.3, 0.7, 1,
        // South line (muted blue)
        0.5, 0.5, 0.7,  0.5, 0.5, 0.7,
        // South arrow head (left)
        0.5, 0.5, 0.7,  0.5, 0.5, 0.7,
        // South arrow head (right)
        0.5, 0.5, 0.7,  0.5, 0.5, 0.7,
        // East line (red)
        1, 0.3, 0.3,  1, 0.3, 0.3,
        // East arrow head (top)
        1, 0.3, 0.3,  1, 0.3, 0.3,
        // East arrow head (bottom)
        1, 0.3, 0.3,  1, 0.3, 0.3,
        // West line (muted red)
        0.7, 0.5, 0.5,  0.7, 0.5, 0.5,
        // West arrow head (top)
        0.7, 0.5, 0.5,  0.7, 0.5, 0.5,
        // West arrow head (bottom)
        0.7, 0.5, 0.5,  0.7, 0.5, 0.5,
    ]);

    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);

    compassBuffers = {
        position: vertexBuffer,
        color: colorBuffer,
        vertexCount: 24
    };
}

export function drawCompass(gl, viewMatrix, projectionMatrix) {
    if (!gl || !viewMatrix || !projectionMatrix) return;
    
    // Check if context is valid and objects belong to this context
    if (compassProgram && !gl.isProgram(compassProgram)) {
        compassProgram = null;
        compassBuffers = null;
    }
    
    if (!compassProgram) {
        try {
            initCompass(gl);
            if (!compassProgram) return;
        } catch (e) {
            return; // Silently fail to prevent spam
        }
    }

    try {
        // Save current viewport
        const viewport = gl.getParameter(gl.VIEWPORT);
        const currentProgram = gl.getParameter(gl.CURRENT_PROGRAM);
        const wasDepthTest = gl.getParameter(gl.DEPTH_TEST);
        
        // Set viewport for compass (top-right corner)
        const compassSize = 80;
        gl.viewport(viewport[2] - compassSize - 10, viewport[3] - compassSize - 10, compassSize, compassSize);
        
        gl.useProgram(compassProgram);
        gl.disable(gl.DEPTH_TEST);
        gl.clear(gl.DEPTH_BUFFER_BIT);

        // Create compass matrices
        const compassView = mat4.create();
        mat4.copy(compassView, viewMatrix);
        // Remove translation, keep only rotation
        compassView[12] = 0;
        compassView[13] = 0;
        compassView[14] = -3;

        const compassProj = mat4.create();
        mat4.perspective(compassProj, Math.PI / 4, 1, 0.1, 10);

        // Get attribute and uniform locations
        const positionLocation = gl.getAttribLocation(compassProgram, 'aPosition');
        const colorLocation = gl.getAttribLocation(compassProgram, 'aColor');
        const modelViewLocation = gl.getUniformLocation(compassProgram, 'uModelViewMatrix');
        const projectionLocation = gl.getUniformLocation(compassProgram, 'uProjectionMatrix');

        // Validate locations
        if (positionLocation === -1 || colorLocation === -1 || !modelViewLocation || !projectionLocation) {
            return;
        }

        // Bind buffers
        gl.bindBuffer(gl.ARRAY_BUFFER, compassBuffers.position);
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, compassBuffers.color);
        gl.enableVertexAttribArray(colorLocation);
        gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, 0, 0);

        // Set uniforms
        gl.uniformMatrix4fv(modelViewLocation, false, compassView);
        gl.uniformMatrix4fv(projectionLocation, false, compassProj);

        // Draw compass lines
        gl.lineWidth(6);
        gl.drawArrays(gl.LINES, 0, compassBuffers.vertexCount);

        // Restore state
        gl.disableVertexAttribArray(positionLocation);
        gl.disableVertexAttribArray(colorLocation);
        gl.viewport(viewport[0], viewport[1], viewport[2], viewport[3]);
        if (wasDepthTest) gl.enable(gl.DEPTH_TEST);
        gl.useProgram(currentProgram);
        
        // Add direction text
        updateCompassText(viewMatrix);
    } catch (e) {
        // Silently handle WebGL errors to prevent spam
        return;
    }
}