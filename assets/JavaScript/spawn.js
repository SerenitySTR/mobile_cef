const spawnSelection=document.getElementById("spawn-selection");
const spawnItems=document.querySelectorAll(".spawn-item");
const spawnButton=document.getElementById("spawn-button");
const spawnPreviewImage=document.getElementById("spawn-preview-image");
const spawnPreviewTitle=document.getElementById("spawn-preview-title");
const spawnPreviewText=document.getElementById("spawn-preview-text");
const spawnPreviewLocation=document.getElementById("spawn-preview-location");

const spawnData={
    LastPosition:{
        id:0,
        title:"Останнє місце",
        text:"Поверніться до місця, де завершили попередню ігрову сесію.",
        location:"SAN ANDREAS",
        image:"./assets/CSS/Images/Spawn/last-position.svg"
    },
    House:{
        id:1,
        title:"Будинок",
        text:"Почніть гру у власному будинку та одразу опиніться вдома.",
        location:"ВАШ БУДИНОК",
        image:"./assets/CSS/Images/Spawn/house.svg"
    },
    Standard:{
        id:2,
        title:"Стандартный",
        text:"Стандартне місце появи для швидкого початку гри у місті.",
        location:"СТАНДАРТНИЙ СПАВН",
        image:"./assets/CSS/Images/Spawn/standard.svg"
    },
    FamilyHouse:{
        id:3,
        title:"Будинок родини",
        text:"З'явіться у будинку своєї родини поруч з іншими її учасниками.",
        location:"БУДИНОК РОДИНИ",
        image:"./assets/CSS/Images/Spawn/family-house.svg"
    }
};

let selectedSpawn="LastPosition";

function showSpawn(){
    spawnSelection.classList.add("active");
}

function hideSpawn(){
    spawnSelection.classList.remove("active");
}

function getSpawnKey(value){
    if(typeof value==="number"){
        return Object.keys(spawnData).find(key=>spawnData[key].id===value);
    }

    if(typeof value==="string"&&/^\d+$/.test(value)){
        const id=Number(value);
        return Object.keys(spawnData).find(key=>spawnData[key].id===id);
    }

    return spawnData[value]?value:null;
}

function selectSpawn(value){
    const type=getSpawnKey(value);
    if(!type)return;

    selectedSpawn=type;

    spawnItems.forEach(item=>{
        item.classList.toggle("active",item.dataset.spawn===type);
    });

    const data=spawnData[type];
    spawnPreviewImage.src=data.image;
    spawnPreviewTitle.textContent=data.title;
    spawnPreviewText.textContent=data.text;
    spawnPreviewLocation.textContent=data.location;
}

spawnItems.forEach(item=>{
    item.addEventListener("click",()=>selectSpawn(item.dataset.spawn));
});

spawnButton.addEventListener("click",()=>{
    GameCef.sendJson("spawn:submit",{
        SpawnType:spawnData[selectedSpawn].id
    });
});

GameCef.on("spawn:show",data=>{
    if(data){
        try{
            const value=typeof data==="string"?JSON.parse(data):data;
            if(value&&value.SelectedSpawn!==undefined)selectSpawn(value.SelectedSpawn);
        }catch{
            selectSpawn(data);
        }
    }

    Loading.Transition(spawnSelection,()=>{
        showSpawn();
    });
});

GameCef.on("spawn:hide",()=>{
    hideSpawn();
});
