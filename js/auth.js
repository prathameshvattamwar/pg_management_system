// js/auth.js

const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const logoutButton = document.getElementById('logout-btn');

// Function to handle login
function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;
    loginError.textContent = ''; // Clear previous errors

    const users = getUsers(); // From storage.js
    const user = users.find(u => u.username === username && u.password === password && u.role === role);

    if (user) {
        // Store login state in sessionStorage (clears on browser close)
        sessionStorage.setItem('loggedInUser', JSON.stringify(user));
        // Redirect or show dashboard based on role
        if (user.role === 'admin') {
            showAdminDashboard(); // Function in script.js
        } else if (user.role === 'tenant') {
            showTenantDashboard(); // Function in script.js
        }
        updateUIBasedOnLogin(); // Update common UI elements
    } else {
        loginError.textContent = 'Invalid credentials or role.';
    }
     loginForm.reset(); // Clear the form fields
}

// Function to handle logout
function handleLogout() {
    sessionStorage.removeItem('loggedInUser');
    showLoginSection(); // Function in script.js
    updateUIBasedOnLogin(); // Update common UI elements
    // Optionally clear sidebar menu if needed
     document.getElementById('sidebar-menu').innerHTML = '';
}

// Function to check if user is logged in
function isLoggedIn() {
    return sessionStorage.getItem('loggedInUser') !== null;
}

// Function to get logged in user details
function getLoggedInUser() {
    const userString = sessionStorage.getItem('loggedInUser');
    return userString ? JSON.parse(userString) : null;
}

// Function to update UI elements like logout button visibility
function updateUIBasedOnLogin() {
    const logoutBtn = document.getElementById('logout-btn'); // Select fresh just in case
    if (!logoutBtn) {
        console.error("Logout button not found in DOM!");
        return;
    }

    if (isLoggedIn()) {
        logoutBtn.classList.remove('d-none');
        console.log("Auth State: Logged In - Showing Logout Button"); // Debug Log
    } else {
        logoutBtn.classList.add('d-none');
        console.log("Auth State: Logged Out - Hiding Logout Button"); // Debug Log
    }
}

// Add event listeners
if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
}
if (logoutButton) {
    logoutButton.addEventListener('click', handleLogout);
}