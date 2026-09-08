var Statistics={
    screen:null,
    profileList:null,
    statusGrid:null,
    statisticsGrid:null,
    skillsList:null,
    skillsContainer:null,

    icons:{
        id:'<path d="M5 4h14v16H5z"></path><path d="M8 8h8"></path><path d="M8 12h5"></path>',
        level:'<path d="M5 20V10"></path><path d="M12 20V4"></path><path d="M19 20V7"></path>',
        health:'<path d="M12 21S3 15.5 3 8.8C3 5.5 5.4 3 8.5 3c1.8 0 3 1 3.5 2 .5-1 1.7-2 3.5-2C18.6 3 21 5.5 21 8.8 21 15.5 12 21 12 21Z"></path>',
        armor:'<path d="M12 2 20 5v6c0 5.5-3.5 9-8 12-4.5-3-8-6.5-8-12V5l8-3Z"></path>',
        hunger:'<path d="M3 2h2v7h1V2h2v7h1V2h2v7c0 2.2-1.2 3.8-3 4.5V22H6v-8.5C4.2 12.8 3 11.2 3 9V2Z"></path><path d="M15 2h2c2.2 2.8 3 6 3 9h-3v11h-2V2Z"></path>',
        energy:'<path d="m13 2-8 12h6l-1 8 9-13h-6l0-7Z"></path>',
        stamina:'<path d="m12 2 3 6 7 .9-5 4.8 1.3 6.8L12 17l-6.3 3.5L7 13.7 2 8.9 9 8l3-6Z"></path>',
        reputation:'<path d="m12 2 3 6 7 .9-5 4.8 1.3 6.8L12 17l-6.3 3.5L7 13.7 2 8.9 9 8l3-6Z"></path>',
        wanted:'<path d="m12 2 3 6 7 .9-5 4.8 1.3 6.8L12 17l-6.3 3.5L7 13.7 2 8.9 9 8l3-6Z"></path>',
        family:'<circle cx="8" cy="8" r="3"></circle><circle cx="16" cy="9" r="2"></circle><path d="M3 21v-2c0-4 2-6 5-6"></path><path d="M13 21v-2c0-3 2-5 5-5"></path>',
        faction:'<rect x="3" y="7" width="18" height="13" rx="2"></rect><path d="M9 7V4h6v3"></path>',
        job:'<path d="M4 7h16v13H4z"></path><path d="M9 7V4h6v3"></path><path d="M4 12h16"></path>',
        clock:'<circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l4 2"></path>',
        money:'<circle cx="12" cy="12" r="9"></circle><path d="M14.5 8.5c-.7-.6-1.5-.9-2.5-.9-1.5 0-2.5.8-2.5 1.9 0 3 5.5 1.5 5.5 4.5 0 1.2-1.1 2-2.7 2-1.2 0-2.3-.4-3.1-1"></path><path d="M12 5v14"></path>',
        vip:'<path d="m3 8 4 3 5-7 5 7 4-3-2 11H5L3 8Z"></path>',
        warning:'<path d="M12 3 2 21h20L12 3Z"></path><path d="M12 9v5"></path><circle cx="12" cy="17" r="1"></circle>',
        phone:'<rect x="7" y="2" width="10" height="20" rx="2"></rect><path d="M10 5h4"></path><circle cx="12" cy="18" r="1"></circle>',
        skill:'<path d="m12 2 3 6 7 .9-5 4.8 1.3 6.8L12 17l-6.3 3.5L7 13.7 2 8.9 9 8l3-6Z"></path>'
    },

    Init:function(){
        this.screen=document.getElementById("statistics");
        this.profileList=document.getElementById("statistics-profile-list");
        this.statusGrid=document.getElementById("statistics-status-grid");
        this.statisticsGrid=document.getElementById("statistics-grid");
        this.skillsList=document.getElementById("statistics-skills-list");
        this.skillsContainer=document.querySelector(".statistics-skills");
    },

    Show:function(data){
        this.Init();

        if(!this.screen){
            console.error("Statistics: #statistics not found");
            return;
        }

        if(data){
            data=this.Parse(data);

            if(data){
                this.SetProfile(data.Profile||data.profile||{});
                this.SetStatus(data.Status||data.status||[]);
                this.SetStatistics(data.Statistics||data.statistics||[]);

                this.ClearSkills();

                var skills=data.Skills||data.skills||[];

                for(var i=0;i<skills.length;i++)
                    this.AddSkill(skills[i]);
            }
        }

        this.screen.classList.add("active");

        if(typeof Loading!=="undefined"&&Loading.Hide)
            Loading.Hide();
    },

    Hide:function(){
        this.Init();

        if(this.screen)
            this.screen.classList.remove("active");
    },

    SetProfile:function(data){
        this.Init();

        var profile=this.Parse(data);

        if(!profile)
            return;

        var playerName=document.getElementById("statistics-player-name");
        var onlineText=document.getElementById("statistics-online-text");
        var online=document.querySelector(".statistics-online");

        var name=this.Get(profile,"Name","name");
        var id=this.Get(profile,"Id","id");
        var level=this.Get(profile,"Level","level");
        var isOnline=this.Get(profile,"Online","online");

        if(playerName)
            playerName.textContent=name||"Персонаж";

        if(onlineText)
            onlineText.textContent=isOnline===false?"Не в мережі":"В мережі";

        if(online){
            online.style.color=isOnline===false?"rgba(184,202,214,.55)":"#31d96c";

            var dot=online.querySelector("i");

            if(dot)
                dot.style.background=isOnline===false?"#748491":"#2ce566";
        }

        if(!this.profileList)
            return;

        this.profileList.innerHTML="";

        if(id!==undefined)
            this.AddProfileItem("id","ID персонажа",id);

        if(level!==undefined)
            this.AddProfileItem("level","Рівень",level);

        var items=this.Get(profile,"Items","items");

        if(items&&items.length){
            for(var i=0;i<items.length;i++){
                var item=items[i];

                this.AddProfileItem(
                    this.Get(item,"Icon","icon")||"skill",
                    this.Get(item,"Title","title")||"",
                    this.Get(item,"Value","value")!==undefined?this.Get(item,"Value","value"):"-"
                );
            }
        }
    },

    AddProfileItem:function(icon,title,value){
        if(!this.profileList)
            return;

        var element=document.createElement("div");
        element.className="statistics-profile-row";

        element.innerHTML=
            this.Icon(icon)+
            "<span>"+this.Escape(title)+"</span>"+
            "<strong>"+this.Escape(value)+"</strong>";

        this.profileList.appendChild(element);
    },

    SetStatus:function(data){
        this.Init();

        var items=this.Parse(data);

        if(!this.statusGrid)
            return;

        this.statusGrid.innerHTML="";

        if(!items||!items.length)
            return;

        for(var i=0;i<items.length;i++)
            this.AddStatus(items[i]);
    },

    AddStatus:function(item){
        if(!this.statusGrid)
            return;

        var id=this.Get(item,"Id","id");
        var title=this.Get(item,"Title","title");
        var valueRaw=this.Get(item,"Value","value");
        var maxRaw=this.Get(item,"Max","max");
        var icon=this.Get(item,"Icon","icon");
        var color=this.Get(item,"Color","color");
        var displayValue=this.Get(item,"DisplayValue","displayValue");

        var max=Math.max(1,Number(maxRaw!==undefined?maxRaw:100));
        var value=Math.max(0,Math.min(max,Number(valueRaw!==undefined?valueRaw:0)));
        var percent=Math.max(0,Math.min(100,value/max*100));

        if(displayValue===undefined)
            displayValue=value+" / "+max;

        var element=document.createElement("div");
        element.className="statistics-status-item";
        element.style.setProperty("--statistics-color",color||this.StatusColor(id));

        element.innerHTML=
            '<div class="statistics-status-icon">'+this.Icon(icon||id||"skill")+'</div>'+
            '<div class="statistics-status-content">'+
                '<div class="statistics-status-header">'+
                    '<span>'+this.Escape(title||"")+'</span>'+
                    '<strong>'+this.Escape(displayValue)+'</strong>'+
                '</div>'+
                '<div class="statistics-progress">'+
                    '<span style="width:'+percent+'%"></span>'+
                '</div>'+
            '</div>';

        this.statusGrid.appendChild(element);
    },

    SetStatistics:function(data){
        this.Init();

        var items=this.Parse(data);

        if(!this.statisticsGrid)
            return;

        this.statisticsGrid.innerHTML="";

        if(!items||!items.length)
            return;

        for(var i=0;i<items.length;i++)
            this.AddStatistic(items[i]);
    },

    AddStatistic:function(item){
        if(!this.statisticsGrid)
            return;

        var icon=this.Get(item,"Icon","icon");
        var title=this.Get(item,"Title","title");
        var value=this.Get(item,"Value","value");

        if(value===undefined)
            value="-";

        var element=document.createElement("div");
        element.className="statistics-card";

        element.innerHTML=
            '<div class="statistics-card-icon">'+this.Icon(icon||"wanted")+'</div>'+
            '<div class="statistics-card-content">'+
                '<div class="statistics-card-title">'+this.Escape(title||"")+'</div>'+
                '<div class="statistics-card-value">'+this.Escape(value)+'</div>'+
            '</div>';

        this.statisticsGrid.appendChild(element);
    },

    ClearSkills:function(){
        this.Init();

        if(this.skillsList)
            this.skillsList.innerHTML="";

        if(this.skillsContainer)
            this.skillsContainer.classList.add("empty");
    },

    AddSkill:function(data){
        this.Init();

        var item=this.Parse(data);

        if(!item||!this.skillsList||!this.skillsContainer)
            return;

        var icon=this.Get(item,"Icon","icon");
        var title=this.Get(item,"Title","title");
        var valueRaw=this.Get(item,"Value","value");
        var maxRaw=this.Get(item,"Max","max");
        var displayValue=this.Get(item,"DisplayValue","displayValue");

        var max=Math.max(1,Number(maxRaw!==undefined?maxRaw:100));
        var value=Math.max(0,Math.min(max,Number(valueRaw!==undefined?valueRaw:0)));
        var percent=Math.max(0,Math.min(100,value/max*100));

        if(displayValue===undefined)
            displayValue=Math.round(percent)+"%";

        this.skillsContainer.classList.remove("empty");

        var element=document.createElement("div");
        element.className="statistics-skill";

        element.innerHTML=
            '<div class="statistics-skill-icon">'+this.Icon(icon||"skill")+'</div>'+
            '<div class="statistics-skill-content">'+
                '<div class="statistics-skill-header">'+
                    '<span>'+this.Escape(title||"")+'</span>'+
                    '<strong>'+this.Escape(displayValue)+'</strong>'+
                '</div>'+
                '<div class="statistics-progress">'+
                    '<span style="width:'+percent+'%"></span>'+
                '</div>'+
            '</div>';

        this.skillsList.appendChild(element);
    },

    StatusColor:function(id){
        id=(id||"").toString().toLowerCase();

        if(id==="health")
            return "#ff4962";

        if(id==="armor")
            return "#35c0ff";

        if(id==="hunger")
            return "#ffb229";

        if(id==="energy")
            return "#42c7ff";

        if(id==="stamina")
            return "#42c7ff";

        if(id==="reputation")
            return "#42c7ff";

        return "#48beff";
    },

    Icon:function(name){
        var icon=this.icons[name];

        if(!icon)
            icon=this.icons.skill;

        return '<svg viewBox="0 0 24 24" aria-hidden="true">'+icon+"</svg>";
    },

    Parse:function(data){
        if(data===undefined||data===null||data==="")
            return null;

        if(typeof data!=="string")
            return data;

        try{
            var result=JSON.parse(data);

            if(typeof result==="string"){
                try{
                    result=JSON.parse(result);
                }catch(error){}
            }

            return result;
        }catch(error){
            console.error("Statistics JSON parse error:");
            console.error(error);
            console.error(data);

            return null;
        }
    },

    Get:function(data,pascalName,camelName){
        if(!data)
            return undefined;

        if(data[pascalName]!==undefined)
            return data[pascalName];

        return data[camelName];
    },

    Escape:function(value){
        return String(value)
            .replace(/&/g,"&amp;")
            .replace(/</g,"&lt;")
            .replace(/>/g,"&gt;")
            .replace(/"/g,"&quot;")
            .replace(/'/g,"&#039;");
    },

};

var statisticsCloseButton=document.getElementById("statistics-close-button");

if(statisticsCloseButton){
    statisticsCloseButton.addEventListener("click",function(){
        Statistics.Hide();
        GameCef.send("statistics:close","");
    });
}

GameCef.on("statistics:show",function(data){
    Statistics.Show(data);
});

GameCef.on("statistics:hide",function(){
    Statistics.Hide();
});

GameCef.on("statistics:profile",function(data){
    Statistics.SetProfile(data);
});

GameCef.on("statistics:status",function(data){
    Statistics.SetStatus(data);
});

GameCef.on("statistics:main",function(data){
    Statistics.SetStatistics(data);
});

GameCef.on("statistics:skills-clear",function(){
    Statistics.ClearSkills();
});

GameCef.on("statistics:skill-add",function(data){
    Statistics.AddSkill(data);
});

