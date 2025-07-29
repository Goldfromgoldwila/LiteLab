// Import all necessary modules and libraries
import './style.css';
import * as deepslate from 'deepslate';
// Resources are loaded from public folder as global variables
import { loadDeepslateResources, structureFromLitematic } from './deepslate-helpers';
import { readLitematicFromNBTData, getMaterialList, generateSetblockCommands } from './litematic-utils';
import { resetSettings, setupSettingsPanel, getSetting } from './settings.js';
import { createRenderCanvas, setStructure, stopRendering } from './viewer.js';
import { handleCommandDataLoad } from './command-loader.js';
import { rotateY90, flipX, flipZ } from './transformations.js';
import { exportLitematicView, exportNBTView } from './exporter.js';
import { initializeEditMode } from './edit-mode.js';
import { Minimap } from './minimap.js';
import { ANIMATION_CONSTANTS, FILE_CONSTANTS } from './constants.js';
import './error-boundary.js';
import { initializeBlockSearchReplace, openReplaceDialog } from './block-search-replace.js';

// Make deepslate globally available
window.deepslate = deepslate;
// Resources are already global from public folder scripts

// Functions are now defined in HTML for immediate availability

// src/main.js

// Global state namespace
const AppState = {
    structureLitematic: null,
    highlightedBlockNames: new Set(),
    transformHistory: []
};

// Make essential functions globally available
window.loadAndProcessFile = loadAndProcessFile;
window.AppState = AppState;
window.reprocessAndRender = reprocessAndRender;
window.processLoadedLitematic = processLoadedLitematic;
window.showNotification = showNotification;
window.openReplaceDialog = openReplaceDialog;
window.readFileInput = function(input) {
    if (input.files) {
        for (let file of input.files) loadAndProcessFile(file);
    }
};

function convertNBTToLitematic(nbtData) {
    const [width, height, depth] = nbtData.size;
    const blocks = Array.from({ length: width }, () => 
        Array.from({ length: height }, () => 
            Array(depth).fill(0)
        )
    );
    
    // Place blocks from NBT data
    nbtData.blocks.forEach(block => {
        const [x, y, z] = block.pos;
        if (x < width && y < height && z < depth) {
            blocks[x][y][z] = block.state;
        }
    });
    
    return {
        regions: [{
            width,
            height, 
            depth,
            blocks,
            blockPalette: nbtData.palette,
            position: { x: 0, y: 0, z: 0 }
        }]
    };
}

function resetAppView() {
    document.getElementById('controls-panel').classList.add('hidden');
    // Restore visibility of initial panels
    document.getElementById('file-panel').style.display = 'block';
    document.getElementById('command-panel').style.display = 'block';
    document.getElementById('viewer-overlay').style.display = 'flex';

    // Clear command input
    const commandInput = document.getElementById('command-data-input');
    if (commandInput) {
        commandInput.value = '';
    }

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

    // Hide minimap
    window.minimap.hide();

    // Cleanly stop the render loop and remove the canvas
    stopRendering();
    const viewer = document.getElementById('viewer');
    const canvas = viewer.querySelector('canvas');
    if (canvas) canvas.remove();
    if (window.resizeHandler) {
        window.removeEventListener('resize', window.resizeHandler);
        window.resizeHandler = null;
    }
    AppState.structureLitematic = null;
    AppState.highlightedBlockNames.clear();
    showNotification('Ready to load a new schematic.', 'info');
}

/**
 * The single, central function for updating the 3D view.
 */
function renderFilteredStructure() {
    if (!AppState.structureLitematic) return;
    const y_min = parseInt(document.getElementById('minYSlider').value);
    const y_max = parseInt(document.getElementById('maxYSlider').value);
    
    if (y_min > y_max || y_max === 0) {
        setStructure(new window.deepslate.Structure([0,0,0]), false);
        document.getElementById('total-blocks-info').textContent = `Visible Blocks: 0`;
        return;
    }

    const highlightFilter = AppState.highlightedBlockNames.size > 0 ? Array.from(AppState.highlightedBlockNames) : null;
    const { structure, blockCount } = structureFromLitematic(AppState.structureLitematic, y_min, y_max, highlightFilter);
    setStructure(structure, false);
    document.getElementById('total-blocks-info').textContent = `Visible Blocks: ${blockCount}`;
}

function reprocessAndRender() {
    if (!AppState.structureLitematic) return;
    try {
        const max_y = Math.abs(AppState.structureLitematic.regions[0].height);
        createRangeSliders(max_y);
        renderFilteredStructure();
        // Defer expensive operations to avoid lag
        setTimeout(() => {
            const blockCounts = getMaterialList(AppState.structureLitematic);
            createMaterialsList(blockCounts);
            regenerateCommands();
        }, 0);
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
        if (!litematic || !litematic.regions || !litematic.regions[0]) {
            throw new Error('Invalid litematic structure');
        }
        
        const region = litematic.regions[0];
        if (!region.blocks || !region.blockPalette) {
            throw new Error('Missing block data in litematic');
        }
        
        // Hide initial panels
        document.getElementById('file-panel').style.display = 'none';
        document.getElementById('command-panel').style.display = 'none';
        document.getElementById('controls-panel').classList.remove('hidden');

        AppState.structureLitematic = litematic;
        AppState.highlightedBlockNames.clear();
        updateSchematicName(schematicName);
        
        createRenderCanvas();
        
        const { structure, blockCount } = structureFromLitematic(AppState.structureLitematic);
        if (!structure) {
            throw new Error('Failed to create 3D structure');
        }
        
        document.getElementById('total-blocks-info').textContent = `Total Blocks: ${blockCount}`;
        setStructure(structure, true);

        const max_y = Math.abs(region.height);
        if (max_y <= 0) {
            throw new Error('Invalid structure dimensions');
        }
        
        createRangeSliders(max_y);
        
        const blockCounts = getMaterialList(AppState.structureLitematic);
        createMaterialsList(blockCounts);
        regenerateCommands();
        
        // Initialize minimap
        window.minimap.updateStructure(AppState.structureLitematic);
        
        showNotification('Schematic loaded successfully!', 'success');
    } catch(error) {
        console.error('Error processing schematic:', error);
        const errorMsg = error.message.includes('structure') ? 'Invalid structure format' :
                        error.message.includes('block') ? 'Missing or corrupted block data' :
                        error.message.includes('dimensions') ? 'Structure has invalid dimensions' :
                        'Failed to process structure file';
        showNotification(errorMsg, 'error');
        resetAppView();
    }
}

function loadAndProcessFile(file) {
   if (!file) {
      showNotification('No file selected', 'error');
      return;
   }
   
   if (!file.name.endsWith('.litematic') && !file.name.endsWith('.nbt')) {
      showNotification('Please select a .litematic or .nbt file', 'error');
      return;
   }
   
   if (file.size > FILE_CONSTANTS.MAX_FILE_SIZE) {
      showNotification(`File too large. Maximum size is ${FILE_CONSTANTS.MAX_FILE_SIZE / (1024 * 1024)}MB`, 'error');
      return;
   }
   
   showNotification('Loading schematic...', 'info');
   const reader = new FileReader();
   
   reader.onload = () => {
      try {
         if (!reader.result || reader.result.byteLength === 0) {
            throw new Error('File is empty or corrupted');
         }
         
         if (file.name.endsWith('.nbt')) {
            // Handle NBT JSON file
            const jsonText = new TextDecoder().decode(new Uint8Array(reader.result));
            const nbtData = JSON.parse(jsonText);
            const litematic = convertNBTToLitematic(nbtData);
            processLoadedLitematic(litematic, file.name);
         } else {
            // Handle litematic file
            const nbtdata = deepslate.readNbt(new Uint8Array(reader.result));
            if (!nbtdata || !nbtdata.value) {
               throw new Error('Invalid NBT data structure');
            }
            
            const litematic = readLitematicFromNBTData(nbtdata);
            if (!litematic || !litematic.regions || litematic.regions.length === 0) {
               throw new Error('No valid regions found in litematic file');
            }
            
            litematic.originalNBT = nbtdata;
            litematic.originalBuffer = new Uint8Array(reader.result);
            processLoadedLitematic(litematic, file.name);
         }
      } catch (error) {
         console.error('Error processing file:', error);
         const errorMsg = error.message.includes('NBT') ? 'Invalid file format' : 
                         error.message.includes('regions') ? 'No structure data found in file' :
                         'Failed to load file';
         showNotification(errorMsg, 'error');
         resetAppView();
      }
   };
   
   reader.onerror = () => {
      console.error('FileReader error');
      showNotification('Failed to read file - file may be corrupted', 'error');
   };
   
   if (file.name.endsWith('.nbt')) {
      reader.readAsArrayBuffer(file);
   } else {
      reader.readAsArrayBuffer(file);
   }
}

function createMaterialsList(blockCounts) {
   const materialList = document.getElementById('material-list');
   materialList.innerHTML = '';
   const sortedBlocks = Object.entries(blockCounts).sort(([,a], [,b]) => b - a);
   sortedBlocks.forEach(([blockName, count]) => {
      const item = document.createElement('div');
      const isHighlighted = AppState.highlightedBlockNames.has(blockName);
      item.className = `flex justify-between items-center p-2 rounded-lg text-sm cursor-pointer transition-colors ${isHighlighted ? 'bg-blue-100 border border-blue-200' : 'bg-white hover:bg-slate-50 border border-slate-200'}`;
      item.innerHTML = `
         <div class="flex justify-between items-center group">
            <span class="${isHighlighted ? 'text-blue-800' : 'text-slate-700'} font-medium flex-1">${blockName.replace('minecraft:', '').replace(/_/g, ' ')}</span>
            <div class="flex items-center space-x-3">
               <span class="${isHighlighted ? 'text-blue-600 bg-blue-50' : 'text-slate-500 bg-slate-100'} text-xs font-bold px-3 py-1.5 rounded-full min-w-[2.5rem] text-center">${count}</span>
               <button class="replace-block-btn text-xs px-3 py-1.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-full font-medium transition-all duration-200 transform hover:scale-105 shadow-sm hover:shadow-md" data-block-name="${blockName}" title="Replace ${blockName.replace('minecraft:', '').replace(/_/g, ' ')}">🔄 Replace</button>
            </div>
         </div>
      `;
      
      item.addEventListener('click', (e) => {
          // Don't trigger highlight if replace button was clicked
          if (e.target.classList.contains('replace-block-btn')) {
              e.stopPropagation();
              const blockName = e.target.dataset.blockName;
              if (window.openReplaceDialog) {
                  window.openReplaceDialog(blockName);
              }
              return;
          }
          
          if (AppState.highlightedBlockNames.has(blockName)) {
              AppState.highlightedBlockNames.delete(blockName);
          } else {
              AppState.highlightedBlockNames.add(blockName);
          }
          createMaterialsList(blockCounts);
          renderFilteredStructure();
          regenerateCommands();
      });

      materialList.appendChild(item);
   });
   document.getElementById('material-controls').classList.remove('hidden');
}

function regenerateCommands() {
    if (!AppState.structureLitematic) return;
    const originX = parseInt(document.getElementById('originX').value) || 0;
    const originY = parseInt(document.getElementById('originY').value) || 0;
    const originZ = parseInt(document.getElementById('originZ').value) || 0;
    
    // Filter commands by selected materials if any are highlighted
    const selectedMaterials = AppState.highlightedBlockNames.size > 0 ? Array.from(AppState.highlightedBlockNames) : null;
    const commands = generateSetblockCommands(AppState.structureLitematic, [originX, originY, originZ], selectedMaterials);
    
    // Update selected materials display
    const selectedMaterialsInfo = document.getElementById('selected-materials-info');
    const selectedMaterialsList = document.getElementById('selected-materials-list');
    
    if (selectedMaterials && selectedMaterials.length > 0) {
        selectedMaterialsInfo.classList.remove('hidden');
        selectedMaterialsList.textContent = selectedMaterials.map(name => name.replace('minecraft:', '').replace(/_/g, ' ')).join(', ');
    } else {
        selectedMaterialsInfo.classList.add('hidden');
    }
    
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
    try {
        exportLitematicView();
    } catch (error) {
        console.error('Export failed:', error);
        showNotification('Export failed: ' + error.message, 'error');
    }
}

function createRangeSliders(max_y) {
   const layerControls = document.getElementById('layer-controls');
   layerControls.classList.remove('hidden');
   const minSlider = document.getElementById('minYSlider'), maxSlider = document.getElementById('maxYSlider');
   const minValue = document.getElementById('minYValue'), maxValue = document.getElementById('maxYValue');
   
   const sliderMax = max_y > 0 ? max_y : 0;
   minSlider.min = 0;
   minSlider.max = sliderMax;
   maxSlider.max = sliderMax;
   minSlider.value = 0; 
   maxSlider.value = sliderMax;
   minValue.textContent = minSlider.value;
   maxValue.textContent = maxSlider.value;

   let debounceTimer;
   const debouncedRender = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(renderFilteredStructure, 100);
   };
   
   minSlider.addEventListener('input', (e) => {
      minValue.textContent = e.target.value;
      debouncedRender();
   });
   maxSlider.addEventListener('input', (e) => {
      maxValue.textContent = e.target.value;
      debouncedRender();
   });
}

function showNotification(message, type = 'info') {
    const container = document.getElementById('notification-container');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    container.appendChild(notification);
    setTimeout(() => notification.classList.add('show'), ANIMATION_CONSTANTS.SETTINGS_TRANSITION_DELAY);
    setTimeout(() => {
        notification.classList.remove('show');
        notification.addEventListener('transitionend', () => notification.remove());
    }, ANIMATION_CONSTANTS.NOTIFICATION_DURATION);
}

function initializeUI() {
    const settingsBtn = document.getElementById('settings-button');
    const settingsPanel = document.getElementById('settings-panel');
    const settingsClose = document.getElementById('settings-close');
    settingsBtn.addEventListener('click', () => settingsPanel.classList.remove('translate-x-full'));
    settingsClose.addEventListener('click', () => settingsPanel.classList.add('translate-x-full'));
    document.getElementById('reset-settings').addEventListener('click', resetSettings);
    setupSettingsPanel();
    document.getElementById('command-data-load-btn').addEventListener('click', handleCommandDataLoad);
    document.getElementById('copy-commands-btn').addEventListener('click', () => navigator.clipboard.writeText(document.getElementById('command-output-textarea').value).then(() => showNotification('Commands copied!', 'success')));
    document.getElementById('load-new-btn').addEventListener('click', () => {
        if (typeof resetEditMode === 'function') resetEditMode();
        resetAppView();
    });
    document.getElementById('fullscreen-btn').addEventListener('click', () => document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen());
    
    // Theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
    }
    
    themeToggle.addEventListener('click', () => {
        document.documentElement.classList.toggle('dark');
        const isDark = document.documentElement.classList.contains('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        
        // Update theme toggle icon
        const icon = themeToggle.querySelector('svg path');
        if (isDark) {
            icon.setAttribute('d', 'M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z');
        } else {
            icon.setAttribute('d', 'M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z');
        }
    });
    
    // ESC key to close settings panel
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const settingsPanel = document.getElementById('settings-panel');
            if (!settingsPanel.classList.contains('translate-x-full')) {
                settingsPanel.classList.add('translate-x-full');
                // Show 3D overlays when settings close
                const overlays = ['#block-info', '#nearest-block-info', '#compass-text', '#structure-arrow'];
                overlays.forEach(id => {
                    const el = document.getElementById(id.replace('#', ''));
                    if (el) el.style.display = el.style.display === 'none' ? 'block' : el.style.display;
                });
            }
        }
    });
    
    // Hide 3D overlays when settings panel opens
    document.getElementById('settings-button').addEventListener('click', () => {
        const settingsPanel = document.getElementById('settings-panel');
        const isOpening = settingsPanel.classList.contains('translate-x-full');
        if (isOpening) {
            const overlays = ['#block-info', '#nearest-block-info', '#compass-text', '#structure-arrow'];
            overlays.forEach(id => {
                const el = document.getElementById(id.replace('#', ''));
                if (el) el.style.display = 'none';
            });
        }
    });
    
    // Show 3D overlays when settings panel closes
    document.getElementById('settings-close').addEventListener('click', () => {
        const overlays = ['#block-info', '#nearest-block-info', '#compass-text', '#structure-arrow'];
        overlays.forEach(id => {
            const el = document.getElementById(id.replace('#', ''));
            if (el) el.style.display = el.style.display === 'none' ? 'block' : el.style.display;
        });
    });

    function saveTransformState() {
        // Store only essential data to reduce memory usage
        const snapshot = {
            regions: AppState.structureLitematic.regions.map(region => ({
                width: region.width,
                height: region.height,
                depth: region.depth,
                blocks: region.blocks,
                blockPalette: region.blockPalette
            }))
        };
        AppState.transformHistory.push(snapshot);
        if (AppState.transformHistory.length > 5) { // Reduced from 10 to 5
            AppState.transformHistory.shift();
        }
        document.getElementById('undo-transform-btn').classList.remove('hidden');
    }
    
    // Make saveTransformState globally available for block replace
    window.saveTransformState = saveTransformState;
    
    document.getElementById('rotate-btn').addEventListener('click', () => { 
        saveTransformState(); 
        AppState.structureLitematic = rotateY90(AppState.structureLitematic); 
        reprocessAndRender(); 
    });
    document.getElementById('flip-x-btn').addEventListener('click', () => { 
        saveTransformState(); 
        AppState.structureLitematic = flipX(AppState.structureLitematic); 
        reprocessAndRender(); 
    });
    document.getElementById('flip-z-btn').addEventListener('click', () => { 
        saveTransformState(); 
        AppState.structureLitematic = flipZ(AppState.structureLitematic); 
        reprocessAndRender(); 
    });
    
    document.getElementById('undo-transform-btn').addEventListener('click', () => {
        if (AppState.transformHistory.length > 0) {
            AppState.structureLitematic = AppState.transformHistory.pop();
            reprocessAndRender();
            if (AppState.transformHistory.length === 0) {
                document.getElementById('undo-transform-btn').classList.add('hidden');
            }
        }
    });
    
    document.getElementById('export-litematic-btn').addEventListener('click', exportCurrentView);
    
    // Add NBT export if button exists
    const nbtExportBtn = document.getElementById('export-nbt-btn');
    if (nbtExportBtn) {
        nbtExportBtn.addEventListener('click', () => exportNBTView());
    }
    
    // Edit mode initialization is handled by initializeEditMode()
    
    ['originX', 'originY', 'originZ'].forEach(id => {
        const input = document.getElementById(id);
        input.addEventListener('input', (e) => {
            const value = e.target.value.replace(/[^0-9-]/g, '');
            const numValue = parseInt(value);
            if (value !== '' && (isNaN(numValue) || numValue < -30000000 || numValue > 30000000)) {
                e.target.value = e.target.value.slice(0, -1);
                return;
            }
            e.target.value = value;
            regenerateCommands();
        });
    });
    document.getElementById('download-csv-btn').addEventListener('click', () => {
        const blockCounts = getMaterialList(AppState.structureLitematic);
        downloadMaterialsCSV(blockCounts);
    });
}

// App Initialization
document.addEventListener("DOMContentLoaded", () => {
    // Register service worker for offline support
    if ('serviceWorker' in navigator) {
        const swPath = import.meta.env.BASE_URL + 'sw.js';
        navigator.serviceWorker.register(swPath)
            .catch(error => console.warn('SW registration failed:', error));
    }

    initializeUI();
    initializeEditMode();
    initializeBlockSearchReplace();
    
    const image = document.getElementById('atlas');
    let resourcesLoaded = false;
    
    function tryLoadResources() {
        if (resourcesLoaded) return;
        
        if (window.assets && window.OPAQUE_BLOCKS && image && (image.complete || image.naturalWidth > 0)) {
            try {
                const resources = loadDeepslateResources(image);
                if (resources) {
                    window.deepslateResources = resources;
                    resourcesLoaded = true;
                    // Deepslate resources loaded successfully
                }
            } catch (error) {
                console.error('Failed to load deepslate resources:', error);
            }
        }
    }
    
    // Multiple attempts to load resources
    const loadAttempts = () => {
        tryLoadResources();
        if (!resourcesLoaded) {
            setTimeout(loadAttempts, 100);
        }
    };
    
    if (image) {
        if (image.complete && image.naturalWidth > 0) {
            tryLoadResources();
        } else {
            image.addEventListener('load', tryLoadResources);
            image.addEventListener('error', (e) => {
                console.error('Error loading atlas:', e);
                showNotification('Failed to load texture atlas', 'error');
            });
        }
    }
    
    // Fallback loading attempt
    setTimeout(loadAttempts, 500);
});