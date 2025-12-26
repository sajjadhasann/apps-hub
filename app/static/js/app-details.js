// app-details.js
import { loadCurrentUser, logout, setActionLimits } from './auth.js';
import { fetchAppById, deleteApplication } from './api-applications.js';
import { fetchTickets } from './api-tickets.js';
import { updateTicketsCache, loadTicketsTable } from './tickets-index.js';

const urlParams = new URLSearchParams(window.location.search);
const appId = urlParams.get("id");
let app = null;

async function getAppTicketsAndDisplay(user, appId) {
    try {
        const tickets = await fetchTickets(false, `appId=${appId}`); 
        updateTicketsCache(tickets)
        loadTicketsTable(tickets);
        
        if (user.role === "User") {
            setActionLimits();
        }
    } catch (error) {
        console.error("Error loading tickets:", error);
    }
}

async function initializeAppDetails() {
    if (!appId) {
        alert("No application ID provided.");
        return window.location.href = "/applications";
    }
    
    const currentUser = await loadCurrentUser();
    
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
        
        console.log("getAppTicketsAndDisplay");
        
        getAppTicketsAndDisplay(currentUser, app.id);

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


window.logout = logout;

// Only add the listener if the active page is App 
if (window.location.pathname.includes('/app')) {
    document.addEventListener('DOMContentLoaded', initializeAppDetails);
}