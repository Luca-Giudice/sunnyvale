document.getElementById("authForm").addEventListener("submit", async function (event) {
    event.preventDefault(); // Impedisce il comportamento predefinito del modulo (il submit)

    const attemptCode = document.getElementById("attemptCode").value;
    const authorName = document.getElementById("authorName").value;

    // Crea il corpo della richiesta
    const requestBody = JSON.stringify({
        code: attemptCode,
        author: authorName
    });

    // Calcola l'hash SHA-256 del corpo della richiesta
    const digest = await calculateDigest(requestBody);

    // Ottieni la firma RSA
    const signature = await generateSignature(digest);

    // Prepara l'header di autorizzazione
    const authorizationHeader = `Signature keyId="client1",algorithm="rsa-sha256",signature="${signature}",headers="digest"`;

    // Aggiungi gli headers e invia la richiesta a PHP per inviarla all'API
    const formData = new FormData();
    formData.append('requestBody', requestBody);
    formData.append('digest', digest);
    formData.append('authorization', authorizationHeader);

    const response = await fetch('client.php', {
        method: 'POST',
        body: formData
    });

    const data = await response.json();
    document.getElementById("response").innerHTML = `Server Response: ${JSON.stringify(data)}`;
});

async function calculateDigest(requestBody) {
    const encoder = new TextEncoder();
    const data = encoder.encode(requestBody);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashBase64 = btoa(String.fromCharCode(...hashArray));
    return `SHA-256=${hashBase64}`;
}

async function generateSignature(digest) {
    const privateKey = await importPrivateKey();
    const encoder = new TextEncoder();
    const data = encoder.encode(digest);
    
    const signatureBuffer = await crypto.subtle.sign(
        { name: "RSASSA-PKCS1-v1_5" },
        privateKey,
        data
    );
    
    const signatureArray = new Uint8Array(signatureBuffer);
    const signatureBase64 = btoa(String.fromCharCode(...signatureArray));
    return signatureBase64;
}

async function importPrivateKey() {
    const response = await fetch('client_private_key.pem');
    const privateKeyPem = await response.text();
    const privateKey = await window.crypto.subtle.importKey(
        "pkcs8",
        str2ab(privateKeyPem),
        { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
        false,
        ["sign"]
    );
    return privateKey;
}

function str2ab(str) {
    const buffer = new ArrayBuffer(str.length);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < str.length; i++) {
        view[i] = str.charCodeAt(i);
    }
    return buffer;
}
