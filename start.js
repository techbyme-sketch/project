const { makeWASocket, useSingleFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');

const TELEGRAM_BOT_TOKEN = '7947636670:AAHfdl2FS_OXusQOAHK6M9OaNB08UihL_sI'; // Remplace par ton token Telegram
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

const { state, saveState } = useSingleFileAuthState('./session.json');
let sock = null;
let currentChatId = null;

async function connectWithPairingCode(pairingCode, chatId) {
    try {
        const { version } = await fetchLatestBaileysVersion();
        sock = makeWASocket({
            version,
            auth: state,
            browser: ['INCONNU-XD', 'Chrome', '1.0'],
            printQRInTerminal: false
        });

        sock.ev.on('connection.update', (update) => {
            const { connection } = update;
            if (connection === 'open') {
                bot.sendMessage(chatId, '✅ Connecté avec succès à WhatsApp !');
                bot.sendMessage(chatId, `ℹ️ Numéro connecté : ${sock.user.id}`);
                require('./index.js')(sock); // Chargement des commandes WhatsApp
            } else if (connection === 'close') {
                bot.sendMessage(chatId, '❌ Déconnecté de WhatsApp.');
            }
        });

        sock.ev.on('creds.update', saveState);
        currentChatId = chatId;

        await sock.ws.send(JSON.stringify({
            method: 'pair-device',
            pairingCode
        }));
    } catch (error) {
        bot.sendMessage(chatId, `Erreur : ${error.message}`);
    }
}

bot.onText(/\/pair (\d{8})/, async (msg, match) => {
    const chatId = msg.chat.id;
    const pairingCode = match[1];
    bot.sendMessage(chatId, `⏳ Connexion avec le code ${pairingCode}...`);
    await connectWithPairingCode(pairingCode, chatId);
});

bot.onText(/\/disconnect/, (msg) => {
    if (sock) {
        sock.logout();
        bot.sendMessage(msg.chat.id, '🔌 Bot déconnecté de WhatsApp.');
    } else {
        bot.sendMessage(msg.chat.id, 'Bot non connecté.');
    }
});

bot.onText(/\/restart/, (msg) => {
    bot.sendMessage(msg.chat.id, '♻️ Redémarrage du bot...');
    process.exit(0);
});

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, `Bienvenue dans INCONNU-XD V2 !
Commandes disponibles :
/pair 12345678 – Connexion WhatsApp
/disconnect – Déconnexion
/restart – Redémarrer`);
});
