import { litematicFromCommands } from './command-parser.js';

// src/command-loader.js

/**
 * Handles the "Load Commands" button click event.
 */
function handleCommandDataLoad() {
    const dataInput = document.getElementById('command-data-input');
    const rawString = dataInput.value.trim();

    if (!rawString) {
        if (typeof window.showNotification === 'function') {
            window.showNotification('Please paste /setblock commands into the text area.', 'error');
        }
        return;
    }

    try {
        if (!rawString.includes('/setblock')) {
            throw new Error("Input does not contain any /setblock commands.");
        }

        // Detected command input. Parsing as commands...
        const schematicName = 'From Commands';
        const litematic = litematicFromCommands(rawString);

        // Use the globally available processing function to render the structure
        if (typeof window.processLoadedLitematic === 'function') {
            window.processLoadedLitematic(litematic, schematicName);
        } else {
            console.error('processLoadedLitematic function not available');
        }

    } catch (error) {
        console.error('Error processing command data:', error);
        if (typeof window.showNotification === 'function') {
            window.showNotification(error.message || 'Invalid command format. Please check the pasted content.', 'error');
        } else {
            alert(error.message || 'Invalid command format. Please check the pasted content.');
        }
    }
}

export { handleCommandDataLoad };