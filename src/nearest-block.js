// src/nearest-block.js
import { vec3 } from 'gl-matrix';

let nearestBlockElement = null;

function createNearestBlockDisplay() {
    if (!nearestBlockElement) {
        nearestBlockElement = document.createElement('div');
        nearestBlockElement.id = 'nearest-block-info';
        nearestBlockElement.style.cssText = `
            position: fixed; bottom: 20px; right: 20px;
            background: rgba(0,0,0,0.8); color: white; padding: 8px 12px;
            border-radius: 6px; font-size: 12px; z-index: 1001;
            text-align: left; border: 1px solid rgba(255,255,255,0.3);
            pointer-events: none; min-width: 150px;
        `;
        document.body.appendChild(nearestBlockElement);
    }
}

function findStructureDistance(cameraPos, structure) {
    if (!structure) return null;
    
    const size = structure.getSize();
    let structureCenter = vec3.fromValues(size[0]/2, size[1]/2, size[2]/2);
    let distanceToStructure = vec3.distance(cameraPos, structureCenter);
    
    // Only show if far from structure (>10 blocks)
    if (distanceToStructure > 10) {
        const direction = vec3.create();
        vec3.subtract(direction, structureCenter, cameraPos);
        vec3.normalize(direction, direction);
        
        return {
            distance: distanceToStructure,
            direction: direction
        };
    }
    
    return null;
}

export function updateNearestBlock(cameraPos, viewMatrix) {
    createNearestBlockDisplay();
    
    const deepslateRenderer = window.deepslateRenderer;
    if (!deepslateRenderer || !deepslateRenderer.structure) {
        nearestBlockElement.style.display = 'none';
        return;
    }
    
    const structureInfo = findStructureDistance(cameraPos, deepslateRenderer.structure);
    
    if (structureInfo) {
        const arrow = getDirectionArrow(structureInfo.direction, viewMatrix);
        nearestBlockElement.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 4px; color: #ffdd44;">Structure</div>
            <div style="color: #fff;">${structureInfo.distance.toFixed(0)} blocks away</div>
        `;
        nearestBlockElement.style.display = 'block';
        
        // Create or update arrow element on center top of the box
        let arrowElement = document.getElementById('structure-arrow');
        if (!arrowElement) {
            arrowElement = document.createElement('div');
            arrowElement.id = 'structure-arrow';
            arrowElement.style.cssText = `
                position: fixed; bottom: 95px; right: 95px;
                font-size: 28px; z-index: 1002;
                pointer-events: none; color: #ffdd44;
                text-shadow: 0 0 6px rgba(0,0,0,0.8);
                transform: translateX(50%);
            `;
            document.body.appendChild(arrowElement);
        }
        arrowElement.textContent = arrow;
        arrowElement.style.display = 'block';
    } else {
        nearestBlockElement.style.display = 'none';
        const arrowElement = document.getElementById('structure-arrow');
        if (arrowElement) arrowElement.style.display = 'none';
    }
}

function getDirectionArrow(worldDirection, viewMatrix) {
    // Transform world direction to camera space
    const cameraRight = vec3.fromValues(viewMatrix[0], viewMatrix[4], viewMatrix[8]);
    const cameraForward = vec3.fromValues(-viewMatrix[2], -viewMatrix[6], -viewMatrix[10]);
    
    // Project direction onto camera's right and forward vectors
    const rightComponent = vec3.dot(worldDirection, cameraRight);
    const forwardComponent = vec3.dot(worldDirection, cameraForward);
    
    // Calculate angle relative to camera view
    let angle = Math.atan2(rightComponent, forwardComponent) * 180 / Math.PI;
    if (angle < 0) angle += 360;
    
    // Map angles to modern styled arrows
    if (angle >= 337.5 || angle < 22.5) return '⬆️';      // Forward
    else if (angle >= 22.5 && angle < 67.5) return '↗️';  // Forward-right
    else if (angle >= 67.5 && angle < 112.5) return '➡️'; // Right
    else if (angle >= 112.5 && angle < 157.5) return '↘️'; // Back-right
    else if (angle >= 157.5 && angle < 202.5) return '⬇️'; // Back
    else if (angle >= 202.5 && angle < 247.5) return '↙️'; // Back-left
    else if (angle >= 247.5 && angle < 292.5) return '⬅️'; // Left
    else return '↖️'; // Forward-left
}