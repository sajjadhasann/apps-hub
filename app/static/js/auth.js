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

export function redirectToDashboardIfLoggedIn() {
    const token = localStorage.getItem("token");
    if (token) {
        window.location.href = "/dashboard";
    }
}