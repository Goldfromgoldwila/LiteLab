// src/settings.js

/**
 * A robust helper function to get a setting value from the DOM.
 * @param {string} id The ID of the input element.
 * @param {*} defaultValue The value to return if the element isn't found.
 * @returns The value of the setting.
 */
function getSetting(id, defaultValue) {
    const element = document.getElementById(id);
    if (!element) {
        return defaultValue;
    }

    if (element.type === 'checkbox') {
        return element.checked;
    }
    
    if (element.type === 'range' || element.type === 'number') {
        return parseFloat(element.value);
    }

    return element.value || defaultValue;
}

/**
 * Resets all settings in the settings panel to their default values.
 */
function resetSettings() {
    // Camera Controls
    document.getElementById('mouse-sensitivity').value = 1;
    document.getElementById('movement-speed').value = 0.2;
    document.getElementById('invert-controls').checked = false;

    // Display Options
    document.getElementById('show-grid').checked = true;
    document.getElementById('wireframe-mode').checked = false;
    
    showNotification('Settings have been reset to default.', 'info');
    
    // Trigger a re-render to apply visual changes like the grid
    if (typeof render === 'function') {
        requestAnimationFrame(render);
    }
}