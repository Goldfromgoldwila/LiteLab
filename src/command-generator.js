// src/command-generator.js

/**
 * Generates an optimized array of Minecraft /fill and /setblock commands.
 * Uses a greedy meshing approach to merge adjacent identical blocks into /fill commands.
 * @param {Litematic} litematic The loaded litematic object.
 * @param {number[]} origin The [x, y, z] origin point in the Minecraft world.
 * @returns {string[]} An array of command strings.
 */
function generateSetblockCommands(litematic, origin = [0, 0, 0]) {
    const commands = [];
    const region = litematic.regions[0];
    if (!region) return [];

    const width = Math.abs(region.width);
    const height = Math.abs(region.height);
    const depth = Math.abs(region.depth);
    const { blocks, blockPalette } = region;

    // A 3D array to keep track of blocks that have already been included in a /fill command
    const visited = Array.from({ length: width }, () =>
        Array.from({ length: height }, () => new Array(depth).fill(false))
    );

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            for (let z = 0; z < depth; z++) {
                if (visited[x][y][z]) continue;

                const blockIndex = blocks[x][y][z];
                if (blockIndex === 0) continue; // Skip air

                const blockInfo = blockPalette[blockIndex];
                if (!blockInfo || blockInfo.Name === 'minecraft:air') continue;

                visited[x][y][z] = true;
                
                // --- Greedy Meshing Algorithm ---
                // Find the largest possible cuboid (preferring Z, then X, then Y)
                let endX = x;
                while (endX + 1 < width && !visited[endX + 1][y][z] && blocks[endX + 1][y][z] === blockIndex) {
                    endX++;
                }
                
                let endZ = z;
                let canExtendZ = true;
                while (endZ + 1 < depth && canExtendZ) {
                    for (let ix = x; ix <= endX; ix++) {
                        if (visited[ix][y][endZ + 1] || blocks[ix][y][endZ + 1] !== blockIndex) {
                            canExtendZ = false;
                            break;
                        }
                    }
                    if (canExtendZ) endZ++;
                }

                let endY = y;
                let canExtendY = true;
                while(endY + 1 < height && canExtendY) {
                    for (let ix = x; ix <= endX; ix++) {
                        for (let iz = z; iz <= endZ; iz++) {
                            if (visited[ix][endY + 1][iz] || blocks[ix][endY + 1][iz] !== blockIndex) {
                                canExtendY = false;
                                break;
                            }
                        }
                        if (!canExtendY) break;
                    }
                    if (canExtendY) endY++;
                }

                // Mark all blocks in the found cuboid as visited
                for (let ix = x; ix <= endX; ix++) {
                    for (let iy = y; iy <= endY; iy++) {
                        for (let iz = z; iz <= endZ; iz++) {
                            visited[ix][iy][iz] = true;
                        }
                    }
                }

                // Format the command
                const blockName = `minecraft:${blockInfo.Name.replace(/^minecraft:/, '')}`;
                const properties = blockInfo.Properties || {};
                const propertyString = Object.entries(properties).map(([key, value]) => `${key}=${value}`).join(',');
                const blockStateString = propertyString ? `${blockName}[${propertyString}]` : blockName;

                const startCoord = `${origin[0] + x} ${origin[1] + y} ${origin[2] + z}`;
                
                if (x === endX && y === endY && z === endZ) {
                    // This is a single block, use /setblock
                    commands.push(`/setblock ${startCoord} ${blockStateString}`);
                } else {
                    // This is a cuboid, use /fill
                    const endCoord = `${origin[0] + endX} ${origin[1] + endY} ${origin[2] + endZ}`;
                    commands.push(`/fill ${startCoord} ${endCoord} ${blockStateString}`);
                }
            }
        }
    }

    return commands;
}