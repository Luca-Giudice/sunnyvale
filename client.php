<?php
// Leggi i dati inviati dal modulo
$requestBody = $_POST['requestBody'];
$digest = $_POST['digest'];
$authorization = $_POST['authorization'];

// Carica la chiave pubblica del server (per convalidare la firma della risposta)
$serverPublicKey = file_get_contents('server_public_key.pem');

// Endpoint API
$apiUrl = 'https://secure-service-1-0.onrender.com';

// Crea le intestazioni necessarie
$headers = [
    "Content-Type: application/json",
    "Digest: $digest",
    "Authorization: $authorization"
];

// Invia la richiesta HTTP POST al server API
$options = [
    "http" => [
        "method" => "POST",
        "header" => implode("\r\n", $headers),
        "content" => $requestBody
    ]
];
$context = stream_context_create($options);
$response = file_get_contents($apiUrl, false, $context);

// Controlla la risposta del server
if ($response === FALSE) {
    die('Error occurred while making the request');
}

// Risposta del server
echo json_encode([
    'response' => json_decode($response)
]);
?>
