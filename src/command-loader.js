// src/command-loader.jssss

/**
 * Handles the "Load Commands" button click event.
 */
function handleCommandDataLoad() {
    const dataInput = document.getElementById('command-data-input');
    const rawString = dataInput.value.trim();

    if (!rawString) {
        alert('Please paste /setblock commands into the text area.');
        return;
    }

    if (deepslateResources == null) {
        showNotification('Resources are not ready, please wait a moment and try again.', 'error');
        return;
    }

    try {
        if (!rawString.includes('/setblock')) {
            throw new Error("Input does not contain any /setblock commands.");
        }

        console.log("Detected command input. Parsing as commands...");
        const schematicName = 'From Commands';
        const litematic = litematicFromCommands(rawString);

        // Use the centralized processing function to render the structure
        processLoadedLitematic(litematic, schematicName);

    } catch (error) {
        console.error('Error processing command data:', error);
        showNotification(error.message || 'Invalid command format. Please check the pasted content.', 'error');
    }
}