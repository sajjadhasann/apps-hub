// /js/markdown-utils.js

/**
 * Initializes the Markdown preview feature by setting up the Showdown converter
 * and attaching an event listener to the description textarea.
 */
export function initializeMarkdownPreview(previewElementId, text = null, livePreview = false, inputElementID = null) {
    // Check if Showdown.js is loaded globally (it should be from the HTML script tag)
    if (typeof showdown === 'undefined') {
        console.error("Showdown.js not found. Please ensure it's loaded in the HTML.");
        return;
    }
    // console.log('markdownPreview');
    
    const converter = new showdown.Converter({
        tables: true,
        strikethrough: true,
        tasklists: true,
        ghCompatibleHeaderId: true,
    });
    
    // const descriptionInput = document.getElementById('description');
    const previewElement = document.getElementById(previewElementId);
    let originalText = text || document.getElementById(inputElementID).value;
    

    /**
     * Updates the live preview area with the converted HTML from the Markdown text.
     * @param {string} markdownText 
     */
    const updatePreview = (markdownText) => {
        const html = converter.makeHtml(markdownText);
        
        if (markdownText.trim() === '') {
            previewElement.innerHTML = '<p class="text-gray-500 italic">Start typing to see the preview...</p>';
        } else {
            previewElement.innerHTML = html;
        }
    };
    
    // Initial load of any existing content
    updatePreview(originalText);

    // Attach the real-time update listener
    if (livePreview) {
        const originalTextInput = document.getElementById(inputElementID);
        originalTextInput.addEventListener('input', (e) => {
            updatePreview(e.target.value);
        });
    }
}