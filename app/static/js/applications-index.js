// applications-index.js
import { loadCurrentUser, logout } from './auth.js';
import { fetchApplications, loadAppsTable, setActionLimits } from './api-applications.js';

async function getApplicationsAndDisplay(user) {
    try {
        const apps = await fetchApplications(false); 
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

async function initializeApplicationsPage() {
    const user = await loadCurrentUser();
    if (user) {
        await getApplicationsAndDisplay(user);
    }
}

window.searchApp = searchApp; 
window.logout = logout; 

document.addEventListener('DOMContentLoaded', initializeApplicationsPage);