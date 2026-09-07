const loadingScreen=document.getElementById("loading-screen");

const LOADING_EXTRA_DELAY=1000;
const LOADING_ASSET_TIMEOUT=2000;

let loadingTransitionId=0;

function showLoading(){
    loadingTransitionId++;
    loadingScreen.classList.add("active");
}

function hideLoading(){
    loadingScreen.classList.remove("active");
}

function wait(ms){
    return new Promise(resolve=>setTimeout(resolve,ms));
}

function waitForImage(image){
    if(image.complete)
        return Promise.resolve();

    return new Promise(resolve=>{
        let finished=false;

        const finish=()=>{
            if(finished)
                return;

            finished=true;
            image.removeEventListener("load",finish);
            image.removeEventListener("error",finish);
            resolve();
        };

        image.addEventListener("load",finish,{once:true});
        image.addEventListener("error",finish,{once:true});

        setTimeout(finish,LOADING_ASSET_TIMEOUT);
    });
}

async function waitForScreenReady(screen){
    if(!screen)
        return;

    const images=[...screen.querySelectorAll("img")];

    await Promise.all(images.map(waitForImage));

    if(document.fonts&&document.fonts.ready){
        try{
            await Promise.race([
                document.fonts.ready,
                wait(LOADING_ASSET_TIMEOUT)
            ]);
        }catch{}
    }

    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
}

async function showScreenAfterLoading(screen,showCallback){
    const transitionId=++loadingTransitionId;

    loadingScreen.classList.add("active");

    await waitForScreenReady(screen);

    if(transitionId!==loadingTransitionId)
        return;

    await wait(LOADING_EXTRA_DELAY);

    if(transitionId!==loadingTransitionId)
        return;

    try{
        showCallback();
    }finally{
        setTimeout(()=>{
            if(transitionId===loadingTransitionId)
                hideLoading();
        },50);
    }
}

GameCef.on("loading:show",()=>{
    showLoading();
});

GameCef.on("loading:hide",()=>{
    loadingTransitionId++;
    hideLoading();
});
