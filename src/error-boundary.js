// src/error-boundary.js

class ErrorBoundary {
    constructor() {
        this.setupGlobalErrorHandlers();
    }

    setupGlobalErrorHandlers() {
        window.addEventListener('error', (event) => {
            this.handleError(event.error, 'JavaScript Error');
        });

        window.addEventListener('unhandledrejection', (event) => {
            this.handleError(event.reason, 'Promise Rejection');
            event.preventDefault();
        });
    }

    handleError(error, type) {
        console.error(`${type}:`, error);
        
        // Show user-friendly error message
        const message = this.getUserFriendlyMessage(error);
        if (window.showNotification) {
            window.showNotification(message, 'error');
        }

        // Try to recover application state
        this.attemptRecovery();
    }

    getUserFriendlyMessage(error) {
        if (error?.message?.includes('WebGL')) {
            return 'Graphics error occurred. Try refreshing the page.';
        }
        if (error?.message?.includes('memory') || error?.message?.includes('Memory')) {
            return 'Out of memory. Try loading a smaller file.';
        }
        if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
            return 'Network error. Check your connection.';
        }
        return 'An unexpected error occurred. The application will try to recover.';
    }

    attemptRecovery() {
        try {
            // Stop rendering to prevent further errors
            if (window.stopRendering) {
                window.stopRendering();
            }
            
            // Clear any problematic state
            if (window.AppState) {
                window.AppState.structureLitematic = null;
                window.AppState.highlightedBlockNames.clear();
            }
            
            // Show the initial view
            setTimeout(() => {
                const controlsPanel = document.getElementById('controls-panel');
                const filePanel = document.getElementById('file-panel');
                const commandPanel = document.getElementById('command-panel');
                const viewerOverlay = document.getElementById('viewer-overlay');
                
                if (controlsPanel) controlsPanel.classList.add('hidden');
                if (filePanel) filePanel.style.display = 'block';
                if (commandPanel) commandPanel.style.display = 'block';
                if (viewerOverlay) viewerOverlay.style.display = 'flex';
            }, 100);
        } catch (recoveryError) {
            console.error('Recovery failed:', recoveryError);
        }
    }
}

// Initialize error boundary
new ErrorBoundary();

export { ErrorBoundary };