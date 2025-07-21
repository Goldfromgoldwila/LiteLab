// src/main.js

var structureLitematic;
var highlightedBlockName = null;

function resetAppView() {
    document.getElementById('controls-panel').classList.add('hidden');
    // Restore visibility of initial panels
    document.getElementById('file-panel').style.display = 'block';
    document.getElementById('command-panel').style.display = 'block';
    document.getElementById('viewer-overlay').style.display = 'flex';
    
    // Cleanly stop the render loop and remove the canvas
    stopRendering();
    const viewer = document.getElementById('viewer');
    const canvas = viewer.querySelector('canvas');
    if (canvas) canvas.remove();
    if (window.resizeHandler) {
        window.removeEventListener('resize', window.resizeHandler);
        window.resizeHandler = null;
    }
    webglContext = null;
    structureLitematic = null;
    highlightedBlockName = null;
    showNotification('Ready to load a new schematic.', 'info');
}

/**
 * The single, central function for updating the 3D view.
 */
function renderFilteredStructure() {
    if (!structureLitematic) return;
    const y_min = parseInt(document.getElementById('miny-slider').value);
    const y_max = parseInt(document.getElementById('maxy-slider').value);
    
    if (y_min > y_max) {
        setStructure(new deepslate.Structure([0,0,0]), false);
        document.getElementById('total-blocks-info').textContent = `Visible Blocks: 0`;
        return;
    }

    const { structure, blockCount } = structureFromLitematic(structureLitematic, y_min, y_max + 1, highlightedBlockName);
    setStructure(structure, false);
    document.getElementById('total-blocks-info').textContent = `Visible Blocks: ${blockCount}`;
}

function reprocessAndRender() {
    if (!structureLitematic) return;
    try {
        const max_y = Math.abs(structureLitematic.regions[0].height);
        createRangeSliders(max_y);
        renderFilteredStructure();
        const blockCounts = getMaterialList(structureLitematic);
        createMaterialsList(blockCounts);
        regenerateCommands();
    } catch (error) {
        console.error("Failed to re-render after transformation:", error);
        showNotification("Error during transformation.", "error");
    }
}

function updateSchematicName(name) {
    document.getElementById('schematic-name-display').textContent = name;
    document.getElementById('schematic-name-display').classList.remove('hidden');
}

function processLoadedLitematic(litematic, schematicName) {
    try {
        // Hide initial panels
        document.getElementById('file-panel').style.display = 'none';
        document.getElementById('command-panel').style.display = 'none';
        document.getElementById('controls-panel').classList.remove('hidden');

        structureLitematic = litematic;
        highlightedBlockName = null;
        updateSchematicName(schematicName);
        
        createRenderCanvas();
        
        const { structure, blockCount } = structureFromLitematic(structureLitematic);
        document.getElementById('total-blocks-info').textContent = `Total Blocks: ${blockCount}`;
        
        setStructure(structure, true);

        const max_y = Math.abs(structureLitematic.regions[0].height);
        createRangeSliders(max_y);
        
        const blockCounts = getMaterialList(structureLitematic);
        createMaterialsList(blockCounts);
        regenerateCommands();
        showNotification('Schematic loaded successfully!', 'success');
    } catch(error) {
        console.error('Error processing schematic:', error);
        showNotification('Error processing schematic data', 'error');
        resetAppView();
    }
}

function loadAndProcessFile(file) {
   if (!deepslateResources) return;
   showNotification('Loading schematic...', 'info');
   let reader = new FileReader();
   reader.readAsArrayBuffer(file);
   reader.onload = () => {
      try {
         const nbtdata = deepslate.readNbt(new Uint8Array(reader.result));
         const litematic = readLitematicFromNBTData(nbtdata);
         processLoadedLitematic(litematic, file.name);
      } catch (error) {
         console.error('Error processing file:', error);
         showNotification('Error loading schematic file', 'error');
      }
   };
   reader.onerror = () => showNotification('Error reading file', 'error');
}

function createMaterialsList(blockCounts) {
   const materialList = document.getElementById('material-list');
   materialList.innerHTML = '';
   const sortedBlocks = Object.entries(blockCounts).sort(([,a], [,b]) => b - a);
   sortedBlocks.forEach(([blockName, count]) => {
      const item = document.createElement('div');
      item.className = 'flex justify-between items-center p-2 bg-gray-800 rounded text-sm cursor-pointer hover:bg-gray-700';
      item.innerHTML = `<span class="text-gray-300">${blockName.replace('minecraft:', '')}</span><span class="text-white font-semibold">${count}</span>`;
      if (blockName === highlightedBlockName) item.classList.add('bg-blue-800');
      
      item.addEventListener('click', () => {
          highlightedBlockName = (highlightedBlockName === blockName) ? null : blockName;
          createMaterialsList(blockCounts);
          renderFilteredStructure();
      });

      materialList.appendChild(item);
   });
   document.getElementById('material-controls').classList.remove('hidden');
}

function regenerateCommands() {
    if (!structureLitematic) return;
    const originX = parseInt(document.getElementById('origin-x').value) || 0;
    const originY = parseInt(document.getElementById('origin-y').value) || 0;
    const originZ = parseInt(document.getElementById('origin-z').value) || 0;
    const commands = generateSetblockCommands(structureLitematic, [originX, originY, originZ]);
    document.getElementById('command-output-textarea').value = commands.join('\n');
    document.getElementById('command-output-section').classList.remove('hidden');
}

function downloadMaterialsCSV(blockCounts) {
    if (!blockCounts) return;
    const csvContent = "Block,Count\n" + Object.entries(blockCounts).map(([key, val]) => `${key.replace('minecraft:','')},${val}`).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "material-list.csv";
    a.click();
    URL.revokeObjectURL(url);
}

function createRangeSliders(max_y) {
   const layerControls = document.getElementById('layer-controls');
   layerControls.classList.remove('hidden');
   const minSlider = document.getElementById('miny-slider'), maxSlider = document.getElementById('maxy-slider');
   const minValue = document.getElementById('miny-value'), maxValue = document.getElementById('maxy-value');
   
   const sliderMax = max_y > 0 ? max_y - 1 : 0;
   minSlider.max = sliderMax;
   maxSlider.max = sliderMax;
   minSlider.value = 0; 
   maxSlider.value = sliderMax;
   minValue.textContent = minSlider.value;
   maxValue.textContent = maxSlider.value;

   minSlider.addEventListener('input', (e) => {
      minValue.textContent = e.target.value;
      renderFilteredStructure();
   });
   maxSlider.addEventListener('input', (e) => {
      maxValue.textContent = e.target.value;
      renderFilteredStructure();
   });
}