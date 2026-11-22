// "Signed!" client story (1080x1920).  node story.mjs stories.json [outDir]
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { launch } from './chrome.mjs'

const [cfg, outDir = 'out'] = process.argv.slice(2)
const stories = JSON.parse(fs.readFileSync(cfg, 'utf8'))
const u = (p) => (p ? (/^https?:/.test(p) ? p : pathToFileURL(path.resolve(path.dirname(cfg), p)).href) : '')
const LOGO = 'https://powercouple.co.il/wp-content/uploads/2026/11/bf-logo-white.png'
const css = `*{box-sizing:border-box;margin:0;padding:0}
body{width:1080px;height:1920px;font-family:Heebo,sans-serif;background:#0A1633;color:#fff;overflow:hidden;position:relative}
.bg{position:absolute;inset:0;background:radial-gradient(1200px 900px at 80% 0%,#1F5BFF55,transparent),linear-gradient(180deg,#0A1633,#071022)}
.wrap{position:relative;padding:64px 64px 0}.top{display:flex;justify-content:space-between;align-items:center}.logo{height:62px}
.tag{background:#FFD23F;color:#0A1633;font-weight:900;font-size:34px;border-radius:99px;padding:10px 30px}
.row{display:flex;gap:36px;margin-top:44px;align-items:stretch}
.photo{width:470px;height:836px;border-radius:32px;overflow:hidden;background:#000;flex:none;box-shadow:0 20px 60px #0008}.photo img{width:100%;height:100%;object-fit:contain}
.side{flex:1;display:flex;flex-direction:column;justify-content:center}.kick{font-size:30px;font-weight:700;color:#8FB0FF}
.name{font-size:76px;font-weight:900;line-height:1.05;margin:8px 0 18px}
.type{display:inline-block;background:#1F5BFF;font-size:30px;font-weight:800;border-radius:14px;padding:6px 18px;margin-bottom:26px;align-self:flex-start}
.price{font-size:30px;color:#B9C7E6}.price b{display:block;font-size:84px;font-weight:900;color:#fff;letter-spacing:-1px;direction:ltr;text-align:right}
ul{list-style:none;margin-top:26px}li{font-size:32px;font-weight:500;padding:9px 0;border-bottom:1px solid #ffffff22}li:before{content:'✓ ';color:#3FD07A;font-weight:900}
.doc{margin-top:40px;background:#fff;border-radius:26px;padding:22px 26px;position:relative;box-shadow:0 20px 60px #0008}
.doc .lbl{position:absolute;top:-22px;right:30px;background:#FFD23F;color:#0A1633;font-weight:900;font-size:26px;border-radius:12px;padding:6px 16px}
.doc img{display:block;width:100%;height:auto;max-height:260px;object-fit:contain;filter:contrast(1.25)}
.comp{margin-top:40px;height:420px;border-radius:26px;overflow:hidden;position:relative}.comp img{width:100%;height:100%;object-fit:cover}
.comp span{position:absolute;bottom:16px;right:18px;background:#0A1633cc;font-size:30px;font-weight:800;border-radius:12px;padding:8px 18px}
.cta{position:absolute;bottom:54px;left:64px;right:64px;text-align:center;font-size:36px;font-weight:800}.cta b{color:#FFD23F}`
const html = (s) => `<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;700;800;900&display=swap" rel="stylesheet"><style>${css}</style></head><body><div class="bg"></div><div class="wrap">
<div class="top"><img class="logo" src="${u(s.logo) || LOGO}"><span class="tag">${s.tag || 'חתמו! 🔑'}</span></div>
<div class="row"><div class="photo"><img src="${u(s.photo)}"></div>
<div class="side"><div class="kick">מזל טוב ל-</div><div class="name">${s.name}</div><span class="type">${s.type}</span>
<div class="price">מחיר רכישה לפי ההסכם<b>₪${s.price}</b></div><ul>${(s.bullets || []).map((b) => `<li>${b}</li>`).join('')}</ul></div></div>
${s.crop ? `<div class="doc"><span class="lbl">📄 מתוך הסכם הרכישה</span><img src="${u(s.crop)}"></div>` : ''}
${s.comp ? `<div class="comp"><img src="${u(s.comp)}"><span>📍 ${s.compLabel || ''}</span></div>` : ''}
</div><div class="cta">${s.cta || 'רוצים להיות הבאים? <b>שלחו "דירה" בהודעה</b> 👇'}</div></body></html>`

fs.mkdirSync(outDir, { recursive: true })
const b = await launch(); const pg = await b.newPage(); await pg.setViewport({ width: 1080, height: 1920 })
for (const [i, s] of stories.entries()) {
  const tmp = path.join(outDir, '.tmp.html'); fs.writeFileSync(tmp, html(s))
  await pg.goto(pathToFileURL(path.resolve(tmp)).href, { waitUntil: 'networkidle0' }); await pg.evaluateHandle('document.fonts.ready')
  const out = path.join(outDir, `${String(i + 1).padStart(2, '0')} - ${s.name}.png`); await pg.screenshot({ path: out }); console.log('✅', out)
  fs.unlinkSync(tmp)
}
await b.close()
