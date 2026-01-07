<?php
session_start();
// 1. DATABASE CONNECTION
require __DIR__ . '/db_connection.php';

// 2. FETCH TUTORS
$tutorQuery = "SELECT t.tutor_id, u.full_name, t.bio, t.rating, 
                      s.name AS subject_name, s.subject_id, t.hourly_rate
               FROM tutors t
               JOIN users u ON t.user_id = u.user_id
               JOIN subjects s ON t.subject_id = s.subject_id
               WHERE t.status = 'active'";

$tutorResult = $conn->query($tutorQuery);
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EduConnect - Book Your Tutor</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/animejs/3.2.1/anime.min.js"></script>
    
    <style>
        /* RESET & BASICS */
        :root { --primary: #000; --secondary: #1e293b; --bg: #fff; --card-radius: 20px; }
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Segoe UI', sans-serif; }
        body { background: var(--bg); color: var(--secondary); padding-bottom: 50px; }
        a { text-decoration: none; color: inherit; }

        /* NAVIGATION */
        .header-wrapper { background: #fff; border-bottom: 1px solid #f0f0f0; position: sticky; top: 0; z-index: 100; }
        .navbar { max-width: 1200px; margin: 0 auto; padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; }
        #mainLogo { height: 35px; width: auto; }
        .site-title { font-size: 1.2rem; font-weight: 700; color: #333; }
        .login-btn { padding: 8px 20px; background: #000; color: #fff; border-radius: 50px; font-weight: 600; font-size: 0.9rem; }

        /* PROGRESS BAR */
        .modern-progress-bar { display: flex; justify-content: center; margin: 20px auto; background: #f8f9fa; border-radius: 50px; padding: 5px; width: fit-content; }
        .progress-tab { padding: 10px 25px; border-radius: 40px; color: #888; font-weight: 600; font-size: 0.9rem; cursor: pointer; transition: 0.3s; }
        .progress-tab.active { background: #fff; color: #000; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
        .tab-number { margin-right: 8px; font-weight: 800; }

        /* CONTAINER */
        .container { max-width: 800px; margin: 0 auto; padding: 0 20px; }
        .booking-card { background: #fff; border-radius: 20px; padding: 40px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); margin-bottom: 20px; border: 1px solid #eee; }
        
        /* SECTION HEADERS */
        .section-header { margin-bottom: 25px; border-bottom: 2px solid #f4f7f6; padding-bottom: 15px; }
        .badge { background: #6366f1; color: white; padding: 5px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; margin-bottom: 8px; display: inline-block; }
        h2 { font-size: 1.5rem; color: #2c3e50; }

        /* TUTOR CARD STYLING */
        .tutor-mini-card { 
            display: flex; align-items: center; justify-content: space-between; 
            padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px; 
            margin-bottom: 15px; transition: all 0.2s ease; cursor: pointer;
        }
        .tutor-mini-card:hover { border-color: #6366f1; background: #f8faff; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(99, 102, 241, 0.1); }
        .tutor-mini-card.selected-card { border-color: #6366f1; background: #eef2ff; border-width: 2px; }

        .tutor-left { display: flex; align-items: center; gap: 15px; }
        .tutor-avatar { width: 60px; height: 60px; background: #f1f5f9; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; }
        .tutor-details h3 { font-size: 1.1rem; font-weight: 800; color: #1e293b; margin-bottom: 4px; }
        .tutor-meta { font-size: 0.9rem; color: #64748b; display: flex; align-items: center; gap: 10px; }
        .subject-badge { background: #e0e7ff; color: #4338ca; padding: 2px 10px; border-radius: 6px; font-size: 0.8rem; font-weight: 700; }
        
        /* Custom Radio Button */
        .custom-radio { width: 24px; height: 24px; border: 2px solid #cbd5e1; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: 0.2s; }
        .custom-radio::after { content: ''; width: 12px; height: 12px; background: #6366f1; border-radius: 50%; display: none; }
        input[type="radio"]:checked + .custom-radio { border-color: #6366f1; }
        input[type="radio"]:checked + .custom-radio::after { display: block; }
        input[type="radio"] { display: none; } /* Hide default */

        /* FORM INPUTS */
        .booking-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .full-width { grid-column: span 2; }
        .form-group label { display: block; font-weight: 600; margin-bottom: 8px; font-size: 0.9rem; }
        .form-group input, .form-group select { width: 100%; padding: 12px; border: 2px solid #f1f5f9; border-radius: 12px; font-size: 1rem; transition: 0.3s; }
        .form-group input:focus, .form-group select:focus { border-color: #6366f1; outline: none; }
        .input-error { border-color: #ef4444 !important; background: #fff5f5; }

        /* PAYMENT METHODS CSS */
        .payment-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 25px; }
        .payment-option { cursor: pointer; }
        .payment-card-content { 
            border: 2px solid #f1f5f9; border-radius: 12px; padding: 20px 10px; 
            display: flex; flex-direction: column; align-items: center; justify-content: center; 
            gap: 10px; transition: 0.2s; height: 100%; text-align: center;
        }
        .payment-card-content .icon { font-size: 1.8rem; }
        .payment-card-content span { font-weight: 600; font-size: 0.9rem; color: #64748b; }
        
        /* Selected Payment State */
        .payment-option input:checked + .payment-card-content { 
            border-color: #10b981; background: #ecfdf5; color: #047857; 
        }
        .payment-option input:checked + .payment-card-content span { color: #047857; }
        .payment-option:hover .payment-card-content { border-color: #10b981; }
        
        @media (max-width: 600px) {
            .payment-grid { grid-template-columns: 1fr; }
        }

        /* BUTTONS */
        .price-footer { margin-top: 30px; padding-top: 20px; border-top: 1px dashed #ddd; display: flex; justify-content: space-between; align-items: center; }
        .total-price-text { font-size: 1.2rem; font-weight: 800; color: #10b981; }
        .button-group { margin-top: 20px; display: flex; gap: 10px; }
        .pay-btn { width: 100%; padding: 16px; background: #0f172a; color: #fff; border: none; border-radius: 12px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: 0.3s; display: flex; justify-content: center; align-items: center; gap: 8px; }
        .pay-btn:hover { background: #334155; transform: translateY(-2px); }
        .save-btn { padding: 15px 30px; background: #f1f5f9; color: #333; border: none; border-radius: 12px; font-weight: 600; cursor: pointer; }
        
        /* HIDE SECTIONS INITIALLY */
        #details-step, #transaction-step { display: none; }
    </style>
</head>
<body>

    <div class="header-wrapper">
        <nav class="navbar">
            <div class="nav-left">
                <a href="index.php"><img src="logo.png" alt="EduConnect" id="mainLogo"></a>
            </div>
            <div class="nav-center"><h1 class="site-title">Tutor Bookings</h1></div>
            <div class="nav-right">
                <a href="login.php" class="login-btn">Login / Register</a>
            </div>
        </nav>

        <div class="modern-progress-bar">
            <div class="progress-tab active" id="tab1"><span class="tab-number">1</span>Select Tutor</div>
            <div class="progress-tab" id="tab2" onclick="switchTab(2)"><span class="tab-number">2</span>Details</div>
            <div class="progress-tab" id="tab3"><span class="tab-number">3</span>Payment</div>
        </div>
    </div>

    <main class="container">
        <form method="POST" action="submit_booking.php" id="bookingForm">
            
            <div id="tutor-step" class="booking-card">
                <div class="section-header">
                    <span class="badge">Step 01</span>
                    <h2>Choose Your Instructor</h2>
                </div>

                <div class="tutor-list">
                    <?php 
                    if ($tutorResult && $tutorResult->num_rows > 0):
                        while($tutor = $tutorResult->fetch_assoc()): 
                            $price = $tutor['hourly_rate'];
                            $cardId = "card_" . $tutor['tutor_id'];
                    ?>
                    <div class="tutor-mini-card" onclick="selectTutor('<?= $cardId ?>')">
                        <div class="tutor-left">
                            <div class="tutor-avatar">👨‍🏫</div>
                            <div class="tutor-details">
                                <h3><?= htmlspecialchars($tutor['full_name']) ?></h3>
                                <div class="tutor-meta">
                                    <span class="subject-badge"><?= htmlspecialchars($tutor['subject_name']) ?></span>
                                    <span>⭐ <?= number_format($tutor['rating'], 1) ?></span>
                                    <span>• RM <?= number_format($price, 0) ?>/hr</span>
                                </div>
                            </div>
                        </div>
                        <label>
                            <input type="radio" 
                                   id="<?= $cardId ?>_radio"
                                   name="tutor_data" 
                                   value="<?= $tutor['tutor_id'] ?>|<?= $tutor['subject_id'] ?>" 
                                   data-price="<?= $price ?>"
                                   required>
                            <div class="custom-radio"></div>
                        </label>
                    </div>
                    <?php endwhile; else: ?>
                        <p style="text-align:center; padding: 20px; color: #64748b;">No active tutors available right now.</p>
                    <?php endif; ?>
                </div>

                <div class="button-group" style="margin-top: 30px;">
                    <button type="button" class="pay-btn" onclick="goToDetails()">
                        Next Step <span style="font-size: 1.2rem;">→</span>
                    </button>
                </div>
            </div> 

            <div id="details-step" class="booking-card">
                <div class="section-header">
                    <span class="badge" style="background: #f59e0b;">Step 02</span>
                    <h2>Session Details</h2>
                </div>

                <div class="booking-form-grid">
                    <div class="form-group full-width">
                        <label>Learning Goal</label>
                        <input type="text" name="learning_goals" id="learningGoals" placeholder="e.g. Prepare for Final Exam">
                    </div>

                    <div class="form-group">
                        <label>Start Date</label>
                        <input type="datetime-local" name="start_date" id="startDate" required>
                    </div>

                    <div class="form-group">
                        <label>Duration</label>
                        <select name="duration" id="hoursInput" onchange="updateTotal()">
                            <option value="1">1 Hour</option>
                            <option value="2">2 Hours</option>
                            <option value="3">3 Hours</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Your Phone</label>
                        <input type="tel" name="phone_number" id="phoneNumber" placeholder="+60..." required>
                    </div>

                    <div class="form-group">
                        <label>Platform</label>
                        <select name="comm_platform" id="commMethod" required>
                            <option value="Zoom">Zoom</option>
                            <option value="Google Meet">Google Meet</option>
                        </select>
                    </div>
                </div>

                <div class="price-footer">
                    <span>Estimated Total:</span>
                    <span class="total-price-text">RM <span id="totalDisplay">0.00</span></span>
                </div>

                <div class="button-group">
                    <button type="button" class="save-btn" onclick="switchTab(1)">Back</button>
                    <button type="button" class="pay-btn" onclick="showPaymentStep()">Proceed to Payment →</button>
                </div>
            </div> 

            <div id="transaction-step" class="booking-card">
                <div class="section-header">
                    <span class="badge" style="background: #10b981;">Step 03</span>
                    <h2>Confirm & Pay</h2>
                </div>
                
                <div style="background: #f0fdf4; padding: 30px; border-radius: 16px; text-align: center; margin-bottom: 25px; border: 1px dashed #16a34a;">
                    <p style="color: #166534; margin-bottom: 5px; font-weight: 600;">Total Amount to Pay</p>
                    <h1 style="color: #15803d; font-size: 3rem; margin: 0;">RM <span id="paymentTotal">0.00</span></h1>
                </div>

                <div class="form-group">
                    <label style="margin-bottom: 15px;">Select Payment Method</label>
                    <div class="payment-grid">
                        <label class="payment-option">
                            <input type="radio" name="payment_method" value="card" required>
                            <div class="payment-card-content">
                                <span class="icon">💳</span>
                                <span>Credit / Debit Card</span>
                            </div>
                        </label>
                        <label class="payment-option">
                            <input type="radio" name="payment_method" value="fpx">
                            <div class="payment-card-content">
                                <span class="icon">🏦</span>
                                <span>Online Banking</span>
                            </div>
                        </label>
                        <label class="payment-option">
                            <input type="radio" name="payment_method" value="ewallet">
                            <div class="payment-card-content">
                                <span class="icon">📱</span>
                                <span>E-Wallet</span>
                            </div>
                        </label>
                    </div>
                </div>

                <div class="button-group">
                    <button type="button" class="save-btn" onclick="switchTab(2)">Back</button>
                    <button type="submit" class="pay-btn" style="background: #15803d;">Confirm Booking</button>
                </div>
            </div> 
        </form>
    </main>

    <script>
        let currentPrice = 0;
        
        function selectTutor(cardId) {
            document.querySelectorAll('.tutor-mini-card').forEach(card => card.classList.remove('selected-card'));
            const clickedCard = document.querySelector(`div[onclick="selectTutor('${cardId}')"]`);
            if(clickedCard) clickedCard.classList.add('selected-card');
            const radio = document.getElementById(cardId + '_radio');
            if(radio) { radio.checked = true; updateTotal(); }
        }

        function goToDetails() {
             const selected = document.querySelector('input[name="tutor_data"]:checked');
             if (!selected) { alert("Please select a tutor first."); return; }
             updateTotal(); switchTab(2);
        }

        function updateTotal() {
            const selected = document.querySelector('input[name="tutor_data"]:checked');
            if (selected) currentPrice = parseFloat(selected.dataset.price);
            const hours = parseInt(document.getElementById('hoursInput').value);
            const total = (currentPrice * hours).toFixed(2);
            document.getElementById('totalDisplay').innerText = total;
            document.getElementById('paymentTotal').innerText = total;
        }

        function showPaymentStep() {
            const date = document.getElementById('startDate').value;
            const phone = document.getElementById('phoneNumber').value;
            if (!date || !phone) { alert("Please fill in the Date and Phone Number."); return; }
            switchTab(3);
        }

        function switchTab(step) {
            document.getElementById('tutor-step').style.display = 'none';
            document.getElementById('details-step').style.display = 'none';
            document.getElementById('transaction-step').style.display = 'none';
            if(step === 1) document.getElementById('tutor-step').style.display = 'block';
            if(step === 2) document.getElementById('details-step').style.display = 'block';
            if(step === 3) document.getElementById('transaction-step').style.display = 'block';
            document.querySelectorAll('.progress-tab').forEach(t => t.classList.remove('active'));
            document.getElementById('tab' + step).classList.add('active');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    </script>
</body>
</html>