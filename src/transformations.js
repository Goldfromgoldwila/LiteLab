// src/transformations.js

// Comprehensive maps for blockstate transformations
const ROTATE_Y_MAP = {
    // Fixed: 90° clockwise rotation (opposite direction)
    facing: { north: 'west', west: 'south', south: 'east', east: 'north' },
    axis: { x: 'z', z: 'x', y: 'y' }, // Y axis stays the same
    shape: { // For stairs - 90° clockwise rotation (corrected direction)
        straight: 'straight',
        inner_left: 'outer_right',
        inner_right: 'outer_left', 
        outer_left: 'inner_right',
        outer_right: 'inner_left'
    },
    half: { // For stairs, slabs, trapdoors
        top: 'top',
        bottom: 'bottom'
    },
    hinge: { // For doors, trapdoors - 90° rotation changes hinge side
        left: 'right',
        right: 'left'
    },
    open: { // For doors, trapdoors, gates
        'true': 'true',
        'false': 'false'
    },
    powered: { // For redstone components
        'true': 'true',
        'false': 'false'
    }
};

const FLIP_X_MAP = {
    facing: { 
        east: 'west', 
        west: 'east',
        north: 'north',
        south: 'south'
    },
    axis: { 
        x: 'x', 
        z: 'z', 
        y: 'y'
    },
    shape: { // For stairs
        straight: 'straight',
        inner_left: 'inner_right',
        inner_right: 'inner_left',
        outer_left: 'outer_right',
        outer_right: 'outer_left'
    },
    half: {
        top: 'top',
        bottom: 'bottom'
    },
    hinge: { // For doors, trapdoors
        left: 'right',
        right: 'left'
    }
};

const FLIP_Z_MAP = {
    facing: { 
        north: 'south', 
        south: 'north',
        east: 'east',
        west: 'west'
    },
    axis: { 
        x: 'x', 
        z: 'z', 
        y: 'y'
    },
    shape: { // For stairs
        straight: 'straight',
        inner_left: 'outer_left',
        outer_left: 'inner_left',
        inner_right: 'outer_right',
        outer_right: 'inner_right'
    },
    half: {
        top: 'top',
        bottom: 'bottom'
    },
    hinge: { // Hinge stays the same for Z flip
        left: 'left',
        right: 'right'
    }
};

// Helper function to find or create a transformed block palette entry
function getTransformedPaletteIndex(oldPalette, newPalette, paletteMap, oldIndex, transformMaps) {
    if (oldIndex === 0) return 0; // Air remains air

    const originalBlock = oldPalette[oldIndex];
    if (!originalBlock) return oldIndex; // Safety check
    
    const memoizationKey = `${oldIndex}-${transformMaps.map(m => Object.keys(m)[0]).join('-')}`;
    if (paletteMap.has(memoizationKey)) {
        return paletteMap.get(memoizationKey);
    }

    let newProperties = originalBlock.Properties ? { ...originalBlock.Properties } : {};
    let wasChanged = false;

    // Apply all transformation maps to the block's properties
    for (const propName in newProperties) {
        for (const map of transformMaps) {
            if (map[propName] && map[propName][newProperties[propName]]) {
                const oldValue = newProperties[propName];
                newProperties[propName] = map[propName][newProperties[propName]];
                wasChanged = true;
            }
        }
    }

    if (!wasChanged) {
        // Find the index of the original block in the new palette
        const originalBlockKey = JSON.stringify(originalBlock);
        for(let i = 1; i < newPalette.length; i++){
            if(JSON.stringify(newPalette[i]) === originalBlockKey){
                paletteMap.set(memoizationKey, i);
                return i;
            }
        }
        // This case should ideally not be hit if the newPalette is seeded correctly.
        const newIndex = newPalette.length;
        newPalette.push(JSON.parse(originalBlockKey));
        paletteMap.set(memoizationKey, newIndex);
        return newIndex;
    }
    
    const newBlock = { 
        Name: originalBlock.Name,
        Properties: newProperties
    };
    const newBlockKey = JSON.stringify(newBlock);

    // Check if this transformed block already exists in the palette
    for (let i = 1; i < newPalette.length; i++) {
        if (JSON.stringify(newPalette[i]) === newBlockKey) {
            paletteMap.set(memoizationKey, i);
            return i;
        }
    }
    
    // Add new transformed block to palette
    const newIndex = newPalette.length;
    newPalette.push(newBlock);
    paletteMap.set(memoizationKey, newIndex);
    return newIndex;
}

function rotateY90(litematic) {
    const oldRegion = litematic.regions[0];
    if (!oldRegion) return litematic;

    const width = Math.abs(oldRegion.width);
    const height = Math.abs(oldRegion.height);
    const depth = Math.abs(oldRegion.depth);
    const { blocks, blockPalette: oldPalette } = oldRegion;
    
    // When rotating 90° clockwise around Y, width becomes depth and depth becomes width
    const newWidth = depth;
    const newDepth = width;

    const newPalette = JSON.parse(JSON.stringify(oldPalette));
    const paletteMap = new Map();
    const newBlocks = Array.from({ length: newWidth }, () => 
        Array.from({ length: height }, () => 
            new Array(newDepth).fill(0)
        )
    );

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            for (let z = 0; z < depth; z++) {
                if (!blocks[x] || !blocks[x][y]) continue;
                
                // 90° clockwise rotation: (x,z) -> (z, width-1-x)
                const newX = z;
                const newZ = width - 1 - x;
                const oldIndex = blocks[x][y][z];
                
                if (oldIndex !== undefined && oldIndex !== null) {
                    newBlocks[newX][y][newZ] = getTransformedPaletteIndex(
                        oldPalette, newPalette, paletteMap, oldIndex, [ROTATE_Y_MAP]
                    );
                }
            }
        }
    }

    const newRegion = { 
        ...oldRegion, 
        width: newWidth, 
        height, 
        depth: newDepth, 
        blocks: newBlocks, 
        blockPalette: newPalette 
    };
    return { ...litematic, regions: [newRegion] };
}

function flipX(litematic) {
    const oldRegion = litematic.regions[0];
    if (!oldRegion) return litematic;

    const width = Math.abs(oldRegion.width);
    const height = Math.abs(oldRegion.height);
    const depth = Math.abs(oldRegion.depth);
    const { blocks, blockPalette: oldPalette } = oldRegion;

    const newPalette = JSON.parse(JSON.stringify(oldPalette));
    const paletteMap = new Map();
    const newBlocks = Array.from({ length: width }, () => 
        Array.from({ length: height }, () => 
            new Array(depth).fill(0)
        )
    );

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            for (let z = 0; z < depth; z++) {
                if (!blocks[x] || !blocks[x][y]) continue;
                
                const newX = width - 1 - x;
                const oldIndex = blocks[x][y][z];
                
                if (oldIndex !== undefined && oldIndex !== null) {
                    newBlocks[newX][y][z] = getTransformedPaletteIndex(
                        oldPalette, newPalette, paletteMap, oldIndex, [FLIP_X_MAP]
                    );
                }
            }
        }
    }
    
    const newRegion = { 
        ...oldRegion, 
        width, 
        height, 
        depth, 
        blocks: newBlocks, 
        blockPalette: newPalette 
    };
    return { ...litematic, regions: [newRegion] };
}

function flipZ(litematic) {
    const oldRegion = litematic.regions[0];
    if (!oldRegion) return litematic;

    const width = Math.abs(oldRegion.width);
    const height = Math.abs(oldRegion.height);
    const depth = Math.abs(oldRegion.depth);
    const { blocks, blockPalette: oldPalette } = oldRegion;

    const newPalette = JSON.parse(JSON.stringify(oldPalette));
    const paletteMap = new Map();
    const newBlocks = Array.from({ length: width }, () => 
        Array.from({ length: height }, () => 
            new Array(depth).fill(0)
        )
    );

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            for (let z = 0; z < depth; z++) {
                if (!blocks[x] || !blocks[x][y]) continue;
                
                const newZ = depth - 1 - z;
                const oldIndex = blocks[x][y][z];
                
                if (oldIndex !== undefined && oldIndex !== null) {
                    newBlocks[x][y][newZ] = getTransformedPaletteIndex(
                        oldPalette, newPalette, paletteMap, oldIndex, [FLIP_Z_MAP]
                    );
                }
            }
        }
    }

    const newRegion = { 
        ...oldRegion, 
        width, 
        height, 
        depth, 
        blocks: newBlocks, 
        blockPalette: newPalette 
    };
    return { ...litematic, regions: [newRegion] };
}

export { rotateY90, flipX, flipZ };