<?php
/**
 * Website Temptations: form mailer (runs on Hostinger).
 *
 * Receives the website request form and the data-request form as JSON from assets/main.js,
 * checks them again on the server, and emails them to the inbox below.
 * Pressing "Reply" in Gmail replies straight to the visitor.
 *
 * Nothing is saved on the server. The only thing kept is a short-lived, hashed rate-limit
 * counter (no readable IP address), deleted automatically after 10 minutes.
 */

// ===== Settings =====
const MAIL_TO   = 'scottyshopstore@gmail.com';            // where requests are delivered
const MAIL_FROM = 'noreply@websitetemptations.com';       // sender address on your own domain
const SITE_NAME = 'Website Temptations';
const MAX_PER_10_MIN = 5;                                 // submissions allowed per visitor per 10 minutes
// ====================

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function reply(int $status, array $body): void {
    http_response_code($status);
    echo json_encode($body);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    reply(405, ['ok' => false, 'error' => 'POST only']);
}

// Only accept submissions sent from this website.
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$host   = $_SERVER['HTTP_HOST'] ?? '';
if ($origin !== '' && parse_url($origin, PHP_URL_HOST) !== $host) {
    reply(403, ['ok' => false, 'error' => 'Wrong origin']);
}

$raw = file_get_contents('php://input', false, null, 0, 20000);
$data = json_decode($raw ?: '', true);
if (!is_array($data)) {
    reply(400, ['ok' => false, 'error' => 'Invalid request']);
}

// Spam trap: real visitors never fill this hidden field. Pretend success so bots learn nothing.
if (!empty($data['website_hp'])) {
    reply(200, ['ok' => true]);
}

// Simple rate limit, keyed by a salted hash of the IP so no readable address is stored.
$ipKey = hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? '') . '|' . __FILE__);
$rlFile = sys_get_temp_dir() . '/wt_rl_' . $ipKey;
$now = time();
$hits = [];
if (is_file($rlFile)) {
    $hits = array_filter(
        array_map('intval', explode(',', (string) file_get_contents($rlFile))),
        fn($t) => $t > $now - 600
    );
}
if (count($hits) >= MAX_PER_10_MIN) {
    reply(429, ['ok' => false, 'error' => 'Too many requests. Please try again in a few minutes.']);
}
$hits[] = $now;
@file_put_contents($rlFile, implode(',', $hits), LOCK_EX);

// ---- helpers ----
function field(array $d, string $key, int $max = 200): string {
    $v = $d[$key] ?? '';
    if (is_array($v)) { $v = implode(', ', $v); }
    $v = trim((string) $v);
    $v = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $v);   // strip control characters
    return mb_substr($v, 0, $max);
}
function oneLine(string $v): string {          // used in email headers: no line breaks allowed
    return trim(preg_replace('/[\r\n]+/', ' ', $v));
}

$form = field($data, 'form', 40);
$name = oneLine(field($data, 'name', 120));
$email = oneLine(field($data, 'email', 200));

$errors = [];
if ($name === '') { $errors[] = 'name'; }
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) { $errors[] = 'email'; }
if (field($data, 'privacy_consent') !== 'yes') { $errors[] = 'privacy_consent'; }

if ($form === 'request-form') {
    $phone = oneLine(field($data, 'phone', 25));
    if (strlen(preg_replace('/\D/', '', $phone)) < 7) { $errors[] = 'phone'; }
    foreach (['site_type', 'package', 'details', 'timeline', 'audience_children'] as $req) {
        if (field($data, $req, 5000) === '') { $errors[] = $req; }
    }
    if (field($data, 'age_confirm') !== 'yes') { $errors[] = 'age_confirm'; }

    $subject = 'New website request from ' . $name;
    $rows = [
        'Name'                 => $name,
        'Email'                => $email,
        'Phone'                => $phone,
        'Business'             => field($data, 'business', 200),
        'Type of website'      => field($data, 'site_type'),
        'Package'              => field($data, 'package'),
        'Launch timing'        => field($data, 'timeline'),
        'Current website'      => field($data, 'current_url', 300),
        'Aimed at children'    => field($data, 'audience_children'),
        'Confirmed 18+'        => field($data, 'age_confirm'),
        'Studio news opt-in'   => field($data, 'marketing_optin') === 'yes' ? 'yes' : 'no',
    ];
    $details = field($data, 'details', 5000);
} elseif ($form === 'privacy-form') {
    if (field($data, 'request_type') === '') { $errors[] = 'request_type'; }

    $subject = 'Privacy/data request from ' . $name . ': ' . field($data, 'request_type', 60);
    $rows = [
        'Name'         => $name,
        'Email'        => $email,
        'Request'      => field($data, 'request_type'),
    ];
    $details = field($data, 'details', 5000);
} else {
    reply(400, ['ok' => false, 'error' => 'Unknown form']);
}

if ($errors) {
    reply(422, ['ok' => false, 'error' => 'Missing or invalid fields', 'fields' => array_values(array_unique($errors))]);
}

// ---- build the email ----
$lines = [];
foreach ($rows as $label => $value) {
    if ($value !== '') { $lines[] = str_pad($label . ':', 20) . $value; }
}
$body  = "A new submission arrived from " . SITE_NAME . ".\n\n";
$body .= implode("\n", $lines) . "\n";
if ($details !== '') {
    $body .= "\nDetails:\n" . $details . "\n";
}
$body .= "\n--\n";
$body .= 'Consent recorded: ' . field($data, '_consent_recorded_at', 40) . ' (policy version ' . field($data, '_policy_version', 20) . ")\n";
$body .= "Reply to this email to answer " . $name . " directly.\n";

$headers = [
    'From: ' . SITE_NAME . ' <' . MAIL_FROM . '>',
    'Reply-To: ' . $name . ' <' . $email . '>',
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    'X-Mailer: Website Temptations form',
];

$encodedSubject = '=?UTF-8?B?' . base64_encode(oneLine($subject)) . '?=';
$sent = mail(MAIL_TO, $encodedSubject, $body, implode("\r\n", $headers), '-f' . MAIL_FROM);

if (!$sent) {
    reply(500, ['ok' => false, 'error' => 'Could not send email']);
}
reply(200, ['ok' => true]);
