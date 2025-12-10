// /js/create-ticket.js
import { logout, loadCurrentUser } from './auth.js'; 
import { serializeForm } from './application-form-utils.js';
import { initializeMarkdownPreview } from './markdown-utils.js';
import { fetchApplications } from './api-applications.js';

// Global cache for application ID/Name mapping
let applicationsData = []; 

// Expose logout to global scope for HTML calls
window.logout = logout;

/**
 * Helper to populate the HTML <datalist> element with application names.
 * This function assumes the HTML has a <datalist id="applicationsList"></datalist>.
 * @param {Array<Object>} apps - Array of application objects with id and name.
 */
function populateApplicationsDatalist(apps) {
    const dataList = document.getElementById('applicationsList');
    if (!dataList) {
        console.warn("Datalist element 'applicationsList' not found. Cannot populate application names.");
        return;
    }
    
    dataList.innerHTML = ''; // Clear previous options
    
    if (apps && Array.isArray(apps)) {
        apps.forEach(app => {
            const option = document.createElement('option');
            // The value is the user-visible application name
            option.value = app.name; 
            dataList.appendChild(option);
        });
    }
}

/**
 * Initializes the Create Ticket page: loads user, fetches applications, 
 * sets up Markdown preview, and registers form submission handler.
 */
async function initCreateTicket() {
    // 1. Load current user and check authentication
    const user = await loadCurrentUser(); 
    if (!user) {
        return; 
    }
    
    // 2. Fetch and populate application list
    try {
        // Fetch all applications (not in dashboard mode, no params)
        const apps = await fetchApplications(false, null); 
        applicationsData = apps; // Cache the data globally
        
        populateApplicationsDatalist(apps);
    } catch (error) {
        console.error("Failed to load applications for dropdown:", error);
    }
    
    // 3. Attach form submission handler
    const ticketForm = document.getElementById("ticketForm") || document.getElementById("createTicketForm"); 
    if (ticketForm) {
        ticketForm.addEventListener("submit", handleCreateTicket);
    }

    // 4. Initialize Markdown Live Preview (inputElementID, previewElementID)
    initializeMarkdownPreview('markdownPreview', null, true, 'description');
};

/**
 * Handles the ticket creation form submission.
 * @param {Event} e - The submit event.
 */
async function handleCreateTicket(e) {
    e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) {
        return logout(); 
    }

    // Convert form data to object. body.application_id currently holds the APP NAME.
    let body = serializeForm(e.target);

    const selectedAppName = body.application_id; 

    // 1. Look up the ID from the cached applicationsData
    const selectedApp = applicationsData.find(app => app.name === selectedAppName);

    if (!selectedApp) {
        alert("⚠️ Please select a valid Application Name from the dropdown list. The entered name must exactly match a known application.");
        return;
    }
    
    // 2. Replace the application name (string) with the actual application ID (number/string)
    body.application_id = selectedApp.id;

    // 3. Proceed with the fetch request
    try {
        const res = await fetch("/api/tickets/create", {
            method: "POST",
            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });

        if (res.ok) {
            alert("🙏 Ticket created successfully");
            window.location.href = "/tickets"; // Redirect to tickets index
        } else if (res.status === 401) {
            logout(); 
        } else if (res.status === 403) {
            alert("⚠️ You don't have permission to create a ticket");
        } else {
            const errorData = await res.text();
            alert(`Error creating ticket: ${res.status} - ${errorData || res.statusText}`);
        }
    } catch (error) {
        console.error("Fetch error:", error);
        alert("An unexpected error occurred during creation.");
    }
}

// Initial call to start the process
initCreateTicket();