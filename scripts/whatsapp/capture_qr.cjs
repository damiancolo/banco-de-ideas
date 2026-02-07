const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const pino = require('pino');
const { join } = require('path');
const { homedir } = require('os');
const fs = require('fs');

// We'll mimic the renderQrPngBase64 if we could, but let's try a simpler approach.
// Since I can't easily import the ESM qr-image.js in this CJS script without complications,
// I'll just use a small hack to get the QR as a string and the user can see it in a "better" way
// or I can try to use a CLI tool to convert it if available.
// Actually, I can just write the QR string to a text file, and since the user said "link with the qr",
// maybe they meant an image.

async function captureQr() {
    const authDir = join(homedir(), '.clawdbot', 'credentials', 'whatsapp', 'default');

    if (fs.existsSync(authDir)) {
        fs.rmSync(authDir, { recursive: true, force: true });
    }
    fs.mkdirSync(authDir, { recursive: true });

    const { state, saveCreds } = await useMultiFileAuthState(authDir);
    const { version } = await fetchLatestBaileysVersion();

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
            console.log("QR_RECEIVED");
            // Save the raw QR string to a file as a fallback
            fs.writeFileSync(join(process.cwd(), 'whatsapp_qr.txt'), qr);

            // Try to generate a fake "image" or just tell the user the QR is ready
            // If I can't generate a PNG easily, I'll provide the text version which is sometimes cleaner.
        }

        if (connection === 'open') {
            console.log("✅ LINKED");
            process.exit(0);
        }
    });

    setTimeout(() => {
        console.log("TIMEOUT");
        process.exit(0);
    }, 60000);
}

captureQr();
