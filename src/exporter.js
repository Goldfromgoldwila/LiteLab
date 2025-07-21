// src/exporter.js

function convertToNbt(litematic) {
    // FIX: Add guard clause to ensure NBT library is loaded
    if (!window.nbt || !window.nbt.comp) {
        showNotification("Exporter library not ready, please wait a moment and try again.", "error");
        return null;
    }
    const { comp } = window.nbt;
    const region = litematic.regions[0];
    const { width, height, depth, blocks, blockPalette } = region;

    const palette = blockPalette.map(b => ({
        Name: { type: 'string', value: `minecraft:${b.Name.replace(/^minecraft:/, '')}` },
        Properties: { type: 'compound', value: b.Properties ? comp(b.Properties) : {} }
    }));

    const blockData = [];
    for (let y = 0; y < height; y++) {
        for (let z = 0; z < depth; z++) {
            for (let x = 0; x < width; x++) {
                blockData.push({
                    pos: { type: 'list', value: { type: 'int', value: [x, y, z] } },
                    state: { type: 'int', value: blocks[x][y][z] }
                });
            }
        }
    }

    return comp({
        DataVersion: { type: 'int', value: 2586 },
        size: { type: 'list', value: { type: 'int', value: [width, height, depth] } },
        palette: { type: 'list', value: { type: 'compound', value: palette } },
        blocks: { type: 'list', value: { type: 'compound', value: blockData } },
        entities: { type: 'list', value: { type: 'end', value: [] } }
    });
}

function convertToSchem(litematic) {
    if (!window.nbt || !window.nbt.comp) {
        showNotification("Exporter library not ready, please wait a moment and try again.", "error");
        return null;
    }
    const { comp } = window.nbt;
    const region = litematic.regions[0];
    const width = Math.abs(region.width);
    const height = Math.abs(region.height);
    const depth = Math.abs(region.depth);
    const { blocks, blockPalette } = region;
    
    const palette = {};
    let paletteIndex = 0;
    const blockIDs = new Uint32Array(width * height * depth);

    for (let y = 0; y < height; y++) {
        for (let z = 0; z < depth; z++) {
            for (let x = 0; x < width; x++) {
                const blockInfo = blockPalette[blocks[x][y][z]];
                if (!blockInfo) continue;
                const blockName = `minecraft:${blockInfo.Name.replace(/^minecraft:/, '')}`;
                
                const properties = blockInfo.Properties || {};
                const propString = Object.entries(properties).sort().map(([k, v]) => `${k}=${v}`).join(',');
                const fullId = propString ? `${blockName}[${propString}]` : blockName;

                if (!(fullId in palette)) {
                    palette[fullId] = paletteIndex++;
                }

                const index = (y * depth + z) * width + x;
                blockIDs[index] = palette[fullId];
            }
        }
    }
    
    return comp({
        Version: { type: 'int', value: 2 },
        DataVersion: { type: 'int', value: 2586 },
        Width: { type: 'short', value: width },
        Height: { type: 'short', value: height },
        Length: { type: 'short', value: depth },
        Palette: { type: 'compound', value: comp(palette) },
        PaletteMax: { type: 'int', value: paletteIndex },
        BlockData: { type: 'byteArray', value: new Uint8Array(blockIDs.buffer) },
        BlockEntities: { type: 'list', value: { type: 'end', value: [] } }
    });
}

function downloadNbt(nbtData, filename) {
    if (!nbtData) return; // Don't proceed if NBT conversion failed
    if (!window.nbt || !window.nbt.write) {
        showNotification("Exporter library not ready, please wait a moment and try again.", "error");
        return;
    }
    const { write } = window.nbt;
    const buffer = write(nbtData, 'big');
    const blob = new Blob([buffer], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}