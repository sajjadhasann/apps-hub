// /js/api-tickets.js
import { logout } from './auth.js';

let ticketsCache = null; 

/**
 * Fetches a list of support tickets from the API.
 * @param {boolean} isDashboardMode - Not used for tickets currently, but kept for consistency.
 * @param {URLSearchParams | null} params - Optional URL parameters for filtering or searching.
 * @returns {Promise<Array<Object>>} The list of tickets.
 */
export async function fetchTickets(isDashboardMode = false, params = null) {
    const token = localStorage.getItem("token");
    if (!token) return logout();

    let apiUrl = isDashboardMode ? "/api/tickets?dashboard=true" : "/api/tickets";
    if (params) apiUrl += (isDashboardMode ? '&' : '?') + params.toString();

    try {
        const res = await fetch(apiUrl, {
            headers: { "Authorization": "Bearer " + token }
        });
        
        if (res.status === 401) {
            alert("Unauthorized access. Please log in again.");
            logout();
            throw new Error("Unauthorized");
        }
        
        if (!res.ok) {
            throw new Error(`Failed to fetch tickets: ${res.statusText}`);
        }

        ticketsCache = await res.json();
        
        return ticketsCache;
    } catch (error) {
        console.error("Fetch Tickets Error:", error);
        alert("Failed to load tickets. Check console for details.");
        logout(); // Logout if fetching fails unexpectedly
        throw error;
    }
}

/**
 * Fetches a single ticket by its ID.
 * @param {string} ticketId - The ID of the ticket to fetch.
 * @returns {Promise<Object>} The ticket object.
 */
export async function fetchTicketById(ticketId) {
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/tickets/${ticketId}`, {
        headers: { "Authorization": "Bearer " + token }
    });
    
    if (!res.ok) {
        throw new Error("Ticket not found or access denied");
    }

    return await res.json();
}

/**
 * Deletes a ticket by its ID after user confirmation.
 * @param {string} ticketId - The ID of the ticket to delete.
 * @param {string} ticketTitle - The title for confirmation message.
 */
export async function deleteTicket(ticketId, ticketTitle) {
    const token = localStorage.getItem("token");

    if (prompt(`Write 'delete ${ticketTitle}' to confirm deletion of ticket #${ticketId}`) !== `delete ${ticketTitle}`) {
        alert("⚠️ Confirmation failed. Check confirmation and try again.");
        return;
    }

    try {
        const res = await fetch(`/api/tickets/${ticketId}`, {
            method: "DELETE",
            headers: { "Authorization": "Bearer " + token }
        });

        if (res.ok) {
            alert("✅ Ticket deleted successfully.");
            window.location.href = "/tickets";
        } else if (res.status === 401) {
            alert("⚠️ Authentication required. Please log in.");
            // logout();
        } else {
            const errorText = await res.text();
            alert(`❌ Error deleting ticket: ${res.status} ${errorText || res.statusText}`);
        }
    } catch (error) {
        console.error("Delete error:", error);
        alert("An unexpected error occurred during deletion.");
    }
}


//----- SEARCH FOR TICKET BY API -----//

// async function searchTicket() {
//     const searchTerm = document.getElementById('searchInput').value;
//     const selectedCategory = document.getElementById('categoryFilter').value;
//     const selectedStatus = document.getElementById('statusTickrtFilter').value;

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