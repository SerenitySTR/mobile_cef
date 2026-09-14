class Loading {
    static #screen=document.getElementById("loading-screen");
    static #transitionId=0;

    static Show(){
        this.#transitionId++;
        this.#screen.classList.add("active");
    }

    static Hide(){
        this.#transitionId++;
        this.#screen.classList.remove("active");
    }

    static Transition(screen,showCallback){
        const transitionId=++this.#transitionId;

        this.#screen.classList.add("active");
        showCallback();

        requestAnimationFrame(()=>{
            if(transitionId!==this.#transitionId)
                return;

            this.#screen.classList.remove("active");
        });
    }
}

GameCef.on("loading:show",()=>{
    Loading.Show();
});

GameCef.on("loading:hide",()=>{
    Loading.Hide();
});

Loading.Hide();
