const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.join(__dirname, '..', 'dist');
const ctx = {window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'data.js'),'utf8'),ctx);
const { ATLAS_CIVS:civs, ATLAS_PLANS:plans } = ctx.window;
assert.equal(civs.length,23);
assert.equal(new Set(civs.map(c=>c.id)).size,civs.length);
for (const c of civs) {
  for (const key of ['id','name','en','opening','condition','source','reviewed']) assert.ok(c[key],`${c.id}: ${key}`);
  assert.ok(c.units.length && c.systems.length && c.plans.length);
  assert.equal(new URL(c.source).hostname,'www.ageofempires.com');
  for (const p of c.plans) assert.ok(plans[p],`${c.id}: missing ${p}`);
  for (const item of [...c.units,...c.systems]) assert.ok(item.name && item.description);
}
for (const p of Object.values(plans)) { assert.ok(p.start < p.end); assert.equal(p.steps.length,4); }
const html = fs.readFileSync(path.join(root,'index.html'),'utf8');
for(const [,asset] of html.matchAll(/(?:src|href)="\.\/([^"]+)"/g))assert.ok(fs.existsSync(path.join(root,asset)),asset);
console.log(`PASS: ${civs.length} civilizations, ${Object.keys(plans).length} strategies, source links and local assets`);
