class Loading {
    static #screen=document.getElementById("loading-screen");
    static #transitionId=0;

    static ExtraDelay=250;
    static AssetTimeout=500;

    static Show(){
        this.#transitionId++;
        this.#screen.classList.add("active");
    }

    static Hide(){
        this.#transitionId++;
        this.#screen.classList.remove("active");
    }

    static async Transition(screen,showCallback,delay=this.ExtraDelay){
        const transitionId=++this.#transitionId;

        this.#screen.classList.add("active");

        await this.#WaitForScreen(screen);

        if(transitionId!==this.#transitionId)
            return;

        await this.#Wait(delay);

        if(transitionId!==this.#transitionId)
            return;

        showCallback();

        if(transitionId===this.#transitionId)
            this.#screen.classList.remove("active");
    }

    static async #WaitForScreen(screen){
        if(!screen)
            return;

        const images=[...screen.querySelectorAll("img")];

        await Promise.all(images.map(image=>this.#WaitForImage(image)));

        if(document.fonts&&document.fonts.ready){
            try{
                await Promise.race([
                    document.fonts.ready,
                    this.#Wait(this.AssetTimeout)
                ]);
            }catch{}
        }

        await new Promise(resolve=>{
            requestAnimationFrame(()=>{
                requestAnimationFrame(resolve);
            });
        });
    }

    static #WaitForImage(image){
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

            setTimeout(finish,this.AssetTimeout);
        });
    }

    static #Wait(ms){
        return new Promise(resolve=>setTimeout(resolve,ms));
    }
}

GameCef.on("loading:show",()=>{
    Loading.Show();
});

GameCef.on("loading:hide",()=>{
    Loading.Hide();
});

Loading.Hide();
