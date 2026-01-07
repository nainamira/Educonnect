<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EduConnect Admin | Dashboard</title>
    <link rel="stylesheet" href="style.css">
    <link rel="stylesheet" href="admin.css">
</head>
<body class="admin-body">

    <div class="admin-container">
        <aside class="admin-sidebar">
            <div class="sidebar-brand">
                <img src="logo.png" alt="EduConnect">
                <span>Admin Panel</span>
            </div>
            
            <nav class="sidebar-menu">
                <a href="admin.php" class="menu-item active">📊 Dashboard Overview</a>
                <a href="#" class="menu-item">📅 Manage Bookings</a>
                <a href="#" class="menu-item">👨‍🏫 Tutor Management</a>
                <a href="#" class="menu-item">👥 Student List</a>
                <a href="#" class="menu-item">🎟️ Promo Codes</a>
                <hr>
                <a href="index.html" class="menu-item logout">🚪 Logout</a>
            </nav>
        </aside>

        <main class="admin-main">
            <header class="admin-header">
                <div class="header-search">
                    <input type="text" placeholder="Search bookings...">
                </div>
                <div class="admin-user">
                    <span>Active Sessions: <strong>12</strong></span>
                    <div class="admin-avatar">A</div>
                </div>
            </header>

            <div class="admin-stats-grid">
                <div class="stat-card bento-inner">
                    <span class="stat-label">Total Revenue</span>
                    <h2 class="stat-value">RM 1,450.00</h2>
                    <span class="stat-change positive">+12% this month</span>
                </div>
                <div class="stat-card bento-inner">
                    <span class="stat-label">New Bookings</span>
                    <h2 class="stat-value">24</h2>
                    <span class="stat-change">Today</span>
                </div>
                <div class="stat-card bento-inner">
                    <span class="stat-label">Active Tutors</span>
                    <h2 class="stat-value">8</h2>
                    <span class="stat-change">Available</span>
                </div>
            </div>

            <section class="table-section bento-inner">
                <div class="section-flex">
                    <h3>Recent Transactions</h3>
                    <button class="export-btn">Download CSV</button>
                </div>
                
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Student Name</th>
                            <th>Tutor</th>
                            <th>Type</th>
                            <th>Duration</th>
                            <th>Amount</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody id="adminBookingTable">
                        <tr>
                            <td>#1001</td>
                            <td><strong>Ahmad Albab</strong></td>
                            <td>Dr. Adirja Mikaeel</td>
                            <td>Single</td>
                            <td>1 Hour</td>
                            <td>RM 60.00</td>
                            <td><span class="status-pill success">Paid</span></td>
                        </tr>
                    </tbody>
                </table>
            </section>
        </main>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const tableBody = document.getElementById('adminBookingTable');
            const savedBookings = JSON.parse(localStorage.getItem('allBookings')) || [];

            savedBookings.forEach((booking, index) => {
                const row = `
                    <tr>
                        <td>#${2024 + index}</td>
                        <td><strong>${booking.name}</strong></td>
                        <td>Dr. Adirja Mikaeel</td>
                        <td>${booking.session}</td>
                        <td>${booking.duration || '1 Hour'}</td>
                        <td>RM ${booking.amount}</td>
                        <td><span class="status-pill success">${booking.status}</span></td>
                    </tr>
                `;
                tableBody.innerHTML += row;
            });
        });
    </script>
</body>
</html>