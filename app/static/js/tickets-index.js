// /js/tickets-index.js
import { loadCurrentUser, logout } from './auth.js';
import { fetchTickets, loadTicketsTable, setActionLimits } from './api-tickets.js';

// Expose logout to global scope for HTML calls
window.logout = logout;

let currentUser = null;
let allTicketsCache = [];

/**
 * Fetches tickets based on the provided URL parameters and updates the UI.
 * @param {URLSearchParams | null} params - Optional URLSearchParams object for filtering.
 */
async function getTicketsAndDisplay(params = null) {
    try {
        const tickets = await fetchTickets(false, params); 
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
async function filterTickets() {
    // Get filter values and normalize search term for case-insensitive matching
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    const selectedStatus = document.getElementById('statusFilter').value; // e.g., "Open" or "all"
    
    console.log("\n\nsearching: ", searchTerm);
    
    // Start filtering from the complete cached list
    // let filteredTickets = allTicketsCache;
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
    console.log("\nfilltered tickets " , filteredTickets, "\n");
    
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
        await getTicketsAndDisplay(null);
    }
}

// Expose filtering function globally for HTML inline event listeners
window.filterTickets = filterTickets; 

document.addEventListener('DOMContentLoaded', initializeTicketsPage);