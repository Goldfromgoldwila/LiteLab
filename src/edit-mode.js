// src/edit-mode.js

let isEditMode = false;
let brokenBlocks = [];
let maxEditHistory = 50;

// This function needs access to a global re-render function
// In a larger app, this would be handled with a state manager or event bus
const reprocessAndRender = () => window.reprocessAndRender && window.reprocessAndRender();

function updateUndoButtonVisibility() {
    const undoBreakBtn = document.getElementById('undo-break-btn');
    if (!undoBreakBtn) return;
    
    if (brokenBlocks.length > 0) {
        undoBreakBtn.classList.remove('hidden');
    } else {
        undoBreakBtn.classList.add('hidden');
    }
}

function toggleEditMode() {
    console.log('Toggle edit mode called');
    isEditMode = !isEditMode;
    const editBtn = document.getElementById('edit-btn');
    const viewer = document.getElementById('viewer');
    
    if (isEditMode) {
        editBtn.innerHTML = `
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
            <span>Preview Mode</span>`;
        editBtn.title = 'Exit edit mode';
        editBtn.className = 'w-full bg-red-500 hover:bg-red-600 text-white font-medium py-3 px-4 rounded-xl transition-colors text-sm mb-2 flex items-center justify-center space-x-2';
        if (viewer) viewer.style.cursor = 'crosshair';
        updateUndoButtonVisibility();
    } else {
        editBtn.innerHTML = `
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
            <span>Edit Mode</span>`;
        editBtn.title = 'Enter edit mode';
        editBtn.className = 'w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-xl transition-colors text-sm mb-2 flex items-center justify-center space-x-2';
        const undoBtn = document.getElementById('undo-break-btn');
        if (undoBtn) undoBtn.classList.add('hidden');
        if (viewer) viewer.style.cursor = 'pointer';
    }
}

function saveBlockState(x, y, z, originalBlock) {
    if (!window.AppState?.structureLitematic) return;
    
    brokenBlocks.push({ x, y, z, originalBlock });
    
    if (brokenBlocks.length > maxEditHistory) {
        brokenBlocks.shift();
    }
    
    updateUndoButtonVisibility();
}

function undoEdit() {
    if (brokenBlocks.length === 0) return;
    
    const lastBroken = brokenBlocks.pop();
    if (!window.AppState?.structureLitematic) return;
    
    const region = window.AppState.structureLitematic.regions[0];
    if (region.blocks[lastBroken.x] && region.blocks[lastBroken.x][lastBroken.y]) {
        region.blocks[lastBroken.x][lastBroken.y][lastBroken.z] = lastBroken.originalBlock;
    }
    
    updateUndoButtonVisibility();
    reprocessAndRender();
}

function handleEditClick(event) {
    if (!isEditMode || !window.AppState?.structureLitematic) return;
    
    if (event.button !== 0) return;
    
    const hovered = window.currentHoveredBlock;
    if (!hovered || !hovered.position) return;
    
    event.preventDefault();
    event.stopPropagation();
    
    const blockPos = hovered.position;
    
    const region = window.AppState.structureLitematic.regions[0];
    const originalBlock = region.blocks[blockPos.x]?.[blockPos.y]?.[blockPos.z];
    if (originalBlock === undefined || originalBlock === 0) return;
    
    saveBlockState(blockPos.x, blockPos.y, blockPos.z, originalBlock);
    
    breakBlock(blockPos.x, blockPos.y, blockPos.z);
    
    reprocessAndRender();
}

function breakBlock(x, y, z) {
    if (!window.AppState?.structureLitematic?.regions?.[0]) return;
    
    const region = window.AppState.structureLitematic.regions[0];
    
    if (x < 0 || y < 0 || z < 0 || 
        x >= Math.abs(region.width) || 
        y >= Math.abs(region.height) || 
        z >= Math.abs(region.depth)) {
        return;
    }
    
    if (region.blocks[x] && region.blocks[x][y]) {
        region.blocks[x][y][z] = 0; // Set to air (palette index 0)
    }
}

function clearEditHistory() {
    brokenBlocks = [];
    updateUndoButtonVisibility();
}

export function resetEditMode() {
    if (isEditMode) {
        toggleEditMode();
    }
    clearEditHistory();
}

// Make toggleEditMode globally available
window.toggleEditMode = toggleEditMode;

// This function will be imported and called by main.js
export function initializeEditMode() {
    const editBtn = document.getElementById('edit-btn');
    if (editBtn) {
        editBtn.addEventListener('click', toggleEditMode);
    }
    
    const undoBreakBtn = document.getElementById('undo-break-btn');
    if (undoBreakBtn) {
        undoBreakBtn.addEventListener('click', undoEdit);
    }
    
    const viewer = document.getElementById('viewer');
    if (viewer) {
        viewer.addEventListener('click', handleEditClick);
    }
}