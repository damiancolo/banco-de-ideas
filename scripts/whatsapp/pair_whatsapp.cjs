const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const pino = require('pino');
const { join } = require('path');
const { homedir } = require('os');

async function generatePairingCode(phoneNumber) {
    const authDir = join(homedir(), '.clawdbot', 'credentials', 'whatsapp', 'default');
    const { state, saveCreds } = await useMultiFileAuthState(authDir);
    const { version } = await fetchLatestBaileysVersion();

    console.log("Starting socket...");
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'info' }), // Increased log level for debugging
        version,
        browser: ["Ubuntu", "Chrome", "20.0.04"] // Standard browser string
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (connection === 'close') {
            console.log("Connection closed:", lastDisconnect?.error || 'Unknown error');
        } else if (connection === 'open') {
            console.log("Connection opened!");
        }
        if (qr) {
            console.log("QR generated (ignoring since we want pairing code).");
        }
    });

    // Wait a bit for the connection to background handshake
    console.log("Waiting 5 seconds for initialization...");
    await new Promise(resolve => setTimeout(resolve, 5000));

    if (!state.creds.registered) {
        console.log("Requesting pairing code for:", phoneNumber);
        try {
            const code = await sock.requestPairingCode(phoneNumber);
            console.log("PAIRING_CODE_START");
            console.log(code);
            console.log("PAIRING_CODE_END");
        } catch (err) {
            console.error("Failed to request pairing code:", err);
        }
    } else {
        console.log("Already registered.");
    }

    // Keep alive to ensure creds are saved and connection is stable
    setTimeout(() => {
        console.log("Done.");
        process.exit(0);
    }, 15000);
}

const phone = process.argv[2];
if (!phone) {
    console.error("Please provide a phone number.");
    process.exit(1);
}

generatePairingCode(phone.replace(/\s+/g, '')).catch(err => {
    console.error("Unhandle error:", err);
    process.exit(1);
});
