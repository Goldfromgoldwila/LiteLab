// src/exporter.js
import * as deepslate from 'deepslate';
import pako from 'pako';

// This function needs to be available to other modules
function showNotification(message, type = 'info') {
    const container = document.getElementById('notification-container');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    container.appendChild(notification);
    setTimeout(() => notification.classList.add('show'), 10);
    setTimeout(() => {
        notification.classList.remove('show');
        notification.addEventListener('transitionend', () => notification.remove());
    }, 3000);
}

// Convert to litematic format
function convertToLitematic(litematic) {
    if (!litematic?.regions?.[0]) {
        showNotification("Invalid litematic data", "error");
        return null;
    }
    
    const region = litematic.regions[0];
    const width = Math.abs(region.width);
    const height = Math.abs(region.height);
    const depth = Math.abs(region.depth);
    const { blocks, blockPalette } = region;

    // Use original NBT structure if available
    if (litematic.originalNBT) {
        return litematic.originalNBT;
    }
    
    // Fallback: create basic structure
    const blockStatesList = [];
    for (let y = 0; y < height; y++) {
        for (let z = 0; z < depth; z++) {
            for (let x = 0; x < width; x++) {
                blockStatesList.push(blocks?.[x]?.[y]?.[z] || 0);
            }
        }
    }
    
    return {
        MinecraftDataVersion: 2586,
        Version: 5,
        Regions: {
            "Unnamed": {
                BlockStates: blockStatesList,
                BlockStatePalette: blockPalette,
                Entities: [],
                PendingBlockTicks: [],
                PendingFluidTicks: [],
                Position: { x: 0, y: 0, z: 0 },
                Size: { x: width, y: height, z: depth }
            }
        }
    };
}

export function exportLitematicView() {
    showNotification('.litematic export not implemented yet', 'info');
}

export function exportNBTView() {
    const structureLitematic = window.AppState?.structureLitematic;
    if (!structureLitematic) {
        showNotification('No structure loaded', 'error');
        return;
    }
    
    try {
        const region = structureLitematic.regions[0];
        const nbtData = {
            DataVersion: 2586,
            size: [region.width, region.height, region.depth],
            palette: region.blockPalette.map(block => ({
                Name: block.Name.startsWith('minecraft:') ? block.Name : `minecraft:${block.Name}`,
                Properties: block.Properties || {}
            })),
            blocks: []
        };
        
        for (let x = 0; x < Math.abs(region.width); x++) {
            for (let y = 0; y < Math.abs(region.height); y++) {
                for (let z = 0; z < Math.abs(region.depth); z++) {
                    const blockId = region.blocks[x]?.[y]?.[z];
                    if (blockId > 0) {
                        nbtData.blocks.push({
                            pos: [x, y, z],
                            state: blockId
                        });
                    }
                }
            }
        }
        
        const jsonString = JSON.stringify(nbtData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'structure_export.nbt';
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        showNotification('Downloaded structure_export.nbt', 'success');
    } catch (error) {
        console.error('NBT export error:', error);
        showNotification('NBT export failed: ' + error.message, 'error');
    }
}