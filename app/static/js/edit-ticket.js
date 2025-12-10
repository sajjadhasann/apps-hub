// /js/edit-ticket.js
// Assuming './auth.js' exports a function 'loadCurrentUser'
import { logout, loadCurrentUser } from './auth.js'; 
import { serializeForm } from './application-form-utils.js';
import {fetchTicketById}  from './api-tickets.js';
import { fetchAppById } from './api-applications.js';
import { fetchUserById } from './access-management.js';
import { initializeMarkdownPreview } from './markdown-utils.js';

// Expose logout to global scope for HTML calls
window.logout = logout;

let currentUser = null;
let ticketCreatorId = null;
let currentTicketStatus = null;
let ticketId = null;

/**
 * Initializes the Edit Ticket page: gets ticket ID, loads user, loads ticket data, and sets up form submission.
 */
async function initEditTicket() {
    // 1. Get Ticket ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    ticketId = urlParams.get("id");

    if (!ticketId) {
        alert("❌ Ticket ID is missing.");
        return window.location.href = "/tickets";
    }

    // 2. Display Ticket ID in the header immediately
    const idDisplay = document.getElementById("ticketIdDisplay");
    if (idDisplay) idDisplay.innerText = `#${ticketId}`;

    // 3. Load current user and check authentication
    currentUser = await loadCurrentUser(); 
    if (!currentUser) {
        return; 
    }

    // 4. Load ticket data
    await loadTicket(ticketId);

    // 5. Attach form submission handler
    const editForm = document.getElementById("editForm");
    if (editForm) {
        editForm.addEventListener("submit", handleSaveEdits);
    }
}

/**
 * Fetches ticket data and populates the form fields.
 * @param {string} id - The ticket ID.
 */
async function loadTicket(ticketId) {
    const [ticket, currentUser] = await Promise.all([
        fetchTicketById(ticketId),
        loadCurrentUser()
    ]);

    const [app, creator] = await Promise.all([
        fetchAppById(ticket.application_id),
        fetchUserById(ticket.created_by)
    ]);

    // Populate form fields
    document.getElementById("application_name").value = app.name;
    document.getElementById("title").value = ticket.title;
    document.getElementById("description").value = ticket.description;
    document.getElementById("cancelBtn").href = `/tickets/ticket?id=${ticket.id}`;
    
    // Populate status dropdown (even if hidden initially)
    const statusSelect = document.getElementById("status");
    if (statusSelect) statusSelect.value = ticket.status;

    // Store critical data for RBAC
    ticketCreatorId = ticket.created_by;
    currentTicketStatus = ticket.status;
    
    // Apply Role-Based Access Control (RBAC)
    applyAccessControl();

}

/**
 * Applies editing restrictions based on the user's role and ticket status.
 * - Admin: Can edit everything, including Status.
 * - Creator: Can edit Title/Description only if status is NOT Resolved.
 */
function applyAccessControl() {
    const saveBtn = document.getElementById("saveBtn");
    const statusControl = document.getElementById("statusControl");
    
    const isAdmin = currentUser.role === "Admin";
    const isCreator = currentUser.id === ticketCreatorId;
    const isResolved = currentTicketStatus === "Resolved";

    // 1. Handle Status Field Visibility (Admin Only)
    if (isAdmin) {
        statusControl.classList.remove("hidden");
    }

    // 2. Determine if user can edit at all
    // Allowed if: User is Admin OR (User is Creator AND Ticket is NOT Resolved)
    const canEdit = isAdmin || (isCreator && !isResolved);
    
    if (!canEdit) {
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.classList.add("opacity-50", "cursor-not-allowed"); 
            saveBtn.innerText = "Read Only";
        }
        
        // Disable input fields
        document.getElementById("title").disabled = true;
        document.getElementById("description").disabled = true;

        alert("🗿 You do not have permission to edit this ticket (it might be resolved or not yours).");
    }
}

/**
 * Handles the form submission to save ticket edits.
 * @param {Event} e - The submit event.
 */
async function handleSaveEdits(e) {
    e.preventDefault();

    // Re-check RBAC before sending the request
    const isAdmin = currentUser.role === "Admin";
    const isCreator = currentUser.id === ticketCreatorId;
    const isResolved = currentTicketStatus === "Resolved";

    if (!isAdmin && (!isCreator || isResolved)) {
        return alert("🗿 Permission denied.");
    }

    const token = localStorage.getItem("token");
    
    // Get form data
    const body = serializeForm(e.target);

    // Clean up body: Regular users shouldn't send 'status' field logic is often handled by API, 
    // but we can ensure it here.
    if (!isAdmin) {
        delete body.status;
    }

    try {
        const res = await fetch(`/api/tickets/${ticketId}`, {
            method: "PUT",
            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });

        if (res.ok) {
            alert("✅ Ticket updated successfully.");
            window.location.href = `/tickets/ticket?id=${ticketId}`; // Redirect to details view
        } else {
            const errorData = await res.text();
            alert(`❌ Update failed: ${res.status} - ${errorData || res.statusText}`);
        }
    } catch (error) {
        console.error("Fetch error:", error);
        alert("An unexpected error occurred during update.");
    }
}

initEditTicket();