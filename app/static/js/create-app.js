// /js/create-app.js
// Assuming './auth.js' exports a function 'loadCurrentUser'
import { logout, loadCurrentUser } from './auth.js'; 
import { serializeForm, validateCategory } from './application-form-utils.js';

// Expose logout to global scope for HTML calls
window.logout = logout;

/**
 * Initializes the Create Application page: loads user, sets owner email, and registers form submission handler.
 */
async function initCreateApp() {
    // 1. Load current user and check authentication
    const user = await loadCurrentUser(); 
    if (!user) {
        // loadCurrentUser handles redirection to /login
        return; 
    }

    // 2. Set default application owner
    const ownerInput = document.querySelector("input[name='owner']");
    if (ownerInput) {
        ownerInput.value = user.email;
    }
    
    // 3. Attach form submission handler
    const appForm = document.getElementById("appForm");
    if (appForm) {
        appForm.addEventListener("submit", handleCreateApp);
    }
}

/**
 * Handles the application creation form submission.
 * @param {Event} e - The submit event.
 */
async function handleCreateApp(e) {
    e.preventDefault();
    
    if (!validateCategory(e)) {
        return; 
    }

    const token = localStorage.getItem("token");
    if (!token) {
        return logout(); 
    }

    const body = serializeForm(e.target);

    try {
        const res = await fetch("/api/applications/create", {
            method: "POST",
            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });

        if (res.ok) {
            alert("🙏 Application created");
            window.location.href = "/applications";
        } else if (res.status === 401) {
            logout(); 
        } else if (res.status === 403) {
            alert("⚠️ You don't have permission to create an application");
        } else {
            const errorData = await res.text();
            alert(`Error creating app: ${res.status} - ${errorData || res.statusText}`);
        }
    } catch (error) {
        console.error("Fetch error:", error);
        alert("An unexpected error occurred during creation.");
    }
}

initCreateApp();