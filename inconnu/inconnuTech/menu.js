
import config from '../../config.cjs';

const menu = async (m, sock) => {
  const prefix = config.PREFIX;
  const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';
  const text = m.body.slice(prefix.length + cmd.length).trim();

  if (cmd === "menu") {
    const start = new Date().getTime();
    await m.React('🪆');
    const end = new Date().getTime();
    const responseTime = (end - start) / 1000;

    let profilePictureUrl = 'https://files.catbox.moe/959dyk.jpg'; // Default image URL
    try {
      const pp = await sock.profilePictureUrl(m.sender, 'image');
      if (pp) {
        profilePictureUrl = pp;
      }
    } catch (error) {
      console.error("Failed to fetch profile picture:", error);
      // Use the default image if fetching fails
    }

    const menuText = `
═════════════════════

> ⚡ *INCONNU-XD-V2* ⚡

> *Version*: 7.1.0 |

> *DEV : INCONNU BOY TECH*

════════════════════

WELCOME TO INCONNNU-XD-V2

════════════════════
   *INCONNU XD MENU*
════════════════════
|  | ${prefix}menu
|  | ${prefix}alive
|  | ${prefix}owner
|  | ${prefix}menu
════════════════════

════════════════════
   *INCONNU-XD OWNER*
════════════════════
|  | ${prefix}join
|  | ${prefix}leave
|  | ${prefix}autobio
|  | ${prefix}block
|  | ${prefix}autolikestatus
|  | ${prefix}unblock
|  | ${prefix}antidelete on
|  | ${prefix}anticall
|  | ${prefix}settings
|  | ${prefix}setname
|  | ${prefix}vv
|  | ${prefix}del
════════════════════

════════════════════
   *INCONNU-XD IA*
════════════════════
|  | ${prefix}ai
|  | ${prefix}bug
|  | ${prefix}report
|  | ${prefix}chatbot
|  | ${prefix}gpt
|  | ${prefix}inconnu-ai
════════════════════

════════════════════
   INCONNU-XD CONVERTER
════════════════════
|  | ${prefix}attp
|  | ${prefix}gimage
|  | ${prefix}play
|  | ${prefix}video
════════════════════

════════════════════
   *INCONNU-XD SEARCH* 
════════════════════
|  | ${prefix}google
|  | ${prefix}mediafire
|  | ${prefix}facebook
|  | ${prefix}instagram
|  | ${prefix}tiktok
|  | ${prefix}lyrics
|  | ${prefix}imdb
════════════════════

════════════════════
   *INCONNU-XD FUN*
════════════════════
|  | ${prefix}getpp
|  | ${prefix}url
|  | ${prefix}roast
════════════════════

════════════════════
   *INCONNU GROUP MENU*
════════════════════
|  | ${prefix}kickall
|  | ${prefix}kick
|  | ${prefix}remove
|  | ${prefix}tagall
|  | ${prefix}hidetag
|  | ${prefix}close
|  | ${prefix}open
|  | ${prefix}link
|  | ${prefix}antilink
|  | ${prefix}antitag
|  | ${prefix}promote
|  | ${prefix}demote
════════════════════

> *⚡ INCONNU BOY TECH ⚡*

`;

    await sock.sendMessage(m.from, {
      image: { url: profilePictureUrl },
      caption: menuText.trim(),
      contextInfo: {
        forwardingScore: 5,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterName: "INCONNU-XD-V2",
          newsletterJid: "120363397722863547@newsletter",
        },
      }
    }, { quoted: m });
  }
};

export default menu;
