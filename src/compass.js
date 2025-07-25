// src/compass.js

let compassMesh = null;

function initCompass(gl) {
    if (!gl) return;

    const vertexShaderSource = `
        attribute vec3 aPosition;
        uniform mat4 uModelViewMatrix;
        uniform mat4 uProjectionMatrix;
        
        void main() {
            gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, 1.0);
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
    
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);
    
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    // Arrow geometry pointing in +Z direction
    const vertices = new Float32Array([
        0, 0, 0,  0, 0, 1,  // line
        -0.2, 0, 0.8,  0, 0, 1,  0.2, 0, 0.8  // arrowhead
    ]);

    const indices = new Uint16Array([0, 1, 2, 3, 4, 3]);

    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    
    compassMesh = {
        program: program,
        buffers: { vertex: vertexBuffer, index: indexBuffer, count: indices.length },
        attributes: { position: gl.getAttribLocation(program, 'aPosition') },
        uniforms: {
            modelViewMatrix: gl.getUniformLocation(program, 'uModelViewMatrix'),
            projectionMatrix: gl.getUniformLocation(program, 'uProjectionMatrix'),
            color: gl.getUniformLocation(program, 'uColor')
        }
    };
}

function drawCompass(gl, viewMatrix, projectionMatrix) {
    if (!compassMesh) {
        initCompass(gl);
        if (!compassMesh) return;
    }

    const canvas = gl.canvas;
    const wasViewport = gl.getParameter(gl.VIEWPORT);
    const wasDepth = gl.getParameter(gl.DEPTH_TEST);
    
    // Set viewport to top-right corner
    const size = 80;
    gl.viewport(canvas.width - size - 10, canvas.height - size - 10, size, size);
    gl.disable(gl.DEPTH_TEST);
    gl.clear(gl.DEPTH_BUFFER_BIT);
    gl.lineWidth(2);

    gl.useProgram(compassMesh.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, compassMesh.buffers.vertex);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, compassMesh.buffers.index);
    gl.enableVertexAttribArray(compassMesh.attributes.position);
    gl.vertexAttribPointer(compassMesh.attributes.position, 3, gl.FLOAT, false, 0, 0);

    // Create orthographic projection for gizmo
    const orthoProj = mat4.create();
    mat4.ortho(orthoProj, -2, 2, -2, 2, -10, 10);

    // Extract rotation from view matrix
    const rotationView = mat4.create();
    mat4.copy(rotationView, viewMatrix);
    rotationView[12] = rotationView[13] = rotationView[14] = 0; // Remove translation

    const directions = [
        { name: 'N', color: [1, 0.2, 0.2, 1], rotation: 0 },
        { name: 'E', color: [0.2, 1, 0.2, 1], rotation: Math.PI/2 },
        { name: 'S', color: [0.2, 0.2, 1, 1], rotation: Math.PI },
        { name: 'W', color: [1, 1, 0.2, 1], rotation: -Math.PI/2 }
    ];

    directions.forEach(dir => {
        const modelMatrix = mat4.create();
        mat4.rotateY(modelMatrix, modelMatrix, dir.rotation);
        
        const modelViewMatrix = mat4.create();
        mat4.multiply(modelViewMatrix, rotationView, modelMatrix);
        
        gl.uniformMatrix4fv(compassMesh.uniforms.modelViewMatrix, false, modelViewMatrix);
        gl.uniformMatrix4fv(compassMesh.uniforms.projectionMatrix, false, orthoProj);
        gl.uniform4fv(compassMesh.uniforms.color, dir.color);
        
        gl.drawElements(gl.LINES, compassMesh.buffers.count, gl.UNSIGNED_SHORT, 0);
    });

    // Update direction text and structure info
    updateDirectionText(viewMatrix);
    updateStructureInfo(gl, viewMatrix);

    // Restore viewport and depth test
    gl.viewport(wasViewport[0], wasViewport[1], wasViewport[2], wasViewport[3]);
    if (wasDepth) gl.enable(gl.DEPTH_TEST);
    gl.disableVertexAttribArray(compassMesh.attributes.position);
}



function updateDirectionText(viewMatrix) {
    const yaw = Math.atan2(viewMatrix[8], viewMatrix[10]);
    let angle = (yaw * 180 / Math.PI + 360) % 360;
    
    let direction;
    if (angle >= 315 || angle < 45) direction = 'North';
    else if (angle >= 45 && angle < 135) direction = 'East';
    else if (angle >= 135 && angle < 225) direction = 'South';
    else direction = 'West';
    
    let directionElement = document.getElementById('direction-text');
    if (!directionElement) {
        directionElement = document.createElement('div');
        directionElement.id = 'direction-text';
        directionElement.style.cssText = `
            position: fixed; top: 130px; right: 20px; 
            color: white; font-size: 14px; font-weight: bold;
            background: rgba(0,0,0,0.1); padding: 4px 8px;
            border-radius: 4px; z-index: 1000;
        `;
        document.body.appendChild(directionElement);
    }
    directionElement.textContent = direction;
}

function updateStructureInfo(gl, viewMatrix) {
    if (!deepslateRenderer || !deepslateRenderer.structure) return;
    
    const invView = mat4.create();
    mat4.invert(invView, viewMatrix);
    const cameraPos = vec3.fromValues(invView[12], invView[13], invView[14]);
    
    // Find nearest block instead of center
    const size = deepslateRenderer.structure.getSize();
    let nearestBlock = null;
    let minDistance = Infinity;
    
    for (let x = 0; x < size[0]; x++) {
        for (let y = 0; y < size[1]; y++) {
            for (let z = 0; z < size[2]; z++) {
                const block = deepslateRenderer.structure.getBlock([x, y, z]);
                if (block && block.name !== 'minecraft:air') {
                    const blockPos = vec3.fromValues(x + 0.5, y + 0.5, z + 0.5);
                    const dist = vec3.distance(cameraPos, blockPos);
                    if (dist < minDistance) {
                        minDistance = dist;
                        nearestBlock = blockPos;
                    }
                }
            }
        }
    }
    
    let structureElement = document.getElementById('structure-info');
    if (!structureElement) {
        structureElement = document.createElement('div');
        structureElement.id = 'structure-info';
        structureElement.style.cssText = `
            position: fixed; bottom: 20px; right: 20px; 
            color: orange; font-size: 12px;
            background: rgba(0,0,0,0.4); padding: 4px 8px;
            border-radius: 4px; z-index: 1000;
        `;
        document.body.appendChild(structureElement);
    }
    
    if (nearestBlock && minDistance > 5) {
        const toStructure = vec3.create();
        vec3.subtract(toStructure, nearestBlock, cameraPos);
        
        // Create/update HTML arrow
        updateHtmlArrow(toStructure, viewMatrix);
        
        structureElement.textContent = `Structure: ${Math.round(minDistance)} blocks`;
        structureElement.style.display = 'block';
    } else {
        structureElement.style.display = 'none';
        const arrowElement = document.getElementById('structure-arrow');
        if (arrowElement) arrowElement.style.display = 'none';
    }
}

function updateHtmlArrow(toStructure) {
    let arrowElement = document.getElementById('structure-arrow');
    if (!arrowElement) {
        arrowElement = document.createElement('div');
        arrowElement.id = 'structure-arrow';
        arrowElement.innerHTML = '↑';
        arrowElement.style.cssText = `
            position: fixed; bottom: 50px; right: 40px;
            color: orange; font-size: 20px; font-weight: bold;
            background: rgba(0,0,0,0.6); padding: 4px;
            border-radius: 50%; width: 30px; height: 30px;
            display: flex; align-items: center; justify-content: center;
            transform-origin: center; z-index: 1001;
        `;
        document.body.appendChild(arrowElement);
    }
    
    // Get current camera yaw
    const viewMatrix = arguments[1] || mat4.create();
    const cameraYaw = Math.atan2(viewMatrix[8], viewMatrix[10]);
    
    // Calculate structure direction in world space (flip Z for correct north/south)
    vec3.normalize(toStructure, toStructure);
    const structureAngle = Math.atan2(toStructure[0], -toStructure[2]);
    
    // Calculate relative angle (structure direction - camera direction)
    const relativeAngle = (structureAngle - cameraYaw) * 180 / Math.PI;
    
    arrowElement.style.transform = `rotate(${relativeAngle}deg)`;
    arrowElement.style.display = 'flex';
}