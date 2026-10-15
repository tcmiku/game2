/** Local pixel effects: compact authoritative hit records survive network polling. */
import {weaponStyle,drawVfx,vfxFrame} from './weapon-vfx.mjs';
const noise = (id, salt) => { const n = Math.sin(id * 12.9898 + salt * 78.233) * 43758.5453; return n - Math.floor(n); };
const MAX_PARTICLES = 240, MAX_NUMBERS = 28, MAX_BURSTS = 32;
export class HitFeedback {
  constructor({ reducedMotion = false } = {}) { this.reducedMotion = reducedMotion; this.reset(); }
  reset() { this.seen = new Set(); this.particles = []; this.numbers = []; this.bursts = []; this.flashes = new Map(); this.sounds = []; this.shake = 0; this.shakeCooldown = 0; this.clock = 0; this.time = -1; }
  update(records, time, owner, dt) {
    if (time < this.time - .1) this.reset();
    this.time = time; this.clock += dt; this.shakeCooldown = Math.max(0, this.shakeCooldown - dt);
    this.shake *= Math.exp(-20 * dt);
    for (const [key, life] of this.flashes) { if (life <= dt) this.flashes.delete(key); else this.flashes.set(key, life - dt); }
    for (const hit of records || []) {
      if (this.seen.has(hit.id)) continue;
      this.seen.add(hit.id);
      if (time - hit.at > .7) continue;
      const mine = hit.owner === owner;
      const style=hit.weapon?weaponStyle(hit.weapon):null;
      const color = style?.color || (hit.type === 2 ? '#9edbc5' : hit.type === 3 ? '#c394ad' : hit.type >= 4 ? '#e9c384' : '#ccd4b6');
      this.flashes.set(hit.target, .12);
      this.bursts.push({ x:hit.x, y:hit.y - 18, age:0, life:.22, angle:Math.atan2(hit.dy, hit.dx), size:hit.killed ? 74 : 54, row:style?.row });
      const count = hit.killed ? 13 : mine ? 8 : 4;
      for (let k = 0; k < count; k++) {
        const angle = Math.atan2(hit.dy,hit.dx) + (noise(hit.id,k) - .5) * 4.8;
        const speed = 55 + noise(hit.id,k + 20) * (hit.killed ? 160 : 110);
        const life = .17 + noise(hit.id,k + 40) * .26;
        this.particles.push({ x:hit.x, y:hit.y - 18, vx:Math.cos(angle)*speed, vy:Math.sin(angle)*speed - 35, life, max:life, size:k < 2 ? 4 : 2, color:k < 3 ? style?.core||'#fff1bd' : color });
      }
      if (mine) {
        const existing = this.numbers.find(n => n.target === hit.target && n.age < .09);
        if (existing) { existing.amount += hit.amount; existing.killed ||= hit.killed; }
        else this.numbers.push({ target:hit.target, amount:hit.amount, x:hit.x + (noise(hit.id,80)-.5)*16, y:hit.y-46, drift:(noise(hit.id,90)-.5)*25, age:0, life:.65, killed:hit.killed, strong:hit.strength > 1.35 });
        this.sounds.push(hit.killed ? 'finish' : 'impact');
        if (!this.reducedMotion && this.shakeCooldown <= 0) { this.shake = Math.max(this.shake, hit.killed ? (hit.type>=4 ? 3.4 : 1.9) : .8); this.shakeCooldown = .085; }
      }
    }
    if (this.seen.size > 384) this.seen = new Set([...this.seen].slice(-192));
    for (const p of this.particles) { p.life -= dt; p.x += p.vx*dt; p.y += p.vy*dt; p.vx *= Math.exp(-5*dt); p.vy += 110*dt; }
    for (const n of this.numbers) n.age += dt;
    for (const b of this.bursts) b.age += dt;
    this.particles = this.particles.filter(p=>p.life>0).slice(-MAX_PARTICLES);
    this.numbers = this.numbers.filter(n=>n.age<n.life).slice(-MAX_NUMBERS);
    this.bursts = this.bursts.filter(b=>b.age<b.life).slice(-MAX_BURSTS);
    this.sounds = this.sounds.sort((a,b)=>(a==='finish'?-1:0)-(b==='finish'?-1:0)).slice(0,8);
  }
  offset() { return this.reducedMotion ? {x:0,y:0} : {x:Math.sin(this.clock*91)*this.shake,y:Math.cos(this.clock*73)*this.shake*.6}; }
  draw(ctx, atlas, vfxAtlas) {
    ctx.save();
    for (const b of this.bursts) {
      if(b.row&&vfxAtlas?.complete&&vfxAtlas.naturalWidth){drawVfx(ctx,vfxAtlas,b.row,b.x,b.y,b.size,vfxFrame(b.age/b.life),b.angle,1-b.age/b.life);continue;}
      if (!atlas?.complete || !atlas.naturalWidth) continue;
      const frame = Math.min(4,Math.floor(b.age/b.life*5)),sw=atlas.width/5;
      ctx.save();ctx.translate(Math.round(b.x),Math.round(b.y));ctx.rotate(Math.round(b.angle/(Math.PI/4))*Math.PI/4);
      ctx.globalAlpha = 1-b.age/b.life;ctx.drawImage(atlas,frame*sw,0,sw,atlas.height,-b.size/2,-b.size/2,b.size,b.size);ctx.restore();
    }
    for (const p of this.particles) { ctx.globalAlpha = Math.min(1,p.life/.12);ctx.fillStyle=p.color;ctx.fillRect(Math.round(p.x/2)*2,Math.round(p.y/2)*2,p.size,p.size); }
    for (const n of this.numbers) {
      const t=n.age/n.life;ctx.globalAlpha=Math.min(1,(1-t)*3);
      const x=Math.round(n.x+n.drift*t),y=Math.round(n.y-38*t-(this.reducedMotion?0:Math.sin(t*Math.PI)*7));
      ctx.font=`bold ${n.killed||n.strong?22:18}px monospace`;ctx.textAlign='center';ctx.lineJoin='round';ctx.lineWidth=4;ctx.strokeStyle='#101b20';ctx.strokeText(String(n.amount),x,y);
      ctx.fillStyle=n.killed?'#ffe3a5':n.strong?'#e9d5a3':'#f2edd8';ctx.fillText(String(n.amount),x,y);
    }
    ctx.restore();
  }
}
