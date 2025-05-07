// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ // ⚙️ INCONNU-XD ANTITAG COMMAND MODULE ⚙️ // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { serialize } from '../../lib/Serializer.js'; import config from '../../config.cjs';

const antitagSettings = {}; // { groupId: { antitag: false, action: null, warnings: {} } }

export const handleAntitag = async (m, sock, logger, isBotAdmins, isAdmins, isCreator) => { const contextInfoHans = { contextInfo: { forwardingScore: 5, isForwarded: true, forwardedNewsletterMessageInfo: { newsletterName: "INCONNU-BOY-TECH", newsletterJid: "120363397722863547@newsletter", }, }, };

const PREFIX = /^[\/!#.]/; const isCOMMAND = (body) => PREFIX.test(body); const prefixMatch = isCOMMAND(m.body) ? m.body.match(PREFIX) : null; const prefix = prefixMatch ? prefixMatch[0] : '/'; const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';

if (!antitagSettings[m.from]) { antitagSettings[m.from] = { antitag: false, action: null, warnings: {} }; }

if (cmd === 'antitag') { if (!m.isGroup) return await sock.sendMessage(m.from, { text: ━━⚠️ *Group Only Command* ⚠️━━, ...contextInfoHans }, { quoted: m }); if (!isBotAdmins) return await sock.sendMessage(m.from, { text: ━━⚠️ *I need admin permission to work!* ⚠️━━, ...contextInfoHans }, { quoted: m }); if (!isAdmins) return await sock.sendMessage(m.from, { text: ━━⚠️ *Only Admins can use Antitag settings!* ⚠️━━, ...contextInfoHans }, { quoted: m });

const args = m.body.slice(prefix.length + cmd.length).trim().split(/\s+/);
const subcmd = args[0] ? args[0].toLowerCase() : '';

if (subcmd === 'on') {
  antitagSettings[m.from].antitag = true;
  antitagSettings[m.from].action = null;
  return await sock.sendMessage(m.from, {
    text: `━⚡ *inconnu Xd AntiTag Activated* ⚡━\n> 🚫 ${prefix}antitag action delete\n> ⚠️ ${prefix}antitag action warn\n> 🚪 ${prefix}antitag action kick`,
    ...contextInfoHans
  }, { quoted: m });
}

if (subcmd === 'off') {
  antitagSettings[m.from].antitag = false;
  antitagSettings[m.from].action = null;
  antitagSettings[m.from].warnings = {};
  return await sock.sendMessage(m.from, { text: `━❌ *inconnu Xd AntiTag Deactivated* ❌━`, ...contextInfoHans }, { quoted: m });
}

if (subcmd === 'action') {
  if (!antitagSettings[m.from].antitag) {
    return await sock.sendMessage(m.from, {
      text: `━━⚠️ *Antitag is OFF*\n> Turn it on with ${prefix}antitag on ⚠️━━`,
      ...contextInfoHans
    }, { quoted: m });
  }
  const actionType = args[1] ? args[1].toLowerCase() : '';
  if (["delete", "warn", "kick"].includes(actionType)) {
    antitagSettings[m.from].action = actionType;
    return await sock.sendMessage(m.from, {
      text: `━━✅ *Antitag action set to ${actionType.toUpperCase()}* ✅━━`,
      ...contextInfoHans
    }, { quoted: m });
  } else {
    return await sock.sendMessage(m.from, {
      text: `━━⚡ *Invalid Action!*\n> 🚫 ${prefix}antitag action delete\n> ⚠️ ${prefix}antitag action warn\n> 🚪 ${prefix}antitag action kick ⚡━━`,
      ...contextInfoHans
    }, { quoted: m });
  }
}

return await sock.sendMessage(m.from, {
  text: `━━📌 *inconnu Xd Antitag Usage:*\n> ${prefix}antitag on\n> ${prefix}antitag off\n> ${prefix}antitag action delete | warn | kick 📌━━`,
  ...contextInfoHans
}, { quoted: m });

}

// Detect tags if antitag is ON if (antitagSettings[m.from].antitag && m.message && m.message.extendedTextMessage && m.message.extendedTextMessage.contextInfo && m.message.extendedTextMessage.contextInfo.mentionedJid) { if (!isBotAdmins) return; if (isAdmins || isCreator) return;

const action = antitagSettings[m.from].action;
if (!action) return;

await sock.sendMessage(m.from, { delete: m.key });

if (action === 'delete') {
  return await sock.sendMessage(m.from, {
    text: `━━🚫 *@${m.sender.split('@')[0]} Tag detected and deleted!* 🚫━━`,
    mentions: [m.sender],
    ...contextInfoHans
  }, { quoted: m });
}

if (action === 'warn') {
  if (!antitagSettings[m.from].warnings[m.sender]) {
    antitagSettings[m.from].warnings[m.sender] = 0;
  }
  antitagSettings[m.from].warnings[m.sender] += 1;

  const userWarnings = antitagSettings[m.from].warnings[m.sender];
  const maxWarnings = config.ANTILINK_WARNINGS || 4;

  if (userWarnings >= maxWarnings) {
    await sock.groupParticipantsUpdate(m.from, [m.sender], 'remove');
    delete antitagSettings[m.from].warnings[m.sender];
    return await sock.sendMessage(m.from, {
      text: `━━🚪 *@${m.sender.split('@')[0]} kicked after 4 warnings for tagging!* 🚪━━`,
      mentions: [m.sender],
      ...contextInfoHans
    });
  } else {
    return await sock.sendMessage(m.from, {
      text: `━━⚠️ *Warning ${userWarnings}/4*\n@${m.sender.split('@')[0]} You can't tag others here! ⚠️━━`,
      mentions: [m.sender],
      ...contextInfoHans
    }, { quoted: m });
  }
}

if (action === 'kick') {
  await sock.groupParticipantsUpdate(m.from, [m.sender], 'remove');
  return await sock.sendMessage(m.from, {
    text: `━━🚪 *@${m.sender.split('@')[0]} kicked for tagging!* 🚪━━`,
    mentions: [m.sender],
    ...contextInfoHans
  }, { quoted: m });
}

} };

                        
