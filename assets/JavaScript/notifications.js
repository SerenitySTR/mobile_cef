class Notifications {
    static #toastContainer=document.getElementById("notification-toast-container");
    static #bannerContainer=document.getElementById("notification-banner-container");
    static #bottomContainer=document.getElementById("notification-bottom-container");

    static #maxToasts=4;
    static #counter=0;
    static #timers=new Map();

    static Toast(data){
        data=this.#Normalize(data);

        const element=this.#CreateToast(data);

        this.#toastContainer.prepend(element);
        this.#TrimToasts();
        this.#AutoRemove(element,data.Duration);

        return element.dataset.notificationId;
    }

    static Banner(data){
        data=this.#Normalize(data);

        this.#ClearContainer(this.#bannerContainer);

        const element=this.#CreateBanner(data);

        this.#bannerContainer.appendChild(element);

        if(data.Duration>0)
            this.#AutoRemove(element,data.Duration);

        return element.dataset.notificationId;
    }

    static Reward(data){
        data=this.#Normalize(data);
        data.Label=data.Label||"НАГОРОДА";

        return this.#Bottom(data,"reward");
    }

    static Achievement(data){
        data=this.#Normalize(data);
        data.Label=data.Label||"ДОСЯГНЕННЯ";

        return this.#Bottom(data,"achievement");
    }

    static Bottom(data){
        data=this.#Normalize(data);
        data.Label=data.Label||"ІНФОРМАЦІЯ";

        return this.#Bottom(data,"info");
    }

    static Show(data){
        data=this.#Normalize(data);

        switch((data.Layout||"Toast").toLowerCase()){
            case "banner":
                return this.Banner(data);

            case "reward":
                return this.Reward(data);

            case "achievement":
                return this.Achievement(data);

            case "bottom":
            case "info":
                return this.Bottom(data);

            default:
                return this.Toast(data);
        }
    }

    static Hide(id){
        const element=document.querySelector(`[data-notification-id="${id}"]`);

        if(element)
            this.#Remove(element);
    }

    static Clear(){
        document.querySelectorAll("[data-notification-id]").forEach(element=>{
            this.#Remove(element,true);
        });
    }

    static #Bottom(data,style){
        this.#ClearContainer(this.#bottomContainer);

        const element=this.#CreateBottom(data,style);

        this.#bottomContainer.appendChild(element);

        if(data.Duration>0)
            this.#AutoRemove(element,data.Duration);

        return element.dataset.notificationId;
    }

    static #Normalize(data){
        if(typeof data==="string"){
            try{
                data=JSON.parse(data);
            }catch{
                data={Text:data};
            }
        }

        data=data||{};

        return {
            Id:data.Id??data.id??null,
            Layout:data.Layout??data.layout??"Toast",
            Type:(data.Type??data.type??"Info").toString(),
            Label:data.Label??data.label??"",
            Title:data.Title??data.title??"",
            Text:data.Text??data.text??data.Message??data.message??"",
            Subtext:data.Subtext??data.subtext??"",
            Time:data.Time??data.time??"",
            Duration:Number(data.Duration??data.duration??5000),
            Brand:data.Brand??data.brand??true
        };
    }

    static #CreateToast(data){
        const element=this.#CreateBase(data,"notification-toast");

        element.innerHTML=`
            ${this.#Icon(data.Type)}
            <div class="notification-body">
                <div class="notification-header">
                    <div class="notification-title">${this.#Escape(data.Title||this.#DefaultTitle(data.Type))}</div>
                    ${data.Time?`<div class="notification-time">${this.#Escape(data.Time)}</div>`:""}
                </div>
                ${data.Text?`<p class="notification-text">${this.#Escape(data.Text)}</p>`:""}
            </div>
            ${data.Duration>0?`<div class="notification-progress"><span></span></div>`:""}
        `;

        if(data.Duration>0)
            element.style.setProperty("--notification-duration",`${data.Duration}ms`);

        return element;
    }

    static #CreateBanner(data){
        const element=this.#CreateBase(data,"notification-banner");

        element.innerHTML=`
            ${this.#Icon(data.Type)}
            <div class="notification-body">
                ${data.Label?`<div class="notification-banner-label">${this.#Escape(data.Label)}</div>`:""}
                <div class="notification-title">${this.#Escape(data.Title||this.#DefaultTitle(data.Type))}</div>
                ${data.Text?`<p class="notification-text">${this.#Escape(data.Text)}</p>`:""}
                ${data.Subtext?`
                    <div class="notification-subtext">
                        ${this.#LocationIcon()}
                        <span>${this.#Escape(data.Subtext)}</span>
                    </div>
                `:""}
            </div>
            <button class="notification-close" type="button" aria-label="Закрити">×</button>
        `;

        element.querySelector(".notification-close").addEventListener("click",()=>{
            this.#Remove(element);
        });

        return element;
    }

    static #CreateBottom(data,style){
        const element=this.#CreateBase(data,"notification-bottom");

        element.classList.add(`notification-bottom-${style}`);

        element.innerHTML=`
            ${this.#Icon(style==="achievement"?"achievement":data.Type)}
            <div class="notification-body">
                ${data.Label?`<div class="notification-bottom-label">${this.#Escape(data.Label)}</div>`:""}
                <div class="notification-title">${this.#Escape(data.Title||this.#DefaultTitle(data.Type))}</div>
                ${data.Text?`<p class="notification-text">${this.#Escape(data.Text)}</p>`:""}
            </div>
            ${data.Brand?`
                <div class="notification-brand">
                    ANTARES
                    <span>ROLEPLAY</span>
                </div>
            `:""}
        `;

        return element;
    }

    static #CreateBase(data,className){
        const element=document.createElement("div");

        element.className=`notification ${className} notification-${this.#TypeClass(data.Type)}`;
        element.dataset.notificationId=(data.Id??++this.#counter).toString();

        return element;
    }

    static #AutoRemove(element,duration){
        if(!Number.isFinite(duration)||duration<=0)
            return;

        const id=element.dataset.notificationId;

        const timer=setTimeout(()=>{
            this.#timers.delete(id);
            this.#Remove(element);
        },duration);

        this.#timers.set(id,timer);
    }

    static #Remove(element,immediate=false){
        if(!element||!element.isConnected)
            return;

        const id=element.dataset.notificationId;
        const timer=this.#timers.get(id);

        if(timer){
            clearTimeout(timer);
            this.#timers.delete(id);
        }

        if(immediate){
            element.remove();
            return;
        }

        element.classList.add("removing");

        setTimeout(()=>{
            element.remove();
        },320);
    }

    static #ClearContainer(container){
        [...container.children].forEach(element=>{
            this.#Remove(element,true);
        });
    }

    static #TrimToasts(){
        const items=[...this.#toastContainer.children];

        while(items.length>this.#maxToasts){
            const element=items.pop();
            this.#Remove(element,true);
        }
    }

    static #TypeClass(type){
        type=type.toString().toLowerCase();

        if(type==="success")
            return "success";

        if(type==="warning")
            return "warning";

        if(type==="error")
            return "error";

        return "info";
    }

    static #DefaultTitle(type){
        switch(this.#TypeClass(type)){
            case "success":
                return "Успішно";

            case "warning":
                return "Увага";

            case "error":
                return "Помилка";

            default:
                return "Інформація";
        }
    }

    static #Icon(type){
        type=type.toString().toLowerCase();

        let path="";

        switch(type){
            case "success":
                path='<path d="m6 12 4 4 8-9"></path>';
                break;

            case "warning":
                path='<path d="M12 3 2.8 20h18.4L12 3Z"></path><path d="M12 8v5"></path><path d="M12 17h.01"></path>';
                break;

            case "error":
                path='<circle cx="12" cy="12" r="9"></circle><path d="m9 9 6 6"></path><path d="m15 9-6 6"></path>';
                break;

            case "achievement":
                path='<path d="M12 3 5 8v8l7 5 7-5V8l-7-5Z"></path><path d="m8 13 4-4 4 4"></path><path d="m8 17 4-4 4 4"></path>';
                break;

            default:
                path='<circle cx="12" cy="12" r="9"></circle><path d="M12 11v6"></path><path d="M12 7h.01"></path>';
                break;
        }

        return `
            <div class="notification-icon">
                <svg viewBox="0 0 24 24" aria-hidden="true">${path}</svg>
            </div>
        `;
    }

    static #LocationIcon(){
        return `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 22s7-5.2 7-12A7 7 0 1 0 5 10c0 6.8 7 12 7 12Zm0-8.6A3.4 3.4 0 1 1 12 6.6a3.4 3.4 0 0 1 0 6.8Z"></path>
            </svg>
        `;
    }

    static #Escape(value){
        return value
            .toString()
            .replaceAll("&","&amp;")
            .replaceAll("<","&lt;")
            .replaceAll(">","&gt;")
            .replaceAll('"',"&quot;")
            .replaceAll("'","&#039;");
    }
}

GameCef.on("notification:show",data=>{
    Notifications.Show(data);
});

GameCef.on("notification:toast",data=>{
    Notifications.Toast(data);
});

GameCef.on("notification:banner",data=>{
    Notifications.Banner(data);
});

GameCef.on("notification:reward",data=>{
    Notifications.Reward(data);
});

GameCef.on("notification:achievement",data=>{
    Notifications.Achievement(data);
});

GameCef.on("notification:bottom",data=>{
    Notifications.Bottom(data);
});

GameCef.on("notification:hide",data=>{
    try{
        const value=typeof data==="string"?JSON.parse(data):data;
        Notifications.Hide(value.Id??value.id??value);
    }catch{
        Notifications.Hide(data);
    }
});

GameCef.on("notification:clear",()=>{
    Notifications.Clear();
});

