const loadingScreen=document.getElementById("loading-screen");

const LOADING_EXTRA_DELAY=1000;
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
        image.addEventListener("load",resolve,{once:true});
        image.addEventListener("error",resolve,{once:true});
    });
}

async function waitForScreenReady(screen){
    if(!screen)
        return;

    const images=[...screen.querySelectorAll("img")];

    await Promise.all(images.map(waitForImage));

    if(document.fonts&&document.fonts.ready){
        try{
            await document.fonts.ready;
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

    showCallback();

    requestAnimationFrame(()=>{
        if(transitionId===loadingTransitionId)
            hideLoading();
    });
}

GameCef.on("loading:show",()=>{
    showLoading();
});

GameCef.on("loading:hide",()=>{
    loadingTransitionId++;
    hideLoading();
});
