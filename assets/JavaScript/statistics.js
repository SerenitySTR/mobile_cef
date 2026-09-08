class Statistics {
    static #screen=document.getElementById("statistics");
    static #profileList=document.getElementById("statistics-profile-list");
    static #statusGrid=document.getElementById("statistics-status-grid");
    static #statisticsGrid=document.getElementById("statistics-grid");
    static #skillsList=document.getElementById("statistics-skills-list");
    static #skillsContainer=document.querySelector(".statistics-skills");

    static #icons={
        id:'<path d="M5 4h14v16H5z"></path><path d="M8 8h8"></path><path d="M8 12h5"></path>',
        level:'<path d="M5 20V10"></path><path d="M12 20V4"></path><path d="M19 20V7"></path>',
        health:'<path d="M12 21S3 15.5 3 8.8C3 5.5 5.4 3 8.5 3c1.8 0 3 1 3.5 2 .5-1 1.7-2 3.5-2C18.6 3 21 5.5 21 8.8 21 15.5 12 21 12 21Z"></path>',
        armor:'<path d="M12 2 20 5v6c0 5.5-3.5 9-8 12-4.5-3-8-6.5-8-12V5l8-3Z"></path>',
        hunger:'<path d="M2 2h2v6h1V2h2v6h1V2h2v7c0 2-1.2 3.5-3 4.2V22H5v-8.8C3.2 12.5 2 11 2 9V2Z"></path><path d="M15 2h2c2 2.6 3 5.7 3 9h-3v11h-2V2Z"></path>',
        wanted:'<path d="m12 2 3 6 7 .9-5 4.8 1.3 6.8L12 17l-6.3 3.5L7 13.7 2 8.9 9 8l3-6Z"></path>',
        skill:'<path d="m12 2 3 6 7 .9-5 4.8 1.3 6.8L12 17l-6.3 3.5L7 13.7 2 8.9 9 8l3-6Z"></path>'
    };

    static Show(data){
        data=this.#Parse(data);

        this.#RenderProfile(data.Profile||{});
        this.#RenderStatus(data.Status||[]);
        this.#RenderStatistics(data.Statistics||[]);
        this.#RenderSkills(data.Skills||[]);

        Loading.Transition(this.#screen,()=>{
            this.#screen.classList.add("active");
        });
    }

    static Hide(){
        this.#screen.classList.remove("active");
    }

    static #RenderProfile(profile){
        document.getElementById("statistics-player-name").textContent=profile.Name||"Персонаж";
        document.getElementById("statistics-online-text").textContent=profile.Online===false?"Не в мережі":"В мережі";

        const online=document.querySelector(".statistics-online");

        online.style.color=profile.Online===false?"rgba(184,202,214,.55)":"#31d96c";
        online.querySelector("i").style.background=profile.Online===false?"#748491":"#2ce566";

        this.#profileList.innerHTML="";

        if(profile.Id!==undefined)
            this.#AddProfileItem("id","ID персонажа",profile.Id);

        if(profile.Level!==undefined)
            this.#AddProfileItem("level","Рівень",profile.Level);
    }

    static #AddProfileItem(icon,title,value){
        const element=document.createElement("div");
        element.className="statistics-profile-row";

        element.innerHTML=`
            ${this.#Icon(icon)}
            <span>${this.#Escape(title)}</span>
            <strong>${this.#Escape(value)}</strong>
        `;

        this.#profileList.appendChild(element);
    }

    static #RenderStatus(items){
        this.#statusGrid.innerHTML="";

        items.forEach(item=>{
            const max=Math.max(1,Number(item.Max??100));
            const value=Math.max(0,Math.min(max,Number(item.Value??0)));
            const percent=Math.max(0,Math.min(100,value/max*100));

            const element=document.createElement("div");
            element.className="statistics-status-item";
            element.style.setProperty("--statistics-color",item.Color||this.#StatusColor(item.Id));

            element.innerHTML=`
                <div class="statistics-status-icon">${this.#Icon(item.Icon||item.Id||"skill")}</div>
                <div class="statistics-status-content">
                    <div class="statistics-status-header">
                        <span>${this.#Escape(item.Title||"")}</span>
                        <strong>${this.#Escape(item.DisplayValue??`${value} / ${max}`)}</strong>
                    </div>
                    <div class="statistics-progress">
                        <span style="width:${percent}%"></span>
                    </div>
                </div>
            `;

            this.#statusGrid.appendChild(element);
        });
    }

    static #RenderStatistics(items){
        this.#statisticsGrid.innerHTML="";

        items.forEach(item=>{
            const element=document.createElement("div");
            element.className="statistics-card";

            element.innerHTML=`
                <div class="statistics-card-icon">${this.#Icon(item.Icon||"wanted")}</div>
                <div class="statistics-card-content">
                    <div class="statistics-card-title">${this.#Escape(item.Title||"")}</div>
                    <div class="statistics-card-value">${this.#Escape(item.Value??"-")}</div>
                </div>
            `;

            this.#statisticsGrid.appendChild(element);
        });
    }

    static #RenderSkills(items){
        this.#skillsList.innerHTML="";
        this.#skillsContainer.classList.toggle("empty",items.length===0);

        items.forEach(item=>{
            const max=Math.max(1,Number(item.Max??100));
            const value=Math.max(0,Math.min(max,Number(item.Value??0)));
            const percent=Math.max(0,Math.min(100,value/max*100));

            const element=document.createElement("div");
            element.className="statistics-skill";

            element.innerHTML=`
                <div class="statistics-skill-icon">${this.#Icon(item.Icon||"skill")}</div>
                <div class="statistics-skill-content">
                    <div class="statistics-skill-header">
                        <span>${this.#Escape(item.Title||"")}</span>
                        <strong>${this.#Escape(item.DisplayValue??`${Math.round(percent)}%`)}</strong>
                    </div>
                    <div class="statistics-progress">
                        <span style="width:${percent}%"></span>
                    </div>
                </div>
            `;

            this.#skillsList.appendChild(element);
        });
    }

    static #StatusColor(id){
        switch((id||"").toString().toLowerCase()){
            case "health":
                return "#ff4d5f";

            case "armor":
                return "#36bfff";

            case "hunger":
                return "#ffb52e";

            default:
                return "#48beff";
        }
    }

    static #Icon(name){
        return `<svg viewBox="0 0 24 24" aria-hidden="true">${this.#icons[name]||this.#icons.skill}</svg>`;
    }

    static #Parse(data){
        if(typeof data!=="string")
            return data||{};

        try{
            return JSON.parse(data);
        }catch{
            return {};
        }
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

document.getElementById("statistics-close-button").addEventListener("click",()=>{
    Statistics.Hide();
    GameCef.send("statistics:close","");
});

GameCef.on("statistics:show",data=>{
    Statistics.Show(data);
});

GameCef.on("statistics:hide",()=>{
    Statistics.Hide();
});
