import { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import pino from 'pino';
import { join } from 'path';
import { homedir } from 'os';

async function generatePairingCode(phoneNumber) {
    const authDir = join(homedir(), '.clawdbot', 'credentials', 'whatsapp', 'default');
    const { state, saveCreds } = await useMultiFileAuthState(authDir);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }),
        version
    });

    sock.ev.on('creds.update', saveCreds);

    if (!state.creds.registered) {
        console.log("Requesting pairing code for:", phoneNumber);
        const code = await sock.requestPairingCode(phoneNumber);
        console.log("PAIRING_CODE_START");
        console.log(code);
        console.log("PAIRING_CODE_END");
    } else {
        console.log("Already registered.");
    }

    // Give it a moment to stabilize
    setTimeout(() => process.exit(0), 5000);
}

const phone = process.argv[2];
if (!phone) {
    console.error("Please provide a phone number.");
    process.exit(1);
}

generatePairingCode(phone.replace(/\s+/g, ''));
