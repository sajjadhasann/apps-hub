// access-management.js
import { logout } from './auth.js';

export let allAccesses = [];
export let users = []; 
export let applications = []; 
export let currentAccesses = {}; 
export let pendingChanges = {}; 
export let selectedAppId = null;
export let selectedAppName = '';


export async function getAllAccesses() {
    const token = localStorage.getItem("token");
    try {
        const res = await fetch("/api/access/", {
            headers: { "Authorization": "Bearer " + token }
        });
        if (res.status == 403) {
            alert("🗿 You have no permission on this page!");
            window.location.href = "/dashboard";
        } else if (!res.ok) {
            throw new Error("Failed to fetch all accesses");
        }
        allAccesses = await res.json();
    } catch (error) {
        console.error("Error fetching all accesses:", error);
    }
}


export async function fetchApplicationsList() {
    const token = localStorage.getItem("token");
    if (!token) return logout();

    const res = await fetch("/api/applications", {
        headers: { "Authorization": "Bearer " + token }
    });
    if (res.status == 403) {
        alert("🗿 You have no permission on this page!");
        window.location.href = "/dashboard";
    } else if (!res.ok) {
        alert("⚠️ Unauthorized, login again");
        logout();
        window.location.href = "/login";
        // throw new Error("Failed to fetch all Applications");
    }
    applications = await res.json();
    loadApplicationsList(applications);
}


export async function fetchUsersList() {
    const token = localStorage.getItem("token");
    if (!token) return logout();

    const res = await fetch("/api/users", {
        method: "GET",
        headers: { "Authorization": "Bearer " + token }
    });

    if (res.status == 403) {
        alert("🗿 You have no permission on this page!");
        return window.location.href = "/dashboard";
    } else if (!res.ok) {
        throw new Error("Failed to fetch all Users");
    }
    users = await res.json();
}


export async function fetchUserById(id) {
    const token = localStorage.getItem("token");
    if (!token) return logout();

    const res = await fetch(`/api/users/${id}`, {
        method: "GET",
        headers: { "Authorization": "Bearer " + token }
    });

    if (res.status == 403) {
        alert("🗿 You have no permission on this page!");
        return window.location.href = "/dashboard";
    } else if (!res.ok) {
        throw new Error("Failed to fetch all Users");
    }
    return await res.json();
}

/**
 * Loads the application list and sets up the event listener for selection.
 */
export function loadApplicationsList(apps) {
    const list = document.getElementById("applicationsList");
    list.innerHTML = "";
    if (apps.length === 0) {
        list.innerHTML = `<div class="text-center py-10 text-gray-500">No matching applications found.</div>`;
        return;
    }

    apps.forEach(app => {
        const isActive = app.id === selectedAppId ? 'bg-blue-100 border-blue-500' : 'hover:bg-gray-50 border-gray-200';
        const statusColor = app.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700';

        list.innerHTML += `
            <div id="app-${app.id}" class="app-item p-3 border-l-4 rounded-lg shadow-sm cursor-pointer ${isActive}" 
                 data-id="${app.id}" data-name="${app.name}" onclick="window.selectApplicationHandler(${app.id}, '${app.name.replace(/'/g, "\\'")}')">
                <div class="flex justify-between items-center">
                    <div class="font-semibold text-gray-900">${app.name}</div>
                    <div class="px-3 py-1 text-xs font-medium rounded-full ${statusColor}">
                        ${app.status}
                    </div>
                </div>
                <div class="text-sm text-gray-600">Owner: ${app.owner}</div>
            </div>
        `;
    });
}


export function selectApplicationHandler(appId, appName) {    
    if (selectedAppId) {
        const prevApp = document.getElementById(`app-${selectedAppId}`);
        if(prevApp) prevApp.classList.remove('bg-blue-100', 'border-blue-500');
    }
    
    selectedAppId = appId;
    selectedAppName = appName;
    const newApp = document.getElementById(`app-${appId}`);
    if(newApp) newApp.classList.add('bg-blue-100', 'border-blue-500');
    
    document.getElementById('selectedAppName').innerText = appName;
    document.getElementById('userSearchContainer').style.display = 'block';
    document.getElementById('floatingActions').style.display = 'flex';

    filterAccessesForSelectedApp(appId);
}


export function filterAccessesForSelectedApp(appId) {
    const list = document.getElementById("usersList");
    list.innerHTML = `<div class="text-center py-20 text-gray-500">Filtering user permissions...</div>`;
    
    currentAccesses = {}; 
    pendingChanges = {};

    const appAccesses = allAccesses.filter(access => access.application_id === appId);
    
    appAccesses.forEach(access => {
        console.log("access ", access);
        
        currentAccesses[access.user_id] = { 
            role: access.permission_level, 
            accessId: access.id 
        };
    });
    loadUsersForApp(users);     
}


export function loadUsersForApp(filteredUsers) {
    const list = document.getElementById("usersList");
    list.innerHTML = "";
    
    if (filteredUsers.length === 0) {
        list.innerHTML = `<div class="text-center py-20 text-gray-500">No matching users found.</div>`;
        return;
    }

    filteredUsers.forEach(user => {
        const access = currentAccesses[user.id] || {};
        const currentRole = access.role || null;
        
        const effectiveRole = pendingChanges[user.id]?.newRole !== undefined 
            ? pendingChanges[user.id].newRole 
            : currentRole;

        const isAdmin = effectiveRole === 'admin' ? 'checked' : '';
        const isEdit = effectiveRole === 'write' ? 'checked' : '';
        const isRead = effectiveRole === 'read' ? 'checked' : '';
        
        let roleColorClass = 'border-gray-200'; 
        
        if (effectiveRole === 'admin') roleColorClass = 'bg-blue-50 border-blue-200';
        else if (effectiveRole === 'write') roleColorClass = 'bg-cyan-50 border-cyan-200';
        else if (effectiveRole === 'read') roleColorClass = 'bg-yellow-50 border-yellow-200';

        list.innerHTML += `
            <div id="user-row-${user.id}" class="p-4 rounded-lg border flex items-center justify-between ${roleColorClass}">
                <div class="flex-grow">
                    <div class="font-semibold text-gray-900">${user.full_name}</div>
                    <div class="text-sm text-gray-600">${user.email}</div>
                </div>

                <div class="flex items-center space-x-6">
                    ${renderPermissionCheckbox('admin', user.id, isAdmin)}
                    ${renderPermissionCheckbox('write', user.id, isEdit)}
                    ${renderPermissionCheckbox('read', user.id, isRead)}
                </div>
            </div>
        `;
    });
}

export function renderPermissionCheckbox(role, userId, isChecked) {
    let labelClass;
    let titleText = '';
    
    switch (role) {
        case 'admin':
            labelClass = 'bg-blue-500 hover:bg-blue-600';
            titleText = 'Full Administration Permissions';
            break;
        case 'write':
            labelClass = 'bg-cyan-500 hover:bg-cyan-600';
            titleText = 'Edit and Create Permissions';
            break;
        case 'read':
            labelClass = 'bg-yellow-500 hover:bg-yellow-600';
            titleText = 'Read Only Permissions';
            break;
    }

    return `
        <div class="flex flex-col items-center">
            <label class="text-xs font-semibold mb-1 text-gray-600">${role}</label>
            <label class="${labelClass} relative inline-flex items-center cursor-pointer rounded-full p-1 transition duration-200" title="${titleText}">
                <input type="checkbox" data-user-id="${userId}" data-role="${role}" 
                        ${isChecked} onchange="window.handlePermissionChange(this, ${userId}, '${role}')" 
                        class="sr-only peer" />
                <div class="w-5 h-5 rounded-full bg-white transition duration-200 peer-checked:bg-opacity-0 peer-checked:translate-x-full"></div>
            </label>
        </div>
    `;
}

export function handlePermissionChange(checkbox, userId, role) {
    const accessInfo = currentAccesses[userId];
    const oldRole = accessInfo ? accessInfo.role : null;
    let newRole = null;

    if (checkbox.checked) {
        ['admin', 'write', 'read'].forEach(r => {
            if (r !== role) {
                const otherCheckbox = document.querySelector(`input[data-user-id="${userId}"][data-role="${r}"]`);
                if (otherCheckbox) otherCheckbox.checked = false;
            }
        });
        newRole = role; 
    } else if (oldRole === role) {
        newRole = null;
    } else {
         return; 
    }

    const isChangeNeeded = newRole !== oldRole;
    
    if (isChangeNeeded) {
        let actionType;
        if (oldRole === null && newRole !== null) {
            actionType = 'POST';
        } else if (oldRole !== null && newRole !== null) {
            actionType = 'PUT';
        } else if (oldRole !== null && newRole === null) {
            actionType = 'DELETE';
        } else {
            delete pendingChanges[userId];
            return; 
        }
        
        pendingChanges[userId] = {
            action: actionType,
            accessId: accessInfo ? accessInfo.accessId : null,
            newRole: newRole,
            oldRole: oldRole,
            userId: userId
        };
    } else {
        delete pendingChanges[userId];
    }
    
    const userRow = document.getElementById(`user-row-${userId}`);
    if (userRow) {
        userRow.classList.remove('bg-blue-50', 'bg-cyan-50', 'bg-yellow-50', 'border-blue-200', 'border-cyan-200', 'border-yellow-200');
        userRow.classList.add('border-gray-200'); 

        let newColorClass = '';
        let newBorderClass = '';

        const effectiveRoleColor = pendingChanges[userId] ? pendingChanges[userId].newRole : currentRole; // يجب أن يعود للدور القديم إذا لم يكن هناك تغيير معلق

        if (effectiveRoleColor === 'admin') {
            newColorClass = 'bg-blue-50';
            newBorderClass = 'border-blue-200';
        } else if (effectiveRoleColor === 'write') {
            newColorClass = 'bg-cyan-50';
            newBorderClass = 'border-cyan-200';
        } else if (effectiveRoleColor === 'read') {
            newColorClass = 'bg-yellow-50';
            newBorderClass = 'border-yellow-200';
        }
        
        if (newColorClass) {
            userRow.classList.add(newColorClass, newBorderClass);
        }
    }
}

export function filterUsers() {
    const searchTerm = document.getElementById('userSearchInput').value.toLowerCase();
    const filteredUsers = users.filter(user => 
        user.full_name.toLowerCase().includes(searchTerm) || 
        user.email.toLowerCase().includes(searchTerm)
    );
    loadUsersForApp(filteredUsers);
}

export async function savePermissions() {
    if (Object.keys(pendingChanges).length === 0) {
        alert('No changes to save.');
        return;
    }

    const token = localStorage.getItem("token");
    const changes = Object.values(pendingChanges);
    let successCount = 0;
    let errorCount = 0;

    for (const change of changes) {
        try {
            let url, method, body;

            if (change.action === 'POST') {
                url = '/api/access/';
                method = 'POST';
                // نستخدم change.userId بدلاً من change.accessId في POST
                body = { user_id: change.userId, application_id: selectedAppId, permission_level: change.newRole };
            } else if (change.action === 'PUT') {
                url = `/api/access/${change.accessId}`;
                method = 'PUT';
                body = { permission_level: change.newRole }; 
            } else if (change.action === 'DELETE') {
                url = `/api/access/${change.accessId}`;
                method = 'DELETE';
                body = null;
            } else {
                continue;
            }

            const res = await fetch(url, {
                method: method,
                headers: { 
                    "Authorization": "Bearer " + token,
                    "Content-Type": "application/json"
                },
                body: body ? JSON.stringify(body) : undefined
            });

            if (res.ok) {
                successCount++;
            } else {
                errorCount++;
                console.error(`❌ Failed to execute ${change.action} for user ${change.userId}: ${res.statusText}`);
            }

        } catch (error) {
            errorCount++;
            console.error(`❌ Error during API call for ${change.action}:`, error);
        }
    }

    alert(`✅ Save complete: ${successCount} successful, ${errorCount} failed.`);
    
    await getAllAccesses();
    filterAccessesForSelectedApp(selectedAppId);
}

export function cancelChanges() {
    if (!selectedAppId) return;
    document.getElementById('userSearchInput').value = '';
    filterAccessesForSelectedApp(selectedAppId); 
    alert('Unsaved changes were reverted.');
}