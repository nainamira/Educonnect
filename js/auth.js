// Shared authentication utilities
const API_URL = 'http://127.0.0.1:5000/api';

// Check if user is authenticated
function isAuthenticated() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    return token && user;
}

// Get current user data
function getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

// Get auth token
function getAuthToken() {
    return localStorage.getItem('token');
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

// Redirect if not authenticated
function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Redirect based on role
function redirectByRole(role) {
    switch(role) {
        case 'student':
            window.location.href = 'studentdashboard.html';
            break;
        case 'tutor':
            window.location.href = 'tutordashboard.html';
            break;
        case 'admin':
            window.location.href = 'admindashboard.html';
            break;
        default:
            window.location.href = 'login.html';
    }
}

// Update user display elements
function updateUserDisplay() {
    const user = getCurrentUser();
    if (!user) return;

    // Update user name displays
    const nameElements = document.querySelectorAll('#userNameDisplay, #user-name, .user-name');
    nameElements.forEach(el => {
        el.textContent = user.full_name || 'User';
    });

    // Update user email displays
    const emailElements = document.querySelectorAll('#userEmail, .user-email');
    emailElements.forEach(el => {
        el.textContent = user.email || '';
    });

    // Update role badges
    const roleElements = document.querySelectorAll('.role-badge');
    roleElements.forEach(el => {
        el.textContent = user.role || '';
        el.className = `role-badge ${user.role}`;
    });
}

// API request helper with auth
async function authenticatedFetch(url, options = {}) {
    const token = getAuthToken();
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        }
    };

    const response = await fetch(`${API_URL}${url}`, {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    });

    if (response.status === 401) {
        logout();
        return;
    }

    return response;
}

// Initialize auth on page load
function initAuth() {
    if (!requireAuth()) return;
    
    updateUserDisplay();
    
    // Add logout event listeners
    const logoutButtons = document.querySelectorAll('[onclick="logout()"]');
    logoutButtons.forEach(btn => {
        btn.addEventListener('click', logout);
    });
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        isAuthenticated,
        getCurrentUser,
        getAuthToken,
        logout,
        requireAuth,
        redirectByRole,
        updateUserDisplay,
        authenticatedFetch,
        initAuth
    };
}
