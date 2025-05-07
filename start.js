
const { makeWASocket, useSingleFileAuthState, fetchLatestBaileysVersion, DisconnectReason } = require('@whiskeysockets/baileys');
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');

// === CONFIGURATION ===
const TELEGRAM_BOT_TOKEN = 'TON_TELEGRAM_BOT_TOKEN'; // Remplace par ton token Telegram
const SESSION_FILE = './auth_info.json';

const { state, saveState } = useSingleFileAuthState(SESSION_FILE);
const telegramBot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

let userChatId = null;

telegramBot.onText(/\/start/, (msg) => {
    userChatId = msg.chat.id;
    telegramBot.sendMessage(userChatId, 'Bienvenue ! Envoie le code de jumelage WhatsApp (8 chiffres) :');
});

telegramBot.on('message', async (msg) => {
    const pairingCode = msg.text?.trim();
    if (!/^[0-9]{8}$/.test(pairingCode)) return;

    telegramBot.sendMessage(msg.chat.id, 'Connexion à WhatsApp en cours, patiente...');

    const { version } = await fetchLatestBaileysVersion();
    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        browser: ['INCONNU-XD', 'Chrome', '1.0.0']
    });

    try {
        await sock.ev.once('connection.update', (update) => {
            const { connection, lastDisconnect } = update;
            if (connection === 'open') {
                telegramBot.sendMessage(userChatId, '✅ Bot connecté à WhatsApp avec succès !');
            } else if (connection === 'close') {
                const reason = lastDisconnect?.error?.output?.statusCode;
                if (reason === DisconnectReason.loggedOut) {
                    telegramBot.sendMessage(userChatId, 'Déconnecté de WhatsApp.');
                }
            }
        });

        await sock.ev.emit('creds.update');
        await sock.ws.send(JSON.stringify({
            method: 'pair-device',
            pairingCode
        }));
    } catch (err) {
        telegramBot.sendMessage(userChatId, 'Erreur pendant la connexion : ' + err.message);
    }
});
