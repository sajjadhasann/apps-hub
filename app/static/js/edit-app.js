// /js/edit-app.js
// Assuming './auth.js' exports a function 'loadCurrentUser'
import { logout, loadCurrentUser } from './auth.js'; 
import { serializeForm } from './application-form-utils.js';

// Expose logout to global scope for HTML calls
window.logout = logout;

let currentUser = null;
let originalOwner = null;
let appId = null;

/**
 * Initializes the Edit Application page: gets app ID, loads user, loads app data, and sets up form submission.
 */
async function initEditApp() {
    // 1. Get Application ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    appId = urlParams.get("id");

    if (!appId) {
        alert("❌ Application ID is missing.");
        return window.location.href = "/applications";
    }

    // 2. Load current user and check authentication
    currentUser = await loadCurrentUser(); 
    if (!currentUser) {
        return; 
    }

    // 3. Load application data
    await loadApp(appId);

    // 4. Attach form submission handler
    const editForm = document.getElementById("editForm");
    if (editForm) {
        editForm.addEventListener("submit", handleSaveEdits);
    }
}

/**
 * Fetches application data and populates the form fields.
 * @param {string} id - The application ID.
 */
async function loadApp(id) {
    try {
        const res = await fetch(`/api/applications/${id}`);
        if (!res.ok) {
            alert("🔍 Application not found");
            return window.location.href = "/applications";
        }

        const app = await res.json();
        
        // Populate form fields
        document.getElementById("name").value = app.name || '';
        document.getElementById("category").value = app.category || '';
        document.getElementById("owner").value = app.owner || '';
        document.getElementById("status").value = app.status || '';

        originalOwner = app.owner;
        
        // Apply Role-Based Access Control (RBAC)
        applyAccessControl();

    } catch (error) {
        console.error("Fetch error:", error);
        alert("An unexpected error occurred while loading application data.");
        window.location.href = "/applications";
    }
}

/**
 * Applies editing restrictions based on the user's role and the application's owner.
 * Only Admin or the Original Owner can edit.
 */
function applyAccessControl() {
    const saveBtn = document.getElementById("saveBtn");
    // Check if the current user is the owner or an admin
    const isOwner = currentUser.email === originalOwner;
    const isAdmin = currentUser.role === "Admin";
    
    if (!isAdmin && !isOwner) {
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.classList.add("opacity-50", "cursor-not-allowed"); 
        }
        alert("🗿 You do not have permission to edit. Only the owner or admin can edit this application.");
    }
}

/**
 * Handles the form submission to save application edits.
 * @param {Event} e - The submit event.
 */
async function handleSaveEdits(e) {
    e.preventDefault();

    // Re-check RBAC before sending the request
    const isOwner = currentUser.email === originalOwner;
    const isAdmin = currentUser.role === "Admin";
    if (!isAdmin && !isOwner) {
        return alert("🗿 Permission denied.");
    }

    const token = localStorage.getItem("token");
    const body = serializeForm(e.target);

    try {
        const res = await fetch(`/api/applications/${appId}`, {
            method: "PUT",
            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });

        if (res.ok) {
            alert("✅ Changes saved.");
            window.location.href = "/applications";
        } else {
            const errorData = await res.text();
            alert(`❌ Update failed: ${res.status} - ${errorData || res.statusText}`);
        }
    } catch (error) {
        console.error("Fetch error:", error);
        alert("An unexpected error occurred during update.");
    }
}

initEditApp();