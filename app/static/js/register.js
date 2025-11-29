// register.js
import { redirectToDashboardIfLoggedIn } from './auth.js';

document.getElementById("registerForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form); 

    const res = await fetch("/api/auth/register", {
        method: "POST",
        body: formData
    });

    const result = await res.json();

    if (res.ok) {
        alert("Account created!");
        window.location.href = "/login";
    } else {
        alert(result.detail || "Registration failed");
    }
});

// التحقق من حالة تسجيل الدخول عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', redirectToDashboardIfLoggedIn);