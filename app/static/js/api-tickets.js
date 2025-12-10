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

    let apiUrl = "/api/tickets/";

    // if (params) {
        // Construct the API URL with query parameters
        // const queryString = params.toString();
        // if (queryString) {
        //     console.log("query: ",queryString);
            
        //     // apiUrl += `?${queryString}`;
        // }
    // }

    try {
        const res = await fetch(apiUrl, {
            headers: { "Authorization": "Bearer " + token }
        });
        // console.log("res: ", res.body);
        
        if (res.status === 401) {
            alert("Unauthorized access. Please log in again.");
            // logout();
            throw new Error("Unauthorized");
        }
        
        if (!res.ok) {
            throw new Error(`Failed to fetch tickets: ${res.statusText}`);
        }

        ticketsCache = await res.json();
        // console.log("tickets", ticketsCache);
        
        return ticketsCache;

        // return;
    } catch (error) {
        console.error("Fetch Tickets Error:", error);
        alert("Failed to load tickets. Check console for details.");
        // logout(); // Logout if fetching fails unexpectedly
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


/**
 * Renders the list of tickets into the HTML table.
 * @param {Array<Object>} tickets - The array of ticket objects to display.
 */
export function loadTicketsTable(tickets) {
    const tableBody = document.getElementById("ticketsTable");
    const noTicketsMessage = document.getElementById("noTicketsMessage");
    tableBody.innerHTML = "";
    noTicketsMessage.classList.add("hidden");

    if (!tickets || tickets.length === 0) {
        // If there are no tickets after filtering/loading, display the message.
        noTicketsMessage.classList.remove("hidden");
        // Clear the loading message that might be present
        tableBody.innerHTML = ''; 
        return;
    }

    tickets.forEach((ticket, i) => {
        const statusClass = `ticket-status-${ticket.status.replace(/\s+/g, '_')}`; // e.g., Open -> ticket-status-Open
        
        // Find the index in the *cache* so delete can reference the correct global object
        const index = ticketsCache.findIndex(cachedTicket => cachedTicket.id === ticket.id);
        const createdAt = new Date(ticket.created_at).toLocaleString();

        tableBody.innerHTML += `
            <tr class="border-b hover:bg-gray-50" ticket-data="${ticket.id}">
                <td class="py-3 px-4 font-mono text-sm">#${ticket.id}</td>
                <td class="py-3 px-4">
                    <a class="hover:underline font-medium text-gray-800" href="/tickets/ticket?id=${ticket.id}">${ticket.title}</a>
                </td>
                <td class="py-3 px-4 text-sm text-gray-600">${ticket.application_id}</td>
                <td class="py-3 px-4">
                    <span class="status-badge ${statusClass}">${ticket.status}</span>
                </td>
                <td class="py-3 px-4 text-sm text-gray-500">${createdAt}</td>
                <td class="py-3 px-4">
                    <a href="/tickets/edit?id=${ticket.id}" class="text-yellow-600 mr-3 action-btn-admin">Edit</a>
                    <button onclick="window.deleteTicketByIndex('${index}')" class="text-red-600 action-btn-admin">Delete</button>
                </td>
            </tr>
        `;
    });
    
    // Expose delete function globally for use in inline onclick attribute
    window.deleteTicketByIndex = (i) => {
        if (ticketsCache && ticketsCache[i]) {
            deleteTicket(ticketsCache[i].id, ticketsCache[i].title);
        } else {
            alert('Ticket data not found in cache.');
        }
    };
}


/**
 * Disables action buttons for users without admin rights.
 * NOTE: This is basic UI disabling. Full permission check must be done server-side.
 */
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