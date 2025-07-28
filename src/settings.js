// src/settings.js

const settingsToSave = ['mouse-sensitivity', 'movement-speed', 'invert-controls', 'show-grid', 'show-block-border'];

function getSetting(id, defaultValue) {
    const element = document.getElementById(id);
    if (!element) return defaultValue;
    if (element.type === 'checkbox') return element.checked;
    if (element.type === 'range' || element.type === 'number') return parseFloat(element.value);
    return element.value || defaultValue;
}

function saveSettings() {
    const settings = {};
    for (const id of settingsToSave) {
        settings[id] = getSetting(id);
    }
    localStorage.setItem('litematicViewerSettings', JSON.stringify(settings));
}

function loadSettings() {
    const saved = localStorage.getItem('litematicViewerSettings');
    if (!saved) return;
    const settings = JSON.parse(saved);

    for (const id of settingsToSave) {
        const element = document.getElementById(id);
        const value = settings[id];
        if (element && value !== undefined) {
            if (element.type === 'checkbox') {
                element.checked = value;
            } else {
                element.value = value;
            }
            // Update associated value display if it exists
            const valueDisplay = document.getElementById(`${id}-value`);
            if (valueDisplay) {
                valueDisplay.textContent = parseFloat(value).toFixed(1);
            }
        }
    }
}

function resetSettings() {
    // Set default values
    document.getElementById('mouse-sensitivity').value = 0.8;
    document.getElementById('movement-speed').value = 0.2;
    document.getElementById('invert-controls').checked = false;
    document.getElementById('show-grid').checked = true;
    document.getElementById('show-block-border').checked = true;

    // Update displays
    document.getElementById('mouse-sensitivity-value').textContent = '0.8';
    document.getElementById('movement-speed-value').textContent = '0.2';
    
    saveSettings(); // Persist the reset settings
    showNotification('Settings have been reset to default.', 'info');
}

function setupSettingsPanel() {
    loadSettings(); // Load saved settings on startup

    // Add listeners to all setting inputs to save on change
    for (const id of settingsToSave) {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', () => {
                // Update value display for sliders
                const valueDisplay = document.getElementById(`${id}-value`);
                if (valueDisplay) {
                    valueDisplay.textContent = parseFloat(element.value).toFixed(1);
                }
                saveSettings();
            });
        }
    }
}

export { resetSettings, setupSettingsPanel, getSetting };