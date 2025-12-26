// access-page.js
import { 
    getAllAccesses, 
    fetchApplicationsList, 
    fetchUsersList,
    selectApplicationHandler,
    filterUsers,
    savePermissions,
    cancelChanges,
    handlePermissionChange
} from './access-management.js';
import { logout } from './auth.js';

async function initializeAccessPage() {
    try {
        await Promise.all([
            getAllAccesses(),
            fetchApplicationsList(),
            fetchUsersList()
        ]);

    } catch (error) {
        console.error("Error initializing access page:", error);
    }
}

window.selectApplicationHandler = selectApplicationHandler;
window.filterUsers = filterUsers;
window.savePermissions = savePermissions;
window.cancelChanges = cancelChanges;
window.handlePermissionChange = handlePermissionChange; 
window.logout = logout; 

// Only add the listener if the active page is Access Management
if (window.location.pathname.includes('/access')) {
    document.addEventListener('DOMContentLoaded', initializeAccessPage);
}