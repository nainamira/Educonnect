<?php
session_start();

// 1. DATABASE CONNECTION
// Ensure these credentials match your XAMPP settings
$conn = new mysqli("localhost", "root", "", "educonnect");

// Check connection immediately
if ($conn->connect_error) { 
    die("❌ Database Connection Failed: " . $conn->connect_error); 
}

// 2. HANDLE ACTIONS (Approve / Reject Tutors)
$msg = "";
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'], $_POST['tutor_id'])) {
    $tutor_id = intval($_POST['tutor_id']);
    $action = $_POST['action'];
    $new_status = ($action === 'approve') ? 'active' : 'rejected';

    $stmt = $conn->prepare("UPDATE tutors SET status = ? WHERE tutor_id = ?");
    if ($stmt) {
        $stmt->bind_param("si", $new_status, $tutor_id);
        if ($stmt->execute()) {
            $msg = "Tutor status updated to " . ucfirst($new_status) . "!";
        } else {
            $msg = "Error updating tutor: " . $stmt->error;
        }
        $stmt->close();
    } else {
        die("❌ SQL Error (Update Tutor): " . $conn->error);
    }
}

// 3. FETCH DATA (With Safety Checks)

// A. Tutors
$tutorResult = $conn->query("SELECT t.tutor_id, u.full_name, s.name AS subject_name, t.created_at, t.status 
                             FROM tutors t 
                             JOIN users u ON t.user_id = u.user_id 
                             JOIN subjects s ON t.subject_id = s.subject_id 
                             ORDER BY t.created_at DESC");
if (!$tutorResult) die("❌ SQL Error (Tutors): " . $conn->error);

// B. Students
$studentResult = $conn->query("SELECT user_id, full_name, email, created_at FROM users WHERE role = 'student' ORDER BY created_at DESC");
if (!$studentResult) die("❌ SQL Error (Students): " . $conn->error);

// C. Financials
$financeResult = $conn->query("SELECT b.booking_id, b.booking_date, u.full_name as student_name, 
                                      t_user.full_name as tutor_name, s.name as subject, 
                                      b.total_price, b.payment_method, b.status 
                               FROM bookings b 
                               JOIN users u ON b.student_id = u.user_id 
                               JOIN tutors t ON b.tutor_id = t.tutor_id 
                               JOIN users t_user ON t.user_id = t_user.user_id 
                               JOIN subjects s ON b.subject_id = s.subject_id 
                               ORDER BY b.booking_date DESC");
if (!$financeResult) die("❌ SQL Error (Financials): " . $conn->error . "<br>Check if 'bookings' table exists and has 'total_price' column.");

// D. Statistics (Revenue)
$revQuery = "SELECT SUM(total_price) as total FROM bookings WHERE status = 'confirmed'";
$revResult = $conn->query($revQuery);
if (!$revResult) die("❌ SQL Error (Revenue): " . $conn->error);
$totalRevenue = ($revResult->num_rows > 0) ? ($revResult->fetch_assoc()['total'] ?? 0) : 0;

// E. Other Stats
$totalBookings = $financeResult->num_rows;

$activeTutorsQuery = "SELECT COUNT(*) as count FROM tutors WHERE status='active'";
$activeResult = $conn->query($activeTutorsQuery);
if (!$activeResult) die("❌ SQL Error (Active Tutors): " . $conn->error);
$activeTutors = $activeResult->fetch_assoc()['count'];

// F. Chart Data
$chartSql = "SELECT DATE_FORMAT(booking_date, '%a') as day, SUM(total_price) as total 
             FROM bookings 
             WHERE status = 'confirmed' 
             GROUP BY booking_date 
             ORDER BY booking_date ASC 
             LIMIT 7";
$chartResult = $conn->query($chartSql);
if (!$chartResult) die("❌ SQL Error (Chart): " . $conn->error);

$days = [];
$totals = [];
if ($chartResult->num_rows > 0) {
    while($row = $chartResult->fetch_assoc()) {
        $days[] = $row['day'];
        $totals[] = (float)$row['total'];
    }
} else {
    // Default data if no bookings
    $days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    $totals = [0, 0, 0, 0, 0, 0, 0];
}

$jsonDays = json_encode($days);
$jsonTotals = json_encode($totals);
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EduConnect Admin | Dashboard</title>
    <link rel="stylesheet" href="admin_style.css">
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/animejs/3.2.1/anime.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        .alert { padding: 15px; margin-bottom: 20px; border-radius: 8px; font-weight: 600; transition: opacity 0.5s ease; }
        .alert-success { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
        .alert-error { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }
        .sidebar-nav li { cursor: pointer; }
        
        /* MODAL STYLES */
        .modal-overlay { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; align-items: center; justify-content: center; }
        .modal-box { background: white; padding: 30px; border-radius: 20px; width: 400px; max-width: 90%; position: relative; box-shadow: 0 20px 50px rgba(0,0,0,0.2); transform: translateY(20px); opacity: 0; transition: 0.3s; }
        .modal-box.active { transform: translateY(0); opacity: 1; }
        .modal-header { font-size: 1.2rem; font-weight: 800; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px; }
        .modal-row { margin-bottom: 10px; font-size: 0.95rem; }
        .modal-row strong { color: #64748b; width: 80px; display: inline-block; }
        .close-btn { position: absolute; top: 20px; right: 20px; cursor: pointer; background: none; border: none; font-size: 1.5rem; color: #94a3b8; }
        .close-btn:hover { color: #ef4444; }
    </style>
</head>
<body class="admin-body">

    <aside class="sidebar" id="adminSidebar">
        <div class="sidebar-logo"> 
            <div class="logo-wrapper"><img src="logo.png" alt="EduConnect Logo" class="admin-brand-logo"></div>
            <button onclick="toggleSidebar()" class="menu-toggle"><i class="fas fa-columns"></i></button>
        </div>
        <div class="admin-status-container"><small class="admin-status">Administrator</small></div>
        <nav class="sidebar-nav">
            <ul>
                <li id="nav-dashboard" class="active" onclick="showSection('dashboard')"><a href="javascript:void(0)"><i class="fas fa-th-large"></i> <span class="nav-text">Dashboard</span></a></li>
                <li id="nav-tutors" onclick="showSection('tutors')"><a href="javascript:void(0)"><i class="fas fa-user-tie"></i> <span class="nav-text">Tutor Requests</span></a></li>
                <li id="nav-members" onclick="showSection('members')"><a href="javascript:void(0)"><i class="fas fa-user-graduate"></i> <span class="nav-text">Students</span></a></li>
                <li id="nav-reports" onclick="showSection('reports')"><a href="javascript:void(0)"><i class="fas fa-file-invoice-dollar"></i> <span class="nav-text">Financials</span></a></li>
            </ul>
        </nav>
        <div class="sidebar-footer"><a href="../index.php" class="logout-link" style="color: white; padding: 20px; display: block;"><i class="fas fa-sign-out-alt"></i> <span class="nav-text">Back to Website</span></a></div>
    </aside>

    <div class="main-wrapper" id="mainWrapper">
        <header class="top-nav"><div class="nav-left"><h1 id="pageTitle">Dashboard</h1></div></header>

        <main class="content-container">
            <?php if($msg): ?><div class="alert alert-success" id="statusAlert"><?= $msg ?></div><?php endif; ?>

            <div id="section-dashboard" class="admin-section">
                <div class="section-header">
                    <div class="header-text"><h2>Performance Summary</h2><p>Real-time overview of operations.</p></div>
                </div>
                <div class="bento-grid">
                    <div class="bento-item stat-card blue">
                        <div class="card-icon"><i class="fas fa-wallet"></i></div><h3>Total Revenue</h3><p class="stat-value">RM <?= number_format($totalRevenue, 2) ?></p>
                    </div>
                    <div class="bento-item stat-card purple">
                        <div class="card-icon"><i class="fas fa-calendar-check"></i></div><h3>Total Bookings</h3><p class="stat-value"><?= $totalBookings ?></p>
                    </div>
                    <div class="bento-item stat-card green">
                        <div class="card-icon"><i class="fas fa-users"></i></div><h3>Active Tutors</h3><p class="stat-value"><?= $activeTutors ?></p>
                    </div>
                    <div class="bento-item chart-area">
                        <div class="card-header"><h3>Revenue Trend</h3></div><div class="canvas-wrapper" style="height: 300px;"><canvas id="transactionChart"></canvas></div>
                    </div>
                </div>
            </div>

            <div id="section-tutors" class="admin-section" style="display:none;">
                <div class="section-header"><h2>Tutor Applications</h2></div>
                <div class="bento-item table-area">
                    <div class="responsive-table">
                        <table class="premium-table">
                            <thead><tr><th>Name</th><th>Subject</th><th>Date</th><th>Status</th><th>Action</th></tr></thead>
                            <tbody>
                                <?php $tutorResult->data_seek(0); while($row = $tutorResult->fetch_assoc()): 
                                    $statusClass = ($row['status'] == 'active') ? 'success' : (($row['status'] == 'rejected') ? 'danger' : 'pending'); ?>
                                <tr>
                                    <td><strong><?= htmlspecialchars($row['full_name']) ?></strong></td>
                                    <td><?= htmlspecialchars($row['subject_name']) ?></td>
                                    <td><?= date("d M Y", strtotime($row['created_at'])) ?></td>
                                    <td><span class="badge <?= $statusClass ?>"><?= ucfirst($row['status']) ?></span></td>
                                    <td>
                                        <form method="POST" style="display:flex; gap:5px;">
                                            <input type="hidden" name="tutor_id" value="<?= $row['tutor_id'] ?>">
                                            <button type="submit" name="action" value="approve" class="export-btn csv" style="background:#22c55e; border:none;" <?= $row['status'] == 'active' ? 'disabled style="opacity:0.5"' : '' ?>>Accept</button>
                                            <button type="submit" name="action" value="reject" class="export-btn pdf" style="background:#ef4444; color:white; border:none;" <?= $row['status'] == 'rejected' ? 'disabled style="opacity:0.5"' : '' ?>>Reject</button>
                                        </form>
                                    </td>
                                </tr>
                                <?php endwhile; ?>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div id="section-members" class="admin-section" style="display:none;">
                <div class="section-header"><h2>Student Directory</h2></div>
                <div class="bento-item table-area">
                    <div class="responsive-table">
                        <table class="premium-table">
                            <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Joined</th><th>Action</th></tr></thead>
                            <tbody>
                                <?php $studentResult->data_seek(0); while($std = $studentResult->fetch_assoc()): ?>
                                <tr>
                                    <td>#STU-<?= $std['user_id'] ?></td>
                                    <td><strong><?= htmlspecialchars($std['full_name']) ?></strong></td>
                                    <td><?= htmlspecialchars($std['email']) ?></td>
                                    <td><?= date("d M Y", strtotime($std['created_at'])) ?></td>
                                    <td>
                                        <button class="export-btn csv" style="padding: 5px 10px; font-size:12px; cursor: pointer;" 
                                                onclick="openStudentModal('<?= htmlspecialchars($std['full_name']) ?>', '<?= htmlspecialchars($std['email']) ?>', '<?= date('d M Y', strtotime($std['created_at'])) ?>')">
                                            View
                                        </button>
                                    </td>
                                </tr>
                                <?php endwhile; ?>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div id="section-reports" class="admin-section" style="display:none;">
                <div class="section-header"><h2>Financial Transactions</h2></div>
                <div class="bento-item table-area">
                    <div class="responsive-table">
                        <table class="premium-table">
                            <thead><tr><th>ID</th><th>Date</th><th>Details</th><th>Method</th><th>Amount</th><th>Status</th></tr></thead>
                            <tbody>
                                <?php 
                                $financeResult->data_seek(0); 
                                if ($financeResult->num_rows > 0):
                                    while($row = $financeResult->fetch_assoc()): 
                                ?>
                                <tr>
                                    <td>#<?= $row['booking_id'] ?></td>
                                    <td><?= date("d M", strtotime($row['booking_date'])) ?></td>
                                    <td><?= htmlspecialchars($row['subject']) ?></td>
                                    <td style="text-transform:uppercase"><?= htmlspecialchars($row['payment_method']) ?></td>
                                    <td><strong>RM <?= number_format($row['total_price'], 2) ?></strong></td>
                                    <td><span class="badge success">Paid</span></td>
                                </tr>
                                <?php endwhile; else: ?>
                                    <tr>
                                        <td colspan="6" style="text-align:center; padding: 40px; color: #64748b;">
                                            <i class="fas fa-folder-open" style="font-size: 2rem; display: block; margin-bottom: 10px; opacity: 0.3;"></i>
                                            <strong>No financial data is recorded</strong>
                                        </td>
                                    </tr>
                                <?php endif; ?>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </main>
    </div>

    <div id="studentModal" class="modal-overlay">
        <div class="modal-box">
            <button class="close-btn" onclick="closeStudentModal()">&times;</button>
            <div class="modal-header">Student Profile</div>
            <div class="modal-content">
                <div class="modal-row"><strong>Name:</strong> <span id="m_name"></span></div>
                <div class="modal-row"><strong>Email:</strong> <span id="m_email"></span></div>
                <div class="modal-row"><strong>Joined:</strong> <span id="m_joined"></span></div>
                <div class="modal-row"><strong>Status:</strong> <span class="badge success">Active</span></div>
            </div>
        </div>
    </div>

    <script>
        function showSection(id) {
            document.querySelectorAll('.admin-section').forEach(sec => sec.style.display = 'none');
            const target = document.getElementById('section-' + id);
            if (target) {
                target.style.display = 'block';
                document.querySelectorAll('.sidebar-nav li').forEach(li => li.classList.remove('active'));
                document.getElementById('nav-' + id).classList.add('active');
                if (typeof anime !== 'undefined') anime({ targets: target, translateY: [15, 0], opacity: [0, 1], duration: 400, easing: 'easeOutQuad' });
            }
        }
        function openStudentModal(name, email, joined) {
            document.getElementById('m_name').innerText = name;
            document.getElementById('m_email').innerText = email;
            document.getElementById('m_joined').innerText = joined;
            const modal = document.getElementById('studentModal');
            const box = modal.querySelector('.modal-box');
            modal.style.display = 'flex';
            setTimeout(() => box.classList.add('active'), 10);
        }
        function closeStudentModal() {
            const modal = document.getElementById('studentModal');
            const box = modal.querySelector('.modal-box');
            box.classList.remove('active');
            setTimeout(() => modal.style.display = 'none', 300);
        }
        function toggleSidebar() { document.getElementById('adminSidebar').classList.toggle('collapsed'); }
        document.addEventListener('DOMContentLoaded', () => {
            const ctx = document.getElementById('transactionChart');
            if (ctx && typeof Chart !== 'undefined') {
                new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: <?php echo $jsonDays; ?>,
                        datasets: [{ label: 'Revenue (RM)', data: <?php echo $jsonTotals; ?>, borderColor: '#4f46e5', backgroundColor: 'rgba(79, 70, 229, 0.1)', fill: true }]
                    },
                    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
                });
            }
            if (typeof anime !== 'undefined') anime({ targets: '.bento-item', translateY: [20, 0], opacity: [0, 1], delay: anime.stagger(80), easing: 'easeOutQuad', duration: 600 });
            const alertBox = document.getElementById('statusAlert');
            if(alertBox) setTimeout(() => { alertBox.style.opacity = '0'; setTimeout(() => alertBox.style.display = 'none', 500); }, 3000);
        });
    </script>
</body>
</html>