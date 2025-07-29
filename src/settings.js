// src/settings.js

const settingsToSave = ['mouseSensitivity', 'movementSpeed', 'invertControls', 'showGrid', 'showBlockBorder'];

function getSetting(id, defaultValue) {
    const element = document.getElementById(id);
    if (!element) return defaultValue;
    if (element.type === 'checkbox') return element.checked;
    if (element.type === 'range' || element.type === 'number') return parseFloat(element.value);
    return element.value || defaultValue;
}

function saveSettings() {
    try {
        const settings = {};
        for (const id of settingsToSave) {
            settings[id] = getSetting(id);
        }
        localStorage.setItem('litematicViewerSettings', JSON.stringify(settings));
    } catch (error) {
        console.warn('Failed to save settings:', error);
    }
}

function loadSettings() {
    try {
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
            const valueDisplay = document.getElementById(`${id}Value`);
            if (valueDisplay) {
                valueDisplay.textContent = parseFloat(value).toFixed(1);
            }
        }
    }
    } catch (error) {
        console.warn('Failed to load settings:', error);
    }
}

function resetSettings() {
    // Set default values
    document.getElementById('mouseSensitivity').value = 0.8;
    document.getElementById('movementSpeed').value = 0.2;
    document.getElementById('invertControls').checked = false;
    document.getElementById('showGrid').checked = true;
    document.getElementById('showBlockBorder').checked = true;

    // Update displays
    document.getElementById('mouseSensitivityValue').textContent = '0.8';
    document.getElementById('movementSpeedValue').textContent = '0.2';
    
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
                const valueDisplay = document.getElementById(`${id}Value`);
                if (valueDisplay) {
                    valueDisplay.textContent = parseFloat(element.value).toFixed(1);
                }
                saveSettings();
            });
        }
    }
}

export { resetSettings, setupSettingsPanel, getSetting };