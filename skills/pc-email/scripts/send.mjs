// Power Couple mail sender (SMTP, Gmail/Workspace app password). Accounts in ~/.config/powercouple/mail.json
//   node send.mjs --from office --to a@b.com[,c@d.com] [--cc …] --subject "…" --body-file f.txt [--attach f.pdf]… [--dry]
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import nodemailer from 'nodemailer'

const opt = { attach: [] }
const argv = process.argv.slice(2)
for (let i = 0; i < argv.length; i++) {
  const k = argv[i].replace(/^--/, '')
  if (k === 'dry') opt.dry = true
  else if (k === 'attach') opt.attach.push(argv[++i])
  else opt[k] = argv[++i]
}
const cfgFile = path.join(os.homedir(), '.config', 'powercouple', 'mail.json')
if (!fs.existsSync(cfgFile)) { console.error(`❌ חסר ${cfgFile} – ראו SKILL.md`); process.exit(1) }
const acct = JSON.parse(fs.readFileSync(cfgFile, 'utf8'))[opt.from || Object.keys(JSON.parse(fs.readFileSync(cfgFile, 'utf8')))[0]]
if (!acct) { console.error('❌ חשבון לא קיים ב-mail.json'); process.exit(1) }
if (!opt.to || !opt.subject || !opt['body-file']) { console.error('❌ חובה: --to --subject --body-file'); process.exit(1) }

const bad = opt.attach.filter((f) => /\.(xlsx?|html?)$/i.test(f))
if (bad.length) { console.error('❌ קבצים שבנקים חוסמים (המירו ל-PDF):\n' + bad.join('\n')); process.exit(1) }
for (const f of opt.attach) if (!fs.existsSync(f)) { console.error('❌ קובץ לא נמצא: ' + f); process.exit(1) }
const size = opt.attach.reduce((s, f) => s + fs.statSync(f).size, 0)

const text = fs.readFileSync(opt['body-file'], 'utf8')
const esc = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))
const html = `<div dir="rtl" style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6">${esc(text).replace(/\*([^*\n]+)\*/g, '<b>$1</b>').replace(/\n/g, '<br>')}</div>`

console.log(`מאת: ${acct.name || ''} <${acct.user}>\nאל: ${opt.to}${opt.cc ? `\nהעתק: ${opt.cc}` : ''}\nנושא: ${opt.subject}\nקבצים (${opt.attach.length}, ${(size / 1e6).toFixed(1)}MB):\n${opt.attach.map((f) => '  • ' + path.basename(f)).join('\n')}`)
if (opt.attach.length > 10 || size > 15e6) console.log('⚠️  תיק גדול – מומלץ לפצל לשני מיילים (1/2, 2/2)')
if (opt.dry) { console.log('— dry run, לא נשלח —'); process.exit(0) }

const t = nodemailer.createTransport({ host: acct.host || 'smtp.gmail.com', port: 465, secure: true, auth: { user: acct.user, pass: acct.pass } })
const info = await t.sendMail({ from: { name: acct.name || acct.user, address: acct.user }, to: opt.to, cc: opt.cc, subject: opt.subject, text: text.replace(/\*/g, ''), html, attachments: opt.attach.map((p) => ({ path: p })) })
console.log('✅ נשלח', info.messageId)
