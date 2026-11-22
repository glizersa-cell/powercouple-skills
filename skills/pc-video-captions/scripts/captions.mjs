// Burn styled Hebrew captions into a video.  node captions.mjs in.mp4 asr.json out.mp4 [--fix fix.json] [--words 3] [--pos 0.67] [--size 50]
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { launch } from './chrome.mjs'

const [input, asrFile, out, ...rest] = process.argv.slice(2)
const opt = {}; for (let i = 0; i < rest.length; i += 2) opt[rest[i].replace(/^--/, '')] = rest[i + 1]
const fix = opt.fix ? JSON.parse(fs.readFileSync(opt.fix, 'utf8')) : {}
const MAXW = Number(opt.words || 3), POS = Number(opt.pos || 0.67), SIZE = Number(opt.size || 50)
const asr = JSON.parse(fs.readFileSync(asrFile, 'utf8'))
const [W, H] = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0:s=x', input]).toString().trim().split('x').map(Number)
const dur = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', input]).toString())

const w = asr.words.map((x) => ({ t: fix[x.word.trim()] || x.word.trim(), s: x.start, e: x.end }))
const chunks = []; let cur = []
for (let i = 0; i < w.length; i++) {
  cur.push(w[i]); const gap = w[i + 1] ? w[i + 1].s - w[i].e : 9
  if (cur.length >= MAXW || /[,.…!?]$/.test(w[i].t) || gap > 0.6 || !w[i + 1]) { chunks.push(cur); cur = [] }
}
const cap = chunks.map((c, i) => ({ text: c.map((x) => x.t).join(' ').replace(/[,.]$/, ''), s: c[0].s, e: Math.min(chunks[i + 1] ? chunks[i + 1][0].s : dur, c[c.length - 1].e + 0.6) }))

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'caps-'))
const scale = W / 720
const b = await launch(); const p = await b.newPage(); await p.setViewport({ width: W, height: H })
await p.setContent(`<html dir="rtl"><head><link href="https://fonts.googleapis.com/css2?family=Heebo:wght@900&display=swap" rel="stylesheet"><style>
html,body{margin:0;background:transparent}#c{position:absolute;left:${40 * scale}px;right:${40 * scale}px;top:${H * POS}px;text-align:center}
span{display:inline-block;font-family:Heebo;font-weight:900;font-size:${SIZE * scale}px;line-height:1.25;color:#fff;background:rgba(0,0,0,.62);padding:${6 * scale}px ${20 * scale}px ${10 * scale}px;border-radius:${16 * scale}px}
</style></head><body><div id="c"><span id="t"></span></div></body></html>`, { waitUntil: 'networkidle0' })
await p.evaluateHandle('document.fonts.ready')
for (const [i, c] of cap.entries()) { await p.evaluate((t) => { document.getElementById('t').textContent = t }, c.text); await p.screenshot({ path: path.join(dir, `${String(i).padStart(3, '0')}.png`), omitBackground: true }) }
await b.close()

const inputs = ['-i', input]; cap.forEach((_, i) => inputs.push('-i', path.join(dir, `${String(i).padStart(3, '0')}.png`)))
let f = '', last = '0:v'
cap.forEach((c, i) => { const o = i === cap.length - 1 ? 'vout' : `v${i}`; f += `[${last}][${i + 1}:v]overlay=0:0:enable='between(t,${c.s.toFixed(2)},${c.e.toFixed(2)})'[${o}];`; last = o })
fs.writeFileSync(path.join(dir, 'filter.txt'), f.slice(0, -1))
execFileSync('ffmpeg', ['-loglevel', 'error', '-y', ...inputs, '-filter_complex_script', path.join(dir, 'filter.txt'), '-map', '[vout]', '-map', '0:a?', '-c:v', 'libx264', '-crf', '20', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-c:a', 'copy', '-movflags', '+faststart', out], { stdio: 'inherit' })
fs.rmSync(dir, { recursive: true, force: true })
console.log(`✅ ${out} · ${cap.length} כתוביות`)
