/**
 * 1. INITIALIZATION & GLOBAL STATE
 */
document.addEventListener('DOMContentLoaded', () => {
    // Initialize UI Components
    initChart();
    
    // --- DISABLED FAKE DATA GENERATORS ---
    // loadDashboardStats();  <-- Disabled (PHP now handles this)
    // loadFinancials();      <-- Disabled (PHP now handles this)
    // loadTutorRequests();   <-- Disabled (PHP now handles this)
    
    // We keep these for now if you haven't built PHP for them yet:
    loadTableData();   // "Recent Transactions" on the main Dashboard tab
    loadMembers();     // "Student Directory" tab

    // Initial Entrance Animations for Cards
    if (typeof anime !== 'undefined') {
        anime({
            targets: '.bento-item',
            translateY: [20, 0],
            opacity: [0, 1],
            delay: anime.stagger(80),
            easing: 'easeOutQuad',
            duration: 600
        });
    }
});

/**
 * 2. NAVIGATION & UI LOGIC
 */
function showSection(sectionId) {
    // Hide all sections
    const sections = document.querySelectorAll('.admin-section');
    sections.forEach(sec => sec.style.display = 'none');

    // Show the target section
    const targetSection = document.getElementById('section-' + sectionId);
    if (targetSection) {
        targetSection.style.display = 'block';

        // Update Title
        const titles = {
            'dashboard': 'Dashboard Overview',
            'tutors': 'Manage Tutor',
            'members': 'Student Management',
            'reports': 'Financial Reports'
        };
        const pageTitle = document.getElementById('pageTitle');
        if(pageTitle) pageTitle.innerText = titles[sectionId] || 'Admin';

        // Update Sidebar
        document.querySelectorAll('.sidebar-nav li').forEach(li => li.classList.remove('active'));
        const activeNav = document.getElementById('nav-' + sectionId);
        if (activeNav) activeNav.classList.add('active');
        
        // Refresh specific tabs if needed (Disabled fake data calls here too)
        if (sectionId === 'members') loadMembers();
        // if (sectionId === 'reports') loadFinancials(); // <-- Disabled

        // Animation
        if (typeof anime !== 'undefined') {
            anime({
                targets: targetSection,
                translateY: [15, 0],
                opacity: [0, 1],
                duration: 400,
                easing: 'easeOutQuad'
            });
        }
    }
}

function toggleSidebar() {
    const sidebar = document.getElementById('adminSidebar');
    sidebar.classList.toggle('collapsed');
}

/**
 * 3. ANALYTICS (CHART.JS)
 */
function initChart() {
    const ctx = document.getElementById('transactionChart');
    if (!ctx) return;

    if (typeof Chart !== 'undefined') {
        const existingChart = Chart.getChart(ctx);
        if (existingChart) existingChart.destroy();

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Revenue (RM)',
                    data: [0, 100, 300, 200, 500, 400, 800], // You can connect this to PHP later!
                    borderColor: '#4f46e5',
                    backgroundColor: 'rgba(79, 70, 229, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    borderWidth: 3
                }]
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { 
                        beginAtZero: true, 
                        grid: { color: '#f3f4f6' },
                        ticks: { callback: (value) => 'RM ' + value }
                    },
                    x: { grid: { display: false } }
                }
            }
        });
    }
}

/**
 * 4. REMAINING JS TABLES (Student Directory & Recent Txns)
 * These still use fake data because we haven't written PHP for them yet.
 */

// Dashboard "Recent Transactions" Table
function loadTableData() {
    const tableBody = document.querySelector('#section-dashboard tbody');
    if (!tableBody) return;
    
    // We leave this as mock data for the Home tab until you want to fix it
    const bookings = [
        { name: "Demo Student", session: "Physics", amount: 60, date: "2024-05-20" }
    ];

    tableBody.innerHTML = bookings.map(booking => `
        <tr>
            <td>${booking.date}</td>
            <td><strong>${booking.name}</strong></td>
            <td>Sarah Jenkins</td>
            <td>${booking.session}</td>
            <td>RM ${parseFloat(booking.amount).toFixed(2)}</td>
            <td><span class="badge success">Completed</span></td>
        </tr>
    `).join('');
}

// Students Section Table
function loadMembers() {
    const tableBody = document.querySelector('#section-members tbody');
    if (!tableBody) return;

    const uniqueNames = ["Ahmad Zaki", "Lee Wei", "Siti Aminah"];

    tableBody.innerHTML = uniqueNames.map((name, i) => `
        <tr>
            <td>#STU-00${i+1}</td>
            <td><strong>${name}</strong></td>
            <td>${name.toLowerCase().replace(/\s/g, '')}@educonnect.com</td>
            <td>2024-01-15</td>
            <td><span class="badge success">Active</span></td>
            <td><button class="export-btn csv" style="padding: 5px 10px; font-size:12px;">Manage</button></td>
        </tr>
    `).join('');
}

function closeModal() {
    document.getElementById('resumeModal').style.display =