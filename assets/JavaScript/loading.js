const loadingScreen=document.getElementById("loading-screen");

function showLoading(){
    loadingScreen.classList.add("active");
}

function hideLoading(){
    loadingScreen.classList.remove("active");
}

GameCef.on("loading:show",()=>{
    showLoading();
});

GameCef.on("loading:hide",()=>{
    hideLoading();
});
