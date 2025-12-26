// api-applications.js
import { logout, redirectIfLoggedIn } from './auth.js';

let appsCache = []; 
let accessPermissions = []; 

export async function fetchApplications(isDashboardMode = false, params = null) {
    const token = localStorage.getItem("token");
    if (!token) return logout();

    let apiUrl = isDashboardMode ? "/api/applications?dashboard=true" : "/api/applications";
    if (params) apiUrl += (isDashboardMode ? '&' : '?') + params.toString();

    try {
        const res = await fetch(apiUrl, {
            headers: { "Authorization": "Bearer " + token }
        });
        appsCache = await res.json();
        
    } catch (error) {
        alert("Unauthorized or failed to fetch applications.");
        throw new Error("Failed to fetch applications");
        redirectIfLoggedIn("/applications");
    }
    
    return appsCache;
}

// export async function fetchAccessPermissions() {
//     const token = localStorage.getItem("token");
//     if (!token) return logout();

//     let apiUrl = "/api/access";

//     try {
//         const res = await fetch(apiUrl, {
//             method: "GET",
//             headers: { "Authorization": "Bearer " + token }
//         });
//         accessPermissions = await res.json();
//     } catch (error) {
//         alert("Unauthorized or failed to fetch permissions.");
//         throw new Error("Failed to fetch user permissions");
//         // logout();
//     }
    
//     return accessPermissions;
// }


export async function fetchAppById(appId) {
    const token = localStorage.getItem("token");
    if (!token) return logout();

    try {
        const res = await fetch(`/api/applications/${appId}`, {
            method: "GET",
            headers: { "Authorization": "Bearer " + token }
        });
        
        if (!res.ok) {
            throw new Error("Application not found");
        }
        
        return await res.json();
    } catch (error) {
        alert("Unauthorized or failed to fetch application.");
        throw new Error("Failed to fetch application");
        redirectIfLoggedIn("/applications");
    }
}


export async function deleteApplication(appId, appName) {
    const token = localStorage.getItem("token");

    const confirmTerm = prompt(`Write 'delete ${appName}' to confirm`);
    if (confirmTerm == null) {
        return;
    } else if (confirmTerm != null && confirmTerm !== `delete ${appName}`) {
        alert("⚠️ Check confirmation and try again !");
        return;
    }

    const res = await fetch(`/api/applications/${appId}`, {
        method: "DELETE",
        headers: { "Authorization": "Bearer " + token }
    });

    if (res.ok) {
        alert("✅ Application deleted successfully.");
        window.location.href = "/applications";
    } else if (res.status === 401) {
        alert("⚠️ Authentication required. Please login.");
        logout();
    }  else if (res.status == 403) {
        alert("😆 You don't have permission to delete !");
    } else {
        alert(`❌ Error deleting application: ${res.status} ${res.statusText}`);
    }
}


//----- SEARCH FOR APP BY API -----//

// async function searchApp() {
//     const searchTerm = document.getElementById('searchAppInput').value;
//     const selectedCategory = document.getElementById('categoryFilter').value;
//     const selectedStatus = document.getElementById('statusAppFilter').value;

//     const params = new URLSearchParams();

//     if (searchTerm) params.append('search', searchTerm);
//     if (selectedCategory && selectedCategory !== 'all') params.append('category', selectedCategory);
//     if (selectedStatus && selectedStatus !== 'all') params.append('status', selectedStatus);

//     try {
//         const filteredApps = await fetchApplications(false, params);
//         loadAppsTable(filteredApps);
        
//         const user = await loadCurrentUser(); 
//         if (user && user.role === "User") {
//             setActionLimits();
//         }
//     } catch (error) {
//         console.error("Error during application search:", error);
//     }
// }
