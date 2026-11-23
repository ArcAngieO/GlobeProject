"use strict";
/* =====================================================================
   PLACEHOLDER DATA — swap these functions for real datasets / APIs.
   ===================================================================== */
const CITIES = [
  {name:"London",lat:51.5,lon:-0.1,base:.82,g:.7},{name:"Paris",lat:48.9,lon:2.35,base:.78,g:.7},
  {name:"Cairo",lat:30.0,lon:31.2,base:.7,g:1.1},{name:"Lagos",lat:6.5,lon:3.4,base:.45,g:1.5},
  {name:"Istanbul",lat:41.0,lon:29.0,base:.66,g:1.1},{name:"Nairobi",lat:-1.3,lon:36.8,base:.35,g:1.4},
  {name:"Cape Town",lat:-33.9,lon:18.4,base:.5,g:.9},{name:"Dubai",lat:25.2,lon:55.3,base:.4,g:1.6},
  {name:"Moscow",lat:55.75,lon:37.6,base:.74,g:.8},{name:"Mumbai",lat:19.1,lon:72.9,base:.5,g:1.3},
  {name:"Tokyo",lat:35.7,lon:139.7,base:.92,g:.5},{name:"Shanghai",lat:31.2,lon:121.5,base:.5,g:1.5},
  {name:"New York",lat:40.7,lon:-74.0,base:.9,g:.55},{name:"São Paulo",lat:-23.5,lon:-46.6,base:.62,g:1},
  {name:"Mexico City",lat:19.4,lon:-99.1,base:.6,g:1},{name:"Sydney",lat:-33.9,lon:151.2,base:.68,g:.7},
  {name:"Seattle",lat:47.6,lon:-122.3,base:.6,g:.8},{name:"Kinshasa",lat:-4.3,lon:15.3,base:.28,g:1.5},
];
const MONTHS=["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
const MONTHS_LONG=["January","February","March","April","May","June","July","August","September","October","November","December"];
const DOW=["SUN","MON","TUE","WED","THU","FRI","SAT"];
function hash(str){let h=2166136261;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619)}return ((h>>>0)%100000)/100000}
// clamped here (not at each call site) since the timeline can now scrub to historical/BCE years
// via the era strip, far outside the archive's real 1990-2026 sample-data range; Math.pow() below
// would otherwise NaN on a negative t.
const yearT=y=>(Math.max(1990,Math.min(2026,y))-1990)/36;
function lightIndex(c,d){
  const t=yearT(d.y+(d.m-1)/12);
  const growth=Math.min(1,c.base*(0.55+0.45*Math.pow(t,0.8)*c.g+0.12*t));
  const season=1+0.04*Math.sin((d.m/12)*Math.PI*2+c.lon/50);
  const noise=(hash(c.name+d.y+"-"+d.m+"-"+d.d)-.5)*0.05;
  return Math.max(0.05,Math.min(0.99,growth*season+noise));
}
function stats(d){
  const t=yearT(d.y+(d.m-1)/12), n=hash("s"+d.y+d.m+d.d);
  const prev=yearT(d.y-1+(d.m-1)/12);
  const reg=r=>Math.round(380+900*Math.pow(r,0.9));
  const a=reg(t)+Math.round(n*20), b=reg(prev);
  return {regions:a,delta:((a-b)/b*100),points:(4.2+44*Math.pow(t,1.3)+n*.4),cities:Math.round(2300+7300*Math.pow(t,.85)+n*30)};
}
const EVENT_TYPES=[
  {k:"INFRASTRUCTURE",t:c=>`${c.name} grid expansion goes live`,f:["MW ADDED","DISTRICTS","HOMES (K)"],v:r=>[Math.round(200+r*900),Math.round(4+r*20),Math.round(40+r*400)],
   s:c=>`A major power-grid expansion came online around ${c.name}, lighting up several new districts. On the globe this shows up as a sharp rise in night-time light for the region.`},
  {k:"CULTURE · FESTIVAL",t:c=>`Citywide festival in ${c.name}`,f:["VISITORS (K)","VENUES","DAYS"],v:r=>[Math.round(120+r*900),Math.round(20+r*160),Math.round(2+r*8)],
   s:c=>`A large citywide festival opened in ${c.name}. Night-time activity peaked well above the usual seasonal level for this time of year.`},
  {k:"WEATHER · STORM",t:c=>`Severe storm near ${c.name}`,f:["WIND KM/H","OUTAGES (K)","HRS DARK"],v:r=>[Math.round(90+r*120),Math.round(10+r*300),Math.round(4+r*40)],
   s:c=>`A severe storm system moved through the ${c.name} region, causing widespread power outages. The light index dipped for several days before recovering.`},
  {k:"TRANSPORT",t:c=>`New transit line opens in ${c.name}`,f:["KM OF TRACK","STATIONS","RIDERS/DAY (K)"],v:r=>[Math.round(8+r*60),Math.round(6+r*30),Math.round(50+r*500)],
   s:c=>`A new rapid-transit line opened in ${c.name}, connecting outer neighborhoods to the city center. New development followed along the route over the next few years.`},
  {k:"SCIENCE · SATELLITE",t:c=>`Satellite survey maps ${c.name}`,f:["IMAGES","RES (M)","KM² MAPPED (K)"],v:r=>[Math.round(1000+r*9000),Math.round(1+r*30),Math.round(5+r*90)],
   s:c=>`A new satellite survey captured high-resolution imagery of the ${c.name} region, adding thousands of data points to the archive for this date.`},
];
function eventFor(d){
  const r=hash("ev"+d.y+d.m+d.d), r2=hash("ev2"+d.d+d.m+d.y);
  const c=CITIES[Math.floor(r*CITIES.length)], T=EVENT_TYPES[Math.floor(r2*EVENT_TYPES.length)];
  return {city:c,type:T,title:T.t(c),facts:T.f.map((f,i)=>[T.v(hash(f+d.y+d.m+d.d))[i],f]),summary:T.s(c)};
}

/* =====================================================================
   STATE
   ===================================================================== */
const S={y:2018,m:6,d:14};
const $=id=>document.getElementById(id);
// new Date(y,...) silently adds 1900 to any y in [0,99], so build via setFullYear instead —
// matters here since the timeline now reaches historical (even BCE, as negative y) dates.
function makeDate(y,m,d){const dt=new Date(0,m-1,d);dt.setFullYear(y);return dt}
const dim=(y,m)=>{const dt=new Date(0,m,0);dt.setFullYear(y);return dt.getDate()};
const clampYear=y=>Math.max(1990,Math.min(2026,y));
const yearStr=y=>y<0?`${-y} BCE`:y<1000?`${y} CE`:`${y}`;

/* =====================================================================
   GLOBE v3 — 2D canvas, deep zoom.
   Ideas borrowed from cambecc/earth (MIT): d3 orthographic projection
   with proper horizon clipping, Natural Earth TopoJSON at 110m/50m/10m
   switched by zoom + interaction, animated wind particles with fading
   trails, and click-to-probe readouts.
   ===================================================================== */
const canvas=$("globe"), ctx=canvas.getContext("2d");
const windCv=$("wind"), wctx=windCv.getContext("2d");
const QUALITY=Math.min(devicePixelRatio||1,1.25);
const D2R=Math.PI/180;
const smoothstep=(a,b,x)=>{x=Math.max(0,Math.min(1,(x-a)/(b-a)));return x*x*(3-2*x)};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const ZMIN=0.75, ZMAX=40;
const view={lon:18,lat:12,vlon:0,vlat:0,tLon:null,tLat:null,z:1,tz:1};
const G={growth:.7};
const LAYERS={wind:true,lights:true,grid:true,borders:true};

function decode(b64){const s=atob(b64),a=new Uint8Array(s.length);for(let i=0;i<s.length;i++)a[i]=s.charCodeAt(i);return a}
const landBits=decode(EARTH.land), LW=EARTH.landW, LH=EARTH.landH;
const isLand=(x,y)=>{x=((x%LW)+LW)%LW;y=clamp(y,0,LH-1);const i=y*LW+x;return (landBits[i>>3]>>(7-(i&7)))&1};
const landAt=(lat,lon)=>isLand(Math.floor((lon+180)/360*LW),Math.floor((90-lat)/180*LH));
const lightMap=decode(EARTH.light);
const lightAt=(lat,lon)=>lightMap[clamp(Math.floor((90-lat)/180*360),0,359)*720+clamp(Math.floor((lon+180)/360*720),0,719)]/255;
const vec=(lat,lon)=>{const a=lat*D2R,b=lon*D2R;return {x:Math.cos(a)*Math.sin(b),y:Math.sin(a),z:Math.cos(a)*Math.cos(b)}};

/* ---------- map geometry (TopoJSON -> GeoJSON), multi-resolution ---------- */
const GEO={};
function loadGeo(r){if(GEO[r]||!TOPO[r])return;const t=TOPO[r];
  const land=topojson.feature(t,t.objects.land);
  // a few tiny 10m islands have reversed winding (they'd fill the whole sphere): flip them
  for(const f of land.features){const g=f.geometry;if(g.type!=="MultiPolygon")continue;
    g.coordinates=g.coordinates.map(poly=>d3.geoArea({type:"Polygon",coordinates:poly})>2*Math.PI?poly.map(ring=>ring.slice().reverse()):poly)}
  GEO[r]={land,borders:topojson.mesh(t,t.objects.countries,(a,b)=>a!==b),countries:topojson.feature(t,t.objects.countries)};}
loadGeo("110m");loadGeo("50m");
let activeRes="110m";

/* ---------- state/province borders (separate, self-contained topology) ---------- */
const GEO_STATES={};
function loadStatesGeo(key){if(GEO_STATES[key]||!TOPO[key])return;const t=TOPO[key];
  GEO_STATES[key]={features:topojson.feature(t,t.objects.states).features,mesh:topojson.mesh(t,t.objects.states,(a,b)=>a!==b)};}
loadStatesGeo("110m_states");loadStatesGeo("50m_states");
const statesKeyFor=res=>res==="110m"?"110m_states":"50m_states";
function featureAt(features,lon,lat){
  if(!features)return null;
  for(let i=0;i<features.length;i++) if(d3.geoContains(features[i],[lon,lat])) return features[i];
  return null;
}
let hiResLoading=false;
function requestHiRes(){ // 10m data is large: only fetched when the user zooms in deep
  if(GEO["10m"]||hiResLoading)return;hiResLoading=true;
  const s=document.createElement("script");s.src="src/data/topo10m.js";s.onload=()=>{loadGeo("10m");needsRedraw=true};document.head.appendChild(s);
}
const graticules={};
function graticule(step){return graticules[step]||(graticules[step]=d3.geoGraticule().step([step,step]).precision(1)())}

/* ---------- land dots (fibonacci sphere) for the low-zoom hologram look ---------- */
let PX,PY,PZ,PC,PL,PLS,PS,NP;
{
  const N=230000, ga=Math.PI*(1+Math.sqrt(5)), tmp=[];
  for(let i=0;i<N;i++){
    const phi=Math.acos(1-2*(i+.5)/N), th=ga*(i+.5);
    const lat=90-phi/D2R, lon=((th/D2R)%360+540)%360-180;
    const x=Math.floor((lon+180)/360*LW), y=Math.floor((90-lat)/180*LH);
    if(!isLand(x,y)) continue;
    let coast=0; for(const [dx,dy] of [[3,0],[-3,0],[0,3],[0,-3],[2,2],[-2,-2],[2,-2],[-2,2]]) if(!isLand(x+dx,y+dy)) coast=1;
    const p=vec(lat,lon); tmp.push(p.x,p.y,p.z,coast,lightAt(lat,lon),Math.random());
  }
  NP=tmp.length/6;[PX,PY,PZ,PC,PL,PS]=[0,0,0,0,0,0].map(()=>new Float32Array(NP));
  for(let i=0;i<NP;i++){PX[i]=tmp[i*6];PY[i]=tmp[i*6+1];PZ[i]=tmp[i*6+2];PC[i]=tmp[i*6+3];PL[i]=tmp[i*6+4];PS[i]=tmp[i*6+5]}
  PLS=new Float32Array(NP);for(let i=0;i<NP;i++)PLS[i]=PL[i]*smoothstep(0.03,0.25,PL[i]);
}
const POW=new Float32Array(1024);for(let i=0;i<1024;i++)POW[i]=Math.pow(i/1023,0.6);
const SPRITES={};
function sprite(d){
  const k=Math.round(d*4); if(SPRITES[k])return SPRITES[k];
  const dd=k/4, n=Math.ceil(dd)+1, off=Math.floor(n/2), w=[];
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){let acc=0;
    for(let sy=0;sy<3;sy++)for(let sx=0;sx<3;sx++){const px=x-off+(sx+.5)/3, py=y-off+(sy+.5)/3;
      const r=Math.hypot(px-.5,py-.5)/dd; acc+=r<.15?1:r>.5?0:1-(r-.15)/.35}
    w.push(acc/9)}
  return SPRITES[k]={n,off,w:new Float32Array(w)};
}

/* ---------- canvases & layout ---------- */
let W=0,H=0,cx=0,cy=0,R=0,Rcss=300,baseR=300;
const dotCv=document.createElement("canvas"),dotCtx=dotCv.getContext("2d");
let dotImg,dotBuf,dotU32;
const htCv=document.createElement("canvas"),htCtx=htCv.getContext("2d");
let htPattern=null;
function radiusFor(d){return Math.tan(Math.asin(1/d))/Math.tan(15*D2R)*innerHeight/2}
function layout(){
  W=Math.round(innerWidth*QUALITY);H=Math.round(innerHeight*QUALITY);
  for(const c of [canvas,windCv]){c.width=W;c.height=H;c.style.width=innerWidth+"px";c.style.height=innerHeight+"px"}
  dotCv.width=htCv.width=W;dotCv.height=htCv.height=H;
  dotImg=dotCtx.createImageData(W,H);dotBuf=dotImg.data;dotU32=new Uint32Array(dotBuf.buffer);
  baseR=radiusFor(5.3);cx=W/2;cy=H/2;
  // halftone tile: staggered dot grid, same tint as the sphere dots
  const t=document.createElement("canvas"),s=Math.round(6*QUALITY);t.width=s;t.height=s;const tc=t.getContext("2d");
  tc.fillStyle="rgb(60,165,225)";for(const [x,y] of [[s/4,s/4],[s*3/4,s*3/4]]){tc.beginPath();tc.arc(x,y,1.05*QUALITY,0,7);tc.fill()}
  htPattern=htCtx.createPattern(t,"repeat");
  updateScale();wclear();
}
function updateScale(){Rcss=baseR*view.z;R=Rcss*QUALITY;buildRings(baseR)}

let r00,r01,r02,r10,r11,r12,r20,r21,r22;
function setRot(){
  const a=-view.lon*D2R,b=view.lat*D2R,ca=Math.cos(a),sa=Math.sin(a),cb=Math.cos(b),sb=Math.sin(b);
  r00=ca;r01=0;r02=sa; r10=sa*sb;r11=cb;r12=-ca*sb; r20=-sa*cb;r21=sb;r22=ca*cb;
}
const rot=p=>({x:r00*p.x+r01*p.y+r02*p.z,y:r10*p.x+r11*p.y+r12*p.z,z:r20*p.x+r21*p.y+r22*p.z});
// screen (device px) -> [lon,lat] or null if off-globe
function invert(sx,sy){
  const X=(sx-cx)/R,Y=(cy-sy)/R,q=X*X+Y*Y;if(q>1)return null;const Z=Math.sqrt(1-q);
  const x=r00*X+r10*Y+r20*Z,y=r01*X+r11*Y+r21*Z,z=r02*X+r12*Y+r22*Z;
  return [Math.atan2(x,z)/D2R,Math.asin(clamp(y,-1,1))/D2R];
}
function projectLL(lon,lat){const q=rot(vec(lat,lon));return {x:cx+q.x*R,y:cy-q.y*R,z:q.z}}
const projection=d3.geoOrthographic().clipAngle(90).precision(0.4);
const path=d3.geoPath(projection,ctx), htPath=d3.geoPath(projection,htCtx);

/* ---------- stars & rings ---------- */
function drawStars(){
  const c=$("stars"),x=c.getContext("2d");c.width=innerWidth*devicePixelRatio;c.height=innerHeight*devicePixelRatio;
  for(let i=0;i<500;i++){const r=Math.random();x.fillStyle=`rgba(${r<.3?"170,200,255":"230,240,255"},${.15+Math.pow(Math.random(),3)*.7})`;
    x.beginPath();x.arc(Math.random()*c.width,Math.random()*c.height,(Math.random()<.95?.6:1.3)*devicePixelRatio,0,7);x.fill();}
}
function buildRings(R){
  const svg=$("rings"),s=R*2.6;
  if(svg.dataset.r==Math.round(R))return;svg.dataset.r=Math.round(R);
  svg.setAttribute("width",s);svg.setAttribute("height",s);svg.setAttribute("viewBox",`${-s/2} ${-s/2} ${s} ${s}`);
  let ticks="";for(let i=0;i<120;i++){const a=i/120*Math.PI*2,r1=R*1.055,r2=R*(i%10?1.075:1.09);ticks+=`<line x1="${Math.cos(a)*r1}" y1="${Math.sin(a)*r1}" x2="${Math.cos(a)*r2}" y2="${Math.sin(a)*r2}"/>`}
  svg.innerHTML=`<defs><filter id="gl" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
   <g filter="url(#gl)" fill="none" stroke="#7fe0ff">
    <circle id="ringMain" r="${R*1.035}" stroke-width="2.2" opacity=".9"/>
    <g class="spin" stroke-width="1.4" opacity=".55">${ticks}</g>
    <g class="spin2"><circle r="${R*1.13}" stroke-width="1" opacity=".35" stroke-dasharray="${R*0.9} ${R*0.35} ${R*0.15} ${R*0.35}"/></g>
    <circle r="${R*1.2}" stroke-width=".8" opacity=".15" stroke-dasharray="2 6"/>
   </g>`;
}

/* ---------- city pings ---------- */
const pingLayer=$("pings"); let selected=null, eventCity=null;
CITIES.forEach(c=>{
  const el=document.createElement("div");el.className="ping";
  el.innerHTML=`<div class="pulse"></div><div class="ring"></div><div class="dot"></div><div class="tag mono"></div>`;
  el.onclick=e=>{e.stopPropagation();selectCity(c)};
  pingLayer.appendChild(el);c.el=el;c.v=vec(c.lat,c.lon);
});
function selectCity(c,fly=true){
  selected=c;CITIES.forEach(k=>k.el.classList.toggle("sel",k===c));
  document.querySelectorAll(".region").forEach(r=>r.classList.toggle("sel",r.dataset.n===c?.name));
  if(c&&fly) flyTo(c.lat,c.lon);
  if(c) showLocationInfo(c.lat,c.lon); else hideLocationInfo();
}
function flyTo(lat,lon,zoom){view.tLat=clamp(view.z>1.5?lat:lat*0.85,-85,85);view.tLon=lon;if(zoom)view.tz=zoom;wclear()}

/* ---------- synthetic wind field (PLACEHOLDER: swap for GFS u/v grids like earth) ---------- */
let WU=new Float32Array(360*181),WV=new Float32Array(360*181);
function buildWind(d){
  const dayIdx=Math.floor(new Date(d.y,d.m-1,d.d)/864e5);
  const vort=[];
  for(let i=0;i<16;i++){
    const h=k=>hash("v"+i+k+d.y);
    const hemi=i%2?1:-1, lat0=hemi*(12+h("a")*50);
    const drift=(Math.abs(lat0)<30?-4:5)*(0.6+h("s"));                    // trades drift west, mid-lats east
    const lon0=((h("b")*360+dayIdx*drift)%360+540)%360-180;
    const life=Math.sin((dayIdx/(5+h("l")*8)+h("p")*6.28));                // vortices grow and fade
    vort.push({lat:lat0,lon:lon0,s:hemi*(10+h("c")*22)*Math.max(0,life),r:5+h("r")*9});
  }
  for(let j=0;j<181;j++){const lat=90-j,phi=lat*D2R,cl=Math.max(Math.cos(phi),.05);
    for(let i=0;i<360;i++){const lon=i-180;
      let u=-8*Math.cos(6*phi)*Math.sqrt(cl)+1.5*Math.sin(dayIdx*.05+lon*D2R*3);
      let v=2.2*Math.sin(lon*D2R*4+lat*D2R*2+dayIdx*.08)*cl;
      for(const o of vort){let dx=((lon-o.lon+540)%360-180)*Math.cos(o.lat*D2R),dy=lat-o.lat;
        const e=Math.exp(-(dx*dx+dy*dy)/(o.r*o.r));if(e<1e-3)continue;u+=-o.s*dy/o.r*e;v+=o.s*dx/o.r*e}
      if(landAt(lat,lon)){u*=.65;v*=.65}
      WU[j*360+i]=u;WV[j*360+i]=v}}
}
function windAt(lon,lat){
  const x=(lon+180+360)%360,y=clamp(90-lat,0,179.999),x0=Math.floor(x),y0=Math.floor(y),fx=x-x0,fy=y-y0,x1=(x0+1)%360;
  const i00=y0*360+x0,i10=y0*360+x1,i01=(y0+1)*360+x0,i11=(y0+1)*360+x1;
  return [WU[i00]*(1-fx)*(1-fy)+WU[i10]*fx*(1-fy)+WU[i01]*(1-fx)*fy+WU[i11]*fx*fy,
          WV[i00]*(1-fx)*(1-fy)+WV[i10]*fx*(1-fy)+WV[i01]*(1-fx)*fy+WV[i11]*fx*fy];
}
/* particles live in screen space, like earth's animator */
const MAXP=4500; const P={x:new Float32Array(MAXP),y:new Float32Array(MAXP),age:new Int16Array(MAXP),n:0};
const WCOL=["rgba(70,170,230,.55)","rgba(95,216,255,.75)","rgba(160,235,255,.85)","rgba(235,250,255,.95)"];
function spawn(i){
  for(let k=0;k<12;k++){const x=Math.random()*W,y=Math.random()*H;
    const dx=x-cx,dy=y-cy;if(dx*dx+dy*dy<R*R*0.995){P.x[i]=x;P.y[i]=y;P.age[i]=Math.floor(Math.random()*90);return}}
  P.age[i]=999;
}
function wclear(){wctx.clearRect(0,0,W,H);windPause=6}
let windPause=0;
function stepWind(){
  if(!LAYERS.wind){return}
  const vis=Math.PI*R*R/(QUALITY*QUALITY), area=Math.min(vis,innerWidth*innerHeight);
  const target=Math.min(MAXP,Math.round(area/160));
  while(P.n<target)spawn(P.n++);P.n=Math.min(P.n,target);
  // fade old trails
  wctx.globalCompositeOperation="destination-in";wctx.fillStyle="rgba(0,0,0,.93)";wctx.fillRect(0,0,W,H);
  wctx.globalCompositeOperation="lighter";
  if(windPause>0){windPause--;return}
  const k=0.016/Math.pow(view.z,0.75), buckets=[new Path2D(),new Path2D(),new Path2D(),new Path2D()];
  for(let i=0;i<P.n;i++){
    if(P.age[i]++>100){spawn(i);continue}
    const ll=invert(P.x[i],P.y[i]);if(!ll){spawn(i);continue}
    const [u,v]=windAt(ll[0],ll[1]),sp=Math.hypot(u,v);
    const lat=ll[1]+v*k, lon=ll[0]+u*k/Math.max(Math.cos(ll[1]*D2R),.1);
    const p=projectLL(lon,lat);
    if(p.z<0.02||p.x<0||p.y<0||p.x>W||p.y>H){spawn(i);continue}
    const b=sp<6?0:sp<11?1:sp<17?2:3;
    buckets[b].moveTo(P.x[i],P.y[i]);buckets[b].lineTo(p.x,p.y);
    P.x[i]=p.x;P.y[i]=p.y;
  }
  wctx.lineWidth=1.1*QUALITY;
  buckets.forEach((b,i)=>{wctx.strokeStyle=WCOL[i];wctx.stroke(b)});
}

/* ---------- location info (left panel): population + timezone, bundled static dataset ---------- */
const tzLabel=lon=>{const off=Math.round(lon/15);return `UTC${off>=0?"+":""}${off}`};
const popForYear=(pop2019,year)=>Math.round(pop2019*Math.pow(1.011,year-2019)); // ~1.1%/yr placeholder global growth
function countryInfoAt(lat,lon){
  const geo=GEO[activeRes]||GEO["110m"];
  const f=geo.countries?featureAt(geo.countries.features,lon,lat):null;
  if(!f)return null;
  const info=COUNTRY_INFO[f.id]||COUNTRY_INFO[f.properties.name];
  return {name:f.properties.name,info};
}
function stateInfoAt(lat,lon){
  const sg=GEO_STATES["50m_states"]||GEO_STATES["110m_states"];
  return sg?featureAt(sg.features,lon,lat):null;
}
function nearestCity(lat,lon){
  // searches the full ~7,300-place world dataset (src/data/places.js), not just the 18
  // demo CITIES used for the light-index simulation — so e.g. a click in Washington state
  // finds Tacoma, not whichever of the 18 happens to be least-far-away.
  const p=vec(lat,lon);let best=null,bestDot=-2;
  for(const place of PLACES){
    const q=vec(place[1],place[2]);
    const dot=p.x*q.x+p.y*q.y+p.z*q.z;
    if(dot>bestDot){bestDot=dot;best=place}
  }
  return {city:{name:best[0]},km:Math.round(Math.acos(clamp(bestDot,-1,1))*6371)};
}
function showLocationInfo(lat,lon){
  const ci=countryInfoAt(lat,lon), land=landAt(lat,lon), st=stateInfoAt(lat,lon);
  $("statsGlobal").style.display="none";$("statsLocation").style.display="grid";
  $("heroDefault").style.display="none";$("heroLocation").style.display="block";
  const countryName=ci?ci.name:(st?st.properties.admin:null);
  // the growth-rate model only compounds sensibly within a few centuries of its ~2019 base
  // figure; far enough back (BCE/early-CE eras) it decays to an absurd near-zero number, so
  // treat anything below a sane floor as "not modeled" rather than showing a fake "0"
  const popRaw=ci&&ci.info?popForYear(ci.info[1],S.y):null;
  const pop=popRaw&&popRaw>=1000?popRaw:null;
  if(ci&&ci.info){
    $("locPop").textContent=pop?fmt(pop):"—";
    $("locCountry").textContent=ci.name;
    $("locContinent").textContent=ci.info[2];
  }else{
    $("locPop").textContent="—";$("locCountry").textContent="";
    $("locContinent").textContent=land?"Unclaimed":"Ocean region";
  }
  $("locTz").textContent=tzLabel(lon);
  $("locSurface").textContent=land?"Land":"Ocean";
  if(st){
    $("locHeroTitle").innerHTML=`${st.properties.name}<br><span>${countryName||st.properties.admin||""}</span>`;
  }else if(countryName){
    $("locHeroTitle").innerHTML=countryName;
  }else{
    $("locHeroTitle").innerHTML=land?"Unclaimed Territory":"Open Ocean";
  }
  const bits=[];
  if(pop)bits.push(`Population ~${fmt(pop)} (country-wide, ${yearStr(S.y)} est.)`);
  else if(ci&&ci.info)bits.push(`Population not modeled this far back`);
  bits.push(`Timezone ${tzLabel(lon)}`);
  bits.push(land?"Landmass":"Ocean region");
  if(ci&&ci.info)bits.push(ci.info[2]);
  $("locHeroDesc").textContent=bits.join(" · ");
}
function hideLocationInfo(){
  $("statsGlobal").style.display="grid";$("statsLocation").style.display="none";
  $("heroDefault").style.display="block";$("heroLocation").style.display="none";
}

/* ---------- probe marker (click anywhere, like earth's location readout) ---------- */
let probe=null;
const dirName=a=>["N","NE","E","SE","S","SW","W","NW"][Math.round(((a%360)+360)%360/45)%8];
function setProbe(lon,lat){
  probe={lon,lat,v:vec(lat,lon)};
  const [u,v]=windAt(lon,lat),sp=Math.hypot(u,v)*3.6,from=(Math.atan2(-u,-v)/D2R+360)%360;
  const land=landAt(lat,lon), li=lightAt(lat,lon), nc=nearestCity(lat,lon);
  $("probeCard").innerHTML=`<div class="pc-h mono"><span>${Math.abs(lat).toFixed(2)}°${lat>=0?"N":"S"} ${Math.abs(lon).toFixed(2)}°${lon>=0?"E":"W"}</span><button class="pc-x" onclick="clearProbe()">×</button></div>
   <div class="pc-r"><span class="mono">NEAREST CITY</span><b>${nc.city.name}</b><i>${fmt(nc.km)} km</i></div>
   <div class="pc-r"><span class="mono">WIND</span><b>${sp.toFixed(0)} km/h</b><i>from ${dirName(from)} ${from.toFixed(0)}°</i></div>
   <div class="pc-r"><span class="mono">SURFACE</span><b>${land?"Land":"Ocean"}</b></div>
   <div class="pc-r"><span class="mono">LIGHT IDX</span><b>${li.toFixed(2)}</b><div class="pc-bar"><i style="width:${li*100}%"></i></div></div>
   <div class="pc-f mono">SAMPLE DATA · ${MONTHS[S.m-1]} ${S.d} ${S.y}</div>`;
  $("probe").style.display="block";
  showLocationInfo(lat,lon);
}
function clearProbe(){probe=null;$("probe").style.display="none";hideLocationInfo()}
window.clearProbe=clearProbe;

/* ---------- interaction ---------- */
let drag=null,lastMove=0,downAt=null;
const interacting=()=>drag||view.tLon!=null||Math.abs(view.tz-view.z)>0.002||Math.abs(view.vlon)+Math.abs(view.vlat)>0.01;
canvas.addEventListener("pointerdown",e=>{drag={x:e.clientX,y:e.clientY};downAt={x:e.clientX,y:e.clientY,t:performance.now()};canvas.classList.add("drag");canvas.setPointerCapture(e.pointerId);view.tLon=view.tLat=null;view.vlon=view.vlat=0});
canvas.addEventListener("pointermove",e=>{if(!drag)return;
  const k=1/Rcss/D2R*0.9; // degrees per pixel, scales with zoom
  const dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag={x:e.clientX,y:e.clientY};
  view.lon-=dx*k;view.lat=clamp(view.lat+dy*k,-85,85);view.vlon=-dx*k;view.vlat=dy*k;lastMove=performance.now();if(dx||dy)wclear()});
canvas.addEventListener("pointerup",e=>{
  if(downAt&&Math.hypot(e.clientX-downAt.x,e.clientY-downAt.y)<4&&performance.now()-downAt.t<400){
    view.vlon=view.vlat=0;
    const ll=invert(e.clientX*QUALITY,e.clientY*QUALITY);
    if(ll){setProbe(ll[0],ll[1])}else{clearProbe();selectCity(null,false)}
  }
  drag=null;downAt=null;canvas.classList.remove("drag")});
canvas.addEventListener("pointercancel",()=>{drag=null;canvas.classList.remove("drag")});

/* ---------- hover highlight + tooltip for country / state outlines ---------- */
let hoverCountry=null,hoverState=null,lastHoverCheck=0;
const geoTip=$("geoTip");
canvas.addEventListener("pointermove",e=>{
  if(!drag)geoTip.style.transform=`translate(${e.clientX+16}px,${e.clientY+18}px)`;
  if(drag||!LAYERS.borders)return;
  const now=performance.now();if(now-lastHoverCheck<70)return;lastHoverCheck=now;
  const ll=invert(e.clientX*QUALITY,e.clientY*QUALITY);
  let hc=null,hs=null;
  if(ll){
    const geo=GEO[activeRes]||GEO["110m"];
    hc=geo.countries?featureAt(geo.countries.features,ll[0],ll[1]):null;
    const sg=GEO_STATES["50m_states"]||GEO_STATES["110m_states"];if(sg)hs=featureAt(sg.features,ll[0],ll[1]);
  }
  if(hc!==hoverCountry||hs!==hoverState){
    hoverCountry=hc;hoverState=hs;needsRedraw=true;
    if(hs){geoTip.innerHTML=`<b>${hs.properties.name}</b><br>${hs.properties.admin||(hc?hc.properties.name:"")}`;geoTip.classList.add("show")}
    else if(hc){geoTip.innerHTML=`<b>${hc.properties.name}</b>`;geoTip.classList.add("show")}
    else geoTip.classList.remove("show");
  }
});
canvas.addEventListener("pointerleave",()=>{if(hoverCountry||hoverState){hoverCountry=hoverState=null;needsRedraw=true}geoTip.classList.remove("show")});
function zoomBy(f,mx,my){
  const nz=clamp(view.tz*f,ZMIN,ZMAX);
  if(mx!=null){ // zoom toward the cursor: nudge the view centre toward the point under it
    const ll=invert(mx*QUALITY,my*QUALITY);
    if(ll&&nz>view.tz){const t=1-view.tz/nz;
      let dl=((ll[0]-view.lon+540)%360)-180;view.lon+=dl*t;view.lat=clamp(view.lat+(ll[1]-view.lat)*t,-85,85)}
  }
  view.tz=nz;wclear();
}
canvas.addEventListener("wheel",e=>{e.preventDefault();zoomBy(Math.exp(-e.deltaY*0.0015),e.clientX,e.clientY)},{passive:false});
canvas.addEventListener("dblclick",e=>zoomBy(2,e.clientX,e.clientY));
function resize(){drawStars();layout();needsRedraw=true}
addEventListener("resize",resize);

/* ---------- layer bar ---------- */
document.querySelectorAll("[data-layer]").forEach(b=>{b.classList.toggle("on",LAYERS[b.dataset.layer]);
  b.onclick=()=>{const k=b.dataset.layer;LAYERS[k]=!LAYERS[k];b.classList.toggle("on",LAYERS[k]);if(k==="wind"){wclear();P.n=0}needsRedraw=true}});
$("zIn").onclick=()=>zoomBy(1.6);$("zOut").onclick=()=>zoomBy(1/1.6);
$("zReset").onclick=()=>{view.tz=1;flyTo(12,18);clearProbe()};
addEventListener("keydown",e=>{if(e.target.tagName==="INPUT"&&e.target.type!=="range")return;if(e.key==="+"||e.key==="=")zoomBy(1.4);if(e.key==="-")zoomBy(1/1.4)});

/* ---------- drawing ---------- */
let needsRedraw=true;
function drawDots(t,alpha,lightsOnly){
  // bbox of the globe on screen, clipped to the viewport
  const x0=Math.max(0,Math.floor(cx-R-4)),x1=Math.min(W,Math.ceil(cx+R+4)),y0=Math.max(0,Math.floor(cy-R-4)),y1=Math.min(H,Math.ceil(cy+R+4));
  if(x1<=x0||y1<=y0)return;
  for(let y=y0;y<y1;y++)dotU32.fill(0xFF000000,y*W+x0,y*W+x1);
  const buf=dotBuf, g=G.growth*1.05, baseD=2.5*QUALITY*Math.max(1,Math.sqrt(view.z)), tw2=t*2;
  const scan=Math.sin(t*0.35)*2.2, bandK=3.2/5.3*view.z, spF=sprite(baseD);
  const lights=LAYERS.lights;
  for(let i=0;i<NP;i++){
    const x=PX[i],y=PY[i],z=PZ[i];
    const zz=r20*x+r21*y+r22*z;
    const li=PL[i],sd=PS[i];
    const lit=(lights&&li>0.03&&sd*0.9<=g)?PLS[i]:0;
    if(lightsOnly&&lit<0.05)continue;
    const xx=r00*x+r02*z, yy=r10*x+r11*y+r12*z;
    const sxp=cx+xx*R, syp=cy-yy*R;
    if(sxp<x0+4||sxp>=x1-4||syp<y0+4||syp>=y1-4)continue;
    if(zz<=0){if(lightsOnly)continue;
      const o=(Math.floor(syp)*W+Math.floor(sxp))*4,k=0.07*(1+zz)*(0.8+0.8*PC[i])*200;
      buf[o]+=0.22*k;buf[o+1]+=0.72*k;buf[o+2]+=k;continue}
    let b=lightsOnly?1.6*lit:0.8+0.8*PC[i]+(lit>0?2.2*lit*(0.85+0.15*Math.sin(tw2+sd*60)):0);
    const bd=yy*bandK-scan;if(bd<0.5&&bd>-0.5)b*=1+0.9*Math.exp(-bd*bd*40);
    const m=Math.min(1,lit*1.4+PC[i]*.3);
    const a=0.25+0.75*POW[(zz*1023)|0], sp=lightsOnly?sprite(2.4*QUALITY*(1+lit)):lit>0.05?sprite(baseD*(1+lit*.5)):spF;
    const k=b*a*205, cr=(0.22+0.53*m)*k, cg=(0.72+0.23*m)*k, cb=k;
    const px=Math.floor(sxp)-sp.off,py=Math.floor(syp)-sp.off,n=sp.n,w=sp.w;
    for(let sy=0;sy<n;sy++){let o=((py+sy)*W+px)*4;const wr=sy*n;
      for(let sx=0;sx<n;sx++,o+=4){const ww=w[wr+sx];if(ww===0)continue;buf[o]+=cr*ww;buf[o+1]+=cg*ww;buf[o+2]+=cb*ww}}
  }
  dotCtx.putImageData(dotImg,0,0,x0,y0,x1-x0,y1-y0);
  ctx.save();ctx.beginPath();ctx.arc(cx,cy,R+2,0,7);ctx.clip();ctx.globalAlpha=alpha;
  ctx.drawImage(dotCv,x0,y0,x1-x0,y1-y0,x0,y0,x1-x0,y1-y0);ctx.restore();ctx.globalAlpha=1;
}

/* cached vector map layer: only re-projected when the view actually changes */
const mapCv=document.createElement("canvas"),mctx=mapCv.getContext("2d");let mapKey="";
function buildMap(geo,Z,htA,res){
  if(mapCv.width!==W||mapCv.height!==H){mapCv.width=W;mapCv.height=H}
  mctx.globalCompositeOperation="source-over";mctx.clearRect(0,0,W,H);mctx.globalCompositeOperation="lighter";
  projection.clipExtent(null);
  const P2=g=>{const p=new Path2D();d3.geoPath(projection,p)(g);return p};
  if(LAYERS.grid){
    const step=Z<2?10:Z<5?5:Z<12?2:1;
    mctx.lineWidth=QUALITY;mctx.strokeStyle=`rgba(64,166,255,${Z<2?.19:.13})`;mctx.stroke(P2(graticule(step)));
    if(Z<1.6){const back=d3.geoOrthographic().clipAngle(90).scale(R).translate([cx,cy]).rotate([-view.lon+180,view.lat]).reflectX(true);
      const p=new Path2D();d3.geoPath(back,p)(graticule(10));mctx.strokeStyle="rgba(64,166,255,.035)";mctx.stroke(p)}
  }
  const landP=P2(geo.land);
  if(htA>0.01){
    htCtx.globalCompositeOperation="source-over";htCtx.clearRect(0,0,W,H);
    htCtx.fillStyle="#fff";htCtx.fill(landP);
    htCtx.globalCompositeOperation="source-in";htCtx.fillStyle=htPattern;htCtx.fillRect(0,0,W,H);
    htCtx.globalCompositeOperation="destination-out";
    const lg=htCtx.createRadialGradient(cx,cy,R*0.55,cx,cy,R);lg.addColorStop(0,"rgba(0,0,0,0)");lg.addColorStop(1,"rgba(0,0,0,.7)");
    htCtx.fillStyle=lg;htCtx.fillRect(0,0,W,H);
    mctx.globalAlpha=htA;mctx.drawImage(htCv,0,0);mctx.fillStyle="rgba(20,90,140,.10)";mctx.fill(landP);mctx.globalAlpha=1;
  }
  const coastA=0.15+0.65*smoothstep(1,2.2,Z);
  mctx.lineJoin="round";mctx.strokeStyle=`rgba(95,216,255,${coastA*.22})`;mctx.lineWidth=4*QUALITY;mctx.stroke(landP);
  mctx.strokeStyle=`rgba(160,235,255,${coastA})`;mctx.lineWidth=1.1*QUALITY;mctx.stroke(landP);
  if(LAYERS.borders){
    const bA=0.06+0.32*smoothstep(1,3,Z);
    mctx.setLineDash([4*QUALITY,3*QUALITY]);mctx.strokeStyle=`rgba(120,200,255,${bA})`;mctx.lineWidth=.8*QUALITY;mctx.stroke(P2(geo.borders));mctx.setLineDash([]);
    if(Z>2){
      const sg=GEO_STATES[statesKeyFor(res)];
      if(sg){
        const sA=smoothstep(2,4,Z)*.3;
        mctx.setLineDash([3*QUALITY,2*QUALITY]);mctx.strokeStyle=`rgba(150,225,255,${sA})`;mctx.lineWidth=.6*QUALITY;mctx.stroke(P2(sg.mesh));mctx.setLineDash([]);
        if(hoverState){mctx.strokeStyle="rgba(255,255,255,.85)";mctx.lineWidth=1.3*QUALITY;mctx.stroke(P2(hoverState))}
      }
    }
    if(hoverCountry){mctx.strokeStyle="rgba(255,255,255,.95)";mctx.lineWidth=1.7*QUALITY;mctx.stroke(P2(hoverCountry))}
  }
}
function drawGlobe(t){
  setRot();
  projection.scale(R).translate([cx,cy]).rotate([-view.lon,-view.lat]);
  const Z=view.z, moving=interacting();
  // resolution switching (earth: 110m while animating, 50m when still; we add 10m for deep zoom)
  let res=Z<2.2||moving?"110m":"50m";
  if(Z>7&&!moving){requestHiRes();if(GEO["10m"])res="10m"}
  const geo=GEO[res]||GEO["110m"];
  activeRes=res;
  const dotA=1-smoothstep(1.25,2.1,Z), htA=1-dotA;
  ctx.globalCompositeOperation="source-over";ctx.clearRect(0,0,W,H);
  // body + fresnel rim
  ctx.fillStyle="rgb(0,6,15)";ctx.beginPath();ctx.arc(cx,cy,R*0.995,0,7);ctx.fill();
  let g=ctx.createRadialGradient(cx,cy,0,cx,cy,R*0.995);
  for(let i=0;i<=20;i++){const r=i/20,f=1-Math.sqrt(Math.max(0,1-r*r));g.addColorStop(r,`rgba(38,153,255,${(Math.pow(f,2.6)*.6).toFixed(3)})`)}
  ctx.fillStyle=g;ctx.fill();
  ctx.globalCompositeOperation="lighter";
  // atmosphere (same falloff as the WebGL shader)
  if(R<Math.hypot(W,H)){g=ctx.createRadialGradient(cx,cy,0,cx,cy,R*1.18);
    for(let i=0;i<=40;i++){const r=i/40,v=Math.max(0,0.78-Math.sqrt(Math.max(0,1-r*r)));g.addColorStop(r,`rgba(51,166,255,${Math.min(1,Math.pow(v,4)*1.3).toFixed(4)})`)}
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(cx,cy,R*1.18,0,7);ctx.fill();}
  // scan band
  ctx.save();ctx.beginPath();ctx.arc(cx,cy,R,0,7);ctx.clip();
  const scan=Math.sin(t*0.35)*2.2,bandK=3.2/5.3,by=cy-(scan/bandK)*baseR*QUALITY,bh=baseR*QUALITY*0.16/bandK;
  const bg=ctx.createLinearGradient(0,by-bh,0,by+bh);bg.addColorStop(0,"rgba(26,115,180,0)");bg.addColorStop(.5,"rgba(26,115,180,.22)");bg.addColorStop(1,"rgba(26,115,180,0)");
  ctx.fillStyle=bg;ctx.fillRect(0,by-bh,W,2*bh);ctx.restore();
  // land: sphere dots at low zoom, cross-fading to the cached vector map at high zoom
  if(dotA>0.01)drawDots(t,dotA,false);
  const key=[view.lon.toFixed(2),view.lat.toFixed(2),Z.toFixed(3),res,LAYERS.grid,LAYERS.borders,W,H,
    hoverCountry?hoverCountry.id:"",hoverState?hoverState.properties.name:""].join("|");
  if(key!==mapKey){buildMap(geo,Z,htA,res);mapKey=key}
  ctx.drawImage(mapCv,0,0);
  if(htA>0.01&&LAYERS.lights)drawDots(t,htA,true);
  ctx.globalCompositeOperation="source-over";
}

/* ---------- loop ---------- */
let lastT=performance.now(),lastDraw=0;
function frame(now){
  requestAnimationFrame(frame);
  const active=interacting()||LAYERS.wind||needsRedraw;
  if(!active&&now-lastDraw<32)return;       // idle cap ~30fps
  if(LAYERS.wind&&!interacting()&&now-lastDraw<30)return;
  const dt=Math.min((now-lastT)/1000,0.05);lastT=now;lastDraw=now;const t=now/1000;needsRedraw=false;
  if(!drag){
    if(view.tLon!=null){
      let d=((view.tLon-view.lon+540)%360)-180;view.lon+=d*Math.min(1,dt*3);view.lat+=(view.tLat-view.lat)*Math.min(1,dt*3);
      if(Math.abs(d)<0.05&&Math.abs(view.tLat-view.lat)<0.05){view.tLon=view.tLat=null;wclear()}
    }else{
      view.lon+=view.vlon;view.lat=clamp(view.lat+view.vlat,-85,85);view.vlon*=0.9;view.vlat*=0.9;
      if(Math.abs(view.vlon)+Math.abs(view.vlat)>0.01)wclear();
      // gentle auto-spin only at overview zoom, like a screensaver
      else if(!selected&&!eventCity&&!probe&&view.z<1.3) view.lon+=dt*2.2;
    }
  }
  const pz=view.z;view.z+=(view.tz-view.z)*Math.min(1,dt*7);if(Math.abs(view.tz-view.z)<0.001)view.z=view.tz;
  if(view.z!==pz)updateScale();
  drawGlobe(t);
  stepWind();
  // overlays that sit on top of the canvas
  const rA=1-smoothstep(1.05,1.4,view.z);const rings=$("rings");rings.style.opacity=rA;
  rings.style.transform=`translate(-50%,-50%) scale(${view.z})`;
  const showAll=view.z>3;
  for(const c of CITIES){
    const q=rot(c.v),x=innerWidth/2+q.x*Rcss,y=innerHeight/2-q.y*Rcss;
    c.el.style.transform=`translate(${x}px,${y}px) scale(${0.6+0.4*Math.max(0,q.z)})`;
    const vis=q.z>0.12&&x>-50&&y>-50&&x<innerWidth+50&&y<innerHeight+50;
    c.el.style.opacity=vis?1:0;c.el.style.pointerEvents=vis?"auto":"none";c.el.classList.toggle("all",showAll);
  }
  if(probe){const q=rot(probe.v),x=innerWidth/2+q.x*Rcss,y=innerHeight/2-q.y*Rcss;
    const pe=$("probe");pe.style.transform=`translate(${x}px,${y}px)`;pe.style.opacity=q.z>0.05?1:0}
  $("zLbl").textContent=view.z<10?view.z.toFixed(1)+"×":Math.round(view.z)+"×";
  $("coords").innerHTML=`CAM&nbsp;&nbsp;LAT ${view.lat.toFixed(2)}°&nbsp;&nbsp;LON ${(((view.lon+540)%360)-180).toFixed(2)}°&nbsp;&nbsp;ZOOM ${view.z.toFixed(1)}×<br>DRAG TO ROTATE · SCROLL / DOUBLE-CLICK TO ZOOM · CLICK TO PROBE`;
}

/* =====================================================================
   UI: timeline, stats, regions
   ===================================================================== */
const yearEl=$("year"),monthEl=$("month"),dayEl=$("day");
const hist=$("hist");
// default range matches the "Modern" era card (1900-Today) below, so the dial and the era
// strip agree from first load instead of the dial showing its own separate 1990-2026 default
let yearMin=1900,yearMax=2026;
function rebuildHist(min,max){
  hist.innerHTML="";
  const span=max-min,bars=Math.max(1,Math.min(span,40)),stepSize=Math.max(1,Math.round(span/bars));
  for(let y=min;y<=max;y+=stepSize){
    const i=document.createElement("i");
    const s=stats({y:clampYear(y),m:6,d:15});
    i.style.height=(18+82*(s.regions-380)/(1290-380))+"%";
    i.title=yearStr(y);i.dataset.y=y;
    i.onclick=()=>{S.y=y;update()};
    hist.appendChild(i);
  }
}
function niceStep(raw){
  if(raw<=0)return 1;
  const mag=Math.pow(10,Math.floor(Math.log10(raw)));
  for(const n of [1,2,5,10])if(raw<=n*mag)return n*mag;
  return 10*mag;
}
function rebuildTicks(min,max){
  const el=$("yearTicks");if(!el)return;el.innerHTML="";
  const step=niceStep((max-min)/4);
  const ticks=[min];let y=min+step;
  while(y<max){ticks.push(y);y+=step}
  ticks.push(max);
  el.innerHTML=ticks.map(y=>`<span>${yearStr(y)}</span>`).join("");
}
rebuildHist(yearMin,yearMax);rebuildTicks(yearMin,yearMax);

/* ---------- historical era strip: clicking an era re-scopes the whole year dial to its real range ---------- */
const ERAS=[
  {k:"ANCIENT",range:"3000 BCE – 500 BCE",event:"Pyramids of Giza · c. 2500 BCE",ymin:-3000,ymax:-500,anchor:-2500,
   icon:'<svg viewBox="0 0 24 24"><path d="M12 4 L21 20 H3 Z"/><path d="M8 20 V15 M12 20 V11 M16 20 V15"/></svg>'},
  {k:"CLASSICAL",range:"500 BCE – 500 CE",event:"Fall of the Western Roman Empire · 476 CE",ymin:-500,ymax:500,anchor:476,
   icon:'<svg viewBox="0 0 24 24"><path d="M4 9 L12 4 L20 9 M3 20 H21 M5 9 V20 M9 9 V20 M15 9 V20 M19 9 V20"/></svg>'},
  {k:"MEDIEVAL",range:"500 – 1500",event:"Magna Carta Signed · 1215",ymin:500,ymax:1500,anchor:1215,
   icon:'<svg viewBox="0 0 24 24"><path d="M4 21 V11 H8 V21 M16 21 V11 H20 V21 M8 17 H16 M5 11 V7 H6.5 V11 M17.5 11 V7 H19 V11 M9.5 11 L12 5 L14.5 11"/></svg>'},
  {k:"RENAISSANCE",range:"1500 – 1700",event:"Printing Press Invented · c. 1450",ymin:1500,ymax:1700,anchor:1600,
   icon:'<svg viewBox="0 0 24 24"><ellipse cx="12" cy="12" rx="8" ry="6"/><circle cx="9" cy="10.5" r=".8"/><circle cx="14.5" cy="9.5" r=".8"/><circle cx="15" cy="13.5" r=".8"/><circle cx="10" cy="14.5" r=".8"/></svg>'},
  {k:"INDUSTRIAL",range:"1700 – 1900",event:"Steam Engine Developed · c. 1769",ymin:1700,ymax:1900,anchor:1769,
   icon:'<svg viewBox="0 0 24 24"><path d="M3 20 H21 M5 20 V12 H19 V20 M8 12 V8 H10 V12 M13 12 V7 H15 V12 M5 15 H19 M3 9 L5.5 6.5"/></svg>'},
  {k:"MODERN",range:"1900 – Today",event:"Moon Landing · 1969",ymin:1900,ymax:2026,anchor:1969,
   icon:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="7"/><path d="M4.5 10 H19.5 M4.5 14 H19.5 M12 5 C9 8 9 16 12 19 C15 16 15 8 12 5Z"/></svg>'},
];
const erasRow=$("erasRow");
erasRow.innerHTML=ERAS.map((e,i)=>`<button class="era mono" data-i="${i}">${e.icon}<b>${e.k}</b><span class="rng">${e.range}</span><span class="evt">${e.event}</span></button>`).join("");
erasRow.querySelectorAll(".era").forEach(b=>b.onclick=()=>{
  const e=ERAS[+b.dataset.i];
  yearMin=e.ymin;yearMax=e.ymax;yearEl.min=yearMin;yearEl.max=yearMax;
  rebuildHist(yearMin,yearMax);rebuildTicks(yearMin,yearMax);
  S.y=e.anchor;update();
});
function markEra(){
  let idx=ERAS.findIndex(e=>S.y>=e.ymin&&S.y<=e.ymax);
  if(idx<0)idx=S.y<ERAS[0].ymin?0:ERAS.length-1;
  erasRow.querySelectorAll(".era").forEach((b,i)=>b.classList.toggle("now",i===idx));
}
const erasTab=$("erasTab"),erasWrap=$("erasWrap");let erasOpen=false;
erasTab.onclick=()=>{erasOpen=!erasOpen;erasWrap.classList.toggle("open",erasOpen);erasTab.textContent=(erasOpen?"▼":"▲")+" HISTORICAL ERAS"};
function setFill(el){el.style.setProperty("--p",((el.value-el.min)/(el.max-el.min)*100)+"%")}
function fmt(n){return n.toLocaleString("en-US")}
function update(){
  S.d=Math.min(S.d,dim(S.y,S.m));
  yearEl.min=yearMin;yearEl.max=yearMax;yearEl.value=S.y;monthEl.value=S.m;dayEl.max=dim(S.y,S.m);dayEl.value=S.d;$("dMax").textContent=dayEl.max;
  [yearEl,monthEl,dayEl].forEach(setFill);
  $("yLbl").textContent=yearStr(S.y);$("mLbl").textContent=MONTHS[S.m-1];$("dLbl").textContent=S.d;
  $("dateTxt").textContent=`${MONTHS_LONG[S.m-1]} ${S.d}, ${yearStr(S.y)}`;
  $("dow").textContent=DOW[makeDate(S.y,S.m,S.d).getDay()];
  $("ctx").textContent=`CONTEXT · ${MONTHS[S.m-1]} ${S.d} ${yearStr(S.y)}`;
  [...hist.children].forEach(b=>b.classList.toggle("a",+b.dataset.y===S.y));
  markEra();
  const st=stats(S);
  $("sRegions").textContent=fmt(st.regions);
  const de=$("sDelta");de.textContent=(st.delta>=0?"+":"")+st.delta.toFixed(0)+"%";de.classList.toggle("neg",st.delta<0);
  $("sPoints").textContent=st.points.toFixed(1)+"M";$("sCities").textContent=fmt(st.cities);$("sYears").textContent=`${yearStr(yearMin)}–${yearStr(yearMax)}`;
  buildWind(S);G.growth=0.35+0.65*yearT(S.y+(S.m-1)/12);
  // regions
  const vals=CITIES.map(c=>({c,v:lightIndex(c,S)})).sort((a,b)=>b.v-a.v).slice(0,5);
  const box=$("regions");
  box.innerHTML=vals.map(o=>`<div class="region${selected===o.c?" sel":""}" data-n="${o.c.name}"><div class="r"><b></b>${o.c.name}<span class="mono">${o.v.toFixed(2)}</span></div><div class="bar"><i style="width:${o.v*100}%"></i></div></div>`).join("");
  box.querySelectorAll(".region").forEach(r=>r.onclick=()=>selectCity(CITIES.find(c=>c.name===r.dataset.n)));
  CITIES.forEach(c=>c.el.querySelector(".tag").textContent=
    c===eventCity?`◆ ${c.name.toUpperCase()} · ${currentEvent?.type.k.split(" ")[0]}`:`${c.name.toUpperCase()} · ${Math.abs(c.lat).toFixed(1)}°${c.lat>=0?"N":"S"} · LI ${lightIndex(c,S).toFixed(2)}`);
  if(probe)showLocationInfo(probe.lat,probe.lon);
  onDateChange();
}
yearEl.oninput=()=>{S.y=+yearEl.value;update()};
monthEl.oninput=()=>{S.m=+monthEl.value;update()};
dayEl.oninput=()=>{S.d=+dayEl.value;update()};

// play controls
const SPEEDS=[[1,"1 DAY"],[7,"1 WEEK"],[30,"1 MONTH"],[365,"1 YEAR"]];let spd=0,playing=null;
function step(days){const dt=makeDate(S.y,S.m,S.d+days);let y=dt.getFullYear();if(y>yearMax||y<yearMin){stop();return}S.y=y;S.m=dt.getMonth()+1;S.d=dt.getDate();update()}
function stop(){clearInterval(playing);playing=null;$("playBtn").classList.remove("on");$("playBtn").textContent="▶"}
$("playBtn").onclick=()=>{if(playing)return stop();playing=setInterval(()=>step(SPEEDS[spd][0]),180);$("playBtn").classList.add("on");$("playBtn").textContent="❚❚"};
$("fwd").onclick=()=>{spd=(spd+1)%SPEEDS.length;$("spd").textContent=SPEEDS[spd][1]+" / TICK"};
$("back").onclick=()=>step(-30);
addEventListener("keydown",e=>{if(e.target.tagName==="INPUT"&&e.target.type!=="range")return;
  if(e.key===" "){e.preventDefault();$("playBtn").click()} if(e.key==="ArrowRight")step(1); if(e.key==="ArrowLeft")step(-1)});

/* =====================================================================
   AI CHAT (mock) — replace getAIResponse() with a real API call.
   ===================================================================== */
const msgs=$("msgs");let currentEvent=null,chatOpen=false,lastChatDate="";
function add(html,cls="bot",who="TERRA AI"){
  const w=document.createElement("div");w.className="who mono"+(cls==="user"?" me":"");w.textContent=who+" · "+new Date().toTimeString().slice(0,5);
  const m=document.createElement("div");m.className="m "+cls;m.innerHTML=html;msgs.append(w,m);msgs.scrollTop=msgs.scrollHeight;return m}
function typing(ms){return new Promise(r=>{const t=document.createElement("div");t.className="typing";t.innerHTML="<i></i><i></i><i></i>";msgs.appendChild(t);msgs.scrollTop=msgs.scrollHeight;setTimeout(()=>{t.remove();r()},ms)})}
function chips(list){const c=document.createElement("div");c.className="chips";
  list.forEach(([label,fn],i)=>{const b=document.createElement("button");b.className="chip"+(i===0?" p":"");b.textContent=label;b.onclick=()=>{c.remove();ask(label,fn)};c.appendChild(b)});
  msgs.appendChild(c);msgs.scrollTop=msgs.scrollHeight}
function highlight(c){if(eventCity)eventCity.el.classList.remove("event");eventCity=c;if(c){c.el.classList.add("event");flyTo(c.lat,c.lon)}update()}
const ds=()=>`${MONTHS_LONG[S.m-1]} ${S.d}, ${S.y}`;

async function introduceEvent(prefix){
  lastChatDate=ds();
  currentEvent=eventFor(S);const e=currentEvent,c=e.city;
  await typing(900);
  add(`${prefix||"Here's a notable event on"} <b style="color:#fff">${ds()}</b>. I've highlighted its location on the globe.
   <div class="ev"><div class="k mono"><span>◆ ${e.type.k}</span><i>SAMPLE DATA</i></div><h4>${e.title}</h4>
   <div class="loc mono">${c.name.toUpperCase()} · ${Math.abs(c.lat).toFixed(1)}°${c.lat>=0?"N":"S"} ${Math.abs(c.lon).toFixed(1)}°${c.lon>=0?"E":"W"}</div>
   <div class="facts">${e.facts.map(([v,l])=>`<div><b>${fmt(v)}</b><span class="mono">${l}</span></div>`).join("")}</div></div>${e.summary}`);
  highlight(c);
  await typing(700);
  add("Would you like to learn more about this event, or do you have any questions?");
  chips([["Yes, tell me more",more],["Show it on the globe",showIt],["What else happened this day?",other]]);
}
async function ask(text,fn){add(text,"user","YOU");await typing(800);if(fn)await fn();else await freeform(text)}
async function more(){const e=currentEvent,c=e.city,li=lightIndex(c,S),prev=lightIndex(c,{...S,y:Math.max(1990,S.y-5)});
  add(`Here's more context on <b style="color:#fff">${e.title}</b>:<br><br>• ${c.name}'s light index on this date is <b style="color:#9fe9ff">${li.toFixed(2)}</b>, ${li>=prev?"up":"down"} from ${prev.toFixed(2)} five years earlier.<br>• Ranked <b style="color:#9fe9ff">#${CITIES.map(k=>lightIndex(k,S)).sort((a,b)=>b-a).indexOf(li)+1}</b> of ${CITIES.length} tracked cities.<br>• Try scrubbing the year slider to see how the region changes before and after.`);
  chips([["Compare with another city",compare],["Pick a new event",()=>introduceEvent("Here's another event from")]]);}
async function showIt(){selectCity(currentEvent.city,false);flyTo(currentEvent.city.lat,currentEvent.city.lon,6);add(`Zoomed in on <b style="color:#fff">${currentEvent.city.name}</b>. You can now see the coastline and borders in detail. Click anywhere to probe the wind there.`);chips([["Yes, tell me more",more],["Zoom back out",async()=>{view.tz=1;add("Done, back to the full view.")}]]);}
async function other(){S.d=S.d;const alt=eventFor({y:S.y,m:S.m,d:((S.d+11)%28)+1});currentEvent={...alt};const c=alt.city;
  add(`Another item in the archive for this date:<div class="ev"><div class="k mono"><span>◆ ${alt.type.k}</span><i>SAMPLE DATA</i></div><h4>${alt.title}</h4><div class="loc mono">${c.name.toUpperCase()}</div></div>${alt.summary}`);
  highlight(c);chips([["Yes, tell me more",more],["Show it on the globe",showIt]]);}
async function compare(){const a=currentEvent.city,b=CITIES.filter(c=>c!==a).sort((x,y)=>Math.abs(lightIndex(x,S)-lightIndex(a,S))-Math.abs(lightIndex(y,S)-lightIndex(a,S)))[0];
  add(`<b style="color:#fff">${a.name}</b> (${lightIndex(a,S).toFixed(2)}) is most similar to <b style="color:#fff">${b.name}</b> (${lightIndex(b,S).toFixed(2)}) on this date. Click either city on the globe for details.`);selectCity(b,false);}
async function getAIResponse(q){
  // Replace this with a real call to your AI backend, passing the date + event as context.
  const t=q.toLowerCase(),c=currentEvent?.city;
  const hit=CITIES.find(k=>t.includes(k.name.toLowerCase()));
  if(hit){highlight(hit);return `${hit.name} has a light index of <b style="color:#9fe9ff">${lightIndex(hit,S).toFixed(2)}</b> on ${ds()}. I've moved the globe there.`}
  if(/where|location/.test(t)&&c)return `It took place in <b style="color:#fff">${c.name}</b> (${c.lat.toFixed(1)}°, ${c.lon.toFixed(1)}°). It's marked in amber on the globe.`;
  if(/why|cause/.test(t))return `In this demo the events are generated placeholders, so there's no real cause to report yet. Once you connect a real dataset, I'll answer from it.`;
  if(/how many|number|stat/.test(t)){const s=stats(S);return `On ${ds()} the archive tracks <b style="color:#9fe9ff">${fmt(s.cities)}</b> cities across <b style="color:#9fe9ff">${fmt(s.regions)}</b> active regions, with ${s.points.toFixed(1)}M data points.`}
  return `Good question! I'm running on placeholder responses right now. Connect <span class="mono" style="color:#9fe9ff">getAIResponse()</span> to an AI API to answer free-form questions about ${ds()}.`;
}
async function freeform(q){add(await getAIResponse(q));}
$("form").onsubmit=e=>{e.preventDefault();const q=$("q").value.trim();if(!q)return;$("q").value="";ask(q)};
function openChat(){chatOpen=true;$("chat").classList.add("open");$("left").classList.add("hide");$("coords").classList.add("hide");
  if(!msgs.children.length||lastChatDate!==ds()){introduceEvent(msgs.children.length?"The date changed. Here's a notable event on":null)}}
function closeChat(){chatOpen=false;$("chat").classList.remove("open");$("left").classList.remove("hide");$("coords").classList.remove("hide");highlight(null)}
$("openChat").onclick=openChat;$("closeChat").onclick=closeChat;
let dateTimer=null;
function onDateChange(){if(!chatOpen||playing)return;clearTimeout(dateTimer);dateTimer=setTimeout(()=>{if(lastChatDate!==ds())introduceEvent("The date changed. Here's a notable event on")},900)}

resize();update();requestAnimationFrame(frame);
