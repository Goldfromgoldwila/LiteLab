// Minimap functionality for LiteLab
class Minimap {
    constructor() {
        this.canvas = document.getElementById('minimap-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.indicator = document.getElementById('camera-indicator');
        this.container = document.getElementById('minimap');
        this.structureData = null;
        this.bounds = { minX: 0, maxX: 0, minZ: 0, maxZ: 0 };
        this.scale = 1;
    }

    show() {
        this.container.classList.remove('hidden');
    }

    hide() {
        this.container.classList.add('hidden');
    }

    updateStructure(litematic) {
        if (!litematic || !litematic.regions || !litematic.regions[0]) {
            this.hide();
            return;
        }

        this.structureData = litematic;
        const region = litematic.regions[0];
        
        // Calculate bounds with padding - handle both litematic and command structures
        const padding = 5;
        const posX = (region.position && region.position.x) || 0;
        const posZ = (region.position && region.position.z) || 0;
        
        this.bounds = {
            minX: posX - padding,
            maxX: posX + Math.abs(region.width) + padding,
            minZ: posZ - padding,
            maxZ: posZ + Math.abs(region.depth) + padding
        };

        // Calculate scale to fit in canvas
        const width = this.bounds.maxX - this.bounds.minX;
        const depth = this.bounds.maxZ - this.bounds.minZ;
        this.scale = Math.min(128 / width, 128 / depth) * 0.8;

        this.render();
        this.show();
    }

    render() {
        if (!this.structureData) return;

        const ctx = this.ctx;
        const region = this.structureData.regions[0];
        
        // Clear canvas
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, 128, 128);

        const centerX = 64;
        const centerZ = 64;
        const width = (this.bounds.maxX - this.bounds.minX) * this.scale;
        const depth = (this.bounds.maxZ - this.bounds.minZ) * this.scale;
        
        // Draw each block as a colored pixel based on block type
        const blockSize = Math.max(1, this.scale);
        
        for (let x = 0; x < Math.abs(region.width); x++) {
            for (let z = 0; z < Math.abs(region.depth); z++) {
                // Find the topmost block in this column
                let topBlock = null;
                const maxY = Math.abs(region.height);
                for (let y = maxY - 1; y >= 0; y--) {
                    if (region.blocks[x] && region.blocks[x][y] && region.blocks[x][y][z] !== 0) {
                        topBlock = region.blocks[x][y][z];
                        break;
                    }
                }
                
                if (topBlock !== null && topBlock !== undefined) {
                    // Get block name and assign color
                    const blockInfo = (region.blockPalette && region.blockPalette[topBlock]) || { Name: 'minecraft:stone' };
                    const blockName = blockInfo.Name || blockInfo || 'minecraft:stone';
                    ctx.fillStyle = this.getBlockColor(blockName);
                    
                    const pixelX = centerX - width / 2 + (x * this.scale);
                    const pixelZ = centerZ - depth / 2 + (z * this.scale);
                    ctx.fillRect(pixelX, pixelZ, blockSize, blockSize);
                }
            }
        }
        
        // Draw border
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1;
        ctx.strokeRect(
            centerX - width / 2,
            centerZ - depth / 2,
            width,
            depth
        );
    }

    getBlockColor(blockName) {
        // Ensure blockName is a string
        const name = String(blockName || 'minecraft:stone');
        
        // Simple color mapping for common blocks
        const colorMap = {
            'minecraft:stone': '#7f8c8d',
            'minecraft:dirt': '#8b4513',
            'minecraft:grass_block': '#228b22',
            'minecraft:oak_log': '#8b4513',
            'minecraft:oak_planks': '#deb887',
            'minecraft:cobblestone': '#696969',
            'minecraft:sand': '#f4a460',
            'minecraft:water': '#4682b4',
            'minecraft:lava': '#ff4500',
            'minecraft:iron_ore': '#b0c4de',
            'minecraft:coal_ore': '#2f4f4f',
            'minecraft:diamond_ore': '#00ced1',
            'minecraft:gold_ore': '#ffd700',
            'minecraft:redstone_ore': '#dc143c',
            'minecraft:wool': '#f5f5f5',
            'minecraft:glass': '#87ceeb'
        };
        
        // Check for specific block types
        if (name.includes('wool')) return '#f0f0f0';
        if (name.includes('log') || name.includes('wood')) return '#8b4513';
        if (name.includes('stone')) return '#808080';
        if (name.includes('dirt')) return '#8b4513';
        if (name.includes('grass')) return '#228b22';
        if (name.includes('sand')) return '#f4a460';
        if (name.includes('ore')) return '#a0a0a0';
        
        return colorMap[name] || '#64748b';
    }

    updateCameraPosition(cameraPos, cameraDir) {
        if (!this.structureData) return;

        const centerX = 64;
        const centerZ = 64;
        const width = (this.bounds.maxX - this.bounds.minX) * this.scale;
        const depth = (this.bounds.maxZ - this.bounds.minZ) * this.scale;

        // Convert world position to minimap position
        const relativeX = Math.max(0, Math.min(1, (cameraPos[0] - this.bounds.minX) / (this.bounds.maxX - this.bounds.minX)));
        const relativeZ = Math.max(0, Math.min(1, (cameraPos[2] - this.bounds.minZ) / (this.bounds.maxZ - this.bounds.minZ)));
        
        const indicatorX = centerX - width / 2 + (relativeX * width);
        const indicatorZ = centerZ - depth / 2 + (relativeZ * depth);

        // Update indicator position
        this.indicator.style.left = `${indicatorX}px`;
        this.indicator.style.top = `${indicatorZ}px`;

        // Rotate indicator based on camera direction
        const angle = Math.atan2(cameraDir[0], cameraDir[2]) * (180 / Math.PI);
        this.indicator.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;
    }
}

// Create global minimap instance
window.minimap = new Minimap();

export { Minimap };