(() => {
  const $ = id => document.getElementById(id);
  const clamp100 = n => Math.max(0, Math.min(100, Number(n) || 0));
  const parsePayload = data => {
    if (data && typeof data === 'object') return data;
    if (typeof data === 'string') { try { const p=JSON.parse(data); return p && typeof p==='object' ? p : null; } catch(_){} }
    return null;
  };
  const HUD_WEAPON_IMAGES = {
    0:'fist.webp',1:'brassknuckle.webp',2:'golfclub.webp',3:'nightstick.webp',4:'knife.webp',5:'bat.webp',6:'shovel.webp',7:'poolcue.webp',8:'katana.webp',9:'chainsaw.webp',10:'dildo1.webp',11:'dildo2.webp',12:'vibrator1.webp',13:'vibrator2.webp',14:'flowers.webp',15:'cane.webp',16:'grenade.webp',17:'teargas.webp',18:'molotov.webp',22:'colt45.webp',23:'silenced.webp',24:'deagle.webp',25:'shotgun.webp',26:'sawnoff.webp',27:'spas12.webp',28:'uzi.webp',29:'mp5.webp',30:'ak47.webp',31:'m4.webp',32:'tec9.webp',33:'rifle.webp',34:'sniper.webp',35:'rocketlauncher.webp',36:'heatseeker.webp',37:'flamethrower.webp',38:'minigun.webp',39:'satchel.webp',40:'detonator.webp',41:'spraycan.webp',42:'extinguisher.webp',43:'camera.webp',44:'nightvision.webp',45:'infrared.webp',46:'parachute.webp'
  };
  function setStat(id,value){ const el=$(id); if(!el)return; const v=clamp100(value); el.textContent=Math.round(v); const stat=el.closest('.stat'); if(stat)stat.style.setProperty('--value',v); }
  function fmtMoney(v){ return Number(v||0).toLocaleString('uk-UA').replace(/\u00a0/g,' '); }
  function renderWanted(level){ const root=$('wanted'); if(!root)return; root.innerHTML=''; const n=Math.max(0,Math.min(5,Math.trunc(Number(level)||0))); for(let i=1;i<=5;i++){const s=document.createElement('span');s.textContent='★';s.className=i<=n?'on':'off';root.appendChild(s);} }
  function setPlayer(name,id){ if(name!=null)$('playerName').textContent=name; if(id!=null)$('playerId').textContent=Math.max(0,Math.trunc(Number(id)||0)); }
  function setTime(time,date){ if(time!=null)$('clock').textContent=time; if(date!=null)$('date').textContent=date; }
  function setMoney(value){ $('money').textContent=fmtMoney(value); }
  function setAmmo(current,total){ $('ammoClip').textContent=Math.max(0,Math.trunc(Number(current)||0)); $('ammoTotal').textContent=Math.max(0,Math.trunc(Number(total)||0)); }
  function updateWeapon(data){ if(!data)return; const id=Math.max(0,Math.trunc(Number(data.WeaponId!==undefined?data.WeaponId:data.weaponId)||0)); const clip=data.AmmoClip!==undefined?data.AmmoClip:(data.ammoClip??data.ammo??0); const total=data.AmmoTotal??data.ammoTotal??data.maxAmmo??data.MaxAmmo??data.max_ammo??data.totalAmmo??data.TotalAmmo??data.ammo_total??0; $('weaponImage').src='assets/CSS/Images/Hud/Weapons/'+(HUD_WEAPON_IMAGES[id]||HUD_WEAPON_IMAGES[0]); const ammo=$('ammo'); if(ammo)ammo.style.display=id===0?'none':''; setAmmo(clip,total); }
  function updateHud(data){ if(!data)return; const hp=data.health??data.Health??data.hp??data.HP; const armor=data.armour??data.Armour??data.armor??data.Armor; const hunger=data.hunger??data.Hunger; const money=data.money??data.Money; const wanted=data.wanted??data.Wanted??data.wantedLevel??data.WantedLevel; const weapon=data.weapon??data.Weapon??data.weaponId??data.WeaponId; if(hp!==undefined)setStat('hp',hp); if(armor!==undefined)setStat('armor',armor); if(hunger!==undefined)setStat('hunger',hunger); if(money!==undefined)setMoney(money); if(wanted!==undefined)renderWanted(wanted); setPlayer(data.nickname??data.Nickname??data.name??data.Name, data.id??data.ID??data.playerId??data.PlayerId); setTime(data.time??data.Time,data.date??data.Date); if(weapon!==undefined || data.ammo!==undefined || data.ammoClip!==undefined || data.AmmoClip!==undefined || data.ammoTotal!==undefined || data.AmmoTotal!==undefined) updateWeapon(data); }
  function showHud(){ document.body.style.display=''; }
  function hideHud(){ document.body.style.display='none'; }

  window.AntaresHUD={setPlayer,setTime,setStats({hp,armor,hunger}={}){if(hp!=null)setStat('hp',hp);if(armor!=null)setStat('armor',armor);if(hunger!=null)setStat('hunger',hunger);},setAmmo,setMoney,setWanted:renderWanted,setWeapon:updateWeapon,update:updateHud};

  if(window.GameCef){
    GameCef.on('hud:show',showHud); GameCef.on('hud:hide',hideHud);
    GameCef.on('hud:update',d=>{const p=parsePayload(d);if(p)updateHud(p)});
    GameCef.on('hud:player',d=>{const p=parsePayload(d);if(p)updateHud(p)});
    GameCef.on('hud:nickname',d=>setPlayer(d,null)); GameCef.on('hud:time',d=>setTime(d,null)); GameCef.on('hud:date',d=>setTime(null,d));
    GameCef.on('hud:health',d=>setStat('hp',d)); GameCef.on('hud:armour',d=>setStat('armor',d)); GameCef.on('hud:hunger',d=>setStat('hunger',d)); GameCef.on('hud:money',d=>setMoney(d)); GameCef.on('hud:id',d=>setPlayer(null,d));
    GameCef.on('hud:wanted',renderWanted); GameCef.on('hud:wantedLevel',renderWanted);
    GameCef.on('hud:weapon',d=>{const p=parsePayload(d)||d;if(p&&typeof p==='object')updateWeapon(p)});
    GameCef.on('hud:ammo',d=>{const p=parsePayload(d);if(p)updateHud(p)});
  }
  let directBound=false;
  function bindDirect(){
    if(directBound||!window.cef||typeof window.cef.on!=='function'||typeof window.cef.emit!=='function')return false;
    window.cef.on('game:data:wantedLevel',renderWanted);
    window.cef.on('game:data:hud',v=>{const p=parsePayload(v);if(p)updateHud(p)});
    window.cef.on('game:data:playerInfo',v=>{const p=parsePayload(v);if(p)updateHud(p)});
    window.cef.on('game:data:playerStats',(...args)=>{
      let p=args.length===1?(parsePayload(args[0])||(args[0]&&typeof args[0]==='object'?args[0]:null)):null;
      if(p){updateHud(p);return;}
      const [health,maxHealth,armour,breath,wanted,weapon,ammo,maxAmmo]=args;
      if(health!==undefined)setStat('hp',health); if(armour!==undefined)setStat('armor',armour); if(wanted!==undefined)renderWanted(wanted); if(weapon!==undefined||ammo!==undefined||maxAmmo!==undefined)updateWeapon({WeaponId:weapon??0,AmmoClip:ammo??0,AmmoTotal:maxAmmo??0});
    });
    window.cef.emit('game:data:pollPlayerStats',true,50); directBound=true; return true;
  }
  if(!bindDirect()){const t=setInterval(()=>{if(bindDirect())clearInterval(t)},250);setTimeout(()=>clearInterval(t),15000)}
  window.addEventListener('load',()=>{if(bindDirect()&&window.cef)window.cef.emit('game:data:pollPlayerStats',true,50);else if(directBound&&window.cef)window.cef.emit('game:data:pollPlayerStats',true,50)});
  window.addEventListener('focus',()=>{if(bindDirect()||directBound){if(window.cef&&typeof window.cef.emit==='function')window.cef.emit('game:data:pollPlayerStats',true,50)}});

  function updateScale(){const scale=Math.min(innerWidth/1920,innerHeight/1080);document.documentElement.style.setProperty('--hud-scale',String(scale))} updateScale(); addEventListener('resize',updateScale,{passive:true});
  if(new URLSearchParams(location.search).get('preview')==='1')document.body.classList.add('preview');
  renderWanted(4);
})();

window.addEventListener("message", event => {
  const message = event.data;
  if (!message || message.source !== "antares-hud") return;

  if (message.type === "show") {
    document.body.classList.add("pc-hud-visible");
    return;
  }

  if (message.type === "hide") {
    document.body.classList.remove("pc-hud-visible");
    return;
  }

  if (message.type === "update" && window.AntaresHUD) {
    window.AntaresHUD.update(message.data || {});
  }
});
