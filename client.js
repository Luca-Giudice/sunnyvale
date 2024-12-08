function calculateDigest(body) { 
    const encoder = new TextEncoder();
    const data = encoder.encode(body);
    return crypto.subtle.digest('SHA-256', data).then(hashBuffer => {
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashBase64 = btoa(String.fromCharCode(...hashArray));
        return `SHA-256=${hashBase64}`;
    });
}

// Funzione per calcolare la firma usando la chiave privata
function signData(data, privateKeyPem) {
    const privateKey = crypto.subtle.importKey(
        'pem', privateKeyPem, { name: 'RSA-PSS', hash: 'SHA-256' },
        false, ['sign']
    ).then(key => {
        return crypto.subtle.sign({ name: 'RSA-PSS', saltLength: 32 }, key, new TextEncoder().encode(data));
    }).then(signatureBuffer => {
        const signatureArray = new Uint8Array(signatureBuffer);
        const signatureBase64 = btoa(String.fromCharCode(...signatureArray));
        return signatureBase64;
    });
}

// Funzione per leggere la chiave privata
function readPrivateKeyFromFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(event) {
            resolve(event.target.result);
        };
        reader.onerror = reject;
        reader.readAsText(file);
    });
}

// Funzione per inviare la richiesta al server
function sendRequest() {
    const url = 'https://secure-service-1-0.onrender.com';
    const body = {
        code: document.getElementById('code').value,
        author: document.getElementById('author').value
    };

    const headers = {
        'Content-Type': 'application/json',
    };

    const bodyString = JSON.stringify(body);

    calculateDigest(bodyString).then(digest => {
        headers['Digest'] = digest;

        // Leggi la chiave privata
        const privateKeyFile = document.getElementById('privateKeyFile').files[0];
        if (privateKeyFile) {
            readPrivateKeyFromFile(privateKeyFile).then(clientPrivateKeyPem => {
                const authorizationHeader = `Signature keyId="client1",algorithm="rsa-sha256",signature=""`;

                signData(digest, clientPrivateKeyPem).then(signature => {
                    headers['Authorization'] = `Signature keyId="client1",algorithm="rsa-sha256",signature="${signature}",headers="digest"`;

                    fetch(url, {
                        method: 'POST',
                        headers: headers,
                        body: bodyString
                    })
                    .then(response => response.json())
                    .then(data => {
                        document.getElementById('response-body').textContent = JSON.stringify(data, null, 2);
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        document.getElementById('response-body').textContent = 'Errore nella richiesta.';
                    });
                });
            }).catch(error => {
                console.error('Error reading private key file:', error);
            });
        } else {
            console.error('No private key file selected');
        }
    });
}

// Gestisci l'evento di invio del form
document.getElementById('api-form').addEventListener('submit', (event) => {
    event.preventDefault();
    sendRequest();
});