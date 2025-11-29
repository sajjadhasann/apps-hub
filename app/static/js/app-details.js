// app-details.js
import { loadCurrentUser, logout } from './auth.js';
import { fetchAppById, deleteApplication } from './api-applications.js';

const urlParams = new URLSearchParams(window.location.search);
const appId = urlParams.get("id");
let app = null;

async function initializeAppDetails() {
    if (!appId) {
        alert("No application ID provided.");
        return window.location.href = "/applications";
    }
    
    await loadCurrentUser();
    
    try {
        app = await fetchAppById(appId);
        
        document.getElementById("name").innerText = app.name;
        document.getElementById("category").innerText = app.category;
        document.getElementById("owner").innerText = app.owner;
        document.getElementById("status").innerText = app.status;
        if (app.status === "Active") {
            document.getElementById("status").classList.add("text-green-700");
        }
        
        const editLink = document.getElementById("edit_app_link");
        if (editLink) editLink.href = `/applications/edit?id=${app.id}`;

    } catch (error) {
        alert(error.message);
        window.location.href = "/applications";
        return;
    }
}

document.getElementById("deleteBtn").addEventListener("click", () => {
    if (app) {
        deleteApplication(app.id, app.name);
    }
});

document.addEventListener('DOMContentLoaded', initializeAppDetails);

window.logout = logout;