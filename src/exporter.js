// src/exporter.js

// Convert to NBT structure format
function convertToNbt(litematic) {
    if (!litematic || !litematic.regions || !litematic.regions[0]) {
        showNotification("Invalid litematic data", "error");
        return null;
    }
    
    const region = litematic.regions[0];
    const width = Math.abs(region.width);
    const height = Math.abs(region.height);
    const depth = Math.abs(region.depth);
    const { blocks, blockPalette } = region;

    // Build palette
    const palette = blockPalette.map(b => ({
        Name: b.Name.startsWith('minecraft:') ? b.Name : `minecraft:${b.Name}`,
        Properties: b.Properties || {}
    }));

    // Build block data
    const blockData = [];
    for (let y = 0; y < height; y++) {
        for (let z = 0; z < depth; z++) {
            for (let x = 0; x < width; x++) {
                if (blocks[x] && blocks[x][y] && blocks[x][y][z] > 0) {
                    blockData.push({
                        pos: [x, y, z],
                        state: blocks[x][y][z]
                    });
                }
            }
        }
    }

    return {
        DataVersion: 2586,
        size: [width, height, depth],
        palette: palette,
        blocks: blockData,
        entities: []
    };
}

// Convert to litematic format
function convertToLitematic(litematic) {
    if (!litematic || !litematic.regions || !litematic.regions[0]) {
        showNotification("Invalid litematic data", "error");
        return null;
    }
    
    const region = litematic.regions[0];
    const width = Math.abs(region.width);
    const height = Math.abs(region.height);
    const depth = Math.abs(region.depth);
    const { blocks, blockPalette } = region;
    const totalBlocks = width * height * depth;

    // Build BlockStates (packed bit array)
    const nbits = Math.max(2, Math.ceil(Math.log2(blockPalette.length)));
    const longsNeeded = Math.ceil(totalBlocks * nbits / 64);
    const blockStates = new Array(longsNeeded).fill(0n);
    let bitIndex = 0;

    for (let y = 0; y < height; y++) {
        for (let z = 0; z < depth; z++) {
            for (let x = 0; x < width; x++) {
                const paletteIndex = blocks[x] && blocks[x][y] ? blocks[x][y][z] || 0 : 0;
                const longIndex = Math.floor(bitIndex / 64);
                const bitOffset = bitIndex % 64;
                blockStates[longIndex] |= (BigInt(paletteIndex) << BigInt(bitOffset));
                bitIndex += nbits;
            }
        }
    }

    // Build BlockStatePalette
    const palette = blockPalette.map(p => ({
        Name: p.Name.startsWith('minecraft:') ? p.Name : `minecraft:${p.Name}`,
        Properties: p.Properties || {}
    }));

    return {
        MinecraftDataVersion: 2586,
        Version: 5,
        Regions: {
            "Unnamed": {
                BlockStates: blockStates,
                BlockStatePalette: palette,
                Entities: [],
                PendingBlockTicks: [],
                PendingFluidTicks: [],
                Position: { x: 0, y: 0, z: 0 },
                Size: { x: width, y: height, z: depth }
            }
        }
    };
}


function exportLitematicView() {
    if (!structureLitematic) {
        showNotification('No structure loaded', 'error');
        return;
    }
    
    try {
        // Use the original buffer if available, otherwise create JSON export
        const buffer = structureLitematic.originalBuffer || new TextEncoder().encode(JSON.stringify(structureLitematic));
        
        const blob = new Blob([buffer], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'structure_copy.litematic';
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        showNotification('Downloaded structure_copy.litematic', 'success');
    } catch (error) {
        console.error('Export error:', error);
        showNotification('Export failed: ' + error.message, 'error');
    }
}

function createFilteredLitematic(originalLitematic, y_min, y_max, blockFilter) {
    const region = originalLitematic.regions[0];
    const { blockPalette, blocks } = region;
    const width = Math.abs(region.width);
    const height = Math.abs(region.height);
    const depth = Math.abs(region.depth);

    const newBlocks = [];
    let nonAirCount = 0;

    for (let x = 0; x < width; x++) {
        newBlocks[x] = [];
        for (let y = 0; y < height; y++) {
            newBlocks[x][y] = [];
            for (let z = 0; z < depth; z++) {
                let setAir = true;
                if (y >= y_min && y <= y_max + 1 && blocks[x] && blocks[x][y]) {
                    const blockID = blocks[x][y][z];
                    if (blockID > 0 && blockID < blockPalette.length) {
                        const blockInfo = blockPalette[blockID];
                        const blockFullName = `minecraft:${blockInfo.Name.replace(/^minecraft:/, '')}`;
                        if (!blockFilter || (Array.isArray(blockFilter) ? blockFilter.includes(blockFullName) : blockFullName === blockFilter)) {
                            newBlocks[x][y][z] = blockID;
                            nonAirCount++;
                            setAir = false;
                        }
                    }
                }
                if (setAir) newBlocks[x][y][z] = 0;
            }
        }
    }

    if (nonAirCount === 0) {
        throw new Error('No blocks to export after filtering.');
    }

    return {
        regions: [{
            width: width,
            height: height,
            depth: depth,
            blocks: newBlocks,
            blockPalette: blockPalette
        }]
    };
}


function countNonAirBlocks(blocks) {
    let count = 0;
    for (let x = 0; x < blocks.length; x++) {
        for (let y = 0; y < blocks[x].length; y++) {
            for (let z = 0; z < blocks[x][y].length; z++) {
                if (blocks[x][y][z] > 0) count++;
            }
        }
    }
    return count;
}

function createLitematicNBT(litematic) {
    const region = litematic.regions[0];
    const { width, height, depth, blocks, blockPalette } = region;
    
    // Convert blocks to simple format
    const blockList = [];
    for (let y = 0; y < height; y++) {
        for (let z = 0; z < depth; z++) {
            for (let x = 0; x < width; x++) {
                if (blocks[x] && blocks[x][y] && blocks[x][y][z] > 0) {
                    blockList.push({
                        x: x, y: y, z: z,
                        state: blocks[x][y][z]
                    });
                }
            }
        }
    }
    
    return {
        DataVersion: 2586,
        Version: 5,
        Size: { x: width, y: height, z: depth },
        Palette: blockPalette.map(p => ({
            Name: p.Name.startsWith('minecraft:') ? p.Name : `minecraft:${p.Name}`,
            Properties: p.Properties || {}
        })),
        BlockData: blockList
    };
}

function writeSimpleNBT(data) {
    const jsonStr = JSON.stringify(data);
    const buffer = new ArrayBuffer(jsonStr.length + 10);
    const view = new DataView(buffer);
    
    // Simple NBT header
    view.setUint8(0, 10); // Compound tag
    view.setUint16(1, 0); // Empty name
    
    // Write JSON as string data
    const encoder = new TextEncoder();
    const jsonBytes = encoder.encode(jsonStr);
    const result = new Uint8Array(3 + jsonBytes.length);
    result[0] = 10; // Compound tag
    result[1] = 0; // Name length high
    result[2] = 0; // Name length low
    result.set(jsonBytes, 3);
    
    return result;
}

function downloadNbt(nbtData, filename) {
    if (!nbtData) {
        showNotification('No NBT data to export', 'error');
        return;
    }
    
    try {
        const jsonData = JSON.stringify(nbtData, null, 2);
        const jsonFilename = filename.replace('.nbt', '.json');
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = jsonFilename;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        showNotification(`Downloaded ${jsonFilename}`, 'success');
    } catch (error) {
        console.error('Export error:', error);
        showNotification('Export failed: ' + error.message, 'error');
    }
}