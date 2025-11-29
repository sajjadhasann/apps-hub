// api-applications.js
import { logout } from './auth.js';

let appsCache = null; 

export async function fetchApplications(isDashboardMode = false, params = null) {
    const token = localStorage.getItem("token");
    if (!token) return logout();

    let apiUrl = "/api/applications";
    if (isDashboardMode) {
        apiUrl += "?dashboard=true";
    }

    if (params) {
        apiUrl += (isDashboardMode ? '&' : '?') + params.toString();
    }

    const res = await fetch(apiUrl, {
        headers: { "Authorization": "Bearer " + token }
    });

    if (!res.ok) {
        alert("Unauthorized or failed to fetch applications.");
        logout();
        throw new Error("Failed to fetch applications");
    }

    appsCache = await res.json();
    return appsCache;
}


export async function fetchAppById(appId) {
    const res = await fetch(`/api/applications/${appId}`);
    if (!res.ok) {
        throw new Error("Application not found");
    }
    return await res.json();
}


export async function deleteApplication(appId, appName) {
    const token = localStorage.getItem("token");

    if (prompt(`Write 'delete ${appName}' to confirm`) !== `delete ${appName}`) {
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
        alert("⚠️ Authentication required. Please log in.");
        logout();
    } else {
        alert(`❌ Error deleting application: ${res.status} ${res.statusText}`);
    }
}


export function loadAppsTable(apps) {
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
        const statusClass = app.status === 'Active' ? 'text-green-700' : 'text-gray';
        
        const index = appsCache.findIndex(cachedApp => cachedApp.id === app.id);

        table.innerHTML += `
            <tr class="border-b hover:bg-gray-50" app-data="${app.id}">
                <td class="py-2 px-4"><a class="hover:underline" href="/applications/app?id=${app.id}">${app.name}</a></td>
                <td class="py-2 px-4">${app.category}</td>
                <td class="py-2 px-4">${app.owner}</td>
                <td class="py-2 px-4 ${statusClass}">${app.status}</td>
                <td class="py-2 px-4">
                    <a href="/applications/edit?id=${app.id}" class="text-blue-600 mr-4 action-btn-admin">Edit</a>
                    <button onclick="window.deleteApplicationByIndex('${index}')" class="text-red-600 action-btn-admin">Delete</button>
                </td>
            </tr>
        `;
    });
    
    window.deleteApplicationByIndex = (i) => {
        if (appsCache && appsCache[i]) {
            deleteApplication(appsCache[i].id, appsCache[i].name);
        } else {
            alert('Application data not found in cache.');
        }
    };
}


export function setActionLimits() {
    let btns = Array.from(document.getElementsByClassName("action-btn-admin"));

    btns.forEach(btn => {
        btn.classList.add("opacity-50", "cursor-not-allowed");
        btn.addEventListener("click", e => {
            e.preventDefault();
            alert("⚠️ You don't have permission to perform this action.");
        });
    });
}