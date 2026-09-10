const hud=document.getElementById("hud");

const HUD_REFERENCE_WIDTH=1280;
const HUD_REFERENCE_HEIGHT=720;
const HUD_MIN_SCALE=0.46;
const HUD_MAX_SCALE=1.35;

function updateHudMobileScale(){
    const width=window.innerWidth;
    const height=window.innerHeight;

    const scaleByWidth=width/HUD_REFERENCE_WIDTH;
    const scaleByHeight=height/HUD_REFERENCE_HEIGHT;

    const isPhone=width<=1000||height<=600;
    const sizeMultiplier=isPhone?0.88:0.82;

    let scale=Math.min(scaleByWidth,scaleByHeight)*sizeMultiplier;

    scale=Math.max(
        HUD_MIN_SCALE*sizeMultiplier,
        Math.min(HUD_MAX_SCALE*sizeMultiplier,scale)
    );

    hud.style.setProperty("--hud-scale",scale.toFixed(4));

    if(isPhone){
        hud.classList.add("hud-compact");
        hud.style.removeProperty("opacity");
    }else{
        hud.classList.remove("hud-compact");
        hud.style.opacity="1";
    }
}

updateHudMobileScale();

window.addEventListener("resize",updateHudMobileScale);
window.addEventListener("orientationchange",()=>{
    setTimeout(updateHudMobileScale,100);
});


const HUD_RING_LENGTH=2*Math.PI*49;

const hudStats={
    health:{
        ring:document.getElementById("hud-health-ring"),
        value:document.getElementById("hud-health-value")
    },

    armour:{
        ring:document.getElementById("hud-armour-ring"),
        value:document.getElementById("hud-armour-value")
    },

    hunger:{
        ring:document.getElementById("hud-hunger-ring"),
        value:document.getElementById("hud-hunger-value")
    }
};

const hudMoneyValue=document.getElementById("hud-money-value");
const hudOnlineValue=document.getElementById("hud-online-value");
const hudIdValue=document.getElementById("hud-id-value");
const hudAmmoClip=document.getElementById("hud-ammo-clip");
const hudAmmoTotal=document.getElementById("hud-ammo-total");
const hudWeaponImage=document.getElementById("hud-weapon-image");

const HUD_WEAPON_IMAGES={
    0:"fist.svg",
    1:"brassknuckle.svg",
    2:"golfclub.svg",
    3:"nightstick.svg",
    4:"knife.svg",
    5:"bat.svg",
    6:"shovel.svg",
    7:"poolcue.svg",
    8:"katana.svg",
    9:"chainsaw.svg",
    10:"dildo1.svg",
    11:"dildo2.svg",
    12:"vibrator1.svg",
    13:"vibrator2.svg",
    14:"flowers.svg",
    15:"cane.svg",
    16:"grenade.svg",
    17:"teargas.svg",
    18:"molotov.svg",
    22:"colt45.svg",
    23:"silenced.svg",
    24:"deagle.svg",
    25:"shotgun.svg",
    26:"sawnoff.svg",
    27:"spas12.svg",
    28:"uzi.svg",
    29:"mp5.svg",
    30:"ak47.svg",
    31:"m4.svg",
    32:"tec9.svg",
    33:"rifle.svg",
    34:"sniper.svg",
    35:"rocketlauncher.svg",
    36:"heatseeker.svg",
    37:"flamethrower.svg",
    38:"minigun.svg",
    39:"satchel.svg",
    40:"detonator.svg",
    41:"spraycan.svg",
    42:"extinguisher.svg",
    43:"camera.svg",
    44:"nightvision.svg",
    45:"infrared.svg",
    46:"parachute.svg"
};

function updateHudWeapon(data){
    if(!data)
        return;

    const weaponId=Math.max(0,Math.trunc(Number(data.WeaponId!==undefined?data.WeaponId:data.weaponId)||0));
    const ammoClip=Math.max(0,Math.trunc(Number(data.AmmoClip!==undefined?data.AmmoClip:data.ammoClip)||0));
    const ammoTotal=Math.max(0,Math.trunc(Number(data.AmmoTotal!==undefined?data.AmmoTotal:data.ammoTotal)||0));
    const weaponFile=HUD_WEAPON_IMAGES[weaponId]||HUD_WEAPON_IMAGES[0];

    if(hudWeaponImage)
        hudWeaponImage.src="./assets/CSS/Images/Hud/Weapons/"+weaponFile;

    hudAmmoClip.textContent=ammoClip;
    hudAmmoTotal.textContent="/"+ammoTotal;
}

function showHud(){
    Loading.Transition(hud,()=>{
        hud.classList.add("active");
    });
}

function hideHud(){
    hud.classList.remove("active");
}

function clamp(value,min,max){
    return Math.max(min,Math.min(max,value));
}

function setHudStat(name,value){
    const stat=hudStats[name];

    if(!stat)
        return;

    value=clamp(Number(value)||0,0,100);

    stat.ring.style.strokeDasharray=HUD_RING_LENGTH;
    stat.ring.style.strokeDashoffset=HUD_RING_LENGTH*(1-value/100);
    stat.value.textContent=Math.round(value);
}

function formatHudMoney(value){
    value=Math.trunc(Number(value)||0);

    return value.toLocaleString("ru-RU").replace(/\u00A0/g," ");
}

function updateHud(data){
    if(data.health!==undefined)
        setHudStat("health",data.health);

    if(data.armour!==undefined)
        setHudStat("armour",data.armour);

    if(data.hunger!==undefined)
        setHudStat("hunger",data.hunger);

    if(data.money!==undefined)
        hudMoneyValue.textContent=formatHudMoney(data.money);

    if(data.online!==undefined)
        hudOnlineValue.textContent=Math.max(0,Math.trunc(Number(data.online)||0));

    if(data.id!==undefined)
        hudIdValue.textContent=Math.max(0,Math.trunc(Number(data.id)||0));

    if(data.ammoClip!==undefined)
        hudAmmoClip.textContent=Math.max(0,Math.trunc(Number(data.ammoClip)||0));

    if(data.ammoTotal!==undefined)
        hudAmmoTotal.textContent=`/${Math.max(0,Math.trunc(Number(data.ammoTotal)||0))}`;
}


if(window.GameCef){
    GameCef.on("hud:show",showHud);
    GameCef.on("hud:hide",hideHud);

    GameCef.on("hud:update",(data)=>{
        try{
            updateHud(JSON.parse(data));
        }catch{}
    });

    GameCef.on("hud:health",(data)=>setHudStat("health",data));
    GameCef.on("hud:armour",(data)=>setHudStat("armour",data));
    GameCef.on("hud:hunger",(data)=>setHudStat("hunger",data));

    GameCef.on("hud:money",(data)=>updateHud({money:data}));
    GameCef.on("hud:online",(data)=>updateHud({online:data}));
    GameCef.on("hud:id",(data)=>updateHud({id:data}));
    GameCef.on("hud:weapon",(data)=>{
        try{
            updateHudWeapon(typeof data==="string"?JSON.parse(data):data);
        }catch{}
    });
}


if(window.GameCef){
    GameCef.on("hud:ammo",(data)=>{
        try{
            updateHud(JSON.parse(data));
        }catch{}
    });
}

let hudPcCefInitialized=false;
let hudPcStatsHandler=null;

function hideDefaultPcHud(){
    if(!window.cef||typeof window.cef.emit!=="function")
        return;

    const components=[
        "ammo",
        "weapon",
        "health",
        "armour",
        "breath",
        "money",
        "wanted",
        "radar",
        "crosshair",
        "clock",
        "radio",
        "vehicle_name",
        "area_name",
        "help_text"
    ];

    components.forEach(component=>{
        window.cef.emit("game:hud:setComponentVisible",component,false);
    });
}

function initializeHudPcStats(){
    if(hudPcCefInitialized)
        return true;

    if(!window.cef||typeof window.cef.on!=="function"||typeof window.cef.emit!=="function")
        return false;

    hudPcStatsHandler=(health,maxHealth,armour,breath,wanted,weapon,ammo,maxAmmo,money,speed)=>{
        updateHudWeapon({
            WeaponId:weapon,
            AmmoClip:ammo,
            AmmoTotal:maxAmmo
        });
    };

    window.cef.on("game:data:playerStats",hudPcStatsHandler);
    hideDefaultPcHud();
    window.cef.emit("game:data:pollPlayerStats",true,50);

    hudPcCefInitialized=true;
    return true;
}

function startHudPcStats(){
    if(initializeHudPcStats())
        return;

    const timer=setInterval(()=>{
        if(initializeHudPcStats())
            clearInterval(timer);
    },250);

    setTimeout(()=>{
        clearInterval(timer);
    },15000);
}

startHudPcStats();

window.addEventListener("load",()=>{
    startHudPcStats();

    if(hudPcCefInitialized&&window.cef&&typeof window.cef.emit==="function"){
        hideDefaultPcHud();
        window.cef.emit("game:data:pollPlayerStats",true,50);
    }
});

window.addEventListener("focus",()=>{
    if(initializeHudPcStats()&&window.cef&&typeof window.cef.emit==="function"){
        hideDefaultPcHud();
        window.cef.emit("game:data:pollPlayerStats",true,50);
    }
});
