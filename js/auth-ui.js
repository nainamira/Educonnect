// Client-side authentication utilities for public pages
document.addEventListener('DOMContentLoaded', function() {
    updateNavigation();
});

function updateNavigation() {
    const user = getCurrentUser();
    const loggedOutNav = document.getElementById('loggedOutNav');
    const loggedInNav = document.getElementById('loggedInNav');
    const userNameDisplay = document.getElementById('userNameDisplay');
    const userRoleBadge = document.getElementById('userRoleBadge');
    const dashboardLink = document.getElementById('dashboardLink');
    const profileLink = document.getElementById('profileLink');

    if (user) {
        // User is logged in
        if (loggedOutNav) loggedOutNav.style.display = 'none';
        if (loggedInNav) loggedInNav.style.display = 'flex';
        if (userNameDisplay) userNameDisplay.textContent = user.full_name;
        if (userRoleBadge) {
            userRoleBadge.textContent = user.role;
            // Update badge color based on role
            if (user.role === 'student') {
                userRoleBadge.style.background = '#e8f5e8';
                userRoleBadge.style.color = '#2e7d32';
            } else if (user.role === 'tutor') {
                userRoleBadge.style.background = '#e3f2fd';
                userRoleBadge.style.color = '#1976d2';
            } else if (user.role === 'admin') {
                userRoleBadge.style.background = '#ffebee';
                userRoleBadge.style.color = '#c62828';
            }
        }
        if (dashboardLink) {
            dashboardLink.href = `${user.role}dashboard.html`;
        }
        if (profileLink) {
            if (user.role === 'student') {
                profileLink.href = 'studentprofile.html';
            } else if (user.role === 'tutor') {
                profileLink.href = 'tutorprofile.html';
            } else {
                profileLink.href = 'admindashboard.html';
            }
        }
    } else {
        // User is not logged in
        if (loggedOutNav) loggedOutNav.style.display = 'block';
        if (loggedInNav) loggedInNav.style.display = 'none';
    }
}

function toggleDropdown() {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) {
        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    }
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    const dropdown = document.getElementById('userDropdown');
    const dropdownButton = event.target.closest('.dropdown');
    
    if (dropdown && !dropdownButton) {
        dropdown.style.display = 'none';
    }
});
