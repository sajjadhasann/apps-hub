// /js/ticket-details.js
import { loadCurrentUser, logout } from './auth.js';
import {fetchTicketById}  from './api-tickets.js';
import { fetchAppById } from './api-applications.js';
import { fetchUserById } from './access-management.js';
import { initializeMarkdownPreview } from './markdown-utils.js';

// Expose logout to global scope for HTML calls
window.logout = logout;

const urlParams = new URLSearchParams(window.location.search);
const ticketId = urlParams.get("id");

// --- 1. Run independent tasks concurrently (Ticket and Current User) ---
async function initializeTicketPage() {
    
    // We start two fetches at the same time. This saves time.
    const [ticket, currentUser] = await Promise.all([
        fetchTicketById(ticketId),
        loadCurrentUser()
    ]);
    
    // Check if the ticket was successfully fetched before proceeding
    if (!ticket) {
        console.error("Ticket data could not be loaded.");
        return; 
    }
    
    // --- 2. Run dependent tasks concurrently (App and Creator) ---
    // These two fetches depend on ticket.application_id and ticket.created_by,
    // but they are independent of each other, so we run them concurrently.
    const [app, creator] = await Promise.all([
        fetchAppById(ticket.application_id),
        fetchUserById(ticket.created_by)
    ]);
    
    // Extract the needed titles safely
    const appTitle = app ? app.name : "N/A (App not found)";
    const creatorName = creator ? creator.full_name : "N/A (User not found)";

    // --- 3. Render all data at once ---
    renderTicketData(ticket, appTitle, creatorName);
    setupActionButtons(ticket, currentUser);
}


/**
 * Renders the fetched ticket data into the HTML elements.
 * IMPORTANT: Now accepts appTitle and creatorName as arguments.
 * @param {Object} ticket - The ticket object.
 * @param {string} appTitle - The resolved application name.
 * @param {string} creatorName - The resolved creator's full name.
 */
function renderTicketData(ticket, appTitle, creatorName) {
    document.getElementById("ticketTitle").innerText = ticket.title;
    document.getElementById("ticketId").innerText = ticket.id;
    document.getElementById("createdAt").innerText = new Date(ticket.created_at).toLocaleString();
    document.getElementById("applicationId").innerText = appTitle; 
    document.getElementById("createdBy").innerText = creatorName;
    
    initializeMarkdownPreview('ticketDescription', ticket.description); // ticketDescription

    // Render Status Badge
    const statusContainer = document.getElementById("ticketStatusContainer");
    const statusClass = `ticket-status-${ticket.status.replace(/\s+/g, '_')}`; // e.g., In_Progress
    statusContainer.innerHTML = `<span class="status-badge ${statusClass}">${ticket.status}</span>`;
}


/**
 * Configures the visibility and links for Edit/Delete buttons based on permissions.
 * @param {Object} ticket - The ticket object.
 */
function setupActionButtons(ticket, currentUser) {
    const editBtn = document.getElementById("editBtn");
    const deleteBtn = document.getElementById("deleteBtn");

    const isAdmin = currentUser.role === "Admin";
    const isCreator = currentUser.id === ticket.created_by;
    
    const isResolved = ticket.status === "Resolved";

    // 1. Handle Edit Button
    // Logic: Admin can always edit. Creator can edit if NOT Resolved.
    if (isAdmin || (isCreator && !isResolved)) {
        editBtn.href = `/tickets/edit?id=${ticket.id}`;
        editBtn.classList.remove("hidden");
    }

    // 2. Handle Delete Button
    // Logic: Only Admin can delete.
    if (isAdmin) {
        deleteBtn.classList.remove("hidden");
        deleteBtn.addEventListener("click", ()=>handleDeleteTicket(ticket));
    }
}

/**
 * Handles the ticket deletion process.
 */
async function handleDeleteTicket(ticket) {
    const confirmMessage = `Are you sure you want to delete ticket #${ticket.id}? This action cannot be undone.`;
    if (!confirm(confirmMessage)) return;

    const token = localStorage.getItem("token");
    try {
        const res = await fetch(`/api/tickets/${ticket.id}`, {
            method: "DELETE",
            headers: { "Authorization": "Bearer " + token }
        });

        if (res.ok) {
            alert("✅ Ticket deleted successfully.");
            window.location.href = "/tickets";
        } else if (res.status === 403) {
            alert("⚠️ Permission denied: Only Admins can delete tickets.");
        } else {
            alert(`❌ Error deleting ticket: ${res.statusText}`);
        }
    } catch (error) {
        console.error("Delete error:", error);
        alert("An unexpected error occurred.");
    }
}



document.addEventListener('DOMContentLoaded', initializeTicketPage);
