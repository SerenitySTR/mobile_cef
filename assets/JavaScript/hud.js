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
    const sizeMultiplier=isPhone?0.88:0.68;

    let scale=Math.min(scaleByWidth,scaleByHeight)*sizeMultiplier;

    scale=Math.max(
        HUD_MIN_SCALE*sizeMultiplier,
        Math.min(HUD_MAX_SCALE*sizeMultiplier,scale)
    );

    hud.style.setProperty("--hud-scale",scale.toFixed(4));

    if(width<1000||height<600)
        hud.classList.add("hud-compact");
    else
        hud.classList.remove("hud-compact");
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

function showHud(){
    hud.classList.add("active");
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

setHudStat("health",96);
setHudStat("armour",100);
setHudStat("hunger",88);

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
}


if(window.GameCef){
    GameCef.on("hud:ammo",(data)=>{
        try{
            updateHud(JSON.parse(data));
        }catch{}
    });
}
showHud();
