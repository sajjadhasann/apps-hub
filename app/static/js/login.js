// login.js
import { redirectIfLoggedIn } from './auth.js';

document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form); 

    const res = await fetch("/api/auth/login", {
        method: "POST",
        body: formData
    });

    const result = await res.json();

    if (res.ok) {
        localStorage.setItem("token", result.access_token);
        alert("✅ Login successful!");
        window.location.href = "/dashboard";
    } else {
        alert(result.detail || "⚠️ Invalid login");
    }
});

// التحقق من حالة تسجيل الدخول عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', redirectIfLoggedIn("/dashboard"));