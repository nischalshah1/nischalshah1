<?php
// ============================================================
//  contact_handler.php  — Receives form data & saves to MySQL
// ============================================================

// ---------- CONFIGURATION — Edit these values ----------
define('DB_HOST',     'localhost');
define('DB_NAME',     'database_setup');   // Your database name
define('DB_USER',     'root');           // Your DB username
define('DB_PASS',     '');               // Your DB password
define('DB_CHARSET',  'utf8mb4');
// -------------------------------------------------------

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
    exit;
}

// Set JSON response header
header('Content-Type: application/json');

// Read and decode JSON body
$raw  = file_get_contents('php://input');
$data = json_decode($raw, true);

// Validate required fields
$name    = isset($data['name'])    ? trim($data['name'])    : '';
$email   = isset($data['email'])   ? trim($data['email'])   : '';
$subject = isset($data['subject']) ? trim($data['subject']) : '';
$message = isset($data['message']) ? trim($data['message']) : '';

if (empty($name) || empty($email) || empty($message)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Name, email, and message are required.']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Please provide a valid email address.']);
    exit;
}

// Sanitize inputs
$name    = htmlspecialchars($name,    ENT_QUOTES, 'UTF-8');
$email   = htmlspecialchars($email,   ENT_QUOTES, 'UTF-8');
$subject = htmlspecialchars($subject, ENT_QUOTES, 'UTF-8');
$message = htmlspecialchars($message, ENT_QUOTES, 'UTF-8');

// Connect to database
try {
    $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
    $pdo = new PDO($dsn, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database connection failed.']);
    exit;
}

// Insert message into database
try {
    $stmt = $pdo->prepare("
        INSERT INTO contact_messages (name, email, subject, message, submitted_at)
        VALUES (:name, :email, :subject, :message, NOW())
    ");

    $stmt->execute([
        ':name'    => $name,
        ':email'   => $email,
        ':subject' => $subject,
        ':message' => $message,
    ]);

    echo json_encode([
        'success' => true,
        'message' => 'Your message has been received!'
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to save your message. Please try again.']);
}
?>
