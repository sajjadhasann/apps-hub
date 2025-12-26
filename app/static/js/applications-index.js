// applications-index.js
import { loadCurrentUser, logout, setActionLimits } from './auth.js';
import { fetchApplications, deleteApplication } from './api-applications.js';

let currentUser = null;
let allAppsCache = []

export function updateAppsCache(apps) {
    allAppsCache = apps;
}

export function loadAppsTable(apps, accessPermissions) {
    const table = document.getElementById("appsTable");
    table.innerHTML = "";

    if (!apps || apps.length === 0) {
        table.innerHTML = `
            <td colspan="5" class="py-8 text-center text-gray-500">
                There are no applications, click on 
                <a href="/applications/create" class="underline font-semibold">
                Create Application</a> to start your work.
            </td>
        `;
        return;
    }

    apps.forEach((app, i) => {
        const statusClass = `app-status-${app.status.replace(/\s+/g, '_')}`; // e.g., Open -> app-status-Open
        // const index = apps.findIndex(apps => apps.id === app.id);

        table.innerHTML += `
            <tr class="bo rder-b hover:bg-gray-50" app-data="${app.id}">
                <td class="py-2 px-4"><a class="hover:underline" href="/applications/app?id=${app.id}">${app.name}</a></td>
                <td class="py-2 px-4">${app.category}</td>
                <td class="py-2 px-4">${app.owner}</td>
                <td class="py-2 px-4">
                    <span class="status-badge ${statusClass}">${app.status}</span>
                </td>
                <td class="py-2 px-4">
                    <a href="/applications/edit?id=${app.id}" class="text-blue-600 mr-4 action-btn-editor" data-user-access="${app.permission_level}">Edit</a>
                    <button onclick="window.deleteApplicationByIndex('${i}')" class="text-red-600 action-btn-admin" data-user-access="${app.permission_level}">Delete</button>
                </td>
            </tr>
        `;
    });
    
    window.deleteApplicationByIndex = (i) => {
        if (apps && apps[i]) {
            deleteApplication(apps[i].id, apps[i].name);
        } else {
            alert('Application data not found in cache.');
        }
    };
}

async function getApplicationsAndDisplay(user) {
    try {
        const apps = await fetchApplications(false);
        allAppsCache = apps 

        loadAppsTable(apps);
        if (user.role === "User") {
            setActionLimits();
        }
    } catch (error) {
        console.error("Error loading applications:", error);
    }
}

export async function filterApps() {
    const searchTerm = document.getElementById('searchAppInput').value;
    const selectedCategory = document.getElementById('categoryAppFilter').value;
    const selectedStatus = document.getElementById('statusAppFilter').value;
  
    // Start filtering from the complete cached list
    let filteredApps = allAppsCache;
    
    // 1. Filter by Category (unless 'all' is selected)
    if (selectedCategory && selectedCategory !== 'all') {
        filteredApps = filteredApps.filter(app => 
            app.category === selectedCategory
        );
    }

    // 2. Filter by Status (unless 'all' is selected)
    if (selectedStatus && selectedStatus !== 'all') {
        filteredApps = filteredApps.filter(app => 
            app.status === selectedStatus
        );
    }

    // 3. Filter by Search Term (matching on title and description)
    if (searchTerm.length > 0) {
        filteredApps = filteredApps.filter(app => {
            // Check if search term is in title OR description
            const titleMatch = app.name.toLowerCase().includes(searchTerm);
            const appId = app.id == searchTerm ? app.id : false;
            const appOwner = app.owner.toLowerCase().includes(searchTerm);
            return titleMatch || appId || appOwner;
        });
    }
    
    // 3. Display the resulting filtered subset
    loadAppsTable(filteredApps);

    // setActionLimits is called within getTicketsAndDisplay, but calling here ensures 
    // any subsequent action limits are set correctly after the filter run.
    if (currentUser && currentUser.role === "User") {
        setActionLimits();
    }
}

async function initializeApplicationsPage() {
    currentUser = await loadCurrentUser();
    if (currentUser) {
        await getApplicationsAndDisplay(currentUser);
    }
}

window.filterApps = filterApps; 
window.logout = logout; 

// Only add the listener if the active page is Appkication
if (window.location.pathname.includes('/applications')) {
    document.addEventListener('DOMContentLoaded', initializeApplicationsPage);
}