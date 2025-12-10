// static/js/chatbot.js

const chatForm = document.getElementById('aiChatForm');
const chatInput = document.getElementById('chatInput');
const chatOutput = document.getElementById('chatOutput');
const chatSubmitBtn = document.getElementById('chatSubmitBtn');

// API Configuration: Now pointing to your FastAPI internal endpoint
const apiUrl = '/api/chat'; 

// Helper to set UI state (loading/enabled)
function setUIState(isLoading) {
    chatInput.disabled = isLoading;
    chatSubmitBtn.disabled = isLoading;
    if (isLoading) {
        chatSubmitBtn.innerHTML = `
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Thinking...
        `;
        chatOutput.innerHTML = '<p class="text-center text-blue-500 italic">Generating response, please wait...</p>';
    } else {
        chatSubmitBtn.textContent = 'Send Query';
    }
}


/**
 * Fetches content from your secure backend proxy (/api/chat).
 * The backend handles the Gemini API call, security, and response parsing.
 * * @param {string} userQuery - The question/prompt from the user.
 * @returns {Promise<{text: string, sources: Array<{uri: string, title: string}>}>} 
 * The structured response object from the FastAPI endpoint.
 */
async function fetchGeminiResponse(userQuery) {
    
    // The payload only needs the query; the backend handles the rest.
    const payload = {
        query: userQuery,
    };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (response.ok) {
            // Success: The server returned the structured {text, sources} object.
            return result; 
        } else {
            // Failure: The server returned an error (e.g., 400, 500, 502).
            const errorMessage = result.detail || result.message || response.statusText;
            throw new Error(`Proxy failed: ${errorMessage}`);
        }
    } catch (error) {
        // Network error or JSON parsing error
        console.error("Network or Proxy Error:", error);
        throw new Error(`Connection failed: ${error.message}`);
    }
}


/**
 * Handles the chat form submission.
 * @param {Event} e 
 */
async function handleChatSubmission(e) {
    e.preventDefault();
    const userQuery = chatInput.value.trim();

    if (!userQuery) return;

    setUIState(true);

    try {
        // The structured data is returned directly from the FastAPI endpoint
        const { text, sources } = await fetchGeminiResponse(userQuery);
        
        // Render the main response text
        let outputHtml = `<p class="whitespace-pre-wrap">${text}</p>`;

        // Render sources if available
        if (sources && sources.length > 0) {
            outputHtml += `<div class="mt-4 pt-4 border-t border-gray-100">
                                <p class="text-sm font-semibold text-gray-700 mb-2">Sources:</p>
                                <ul class="list-disc list-inside text-xs text-gray-600 space-y-1">`;
            
            sources.forEach((source) => {
                outputHtml += `<li><a href="${source.uri}" target="_blank" class="text-blue-500 hover:underline">
                                    ${source.title || source.uri}
                                </a></li>`;
            });

            outputHtml += `</ul></div>`;
        }

        chatOutput.innerHTML = outputHtml;
        chatInput.value = ''; // Clear input after successful submission

    } catch (error) {
        console.error("Chatbot processing failed:", error);
        // Display the user-friendly error message from the caught exception
        chatOutput.innerHTML = `<p class="text-red-600">❌ Error: ${error.message}</p>`;
    } finally {
        setUIState(false);
    }
}

// Attach event listener when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (chatForm) {
        chatForm.addEventListener('submit', handleChatSubmission);
    }
});