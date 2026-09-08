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
        wanted:'<path d="m12 2 3 6 7 .9-5 4.8 1.3 6.8L12 17l-6.3 3.5L7 13.7 2 8.9 9 8l3-6Z"></path>',
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

    Show:function(){
        this.Init();

        if(!this.screen){
            console.error("Statistics: #statistics not found");
            return;
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
            return "#ff4d5f";

        if(id==="armor")
            return "#36bfff";

        if(id==="hunger")
            return "#ffb52e";

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
    }
};

var statisticsCloseButton=document.getElementById("statistics-close-button");

if(statisticsCloseButton){
    statisticsCloseButton.addEventListener("click",function(){
        Statistics.Hide();
        GameCef.send("statistics:close","");
    });
}

GameCef.on("statistics:show",function(){
    Statistics.Show();
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