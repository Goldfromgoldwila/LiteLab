// src/command-parser.js

/**
 * Parses a string of /setblock and /fill commands and converts it into a litematic-like object.
 * @param {string} commandString A string containing one or more commands.
 * @returns {object} A litematic-like object that can be processed by the main app.
 */
function litematicFromCommands(commandString) {
  const parsedBlocks = [];
  let minCoords = { x: Infinity, y: Infinity, z: Infinity };
  let maxCoords = { x: -Infinity, y: -Infinity, z: -Infinity };

  const setblockRegex = /\/setblock\s+(-?\d+)\s+(-?\d+)\s+(-?\d+)\s+([\w:]+)(?:\[([^\]]*)\])?/g;
  const fillRegex = /\/fill\s+(-?\d+)\s+(-?\d+)\s+(-?\d+)\s+(-?\d+)\s+(-?\d+)\s+(-?\d+)\s+([\w:]+)(?:\[([^\]]*)\])?/g;
  let match;

  // --- Pass 1: Parse /setblock commands ---
  while ((match = setblockRegex.exec(commandString)) !== null) {
    const x = parseInt(match[1], 10);
    const y = parseInt(match[2], 10);
    const z = parseInt(match[3], 10);
    const name = match[4].replace(/^minecraft:/, '');
    const propertiesString = match[5];
    
    const properties = {};
    if (propertiesString) {
      propertiesString.split(',').forEach(part => {
        const [key, value] = part.split('=');
        if (key && value) properties[key.trim()] = value.trim();
      });
    }

    parsedBlocks.push({ x, y, z, Name: name, Properties: properties });
  }
  
  // --- Pass 2: Parse /fill commands ---
  while ((match = fillRegex.exec(commandString)) !== null) {
      const x1 = parseInt(match[1], 10);
      const y1 = parseInt(match[2], 10);
      const z1 = parseInt(match[3], 10);
      const x2 = parseInt(match[4], 10);
      const y2 = parseInt(match[5], 10);
      const z2 = parseInt(match[6], 10);
      const name = match[7].replace(/^minecraft:/, '');
      const propertiesString = match[8];
      
      const properties = {};
      if (propertiesString) {
          propertiesString.split(',').forEach(part => {
              const [key, value] = part.split('=');
              if (key && value) properties[key.trim()] = value.trim();
          });
      }

      // Iterate through the cuboid defined by the /fill command
      for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
          for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
              for (let z = Math.min(z1, z2); z <= Math.max(z1, z2); z++) {
                  parsedBlocks.push({ x, y, z, Name: name, Properties: properties });
              }
          }
      }
  }

  if (parsedBlocks.length === 0) {
    throw new Error("No valid /setblock or /fill commands found in the input.");
  }
  
  // --- Pass 3: Find boundaries from all parsed blocks ---
  for (const block of parsedBlocks) {
      minCoords.x = Math.min(minCoords.x, block.x);
      minCoords.y = Math.min(minCoords.y, block.y);
      minCoords.z = Math.min(minCoords.z, block.z);
      maxCoords.x = Math.max(maxCoords.x, block.x);
      maxCoords.y = Math.max(maxCoords.y, block.y);
      maxCoords.z = Math.max(maxCoords.z, block.z);
  }

  // Calculate dimensions and create the data structure
  const width = maxCoords.x - minCoords.x + 1;
  const height = maxCoords.y - minCoords.y + 1;
  const depth = maxCoords.z - minCoords.z + 1;

  const blocks = Array.from({ length: width }, () => Array.from({ length: height }, () => new Array(depth).fill(0)));
  const blockPalette = [{ Name: 'minecraft:air' }];
  const paletteMap = new Map();

  // Populate the 3D array and the block palette
  for (const block of parsedBlocks) {
    const propKey = Object.keys(block.Properties).sort().map(k => `${k}=${block.Properties[k]}`).join(',');
    const paletteKey = `${block.Name}[${propKey}]`;
    let paletteIndex = paletteMap.get(paletteKey);

    if (paletteIndex === undefined) {
      paletteIndex = blockPalette.length;
      blockPalette.push({ Name: block.Name, Properties: block.Properties });
      paletteMap.set(paletteKey, paletteIndex);
    }
    
    const relX = block.x - minCoords.x;
    const relY = block.y - minCoords.y;
    const relZ = block.z - minCoords.z;

    if (relX >= 0 && relX < width && relY >= 0 && relY < height && relZ >= 0 && relZ < depth) {
      blocks[relX][relY][relZ] = paletteIndex;
    }
  }
  
  // Assemble the final litematic-like object
  const litematic = {
    regions: [{
      width,
      height,
      depth,
      blocks,
      blockPalette
    }]
  };
  
  return litematic;
}

export { litematicFromCommands };