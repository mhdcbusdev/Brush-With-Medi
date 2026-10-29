
'use strict';
const ASSET={"GAMEFACE": "images/medi/gameface.webp", "MEDI_BRUSH": "images/medi/brush.webp", "MEDI_HORE": "images/medi/hore.webp", "MEDI_DRINK": "images/medi/drink.webp", "MEDI_TROPHY": "images/medi/trophy.webp", "MEDI_AVATAR": "images/medi/avatar.webp", "BRUSH_biru_stand": "images/tools/brush_biru_stand.webp", "BRUSH_biru_use": "images/tools/brush_biru_use.webp", "BRUSH_pink_stand": "images/tools/brush_pink_stand.webp", "BRUSH_pink_use": "images/tools/brush_pink_use.webp", "BRUSH_hijau_stand": "images/tools/brush_hijau_stand.webp", "CUP_biru": "images/tools/cup_biru.webp", "CUP_kuning": "images/tools/cup_kuning.webp", "CUP_pink": "images/tools/cup_pink.webp", "ODOL_biru": "images/tools/odol_biru.webp", "ODOL_hijau": "images/tools/odol_hijau.webp", "ODOL_pink": "images/tools/odol_pink.webp"};
const TOOLIMG=ASSET, POSES=ASSET;
const toolImg={};
function ld(keys){keys.forEach(function(k){if(toolImg[k]||!ASSET[k])return;var im=new Image();im.src=ASSET[k];toolImg[k]=im;});}
// Image-fraction calibration (matches the cut-out face PNG)
const EYE=[[0.342,0.501],[0.633,0.501]];
const UP=[0.36,0.655,0.635,0.715];   // upper teeth band x0,y0,x1,y1
const LO=[0.41,0.745,0.60,0.80];   // lower teeth band
const SKIN='#F6C9B4';

const DAYS=[
 {id:1,bg:'#FFF5E8',theme:'#E67E22',dirt:10,instr:"🪥 Gosok semua kotoran di gigi Medi!",mission:"Clean Medi's Teeth",stars:'⭐',cTitle:"GREAT JOB!",cMsg:"Gigi Medi bersih!",cNote:"Day 1 selesai! Sikat lagi besok ya! 🦷"},
 {id:2,bg:'#FFFDE8',theme:'#F39C12',dirt:12,instr:"🪥 Sikat pelan-pelan, jangan terlewat!",mission:"Brush Before Going Out",stars:'⭐⭐',cTitle:"AWESOME!",cMsg:"Medi siap berangkat!",cNote:"Day 2 done! Konsisten ya! 🌟"},
 {id:3,bg:'#F0FFF4',theme:'#27AE60',dirt:14,instr:"🔍 Jangan lupa gigi belakang juga!",mission:"Clean Every Corner",stars:'⭐⭐',cTitle:"MISSION COMPLETE!",cMsg:"Kamu berhasil!",cNote:"Gigi belakang juga penting! 🦷"},
 {id:4,bg:'#E8F8F8',theme:'#17A589',dirt:16,instr:"💪 Cek semua sudut, jangan terlewat!",mission:"All Corners Clean",stars:'⭐⭐⭐',cTitle:"HALFWAY THERE! 🎉",cMsg:"Sudah 4 hari, amazing!",cNote:"Terus semangat sampai hari ke-7! 💪"},
 {id:5,bg:'#F0F0FF',theme:'#6C3483',dirt:18,instr:"💥 Deep clean! Gosok sampai bersih!",mission:"Deep Clean Mission",stars:'⭐⭐⭐',cTitle:"SO CLOSE!",cMsg:"Gigi Medi makin bersih!",cNote:"Tinggal 2 hari lagi! 🦷"},
 {id:6,bg:'#FFF0F6',theme:'#B03A6E',dirt:20,instr:"🧹 Weekend banyak jajan, gosok lebih keras!",mission:"Fight the Weekend Germs",stars:'⭐⭐⭐',cTitle:"WARRIOR COMPLETE!",cMsg:"Kamu berhasil!",cNote:"Satu hari lagi menuju 7-DAY HERO! 🏆"},
 {id:7,bg:'#FFFBEC',theme:'#B7860B',dirt:22,instr:"🌟 FINAL BOSS! Bersihkan semua gigi Medi!",mission:"Give Medi a Super Clean Smile",stars:'🌟🌟🌟',cTitle:"WEEK COMPLETE! 🏆",cMsg:"Medi punya senyum paling bersih!",cNote:"Kamu adalah 7-DAY HERO sejati! 🦷✨"},
];

function loadST(){var def={done:[],cur:1,tools:{brush:'biru',cup:'biru',odol:'biru'}};try{var o=JSON.parse(localStorage.getItem('medi7')||'null')||{};if(!o.done)o.done=[];if(!o.cur)o.cur=1;if(!o.tools)o.tools=def.tools;return o;}catch(e){return def;}}
function saveST(){try{localStorage.setItem('medi7',JSON.stringify(ST));}catch(e){}}
let ST=loadST(), cd=ST.cur;

const app=document.getElementById('app'),stage=document.getElementById('stage'),faceEl=document.getElementById('face');
const bg=document.getElementById('bg'),dirt=document.getElementById('dirt'),fx=document.getElementById('fx');
const bc=bg.getContext('2d'),dc=dirt.getContext('2d'),xc=fx.getContext('2d');
let W=0,H=0,FX=0,FY=0,FS=0; // face box left,top,size
let phase='',curDay=null,ip=1,ckPend=false;
let touching=false,lx=0,ly=0,brushHeld=false,bx=null,by=null;
let sparks=[],conf=[],t=0,rinseT=0,blinkV=0,blinkDir=0,blinkCd=70;
let scrub=0.32; // erase strength per rub — lower = harder to clean
let stinkPts=[],lastPct=0;
let pasteOn=false,pasteT=0;
let cupX,cupY,cupSz,brRestX,brRestY,brSz,BR,odolX,odolY;
let cupDX=0,cupDY=0,cupDrag=false;

function sx(f){return FX+f*FS;} function sy(f){return FY+f*FS;}

function layout(){
  W=app.clientWidth;H=app.clientHeight;
  [bg,dirt,fx].forEach(c=>{c.width=W;c.height=H;});
  FS=Math.min(W*0.98,H*0.52); FX=(W-FS)/2; FY=H*0.075;
  faceEl.style.left=FX+'px';faceEl.style.top=FY+'px';faceEl.style.width=FS+'px';faceEl.style.height=FS+'px';
  cupX=W*0.15;cupY=H*0.85;cupSz=H*0.065;odolX=W*0.5;odolY=H*0.86;brRestX=W*0.85;brRestY=H*0.85;brSz=H*0.1;BR=FS*0.075;
}

function rr(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();}

// ---- BACKGROUND ----
function drawBg(day){
  bc.clearRect(0,0,W,H);
  const g=bc.createLinearGradient(0,0,0,H);g.addColorStop(0,'#FCEFD6');g.addColorStop(1,'#F6E2C4');
  bc.fillStyle=g;bc.fillRect(0,0,W,H);
  bc.strokeStyle='rgba(192,143,103,.10)';bc.lineWidth=1;
  for(let x=0;x<W;x+=26){bc.beginPath();bc.moveTo(x,0);bc.lineTo(x,H);bc.stroke();}
  for(let y=0;y<H;y+=26){bc.beginPath();bc.moveTo(0,y);bc.lineTo(W,y);bc.stroke();}
}

// ---- DIRT (food on teeth) ----
function plaque(ctx,x,y,s,col,a){ctx.globalAlpha=a;ctx.fillStyle=col;ctx.beginPath();ctx.ellipse(x,y,s,s*(0.7+Math.random()*0.25),Math.random()*1.2,0,7);ctx.fill();ctx.globalAlpha=1;}
function germ(x,y,s){
  // spiky dark bug-germ (matches storyboard)
  dc.fillStyle='#302E38';for(let a=0;a<9;a++){const an=a/9*6.283;dc.beginPath();dc.moveTo(x,y);dc.lineTo(x+Math.cos(an-0.2)*s*1.2,y+Math.sin(an-0.2)*s*1.1);dc.lineTo(x+Math.cos(an+0.2)*s*1.2,y+Math.sin(an+0.2)*s*1.1);dc.closePath();dc.fill();}
  dc.fillStyle='#45424E';dc.beginPath();dc.ellipse(x,y,s,s*0.9,0,0,7);dc.fill();
  dc.fillStyle='#35333D';dc.beginPath();dc.ellipse(x,y+s*0.25,s*0.7,s*0.45,0,0,7);dc.fill();
  dc.fillStyle='#fff';dc.beginPath();dc.arc(x-s*0.32,y-s*0.12,s*0.27,0,7);dc.arc(x+s*0.32,y-s*0.12,s*0.27,0,7);dc.fill();
  dc.fillStyle='#1A1820';dc.beginPath();dc.arc(x-s*0.3,y-s*0.08,s*0.13,0,7);dc.arc(x+s*0.34,y-s*0.08,s*0.13,0,7);dc.fill();
  dc.fillStyle='#fff';dc.beginPath();dc.arc(x-s*0.35,y-s*0.14,s*0.05,0,7);dc.arc(x+s*0.29,y-s*0.14,s*0.05,0,7);dc.fill();
  dc.strokeStyle='#302E38';dc.lineWidth=s*0.1;dc.lineCap='round';dc.beginPath();dc.moveTo(x-s*0.45,y-s*0.85);dc.lineTo(x-s*0.6,y-s*1.15);dc.moveTo(x+s*0.45,y-s*0.85);dc.lineTo(x+s*0.6,y-s*1.15);dc.stroke();
}
function cavity(x,y,s){dc.fillStyle='#9A6534';dc.beginPath();dc.ellipse(x,y,s,s*0.8,0,0,7);dc.fill();dc.fillStyle='#5C3A18';dc.beginPath();dc.ellipse(x,y,s*0.55,s*0.42,0,0,7);dc.fill();}
function layDirt(day){
  dc.clearRect(0,0,W,H);dc.globalCompositeOperation='source-over';
  scrub=Math.max(0.14,0.28-(day.id-1)*0.02); // later days harder
  const s=FS*0.03;
  function band(b){
    const w=b[2]-b[0],h=b[3]-b[1];
    // filmy yellow plaque across the teeth
    const cols=Math.max(5,Math.round(day.dirt*0.7)),rows=2;
    for(let r=0;r<rows;r++)for(let i=0;i<cols;i++){
      const fxx=b[0]+w*((i+0.5)/cols)+(Math.random()-0.5)*w*0.05;
      const fyy=b[1]+h*((r+0.5)/rows)+(Math.random()-0.5)*h*0.14;
      plaque(dc,sx(fxx),sy(fyy),s*(0.9+Math.random()*0.5),'#E8D667',0.5+Math.random()*0.22);
    }
    // stubborn tartar near the gum line (more opaque = needs more scrubbing)
    const tn=Math.max(3,Math.round(day.dirt*0.35));
    for(let i=0;i<tn;i++){
      const fxx=b[0]+w*((i+0.5)/tn);
      const fyy=(b===UP)?b[3]-h*0.16:b[1]+h*0.16;
      plaque(dc,sx(fxx),sy(fyy),s*(0.65+Math.random()*0.4),'#CBAF37',0.92);
      if(Math.random()<0.35)plaque(dc,sx(fxx),sy(fyy),s*0.42,'#8A6B2E',0.8);
    }
  }
  band(UP);band(LO);
  // germs + cavities sitting on teeth (also brushable)
  const gN=2+Math.floor(day.id/2), cN=1+Math.floor(day.id/3);
  function pick(b,ny){const w=b[2]-b[0];return [b[0]+w*(0.15+Math.random()*0.7), b[1]+(b[3]-b[1])*ny];}
  for(let i=0;i<gN;i++){const b=Math.random()<0.5?UP:LO;const p=pick(b,0.35+Math.random()*0.3);germ(sx(p[0]),sy(p[1]),FS*0.032);}
  for(let i=0;i<cN;i++){const b=Math.random()<0.5?UP:LO;const p=pick(b,0.4+Math.random()*0.2);cavity(sx(p[0]),sy(p[1]),FS*0.03);}
  // stink sources (visual only, fade as teeth get clean)
  stinkPts=[[UP[0]+(UP[2]-UP[0])*0.28, UP[1]+(UP[3]-UP[1])*0.55],[LO[0]+(LO[2]-LO[0])*0.7, LO[1]+(LO[3]-LO[1])*0.5]];
  const d=dc.getImageData(0,0,W,H).data;ip=0;for(let i=3;i<d.length;i+=4)if(d[i]>20)ip++;ip=Math.max(ip,1);
}
function erase(x,y){
  dc.globalCompositeOperation='destination-out';
  const g=dc.createRadialGradient(x,y,0,x,y,BR);g.addColorStop(0,'rgba(0,0,0,'+scrub+')');g.addColorStop(.55,'rgba(0,0,0,'+(scrub*0.8)+')');g.addColorStop(1,'rgba(0,0,0,0)');
  dc.fillStyle=g;dc.beginPath();dc.arc(x,y,BR,0,7);dc.fill();dc.globalCompositeOperation='source-over';
  for(let i=0;i<2;i++)sparks.push({x,y,vx:(Math.random()-.5)*7,vy:-Math.random()*5-1,life:1,c:'hsl('+(40+Math.random()*90)+',100%,60%)'});
}

// ---- FACE OVERLAY FX (blink / happy eyes / bubbles) ----
function eyeCover(b,happy){
  EYE.forEach(e=>{
    const cx=sx(e[0]),cy=sy(e[1]),rx=FS*0.072,ry=FS*0.085;
    xc.save();xc.beginPath();xc.ellipse(cx,cy,rx,ry,0,0,7);xc.clip();
    xc.fillStyle=SKIN;
    if(happy){xc.fillRect(cx-rx,cy-ry,rx*2,ry*2);}
    else{xc.fillRect(cx-rx,cy-ry,rx*2,2*ry*b);}
    xc.restore();
    if(happy){xc.strokeStyle='#3a1e12';xc.lineWidth=FS*0.012;xc.lineCap='round';xc.beginPath();xc.arc(cx,cy+ry*0.35,rx*0.75,Math.PI*1.18,Math.PI*1.82);xc.stroke();}
    else if(b>0.12){xc.strokeStyle='#3a1e12';xc.lineWidth=FS*0.009;xc.lineCap='round';xc.beginPath();xc.moveTo(cx-rx*0.9,cy-ry+2*ry*b);xc.lineTo(cx+rx*0.9,cy-ry+2*ry*b);xc.stroke();}
  });
}
function drawBubbles(){
  const mcx=sx(0.5),mcy=sy(0.82),mw=FS*(UP[2]-UP[0])*0.5,mh=FS*0.09;
  xc.fillStyle='rgba(90,185,240,'+Math.min(.6,rinseT*.4)+')';
  xc.beginPath();xc.ellipse(mcx,mcy,mw*0.7,mh,0,0,7);xc.fill();
  for(let b=0;b<9;b++){const x=mcx+Math.sin(rinseT*4.2+b*1.15)*mw*0.55;const y=mcy+Math.cos(rinseT*3.5+b*0.95)*mh*0.7;const r=3+Math.sin(rinseT*2.8+b)*2.6;xc.fillStyle='rgba(255,255,255,'+(.55+Math.sin(rinseT+b)*.2)+')';xc.beginPath();xc.arc(x,y,r,0,7);xc.fill();}
  xc.fillStyle='rgba(240,250,255,.6)';xc.beginPath();xc.ellipse(mcx,mcy-mh*0.9,mw*0.5,mh*0.4,0,0,7);xc.fill();
}

// ---- COMPANIONS ----
function drawCup(x,y,s,glow,bounce){
  const by=Math.sin(bounce*6.283)*s*.08;xc.save();xc.translate(x,y+by);
  if(glow){xc.shadowColor='#F7C948';xc.shadowBlur=28;}
  xc.fillStyle='#F7C948';xc.strokeStyle='#D4860A';xc.lineWidth=s*.04;
  xc.beginPath();xc.moveTo(-s*.28,-s*.5);xc.lineTo(-s*.32,s*.42);xc.quadraticCurveTo(-s*.32,s*.52,-s*.22,s*.52);xc.lineTo(s*.22,s*.52);xc.quadraticCurveTo(s*.32,s*.52,s*.32,s*.42);xc.lineTo(s*.28,-s*.5);xc.closePath();xc.fill();xc.stroke();
  xc.beginPath();xc.ellipse(0,-s*.5,s*.28,s*.08,0,0,7);xc.fill();xc.stroke();xc.shadowBlur=0;
  xc.fillStyle='#2C1810';xc.beginPath();xc.arc(-s*.09,-s*.04,s*.05,0,7);xc.fill();xc.beginPath();xc.arc(s*.09,-s*.04,s*.05,0,7);xc.fill();
  xc.strokeStyle='#2C1810';xc.lineWidth=s*.04;xc.beginPath();xc.arc(0,s*.14,s*.1,.3,Math.PI-.3);xc.stroke();
  if(glow){xc.fillStyle='#C0392B';xc.font='900 '+(s*.28)+'px Nunito,sans-serif';xc.textAlign='center';xc.textBaseline='middle';xc.fillText('KUMUR!',0,-s*.9);}
  xc.restore();
}
function drawRestBrush(x,y,s){xc.save();xc.translate(x,y);xc.rotate(-.15);xc.fillStyle='#27AE60';xc.strokeStyle='#1E8449';xc.lineWidth=s*.04;rr(xc,-s*.14,-s*.55,s*.28,s*.7,s*.09);xc.fill();xc.stroke();xc.fillStyle='#2ECC71';rr(xc,-s*.17,-s*.75,s*.34,s*.26,s*.07);xc.fill();xc.stroke();xc.strokeStyle='rgba(255,255,255,.9)';xc.lineWidth=s*.05;xc.lineCap='round';for(let i=0;i<4;i++){const bx=-s*.12+i*s*.08;xc.beginPath();xc.moveTo(bx,-s*.7);xc.lineTo(bx,-s*.54);xc.stroke();}xc.restore();}
function drawActiveBrush(x,y,s){xc.save();xc.translate(x,y);xc.rotate(-.45);xc.fillStyle='rgba(255,255,255,.9)';xc.beginPath();xc.ellipse(0,-s*.32,s*.2,s*.1,0,0,7);xc.fill();xc.strokeStyle='rgba(255,255,255,.92)';xc.lineWidth=s*.055;xc.lineCap='round';for(let i=0;i<4;i++){const bx=-s*.12+i*s*.085;xc.beginPath();xc.moveTo(bx,-s*.25);xc.lineTo(bx,-s*.08);xc.stroke();}xc.fillStyle='#2ECC71';xc.strokeStyle='#1E8449';xc.lineWidth=s*.04;rr(xc,-s*.18,-s*.27,s*.36,s*.3,s*.07);xc.fill();xc.stroke();xc.fillStyle='#27AE60';rr(xc,-s*.14,-s*.02,s*.28,s*.62,s*.09);xc.fill();xc.stroke();xc.restore();}

// ---- LOOP ----
function loop(){
  if(!ST.tools)ST.tools={brush:'biru',cup:'biru',odol:'biru'};
  t+=.04;rinseT+=.055;if(phase==='pasting')pasteT+=0.04;
  // blink
  if(blinkDir===0){if(--blinkCd<=0){blinkDir=1;blinkCd=90+Math.floor(Math.random()*120);}}
  else{blinkV=Math.max(0,Math.min(1,blinkV+blinkDir*.22));if(blinkV>=1)blinkDir=-1;else if(blinkV<=0)blinkDir=0;}
  // gentle breathing
  stage.style.transform='none'; // teeth stay fixed

  xc.clearRect(0,0,W,H);
  const playing=(phase==='brush'||phase==='rinse'||phase==='rinsing');
  const toolsOn=(phase==='paste'||phase==='pasting'||playing);
  const done=(phase==='done');
  // blink disabled for illustrated face
  if(phase==='rinsing') drawBubbles();
  // sparkles
  sparks=sparks.filter(s=>{s.x+=s.vx;s.y+=s.vy;s.vy+=.2;s.life-=.07;if(s.life<=0)return false;xc.globalAlpha=s.life;xc.fillStyle=s.c;xc.beginPath();xc.arc(s.x,s.y,2.5+s.life*3.5,0,7);xc.fill();xc.globalAlpha=1;return true;});
  // confetti
  conf=conf.filter(c=>{c.x+=c.vx;c.y+=c.vy;c.rot+=c.rs;c.vy*=.985;if(c.y>H+20)return false;xc.save();xc.translate(c.x,c.y);xc.rotate(c.rot);xc.fillStyle=c.col;if(c.sq)xc.fillRect(-c.sz/2,-c.sz/4,c.sz,c.sz/2);else{xc.beginPath();for(let j=0;j<5;j++){const a=j/5*6.283-1.57;xc.lineTo(Math.cos(a)*c.sz*.5,Math.sin(a)*c.sz*.5);}xc.closePath();xc.fill();}xc.restore();return true;});
  if(phase==='brush'){const sa=Math.max(0,1-lastPct/0.85);if(sa>0.02)stinkPts.forEach((p,idx)=>{const bx2=sx(p[0]),by2=sy(p[1]);for(let i=0;i<3;i++){const ph=((t*0.5)+(i*0.34)+idx*0.5)%1;const yy=by2-ph*FS*0.17;const xx=bx2+Math.sin((t+i*2)*2.2)*FS*0.022;const r=FS*0.018*(0.6+ph);xc.globalAlpha=sa*(1-ph)*0.45;xc.fillStyle='#9AA0A6';xc.beginPath();xc.arc(xx,yy,r,0,7);xc.fill();}});xc.globalAlpha=1;}
  if(toolsOn){
    const cI=toolImg['CUP_'+ST.tools.cup];
    const pasteCol=ST.tools.odol==='hijau'?'#86D98F':'#7FC9F2';
    if(phase==='rinse'){xc.save();xc.shadowColor='#F7C948';xc.shadowBlur=26;drawImgC(cI,cupDX,cupDY,cupSz*2.4,0);xc.restore();xc.fillStyle='rgba(231,76,60,.95)';xc.font='900 '+(cupSz*0.5)+'px Nunito,sans-serif';xc.textAlign='center';xc.textBaseline='middle';xc.fillText('⬆ SERET KE MULUT',sx(0.5),sy(0.99));}
    else if(phase==='rinsing'){drawImgC(cI,sx(0.5),sy(0.70),cupSz*2.3,0);}
    else drawImgC(cI,cupX,cupY,cupSz*2.1,t);
    if(phase==='pasting'){const k=Math.min(1,pasteT/0.5);drawImgC(toolImg['ODOL_'+ST.tools.odol],odolX+(brRestX-odolX)*k,odolY+((brRestY-brSz*1.05)-odolY)*k,brSz*1.2,t);}
    else{const oh=brSz*1.25*(phase==='paste'?(1+Math.sin(t*5)*0.05):1);drawImgC(toolImg['ODOL_'+ST.tools.odol],odolX,odolY,oh,phase==='paste'?t:t*0.8);if(phase==='paste'){xc.save();xc.fillStyle='#C0392B';xc.font='900 '+(brSz*0.26)+'px Nunito,sans-serif';xc.textAlign='center';xc.textBaseline='middle';xc.fillText('👆 TAP',odolX,odolY-brSz*0.98);xc.restore();}}
    if(phase==='brush'&&brushHeld&&bx!==null){var _bu=toolImg['BRUSH_'+ST.tools.brush+'_use'],_bi=_bu||toolImg['BRUSH_'+ST.tools.brush+'_stand'];if(_bu)drawBrushAt(_bi,bx,by,brSz*1.6,0.18,0.30);else drawBrushAt(_bi,bx,by,brSz*2.0,0.5,0.10);if(pasteOn){xc.fillStyle=pasteCol;xc.beginPath();xc.ellipse(bx+brSz*0.04,by-brSz*0.04,brSz*0.13,brSz*0.08,0,0,7);xc.fill();}}
    else{drawImgC(toolImg['BRUSH_'+ST.tools.brush+'_stand'],brRestX,brRestY,brSz*1.7);if(phase==='pasting'||pasteOn){const amt=phase==='pasting'?Math.min(1,pasteT/0.8):1;xc.fillStyle=pasteCol;xc.beginPath();xc.ellipse(brRestX,brRestY-brSz*0.82,brSz*0.22*amt,brSz*0.12*amt,0,0,7);xc.fill();}}
  }
  requestAnimationFrame(loop);
}

// ---- PROGRESS ----
function schedCheck(){
  if(ckPend||phase!=='brush')return;ckPend=true;
  setTimeout(()=>{ckPend=false;if(phase!=='brush')return;
    const d=dc.getImageData(0,0,W,H).data;let rem=0;for(let i=3;i<d.length;i+=4)if(d[i]>20)rem++;
    const pct=1-rem/ip;setPct(pct);if(pct>=.9)endBrush();},200);
}
function setPct(p){lastPct=p;const v=Math.min(100,Math.round(p*100));document.getElementById('pFill').style.width=v+'%';const el=document.getElementById('pPct');el.textContent=v+'%';el.style.color=v>=70?'#27AE60':v>=40?'#E67E22':'#C0392B';}
function setInstr(m){const el=document.getElementById('instrBox');el.textContent=m;el.style.opacity='1';}
function endBrush(){setPct(1);phase='brushdone';showBrushDone();}
function startKumur(){phase='rinse';cupDX=W*0.22;cupDY=H*0.70;cupDrag=false;showScreen(null);setInstr('💧 Seret gelas ke mulut Medi untuk kumur!');}
function startGargle(){phase='rinsing';rinseT=0;document.getElementById('instrBox').style.opacity='0';setTimeout(function(){phase='done';showResult();},1700);}

// ---- INPUT ----
function pos(e){const r=dirt.getBoundingClientRect(),sX=W/r.width,sY=H/r.height,s=e.touches?e.touches[0]:e;return{x:(s.clientX-r.left)*sX,y:(s.clientY-r.top)*sY};}
function startPaste(){phase='pasting';pasteT=0;setInstr('💧 Lagi oles pasta...');setTimeout(function(){pasteOn=true;phase='brush';setInstr(curDay.instr);},800);}
function onStart(e){e.preventDefault();if(phase==='done')return;const p=pos(e);
  if(phase==='paste'){if(Math.hypot(p.x-odolX,p.y-odolY)<brSz*1.1)startPaste();return;}
  if(phase==='pasting')return;
  if(phase==='rinse'){if(Math.hypot(p.x-cupDX,p.y-cupDY)<cupSz*2.8){cupDrag=true;cupDX=p.x;cupDY=p.y;}return;}
  if(phase!=='brush')return;touching=true;brushHeld=true;bx=p.x;by=p.y;lx=p.x;ly=p.y;erase(p.x,p.y);schedCheck();}
function onMove(e){if(phase==='rinse'&&cupDrag){e.preventDefault();const p=pos(e);cupDX=p.x;cupDY=p.y;if(Math.hypot(cupDX-sx(0.5),cupDY-sy(0.80))<FS*0.17)startGargle();return;}e.preventDefault();if(!touching||phase!=='brush')return;const p=pos(e);bx=p.x;by=p.y;const st=Math.max(1,Math.floor(Math.hypot(p.x-lx,p.y-ly)/8));for(let i=1;i<=st;i++)erase(lx+(p.x-lx)*i/st,ly+(p.y-ly)*i/st);lx=p.x;ly=p.y;schedCheck();}
function onEnd(e){e.preventDefault();touching=false;brushHeld=false;bx=null;by=null;cupDrag=false;}
dirt.addEventListener('touchstart',onStart,{passive:false});dirt.addEventListener('touchmove',onMove,{passive:false});dirt.addEventListener('touchend',onEnd,{passive:false});
dirt.addEventListener('mousedown',onStart);dirt.addEventListener('mousemove',onMove);window.addEventListener('mouseup',onEnd);

// ---- SCREENS ----
function showScreen(id){['scrSplash','scrHome','scrSelect','scrPrep','scrBrushDone','scrComplete','scrHero','scrCollection'].forEach(s=>document.getElementById(s).classList.add('off'));if(id)document.getElementById(id).classList.remove('off');}
const FACE_SRC=faceEl.src;
function drawImgC(img,cx,cy,h,bounce){if(!img||!img.complete||!img.naturalWidth)return;const w=img.naturalWidth/img.naturalHeight*h;const by=bounce?Math.sin(bounce*6.283)*h*0.05:0;xc.drawImage(img,cx-w/2,cy-h/2+by,w,h);}
function drawBrushAt(img,bx,by,h,fx,fy){if(!img||!img.complete||!img.naturalWidth)return;const w=img.naturalWidth/img.naturalHeight*h;const cx=bx+w*(0.5-fx),cy=by+h*(0.5-fy);xc.drawImage(img,cx-w/2,cy-h/2,w,h);}
function buildSel(){
  const defs={brush:[['biru','BRUSH_biru_stand'],['pink','BRUSH_pink_stand'],['hijau','BRUSH_hijau_stand']],cup:[['biru','CUP_biru'],['kuning','CUP_kuning'],['pink','CUP_pink']],odol:[['biru','ODOL_biru'],['hijau','ODOL_hijau'],['pink','ODOL_pink']]};
  [['brush','selBrush'],['cup','selCup'],['odol','selOdol']].forEach(function(pair){var kind=pair[0],row=document.getElementById(pair[1]);row.innerHTML='';defs[kind].forEach(function(o){var val=o[0],imgk=o[1];var d=document.createElement('div');d.className='sel-opt'+(ST.tools[kind]===val?' sel':'');d.innerHTML='<img loading="lazy" src="'+TOOLIMG[imgk]+'">';d.onclick=function(){ST.tools[kind]=val;saveST();Array.prototype.forEach.call(row.children,function(e){e.classList.remove('sel');});d.classList.add('sel');};row.appendChild(d);});});
}
function showSelect(){buildSel();var day=DAYS[cd-1];document.getElementById('scrSelect').style.background='linear-gradient(160deg,#FCEFD6,#F6E2C4)';document.getElementById('btnPlay').style.background=day.theme;showScreen('scrSelect');}
document.getElementById('btnPlay').onclick=showPrep;
function showPrep(){var day=DAYS[cd-1];document.getElementById('prepMedi').src=POSES.MEDI_BRUSH;document.getElementById('scrPrep').style.background='linear-gradient(160deg,#FCEFD6,#F6E2C4)';document.getElementById('btnPrep').style.background=day.theme;showScreen('scrPrep');}
document.getElementById('btnPrep').onclick=startGame;
function showBrushDone(){var day=DAYS[cd-1];document.getElementById('bdMedi').src=POSES.MEDI_HORE;document.getElementById('scrBrushDone').style.background='linear-gradient(160deg,#FCEFD6,#F6E2C4)';document.getElementById('btnKumur').style.background=day.theme;showScreen('scrBrushDone');}
document.getElementById('btnKumur').onclick=startKumur;
function showCollection(){var g=document.getElementById('collGrid');g.innerHTML='';DAYS.forEach(function(d){var done=ST.done.indexOf(d.id)>=0,unlocked=(d.id===1||ST.done.indexOf(d.id-1)>=0||done),active=(d.id===cd&&unlocked&&!done);var cls='coll-cell'+(done?' done':active?' active':unlocked?'':' lock');var inner=unlocked?('<img loading="lazy" src="'+POSES.MEDI_AVATAR+'">'):'<div class="lk">🔒</div>';var el=document.createElement('div');el.className=cls;el.innerHTML=inner+'<div class="coll-lbl">Hari '+d.id+(done?' ✓':'')+'</div>';g.appendChild(el);});showScreen('scrCollection');}
document.getElementById('btnCollBack').onclick=function(){showScreen('scrHome');renderHome();};
document.getElementById('btnColl').onclick=showCollection;
document.getElementById('splashMedi').src=POSES.MEDI_BRUSH;
document.getElementById('btnPlaySplash').onclick=function(){showScreen('scrHome');renderHome();};
function renderHome(){
  var maxU=1;for(var k=1;k<=7;k++){if(k===1||ST.done.indexOf(k-1)>=0)maxU=k;}
  if(cd>maxU)cd=maxU;
  const day=DAYS[cd-1];
  document.getElementById('scrHome').style.background='linear-gradient(160deg,#FCEFD6,#F6E2C4)';
  document.getElementById('homeChip').style.background=day.theme;
  var ttl=document.querySelector('#scrHome .home-title');if(ttl)ttl.innerHTML='Pilih Hari';
  var hf=document.getElementById('homeFace');hf.src=POSES.MEDI_BRUSH;hf.style.borderRadius='0';hf.style.objectFit='contain';hf.style.height='150px';hf.style.width='auto';hf.style.background='none';
  const tr=document.getElementById('tracker');tr.className='tracker grid';tr.innerHTML='';
  DAYS.forEach(function(d){var done=ST.done.indexOf(d.id)>=0,unlocked=(d.id===1||ST.done.indexOf(d.id-1)>=0||done),active=(d.id===cd&&unlocked&&!done);
    var cls='day-card'+(done?' done':active?' active':unlocked?'':' lock');
    var inner=done?'✓':(unlocked?d.id:'🔒');
    var el=document.createElement('div');el.className=cls;el.innerHTML='<div style="font-size:18px">'+inner+'</div><small>Hari '+d.id+'</small>';
    if(unlocked)el.onclick=function(){cd=d.id;ST.cur=cd;saveST();renderHome();};
    tr.appendChild(el);});
  const btn=document.getElementById('btnStart');btn.style.background=day.theme;
  if(ST.done.length===7){btn.textContent='🏆 Lihat Hadiah';btn.onclick=showHero;}
  else{btn.textContent='Mulai Hari '+cd+' ▶';btn.onclick=showSelect;}
}
function startGame(){
  const day=DAYS[cd-1];curDay=day;layout();
  faceEl.src=ASSET.GAMEFACE;ld(['BRUSH_'+ST.tools.brush+'_use','BRUSH_'+ST.tools.brush+'_stand','CUP_'+ST.tools.cup,'ODOL_'+ST.tools.odol]);
  phase='paste';pasteOn=false;pasteT=0;sparks=[];conf=[];rinseT=0;brushHeld=false;bx=by=null;touching=false;
  drawBg(day);layDirt(day);setPct(0);
  document.getElementById('dayLbl').textContent='🪥 DAY '+cd+'/7';
  document.getElementById('pFill').style.background='linear-gradient(90deg,'+day.theme+',#F7C948)';
  setInstr('👆 Tap odol dulu untuk oles pasta ke sikat!');showScreen(null);
}
function spawnConfetti(){const cols=['#F7C948','#C0392B','#27AE60','#3498DB','#9B59B6','#E91E63','#FF5722'];for(let i=0;i<90;i++)conf.push({x:Math.random()*W,y:-10-Math.random()*80,vx:(Math.random()-.5)*4,vy:2.5+Math.random()*3,rot:Math.random()*6.283,rs:(Math.random()-.5)*.22,sz:6+Math.random()*9,col:cols[i%cols.length],sq:Math.random()>.5});}
function showResult(){
  const day=DAYS[cd-1];spawnConfetti();
  document.getElementById('celStars').textContent=day.stars;
  document.getElementById('celTitle').textContent='Hebat! Hari '+cd+' selesai!';
  document.getElementById('celMsg').textContent='';
  document.getElementById('celNote').textContent='Yeay! Gigiku sudah bersih! Sekarang giliran kamu, yuk sikat gigi bareng Medi!';
  document.getElementById('dayCheck').innerHTML='<div class="cl-item"><span>✅</span><span>Menyikat gigi</span></div><div class="cl-item"><span>✅</span><span>Berkumur</span></div><div class="cl-item"><span>✅</span><span>Gigi bersih dan sehat</span></div>';
  document.getElementById('scrComplete').style.background='linear-gradient(160deg,#FCEFD6,#F6E2C4)';
  var df=document.getElementById('doneFace');df.src=POSES.MEDI_HORE;df.style.borderRadius='0';df.style.objectFit='contain';df.style.height='160px';df.style.width='auto';df.style.background='none';
  if(ST.done.indexOf(cd)<0)ST.done.push(cd);
  const next=cd+1,btn=document.getElementById('btnNext');btn.style.background=day.theme;
  if(next<=7){ST.cur=next;saveST();btn.textContent='Lanjut Hari '+next+' ▶';btn.onclick=function(){cd=next;renderHome();showScreen('scrHome');};}
  else{saveST();btn.textContent='🏆 Lihat Hadiah';btn.onclick=showHero;}
  showScreen('scrComplete');
}
function showHero(){
  const day=DAYS[6];spawnConfetti();
  document.getElementById('scrHero').style.background='linear-gradient(160deg,#FCEFD6,#F6E2C4)';
  document.getElementById('heroBanner').style.background='linear-gradient(135deg,'+day.theme+',#E67E22)';
  var hrf=document.getElementById('heroFace');hrf.src=POSES.MEDI_TROPHY;hrf.style.borderRadius='0';hrf.style.objectFit='contain';hrf.style.height='175px';hrf.style.width='auto';hrf.style.background='none';
  document.getElementById('checklist').innerHTML='';
  document.getElementById('btnAgain').onclick=function(){ST={done:[],cur:1,tools:(ST&&ST.tools)||{brush:'biru',cup:'biru',odol:'biru'}};cd=1;saveST();renderHome();showScreen('scrHome');};
  var bh=document.getElementById('btnHome');if(bh)bh.onclick=function(){showScreen('scrSplash');};
  showScreen('scrHero');
}
document.getElementById('btnReset').addEventListener('click',function(){ST={done:[],cur:1,tools:(ST&&ST.tools)||{brush:'biru',cup:'biru',odol:'biru'}};cd=1;saveST();renderHome();});
window.addEventListener('resize',function(){layout();if(curDay&&phase)drawBg(curDay);});

// ---- BOOT ----
function boot(){layout();renderHome();loop();}
if(faceEl.complete)boot();else faceEl.addEventListener('load',boot);
