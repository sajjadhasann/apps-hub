// /js/tickets-index.js
import { loadCurrentUser, logout, setActionLimits } from './auth.js';
import { fetchTickets, deleteTicket } from './api-tickets.js';


let currentUser = null;
let allTicketsCache = [];

export function updateTicketsCache(tickets) {
    allTicketsCache = tickets;
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
        // const index = allTicketsCache.findIndex(cachedTicket => cachedTicket.id === ticket.id);
        const createdAt = new Date(ticket.created_at).toLocaleString();

        tableBody.innerHTML += `
            <tr class="hover:bg-gray-50" ticket-data="${ticket.id}">
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
                    <button onclick="window.deleteTicketByIndex('${i}')" class="text-red-600 action-btn-admin">Delete</button>
                </td>
            </tr>
        `;
    });
    
    // Expose delete function globally for use in inline onclick attribute
    window.deleteTicketByIndex = (i) => {
        if (allTicketsCache && allTicketsCache[i]) {
            deleteTicket(allTicketsCache[i].id, allTicketsCache[i].title);
        } else {
            alert('Ticket data not found in cache.');
        }
    };
}

/**
 * Fetches tickets based on the provided URL parameters and updates the UI.
 * @param {URLSearchParams | null} params - Optional URLSearchParams object for filtering.
 */
async function getTicketsAndDisplay(isDashboardMode = false,params = null) {
    try {
        const tickets = await fetchTickets(isDashboardMode, params); 
        allTicketsCache = tickets;
        loadTicketsTable(tickets);
        
        // Re-apply limits after loading the new table data
        if (currentUser && currentUser.role === "User") {
            setActionLimits();
        }
    } catch (error) {
        console.error("Error loading tickets:", error);
        // fetchTickets already handles logout on 401
    }
}

/**
 * Collects current filter values from the UI, filters the local cache (allTicketsCache), 
 * and updates the table. This is now 100% client-side filtering.
 */
export async function filterTickets() {
    // Get filter values and normalize search term for case-insensitive matching
    const searchTerm = document.getElementById('searchTicketInput').value.toLowerCase().trim();
    const selectedStatus = document.getElementById('statusTicketFilter').value;

    // Start filtering from the complete cached list
    let filteredTickets = allTicketsCache;
    
    // 1. Filter by Status (unless 'all' is selected)
    if (selectedStatus && selectedStatus !== 'all') {
        filteredTickets = filteredTickets.filter(ticket => 
            ticket.status === selectedStatus
        );
    }

    // 2. Filter by Search Term (matching on title and description)
    if (searchTerm.length > 0) {
        filteredTickets = filteredTickets.filter(ticket => {
            // Check if search term is in title OR description
            const titleMatch = ticket.title.toLowerCase().includes(searchTerm);
            const descriptionMatch = ticket.description.toLowerCase().includes(searchTerm) ? ticket.description : false;
            const ticketId = ticket.id == searchTerm ? ticket.id : false;
            const applicationId = ticket.application_id == searchTerm? ticket.application_id : false;
            const userId = ticket.created_by == searchTerm? ticket.created_by : false;
            return titleMatch || descriptionMatch || ticketId || applicationId || userId;
        });
    }
    
    // 3. Display the resulting filtered subset
    loadTicketsTable(filteredTickets);

    // setActionLimits is called within getTicketsAndDisplay, but calling here ensures 
    // any subsequent action limits are set correctly after the filter run.
    if (currentUser && currentUser.role === "User") {
        setActionLimits();
    }
}


/**
 * Initializes the Tickets Index page: loads user and fetches initial ticket list.
 */
async function initializeTicketsPage() {
    currentUser = await loadCurrentUser();
    if (currentUser) {
        // Load all tickets initially (params=null)
        getTicketsAndDisplay();
    } else {
        logout();
    }
}

// Expose filtering function globally for HTML inline event listeners
window.filterTickets = filterTickets; 
window.logout = logout;

// Only add the listener if the active page is Tickets
if (window.location.pathname.includes('/tickets')) {
    document.addEventListener('DOMContentLoaded', initializeTicketsPage);
}
