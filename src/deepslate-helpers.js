import * as deepslate from 'deepslate';

// src/deepslate-helpers.js

var deepslateResources;

function upperPowerOfTwo(x) {
	x -= 1
	x |= x >> 1
	x |= x >> 2
	x |= x >> 4
	x |= x >> 8
	x |= x >> 18
	x |= x >> 32
	return x + 1
}

function loadDeepslateResources(textureImage) {
  // The global 'assets' and 'OPAQUE_BLOCKS' are guaranteed to be loaded
  // by the time this module-based script runs.
  const assets = window.assets;
  const OPAQUE_BLOCKS = window.OPAQUE_BLOCKS;
  
  if (!assets) {
    console.error('CRITICAL: window.assets is not defined. Make sure assets.js is in the /public/resource folder and loaded in index.html.');
    return null;
  }
  
  const blockDefinitions = {};
  Object.keys(assets.blockstates).forEach(id => {
    blockDefinitions['minecraft:' + id] = deepslate.BlockDefinition.fromJson(id, assets.blockstates[id]);
  })

  const blockModels = {};
  Object.keys(assets.models).forEach(id => {
    blockModels['minecraft:' + id] = deepslate.BlockModel.fromJson(id, assets.models[id]);
  })
  Object.values(blockModels).forEach(m => m.flatten({ getBlockModel: id => blockModels[id] }));

  const atlasCanvas = document.createElement('canvas');
  const atlasSize = upperPowerOfTwo((textureImage.width >= textureImage.height) ? textureImage.width : textureImage.height);
  atlasCanvas.width = textureImage.width;
  atlasCanvas.height = textureImage.height;

  const atlasCtx = atlasCanvas.getContext('2d');
  atlasCtx.drawImage(textureImage, 0, 0);

  const atlasData = atlasCtx.getImageData(0, 0, atlasSize, atlasSize);

  const idMap = {};

  Object.keys(assets.textures).forEach(id => {
		const [u, v, du, dv] = assets.textures[id]
		const dv2 = (du !== dv && id.startsWith('block/')) ? du : dv
		idMap['minecraft:' + id] = [u / atlasSize, v / atlasSize, (u + du) / atlasSize, (v + dv2) / atlasSize]
	})

  const textureAtlas = new deepslate.TextureAtlas(atlasData, idMap);

  deepslateResources = {
    getBlockDefinition(id) { return blockDefinitions[id] },
    getBlockModel(id) { return blockModels[id] },
    getTextureUV(id) { return textureAtlas.getTextureUV(id) },
    getTextureAtlas() { return textureAtlas.getTextureAtlas() },
    getBlockFlags(id) {
      const opaqueBlocks = OPAQUE_BLOCKS || new Set();
      const NON_SELF_CULLING = new Set();
      const TRANSPARENT_BLOCKS = new Set();
      return {
        opaque: opaqueBlocks.has(id.toString()),
        self_culling: !NON_SELF_CULLING.has(id.toString()),
        semi_transparent: TRANSPARENT_BLOCKS.has(id.toString()),
      };
    },
    getBlockProperties(id) { return null },
    getDefaultBlockProperties(id) { return null },
  }
  
  window.deepslateResources = deepslateResources;
  return deepslateResources;
}

function structureFromLitematic(litematic, y_min=0, y_max=-1, filterBlockNames = null) {
  if (!litematic || !litematic.regions || !litematic.regions[0] || !litematic.regions[0].blocks) {
      console.error("Attempted to process an invalid or corrupt litematic object.");
      return { structure: new deepslate.Structure([0,0,0]), blockCount: 0 };
  }
    
  const region = litematic.regions[0];
  const { blockPalette, blocks } = region;
  const width = Math.abs(region.width);
  const height = Math.abs(region.height);
  const depth = Math.abs(region.depth);

  if (y_max === -1) { y_max = height; }
  
  const structure = new deepslate.Structure([width, height, depth]);

  let blockCount = 0;
  for (let x=0; x < width; x++) {
    for (let y=y_min; y < y_max; y++) {
      for (let z=0; z < depth; z++) {
        if (!blocks[x] || !blocks[x][y]) continue;
        const blockID = blocks[x][y][z];

        if (blockID > 0) {
          if(blockID < blockPalette.length) {
            const blockInfo = blockPalette[blockID];
            const blockFullName = `minecraft:${blockInfo.Name.replace(/^minecraft:/, '')}`;

            // Handle filtering
            if (filterBlockNames && !filterBlockNames.includes(blockFullName)) {
                continue;
            }

            blockCount++;
            structure.addBlock([x, y, z], blockInfo.Name, blockInfo.Properties);
          } else {
            structure.addBlock([x, y, z], "minecraft:cake");
          }
        }
      }
    }
  }
  return { structure, blockCount };
}

export { loadDeepslateResources, structureFromLitematic };