// /js/edit-app.js
// Assuming './auth.js' exports a function 'loadCurrentUser'
import { logout, loadCurrentUser, redirectIfLoggedIn } from './auth.js'; 
import { serializeForm } from './application-form-utils.js';
import { fetchAppById } from './api-applications.js';

// Expose logout to global scope for HTML calls
window.logout = logout;

/**
 * Initializes the Edit Application page: gets app ID, loads user, loads app data, and sets up form submission.
 */
async function initEditApp() {
    // 1. Get Application ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const appId = urlParams.get("id");

    if (!appId) {
        alert("❌ Application ID is missing.");
        return redirectIfLoggedIn("/applications");
    }

    // 2. Load current user and check authentication
    const currentUser = await loadCurrentUser(); 
    if (!currentUser) {
        return; 
    }

    // 3. Fetch application data
    const app = await fetchAppById(appId)
    
    // 4. Check User Edit permission
    checkUserAccess(app.permission_level);

    // 5. Load application data
    await loadApp(app);

    // 6. Attach form submission handler
    const editForm = document.getElementById("editForm");
    editForm?.addEventListener("submit", e => {handleSaveEdits(e, app.id)});
}

/**
 * Fetches application data and populates the form fields.
 * @param {string} id - The application ID.
 */
async function loadApp(app) {
    // Populate form fields
    document.getElementById("name").value = app?.name || '...';
    document.getElementById("category").value = app?.category || '...';
    document.getElementById("owner").value = app?.owner || '...';
    document.getElementById("status").value = app?.status || '...';
}

/**
 * Applies editing restrictions based on the user's role and the application's owner.
 * Only Admin or the Original Owner can edit.
 */
function checkUserAccess(accessLevel) {
    if (accessLevel !== "admin" && accessLevel !== "write") {
        alert("🗿 You do not have permission to edit this app.");
        return redirectIfLoggedIn("/applications");
    }
    return;
}

/**
 * Handles the form submission to save application edits.
 * @param {Event} e - The submit event.
 */
async function handleSaveEdits(e,appId) {
    e.preventDefault();

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
            const errorData = await res.json();
            alert(`❌ Update failed: ${res.status} - ${errorData.detail || res.statusText}`);
            console.error(errorData)
        }
    } catch (error) {
        console.error("Fetch error:", error);
        alert("An unexpected error occurred during update.");
    }
}

initEditApp();