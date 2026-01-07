<?php
session_start();
// 1. Connect to Database
require __DIR__ . '/db_connection.php';

// 2. Check if user is logged in
// (If you haven't built login yet, you can comment this out for testing)
if (!isset($_SESSION['user_id'])) {
    // For now, let's just set a dummy user ID if none exists, so you can test
    $_SESSION['user_id'] = 1; 
    // echo "<script>alert('Please login first!'); window.location.href='login.php';</script>";
    // exit();
}

// 3. Check if form was submitted
if ($_SERVER["REQUEST_METHOD"] == "POST") {

    // --- GET DATA FROM FORM ---
    $student_id = $_SESSION['user_id'];
    
    // The "tutor_data" comes as "ID|SubjectID" (e.g., "2|1")
    // We need to split it apart.
    $raw_tutor_data = $_POST['tutor_data']; 
    $tutor_parts = explode('|', $raw_tutor_data);
    $tutor_id = intval($tutor_parts[0]);
    $subject_id = intval($tutor_parts[1]);

    $learning_goals = $_POST['learning_goals'];
    $start_date_str = $_POST['start_date']; 
    $duration = intval($_POST['duration']);
    $phone = $_POST['phone_number'];
    $platform = $_POST['comm_platform'];
    
    // CAPTURE THE PAYMENT METHOD (card, fpx, or ewallet)
    $payment_method = $_POST['payment_method'];

    // --- CALCULATE DATES & PRICE ---
    
    // 1. Format Dates
    $start_dt = new DateTime($start_date_str);
    $booking_date = $start_dt->format('Y-m-d'); // For database DATE column
    $start_time = $start_dt->format('H:i:s');   // For database TIME column
    
    // 2. Calculate End Time
    $end_dt = clone $start_dt;
    $end_dt->modify("+$duration hours");
    $end_time = $end_dt->format('H:i:s');

    // 3. Get Real Price from Database (Security Measure)
    // We don't trust the price sent from the browser. We check the database again.
    $priceQuery = "SELECT hourly_rate FROM tutors WHERE tutor_id = ?";
    $stmtPrice = $conn->prepare($priceQuery);
    $stmtPrice->bind_param("i", $tutor_id);
    $stmtPrice->execute();
    $resultPrice = $stmtPrice->get_result();
    
    if ($resultPrice->num_rows > 0) {
        $row = $resultPrice->fetch_assoc();
        $hourly_rate = floatval($row['hourly_rate']);
        $total_price = $hourly_rate * $duration;
    } else {
        die("Error: Tutor not found.");
    }

    // --- INSERT INTO DATABASE ---
    $sql = "INSERT INTO bookings 
            (student_id, tutor_id, subject_id, booking_date, start_time, end_time, 
             learning_goals, session_type, comm_platform, phone_number, total_price, payment_method, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, 'Single Session', ?, ?, ?, ?, 'confirmed')";

    $stmt = $conn->prepare($sql);

    if ($stmt) {
        // s = string, i = integer, d = decimal
        $stmt->bind_param("iiisssssdss", 
            $student_id, 
            $tutor_id, 
            $subject_id, 
            $booking_date, 
            $start_time, 
            $end_time, 
            $learning_goals, 
            $platform, 
            $phone, 
            $total_price,
            $payment_method, // This saves 'card', 'fpx', or 'ewallet'
        );

        if ($stmt->execute()) {
            // SUCCESS!
            echo "<h1>Success!</h1>";
            echo "<p>Booking saved. Payment method: <strong>$payment_method</strong></p>";
            echo "<p>Total Price: RM $total_price</p>";
            echo "<a href='index.php'>Go Home</a>";
        } else {
            echo "Database Error: " . $stmt->error;
        }
        $stmt->close();
    } else {
        echo "Prepare Error: " . $conn->error;
    }

    $conn->close();
}
?>