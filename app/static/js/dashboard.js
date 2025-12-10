// dashboard.js
import { loadCurrentUser, logout } from './auth.js';
import { fetchApplications, loadAppsTable, setActionLimits } from './api-applications.js';

let apps = null; 

async function getApplicationsAndDisplay(user) {
    try {
        apps = await fetchApplications(true); 
        loadAppsTable(apps);
        
        if (user.role === "User") {
            setActionLimits();
        }
    } catch (error) {
        console.error("Error loading applications:", error);
    }
}

async function searchApp() {
    const searchTerm = document.getElementById('searchInput').value;
    const selectedCategory = document.getElementById('categoryFilter').value;
    const selectedStatus = document.getElementById('statusFilter').value;

    const params = new URLSearchParams();

    if (searchTerm) params.append('search', searchTerm);
    if (selectedCategory && selectedCategory !== 'all') params.append('category', selectedCategory);
    if (selectedStatus && selectedStatus !== 'all') params.append('status', selectedStatus);

    try {
        const filteredApps = await fetchApplications(false, params);
        loadAppsTable(filteredApps);
        
        const user = await loadCurrentUser(); 
        if (user && user.role === "User") {
            setActionLimits();
        }
    } catch (error) {
        console.error("Error during application search:", error);
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
        
        await getApplicationsAndDisplay(user);
    } else {

    }
}

window.searchApp = searchApp;

document.addEventListener('DOMContentLoaded', initializeDashboard);
window.logout = logout;