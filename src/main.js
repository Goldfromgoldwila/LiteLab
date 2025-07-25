// src/main.js

var structureLitematic;
var highlightedBlockNames = new Set();

function resetAppView() {
    document.getElementById('controls-panel').classList.add('hidden');
    // Restore visibility of initial panels
    document.getElementById('file-panel').style.display = 'block';
    document.getElementById('command-panel').style.display = 'block';
    document.getElementById('viewer-overlay').style.display = 'flex';

    // Hide schematic name display
    const schematicNameDisplay = document.getElementById('schematic-name-display');
    if (schematicNameDisplay) {
        schematicNameDisplay.classList.add('hidden');
        schematicNameDisplay.textContent = '';
    }

    // Hide or clear block info panel
    const blockInfoPanel = document.getElementById('block-info-panel');
    if (blockInfoPanel) {
        blockInfoPanel.classList.add('hidden');
        blockInfoPanel.textContent = '';
    }

    // Hide or clear materials list
    const materialsList = document.getElementById('materials-list');
    if (materialsList) {
        materialsList.innerHTML = '';
        materialsList.classList.add('hidden');
    }

    // Hide total blocks info
    const totalBlocksInfo = document.getElementById('total-blocks-info');
    if (totalBlocksInfo) {
        totalBlocksInfo.textContent = '';
        totalBlocksInfo.classList.add('hidden');
    }

    // Hide block coordinates display (if exists)
    const blockCoords = document.getElementById('block-coords');
    if (blockCoords) {
        blockCoords.textContent = '';
        blockCoords.classList.add('hidden');
    }

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
    
    if (y_min > y_max || y_max === 0) {
        setStructure(new deepslate.Structure([0,0,0]), false);
        document.getElementById('total-blocks-info').textContent = `Visible Blocks: 0`;
        return;
    }

    const highlightFilter = highlightedBlockNames.size > 0 ? Array.from(highlightedBlockNames) : null;
    const { structure, blockCount } = structureFromLitematic(structureLitematic, y_min, y_max, highlightFilter);
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
        highlightedBlockNames.clear();
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
         litematic.originalNBT = nbtdata;
         litematic.originalBuffer = new Uint8Array(reader.result);
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
      if (highlightedBlockNames.has(blockName)) item.classList.add('bg-blue-800');
      
      item.addEventListener('click', () => {
          if (highlightedBlockNames.has(blockName)) {
              highlightedBlockNames.delete(blockName);
          } else {
              highlightedBlockNames.add(blockName);
          }
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

function exportCurrentView() {
    exportLitematicView();
}

function createRangeSliders(max_y) {
   const layerControls = document.getElementById('layer-controls');
   layerControls.classList.remove('hidden');
   const minSlider = document.getElementById('miny-slider'), maxSlider = document.getElementById('maxy-slider');
   const minValue = document.getElementById('miny-value'), maxValue = document.getElementById('maxy-value');
   
   const sliderMax = max_y > 0 ? max_y - 1 : 0;
   minSlider.min = 0;
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