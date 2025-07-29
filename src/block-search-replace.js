// src/block-search-replace.js

let selectedBlockForReplace = null;
let replaceDialog = null;

function initializeBlockSearchReplace() {
    createReplaceDialog();
}

function createReplaceDialog() {
    replaceDialog = document.createElement('div');
    replaceDialog.id = 'replace-dialog';
    replaceDialog.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden';
    
    replaceDialog.innerHTML = `
        <div class="bg-white rounded-xl shadow-2xl p-5 w-[26rem] max-h-[30rem] border border-gray-100">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-bold text-gray-800 flex items-center">
                    <span class="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center mr-2 text-sm">🔄</span>
                    Replace Block
                </h3>
                <button id="close-replace-dialog" class="text-gray-400 hover:text-gray-600 text-xl font-light transition-colors">&times;</button>
            </div>
            <div class="mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                <p class="text-sm text-gray-600">Replace: <span class="font-bold text-blue-800" id="selected-block-name"></span></p>
                <p class="text-sm text-gray-600 mt-1">With:</p>
            </div>
            <div class="mb-3">
                <div class="relative">
                    <input type="text" id="block-search-input" placeholder="Search blocks..." 
                           class="w-full px-3 py-2 pl-9 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all">
                    <svg class="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                </div>
            </div>
            <div id="block-list" class="max-h-48 overflow-y-auto border-2 border-gray-100 rounded-lg mb-4 bg-gray-50">
                <!-- Block list will be populated here -->
            </div>
            <div class="flex justify-end space-x-3">
                <button id="cancel-replace" class="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors">Cancel</button>
                <button id="confirm-replace" class="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg font-medium transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed" disabled>✓ Replace</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(replaceDialog);
    setupReplaceDialogEvents();
}

function setupReplaceDialogEvents() {
    const closeBtn = document.getElementById('close-replace-dialog');
    const cancelBtn = document.getElementById('cancel-replace');
    const confirmBtn = document.getElementById('confirm-replace');
    const searchInput = document.getElementById('block-search-input');
    
    closeBtn.addEventListener('click', closeReplaceDialog);
    cancelBtn.addEventListener('click', closeReplaceDialog);
    confirmBtn.addEventListener('click', performReplace);
    searchInput.addEventListener('input', filterBlocks);
    
    // Add keyboard support
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const selectedItem = document.querySelector('#block-list .bg-blue-100');
            if (selectedItem) {
                performReplace();
            }
        }
    });
    
    // Close on outside click
    replaceDialog.addEventListener('click', (e) => {
        if (e.target === replaceDialog) closeReplaceDialog();
    });
}

function openReplaceDialog(blockName) {
    selectedBlockForReplace = blockName;
    document.getElementById('selected-block-name').textContent = blockName.replace('minecraft:', '').replace(/_/g, ' ');
    document.getElementById('block-search-input').value = '';
    populateBlockList();
    replaceDialog.classList.remove('hidden');
    
    // Focus on search input for immediate typing
    setTimeout(() => {
        document.getElementById('block-search-input').focus();
    }, 100);
}

function closeReplaceDialog() {
    replaceDialog.classList.add('hidden');
    selectedBlockForReplace = null;
    const confirmBtn = document.getElementById('confirm-replace');
    confirmBtn.disabled = true; // Disable until block is selected
    confirmBtn.dataset.replacementBlock = '';
    confirmBtn.innerHTML = '✓ Replace';
}

function populateBlockList() {
    const blockList = document.getElementById('block-list');
    const allBlocks = getAllAvailableBlocks();
    
    blockList.innerHTML = '';
    allBlocks.forEach((blockName, index) => {
        const item = document.createElement('div');
        item.className = 'p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-all duration-150 flex items-center justify-between group';
        
        const displayName = blockName.replace('minecraft:', '').replace(/_/g, ' ');
        const blockType = getBlockType(blockName);
        
        item.innerHTML = `
            <div class="flex items-center space-x-3">
                <span class="${blockType.color} w-3 h-3 rounded-full flex-shrink-0"></span>
                <span class="font-medium text-gray-700 group-hover:text-blue-700">${displayName}</span>
            </div>
            <span class="text-xs ${blockType.textColor} px-2 py-1 rounded-full font-medium">${blockType.label}</span>
        `;
        
        item.dataset.blockName = blockName;
        item.dataset.displayName = displayName;
        
        item.addEventListener('click', () => {
            selectReplacementBlock(blockName, item);
        });
        
        blockList.appendChild(item);
    });
    
    // Don't auto-select - require user to choose
    // This ensures replace button stays disabled until user selects
}

function getBlockType(blockName) {
    if (window.TRANSPARENT_BLOCKS && window.TRANSPARENT_BLOCKS.has(blockName)) {
        return { color: 'bg-cyan-400', textColor: 'text-cyan-700', label: 'Transparent' };
    }
    if (window.NON_SELF_CULLING && window.NON_SELF_CULLING.has(blockName)) {
        return { color: 'bg-green-400', textColor: 'text-green-700', label: 'Leaves' };
    }
    return { color: 'bg-gray-400', textColor: 'text-gray-600', label: 'Solid' };
}

function filterBlocks() {
    const searchTerm = document.getElementById('block-search-input').value.toLowerCase();
    const blockItems = document.querySelectorAll('#block-list > div');
    let bestMatch = null;
    let bestScore = -1;
    let visibleCount = 0;
    
    blockItems.forEach(item => {
        // Skip results count element
        if (item.classList.contains('results-count')) return;
        
        const displayName = item.dataset.displayName;
        if (!displayName) return;
        
        const score = getMatchScore(displayName.toLowerCase(), searchTerm);
        
        if (score > 0) {
            item.style.display = 'flex';
            visibleCount++;
            
            // Highlight matching text
            if (searchTerm.length > 0) {
                highlightMatchingText(item, searchTerm);
            }
            
            if (score > bestScore) {
                bestScore = score;
                bestMatch = item;
            }
        } else {
            item.style.display = 'none';
        }
    });
    
    // Highlight best match but don't auto-select
    if (bestMatch && searchTerm.length > 0) {
        // Remove previous highlights
        document.querySelectorAll('#block-list > div').forEach(item => {
            item.classList.remove('ring-2', 'ring-blue-300');
        });
        // Highlight best match
        bestMatch.classList.add('ring-2', 'ring-blue-300');
        bestMatch.scrollIntoView({ block: 'nearest' });
    }
    
    // Show count of results
    updateResultsCount(visibleCount, searchTerm);
}

function highlightMatchingText(item, searchTerm) {
    const textSpan = item.querySelector('.font-medium');
    const originalText = item.dataset.displayName;
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const highlightedText = originalText.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>');
    textSpan.innerHTML = highlightedText;
}

function updateResultsCount(count, searchTerm) {
    const blockList = document.getElementById('block-list');
    let countDisplay = blockList.querySelector('.results-count');
    
    if (!countDisplay) {
        countDisplay = document.createElement('div');
        countDisplay.className = 'results-count p-2 text-xs text-gray-500 bg-gray-100 border-b border-gray-200 font-medium';
        blockList.insertBefore(countDisplay, blockList.firstChild);
    }
    
    if (searchTerm.length > 0) {
        countDisplay.textContent = `${count} blocks found`;
        countDisplay.style.display = 'block';
    } else {
        countDisplay.style.display = 'none';
    }
}

function getMatchScore(blockName, searchTerm) {
    if (!searchTerm) return 1;
    
    // Exact match gets highest score
    if (blockName === searchTerm) return 100;
    
    // Starts with search term gets high score
    if (blockName.startsWith(searchTerm)) return 80;
    
    // Contains search term gets medium score
    if (blockName.includes(searchTerm)) return 60;
    
    // Word boundary matches get lower score
    const words = blockName.split(' ');
    for (const word of words) {
        if (word.startsWith(searchTerm)) return 40;
    }
    
    return 0;
}

function selectReplacementBlock(blockName, element) {
    // Remove previous selection
    document.querySelectorAll('#block-list > div').forEach(item => {
        item.classList.remove('bg-blue-100', 'border-l-4', 'border-blue-500', 'shadow-sm');
        item.classList.add('hover:bg-blue-50');
    });
    
    // Add selection to clicked item
    element.classList.remove('hover:bg-blue-50');
    element.classList.add('bg-blue-100', 'border-l-4', 'border-blue-500', 'shadow-sm');
    
    // Enable replace button
    const confirmBtn = document.getElementById('confirm-replace');
    confirmBtn.disabled = false;
    confirmBtn.dataset.replacementBlock = blockName;
    
    // Update button text with selected block
    const displayName = blockName.replace('minecraft:', '').replace(/_/g, ' ');
    confirmBtn.innerHTML = `✓ Replace with ${displayName}`;
}

function performReplace() {
    const replacementBlock = document.getElementById('confirm-replace').dataset.replacementBlock;
    if (!selectedBlockForReplace || !replacementBlock || !window.AppState.structureLitematic) {
        return;
    }
    
    const litematic = window.AppState.structureLitematic;
    let replacedCount = 0;
    
    // Save state for undo
    if (window.saveTransformState) {
        window.saveTransformState();
    }
    
    // Update highlighted blocks - replace old block name with new one
    const wasHighlighted = window.AppState.highlightedBlockNames.has(selectedBlockForReplace);
    if (wasHighlighted) {
        window.AppState.highlightedBlockNames.delete(selectedBlockForReplace);
        // Ensure replacement block name matches the format used in materials list
        const normalizedReplacement = replacementBlock.startsWith('minecraft:') ? replacementBlock : `minecraft:${replacementBlock}`;
        window.AppState.highlightedBlockNames.add(normalizedReplacement);
    }
    
    // Perform replacement
    for (const region of litematic.regions) {
        const { blocks, blockPalette } = region;
        const width = Math.abs(region.width);
        const height = Math.abs(region.height);
        const depth = Math.abs(region.depth);
        
        // Normalize block names for comparison
        const normalizeBlockName = (name) => {
            if (!name) return '';
            return name.replace(/^minecraft:/, '').toLowerCase();
        };
        
        const selectedNormalized = normalizeBlockName(selectedBlockForReplace);
        const replacementNormalized = normalizeBlockName(replacementBlock);
        
        // Find all blocks to replace (including variants with different properties)
        const targetIndices = [];
        blockPalette.forEach((block, index) => {
            if (normalizeBlockName(block.Name) === selectedNormalized) {
                targetIndices.push(index);
            }
        });
        
        if (targetIndices.length === 0) {
            console.log('Target block not found in palette:', selectedBlockForReplace, 'Available blocks:', blockPalette.map(b => b.Name));
            continue;
        }
        
        // Find or add replacement block to palette
        let replacementIndex = blockPalette.findIndex(block => 
            normalizeBlockName(block.Name) === replacementNormalized
        );
        
        if (replacementIndex === -1) {
            // Add new block to palette with proper name format
            const newBlockName = replacementBlock.startsWith('minecraft:') ? replacementBlock.replace('minecraft:', '') : replacementBlock;
            blockPalette.push({ Name: newBlockName });
            replacementIndex = blockPalette.length - 1;
        }
        
        // This check is now above, so we can remove this line
        
        // Replace blocks (all variants)
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                for (let z = 0; z < depth; z++) {
                    if (blocks[x] && blocks[x][y]) {
                        const blockIndex = blocks[x][y][z];
                        if (targetIndices.includes(blockIndex)) {
                            blocks[x][y][z] = replacementIndex;
                            replacedCount++;
                        }
                    }
                }
            }
        }
    }
    
    closeReplaceDialog();
    
    if (replacedCount > 0) {
        // Clear any layer filtering to show all blocks
        const minSlider = document.getElementById('minYSlider');
        const maxSlider = document.getElementById('maxYSlider');
        if (minSlider && maxSlider) {
            minSlider.value = minSlider.min;
            maxSlider.value = maxSlider.max;
            document.getElementById('minYValue').textContent = minSlider.value;
            document.getElementById('maxYValue').textContent = maxSlider.value;
        }
        
        // Force complete re-render to update 3D view
        if (window.reprocessAndRender) {
            window.reprocessAndRender();
        }
        
        if (window.showNotification) {
            window.showNotification(`Replaced ${replacedCount} blocks`, 'success');
        }
    } else {
        console.log('No blocks replaced. Selected:', selectedBlockForReplace, 'Replacement:', replacementBlock);
        if (window.showNotification) {
            window.showNotification('No blocks found to replace', 'info');
        }
    }
}

function getAllAvailableBlocks() {
    const allBlocks = new Set();
    
    // Combine all three block sets
    if (window.OPAQUE_BLOCKS) {
        window.OPAQUE_BLOCKS.forEach(block => allBlocks.add(block));
    }
    if (window.TRANSPARENT_BLOCKS) {
        window.TRANSPARENT_BLOCKS.forEach(block => allBlocks.add(block));
    }
    if (window.NON_SELF_CULLING) {
        window.NON_SELF_CULLING.forEach(block => allBlocks.add(block));
    }
    
    if (allBlocks.size > 0) {
        return Array.from(allBlocks).sort();
    }
    
    // Fallback to common blocks
    return [
        'minecraft:stone', 'minecraft:cobblestone', 'minecraft:dirt', 'minecraft:grass_block',
        'minecraft:oak_planks', 'minecraft:oak_log', 'minecraft:sand', 'minecraft:gravel',
        'minecraft:iron_ore', 'minecraft:coal_ore', 'minecraft:diamond_ore', 'minecraft:gold_ore',
        'minecraft:redstone_ore', 'minecraft:glass', 'minecraft:white_wool', 'minecraft:water',
        'minecraft:lava', 'minecraft:bedrock', 'minecraft:obsidian', 'minecraft:netherrack'
    ].sort();
}

export { initializeBlockSearchReplace, openReplaceDialog };