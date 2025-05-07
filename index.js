import dotenv from 'dotenv';
dotenv.config();

import {
    makeWASocket,
    Browsers,
    fetchLatestBaileysVersion,
    DisconnectReason,
    useMultiFileAuthState,
} from '@whiskeysockets/baileys';

import { Handler, Callupdate, GroupUpdate } from './inconnu/inconnuTz/index.js';
import express from 'express';
import pino from 'pino';
import fs from 'fs';
import NodeCache from 'node-cache';
import path from 'path';
import chalk from 'chalk';
import axios from 'axios';
import config from './config.cjs';
import pkg from './lib/autoreact.cjs';
import { fileURLToPath } from 'url';
import { File } from 'megajs';

const { emojis, doReact } = pkg;

const app = express();
const orange = chalk.bold.hex("#FFA500");
const lime = chalk.bold.hex("#32CD32");
let useQR = false;
let initialConnection = true;
const PORT = process.env.PORT || 3000;

const MAIN_LOGGER = pino({
    timestamp: () => `,"time":"${new Date().toJSON()}"`
});
const logger = MAIN_LOGGER.child({});
logger.level = "trace";

const msgRetryCounterCache = new NodeCache();

// __dirname fix
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sessionDir = path.join(__dirname, 'session');
const credsPath = path.join(sessionDir, 'creds.json');

if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });

async function downloadSessionData() {
    console.log("Debugging SESSION_ID:", config.SESSION_ID);

    if (!config.SESSION_ID) {
        console.error('❌ Please add your session to SESSION_ID env !!');
        return false;
    }

    const sessdata = config.SESSION_ID.split("INCONNU~XD~")[1];

    if (!sessdata || !sessdata.includes("#")) {
        console.error('❌ Invalid SESSION_ID format! It must contain both file ID and decryption key.');
        return false;
    }

    const [fileID, decryptKey] = sessdata.split("#");

    try {
        console.log("🔄 Downloading Session...");
        const file = File.fromURL(`https://mega.nz/file/${fileID}#${decryptKey}`);
        const data = await new Promise((resolve, reject) => {
            file.download((err, data) => {
                if (err) reject(err);
                else resolve(data);
            });
        });

        await fs.promises.writeFile(credsPath, data);
        console.log("🔒 Session Successfully Loaded !!");
        return true;
    } catch (error) {
        console.error('❌ Failed to download session data:', error);
        return false;
    }
}

async function start() {
    try {
        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
        const { version, isLatest } = await fetchLatestBaileysVersion();
        console.log(`🤖 INCONNU-XD using WA v${version.join('.')}, isLatest: ${isLatest}`);

        const Matrix = makeWASocket({
            version,
            logger: pino({ level: 'silent' }),
            printQRInTerminal: useQR,
            browser: ["INCONNU-XD", "safari", "3.3"],
            auth: state,
            getMessage: async (key) => {
                if (store) {
                    const msg = await store.loadMessage(key.remoteJid, key.id);
                    return msg.message || undefined;
                }
                return { conversation: "inconnu-xd whatsapp user bot" };
            }
        });

        Matrix.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;
            if (connection === 'close') {
                if (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
                    start();
                }
            } else if (connection === 'open') {
                if (initialConnection) {
                    console.log(chalk.green("✅ INCONNU-XD is now online!"));

                    const image = { url: "https://files.catbox.moe/959dyk.jpg" };
                    const caption = `
┌═『 *INCONNU - XD-V2* 』
│ > BOT       : INCONNU-XD
│ > OWNER     : INCONNU BOY
│ > MODE      : public
│ > PREFIX    : .
│ > STATUS    :  ONLINE 
└══════════════════┘`;

                    await Matrix.sendMessage(Matrix.user.id, {
                        image,
                        caption,
                        contextInfo: {
                            isForwarded: true,
                            forwardingScore: 999,
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: '120363397722863547@newsletter',
                                newsletterName: "INCONNU-XD",
                                serverMessageId: -1,
                            },
                            externalAdReply: {
                                title: "INCONNU-XD",
                                body: "ᴘᴏᴡᴇʀᴇᴅ ʙʏ inconnu-xd",
                                thumbnailUrl: 'https://files.catbox.moe/959dyk.jpg',
                                sourceUrl: 'https://whatsapp.com/channel/0029Vb6T8td5K3zQZbsKEU1R',
                                mediaType: 1,
                                renderLargerThumbnail: false,
                            },
                        }
                    });

                    initialConnection = false;
                } else {
                    console.log(chalk.blue("♻️ Connection reestablished after restart."));
                }
            }
        });

        Matrix.ev.on('creds.update', saveCreds);
        Matrix.ev.on("messages.upsert", chatUpdate => Handler(chatUpdate, Matrix, logger));
        Matrix.ev.on("call", json => Callupdate(json, Matrix));
        Matrix.ev.on("group-participants.update", messag => GroupUpdate(Matrix, messag));

        if (config.MODE === "public") {
            Matrix.public = true;
        } else if (config.MODE === "private") {
            Matrix.public = false;
        }

        Matrix.ev.on('messages.upsert', async (chatUpdate) => {
            try {
                const mek = chatUpdate.messages[0];
                if (!mek.key.fromMe && config.AUTO_REACT && mek.message) {
                    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
                    await doReact(randomEmoji, mek, Matrix);
                }
            } catch (err) {
                console.error('Auto react error:', err);
            }
        });

    } catch (error) {
        console.error('Critical Error:', error);
        process.exit(1);
    }
}

async function init() {
    if (fs.existsSync(credsPath)) {
        console.log("🔒 Session file found, proceeding without QR.");
        await start();
    } else {
        const sessionDownloaded = await downloadSessionData();
        if (sessionDownloaded) {
            console.log("✅ Session downloaded, starting bot.");
            await start();
        } else {
            console.log("❌ No session found or invalid, printing QR.");
            useQR = true;
            await start();
        }
    }
}

init();

// Static files for frontend (if needed)
app.use(express.static(path.join(__dirname, 'mydata')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'mydata', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🌐 Server running on port ${PORT}`);
});
