// /js/home.js
// Imports authentication and utility functions
import { logout, loadCurrentUser } from './auth.js'; 

/**
 * Initializes the home page: checks authentication status.
 */
async function initHome() {
    // Check if user is logged in. loadCurrentUser handles redirection if session is invalid.
    const user = await loadCurrentUser(); 
    
    if (user) {
        console.log(`User logged in: ${user.email}.\n Home view loaded.`);
    } else {
        // If the home page is public, this else block can be used for public-only UI logic.
        console.log("User not authenticated. Showing public view or redirecting.");
    }
}

initHome();