// js/script.js

// --- DOM Elements ---
const sidebar = document.getElementById('sidebar');
const content = document.getElementById('content');
const sidebarToggleBtn = document.getElementById('sidebar-toggle-btn');
const closeSidebarBtn = document.getElementById('close-sidebar-btn');

const loginSection = document.getElementById('login-section');
const adminDashboardSection = document.getElementById('admin-dashboard-section');
const tenantDashboardSection = document.getElementById('tenant-dashboard-section');

// --- Functions ---

// Function to show only the Login section
function showLoginSection() {
    hideAllSections();
    loginSection.classList.remove('d-none');
    document.getElementById('sidebar-menu').innerHTML = ''; // Clear sidebar menu
    sidebar.classList.add('toggled'); // Hide sidebar on login page
    content.classList.add('sidebar-toggled');
    sidebarToggleBtn.classList.add('d-none'); // Hide hamburger on login
}

// Function to show only the Admin Dashboard
function showAdminDashboard() {
    hideAllSections();
    adminDashboardSection.classList.remove('d-none');
    setupAdminDashboard(); // Call setup function from admin.js
    sidebar.classList.remove('toggled'); // Ensure sidebar is potentially visible
    content.classList.remove('sidebar-toggled');
     sidebarToggleBtn.classList.remove('d-none'); // Show hamburger
}

// Function to show only the Tenant Dashboard
function showTenantDashboard() {
    hideAllSections();
    tenantDashboardSection.classList.remove('d-none');
    setupTenantDashboard(); // Call setup function from tenant.js
    sidebar.classList.remove('toggled'); // Ensure sidebar is potentially visible
    content.classList.remove('sidebar-toggled');
     sidebarToggleBtn.classList.remove('d-none'); // Show hamburger
}

// Helper function to hide all main content sections
function hideAllSections() {
    loginSection.classList.add('d-none');
    adminDashboardSection.classList.add('d-none');
    tenantDashboardSection.classList.add('d-none');
}

// Toggle sidebar visibility
function toggleSidebar() {
    sidebar.classList.toggle('toggled');
    content.classList.toggle('sidebar-toggled');
}

// Check login state on page load/refresh
function checkInitialAuthState() {
    initializeStorage(); // Make sure storage is ready
    const user = getLoggedInUser(); // from auth.js
    if (user) {
        if (user.role === 'admin') {
            showAdminDashboard();
        } else if (user.role === 'tenant') {
            showTenantDashboard();
        } else {
            // Invalid role found in session storage, force logout
            handleLogout();
        }
        updateUIBasedOnLogin(); // from auth.js (show logout button etc)
    } else {
        showLoginSection();
        updateUIBasedOnLogin(); // from auth.js (hide logout button etc)
    }
}

// --- Event Listeners ---
if (sidebarToggleBtn) {
    sidebarToggleBtn.addEventListener('click', toggleSidebar);
}
if (closeSidebarBtn) {
    closeSidebarBtn.addEventListener('click', toggleSidebar); // Close button does the same as toggle
}

// --- Initial Setup ---
document.addEventListener('DOMContentLoaded', checkInitialAuthState);