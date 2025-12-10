// register.js
import { redirectToDashboardIfLoggedIn } from './auth.js';

const urlParams = new URLSearchParams(window.location.search);
const adminKey = urlParams.get("admin_key");

const REGISTER_ENDPOINT = "/api/auth/register";

document.getElementById("registerForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    let url = REGISTER_ENDPOINT;
    
    if (adminKey) {
        url = `${REGISTER_ENDPOINT}?admin_key=${adminKey}`;
    }

    const form = e.target;
    const formData = new FormData(form); 

    const res = await fetch(url, {
        method: "POST",
        body: formData
    });

    const result = await res.json();

    if (res.ok) {
        alert(`OK, ${res.message}`);
        window.location.href = "/login";
    } else {
        alert(result.detail || "Registration failed");
    }
});

document.addEventListener('DOMContentLoaded', redirectToDashboardIfLoggedIn);