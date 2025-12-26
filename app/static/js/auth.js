// auth.js

export async function loadCurrentUser() {
    const token = localStorage.getItem("token");

    if (!token) {
        return null;
    }

    const res = await fetch("/api/auth/me", {
        method: "GET",
        headers: {
            "Authorization": "Bearer " + token
        }
    });

    if (!res.ok) {
        alert("Session expired, please login again.");
        logout();
        return null;
    }

    return await res.json();
}

export function logout() {
    localStorage.removeItem("token");
    window.location.href = "/login";
}

export function redirectIfLoggedIn(to = null) {
    const token = localStorage.getItem("token");
    if (token) {
        to ? window.location.href = to : window.location.href = "/";
    }
    return;
}


/**
 * Disables action buttons for users without admin rights.
 * NOTE: This is basic UI disabling. Full permission check in server-side.
 */
// export function setActionLimits(event = null) {
//     event?.preventDefault();

//     let btns = Array.from(document.getElementsByClassName("action-btn-admin"));

//     btns.forEach(btn => {
//         btn.classList.add("opacity-50", "cursor-not-allowed");

//         btn.onclick = (e) => {
//             e.preventDefault();
//             e.stopPropagation();
//             console.warn("Permission denied for this action.");
//             alert("⚠️ You don't have permission to perform this action.");
//         };
//     });
// }

/**
 * Disables action buttons for users without admin rights.
 * NOTE: This is basic UI disabling. Full permission check in server-side.
 */
export function setActionLimits() {
    const adminBtns = Array.from(document.getElementsByClassName("action-btn-admin"));
    const editorBtns = Array.from(document.getElementsByClassName("action-btn-editor"));

    adminBtns.forEach(btn => {
        const accessLevel = btn.getAttribute("data-user-access"); // e.g., 'admin', 'write', 'read'

        if (accessLevel !== "admin") disableAction(btn);
    });

    editorBtns.forEach(btn => {
        const accessLevel = btn.getAttribute("data-user-access"); // e.g., 'admin', 'write', 'read'

        if (accessLevel !== "write") disableAction(btn);
    });
}

/**
 * Helper to visually and functionally disable an element without using alerts.
 */
function disableAction(element) {
    element.classList.add("opacity-40", "cursor-not-allowed");
    element.style.pointerEvents = "none";
    element.setAttribute("aria-disabled", "true");
    element.setAttribute("title", "You do not have permission for this action in this app.");
}