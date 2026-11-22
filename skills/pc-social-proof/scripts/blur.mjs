// Collage of screenshot strips with blurred names.  node blur.mjs blur.json out.png
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { launch } from './chrome.mjs'

const [cfgFile, out = 'proof.png'] = process.argv.slice(2)
const cfg = JSON.parse(fs.readFileSync(cfgFile, 'utf8'))
const W = cfg.width || 1320, RH = cfg.rowHeight || 205, cols = cfg.columns || 1, bg = cfg.background || '#f4f4f7'
const u = (p) => pathToFileURL(path.resolve(path.dirname(cfgFile), p)).href
const row = (r) => `<div class="r" style="height:${r.height || RH}px;background-image:url('${u(r.src)}');background-position:0 -${r.top || 0}px">${(r.blur || []).map(([right, top, w, h]) => `<i style="right:${right}px;top:${top}px;width:${w}px;height:${h}px"></i>`).join('')}</div>`
const html = `<html><body style="margin:0;background:${bg}"><style>.g{display:grid;grid-template-columns:repeat(${cols},${W}px)}.r{position:relative;width:${W}px;background-repeat:no-repeat;background-color:${bg}}.r i{position:absolute;backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px);border-radius:14px}</style><div class="g">${cfg.rows.map(row).join('')}</div></body></html>`
const tmp = path.join(path.dirname(path.resolve(out)), '.blur.html'); fs.mkdirSync(path.dirname(tmp), { recursive: true }); fs.writeFileSync(tmp, html)
const b = await launch(); const p = await b.newPage()
const rows = Math.ceil(cfg.rows.length / cols)
await p.setViewport({ width: W * cols, height: cfg.rows.slice(0, rows).reduce((s, r) => s + (r.height || RH), 0) })
await p.goto(pathToFileURL(tmp).href); await new Promise((r) => setTimeout(r, 500))
await p.screenshot({ path: out, fullPage: true }); await b.close(); fs.unlinkSync(tmp)
console.log('✅', out)
