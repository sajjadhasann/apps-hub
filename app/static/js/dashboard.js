// dashboard.js
import { loadCurrentUser, logout, setActionLimits } from './auth.js';
import { fetchApplications } from './api-applications.js';
import { loadAppsTable, filterApps, updateAppsCache } from './applications-index.js';
import { fetchTickets } from './api-tickets.js';
import { loadTicketsTable, filterTickets, updateTicketsCache } from './tickets-index.js';


async function getUserApplicationsAndDisplay(user) {
    try {
        const apps = await fetchApplications(true);
        updateAppsCache(apps); 
        loadAppsTable(apps);
        
        if (user.role === "User") {
            setActionLimits();
        }
    } catch (error) {
        console.error("Error loading applications:", error);
    }
}


async function getUserTicketsAndDisplay(user) {
    try {
        const tickets = await fetchTickets(true); 
        updateTicketsCache(tickets)
        loadTicketsTable(tickets);
        
        if (user.role === "User") {
            setActionLimits();
        }
    } catch (error) {
        console.error("Error loading tickets:", error);
    }
}


async function initializeDashboard() {
    const user = await loadCurrentUser();
    
    if (user) {
        document.getElementById("fullName").innerText = user.full_name;
        document.getElementById("email").innerText = user.email;
        document.getElementById("role").innerText = user.role;
        
        user.role === "User" ?
            document.getElementById("role").classList.add("bg-yellow-200") :
            document.getElementById("role").classList.add("bg-blue-200");
        
        getUserApplicationsAndDisplay(user);
        getUserTicketsAndDisplay(user);
    } else {
        logout()
    }
};

window.logout = logout;
window.filterApps = filterApps;
window.filterTickets = filterTickets;

// Only add the listener if the active page is Dashboard
if (window.location.pathname.includes('/dashboard')) {
    document.addEventListener('DOMContentLoaded', initializeDashboard);
}