const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const pino = require('pino');
const { join } = require('path');
const { homedir } = require('os');
const fs = require('fs');
const QRCode = require('qrcode');

async function generateQrImage() {
    const authDir = join(homedir(), '.clawdbot', 'credentials', 'whatsapp', 'default');

    // Clear old auth to force fresh QR
    if (fs.existsSync(authDir)) {
        fs.rmSync(authDir, { recursive: true, force: true });
    }
    fs.mkdirSync(authDir, { recursive: true });

    const { state, saveCreds } = await useMultiFileAuthState(authDir);
    const { version } = await fetchLatestBaileysVersion();

    console.log("Starting socket for QR generation...");
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }),
        version,
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log("QR received! Saving to file...");
            const qrPath = join(process.cwd(), 'whatsapp_qr.png');
            await QRCode.toFile(qrPath, qr, {
                scale: 10,
                margin: 4
            });
            console.log("QR_SAVED_AT: " + qrPath);
        }

        if (connection === 'close') {
            console.log("Connection closed:", lastDisconnect?.error || 'Unknown error');
            // If it closed due to logout (relink), we might need to restart
        } else if (connection === 'open') {
            console.log("✅ WhatsApp Linked successfully!");
            process.exit(0);
        }
    });

    // Keep process alive
    console.log("Waiting for scan...");
    setTimeout(() => {
        console.log("Timeout waiting for scan.");
        process.exit(0);
    }, 120000); // 2 minutes
}

generateQrImage().catch(err => {
    console.error("Fatal error:", err);
    process.exit(1);
});
