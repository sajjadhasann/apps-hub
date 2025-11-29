function renderNavbar() {
    const token = localStorage.getItem("token");
    const isLoggedIn = !!token;

    let navLinksHTML = '';

    if (isLoggedIn) {
        navLinksHTML = `
            <a href="/" class="font-semibold hover:underline px-3 text-gray-700">Home</a>
            <a href="/dashboard" class="font-semibold hover:underline px-3 text-gray-700">Dashboard</a>
            <a href="/applications" class="font-semibold hover:underline px-3 text-gray-700">Applications</a>
            <a href="/access" class="font-semibold hover:underline px-3 text-gray-700">Manage Roles</a>
            <button onclick="logout()" class="font-semibold py-2 px-3 bg-red-300 rounded hover:bg-red-500 transition">Logout</button>
        `;
    } else {
        navLinksHTML = `
            <a href="/login" class="font-semibold py-2 px-3 bg- blue-500 text -white rounded hover: bg- blue-600 transition">Login</a>
            <a href="/register" class="font-semibold py-2 px-3 bg-blue-500  text-white rounded ml-2 hover:bg-blue-600 transition">Register</a>
        `;
    }

    const navbarHTML = `
        <nav class="bg-white shadow p-4 flex justify-between items-center">
            <h1 class="text-2xl font-bold text-blue-800" id="mainPageTitle">
            </h1>
            <div class="flex items-center space-x-2">
                ${navLinksHTML}
            </div>
        </nav>
    `;

    document.body.insertAdjacentHTML('afterbegin', navbarHTML);

    const pageTitleElement = document.getElementById('mainPageTitle');
    const pageTitle = document.title;
    if (pageTitleElement) {
        pageTitleElement.textContent = pageTitle;
    }
}

function logout() {
    localStorage.removeItem("token");
    window.location.href = "/login";
}

document.addEventListener('DOMContentLoaded', renderNavbar);