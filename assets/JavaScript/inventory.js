var Inventory={
    screen:null,
    grid:null,
    empty:null,
    items:[],
    selectedIndex:null,

    Init:function(){
        this.screen=document.getElementById("inventory");
        this.grid=document.getElementById("inventory-grid");
        this.empty=document.getElementById("inventory-empty");

        if(!this.screen)
            return;

        this.Bind();
    },

    Bind:function(){
        if(this.screen.getAttribute("data-bound")==="1")
            return;

        this.screen.setAttribute("data-bound","1");

        var self=this;
        var close=document.getElementById("inventory-close");
        var use=document.getElementById("inventory-use");

        if(close)
            close.onclick=function(){
                self.Hide();
                GameCef.sendJson("inventory:close",{});
            };

        if(use)
            use.onclick=function(){
                self.UseSelected();
            };

        document.addEventListener("keydown",function(event){
            if(event.defaultPrevented||event.isComposing||event.keyCode===229||event.repeat)
                return;

            if(!self.screen||!self.screen.classList.contains("active"))
                return;

            if(event.key==="Escape"){
                event.preventDefault();
                event.stopImmediatePropagation();
                if(close) close.click();
                return;
            }

            if(event.key!=="Enter"||self.selectedIndex===null)
                return;

            if(event.target&&("INPUT TEXTAREA BUTTON A".indexOf(event.target.tagName)!==-1))
                return;

            event.preventDefault();
            event.stopImmediatePropagation();
            self.UseSelected();
        });
    },

    Show:function(data){
        this.Init();

        if(!this.screen)
            return;

        if(data!==undefined&&data!==null&&data!=="")
            this.SetData(data);

        this.screen.classList.add("active");

        if(typeof UiKeyboard!=="undefined")
            UiKeyboard.Focus(this.screen);

        if(typeof Loading!=="undefined"&&Loading.Hide)
            Loading.Hide();
    },

    Hide:function(){
        this.Init();

        if(typeof UiKeyboard!=="undefined")
            UiKeyboard.Release(this.screen);

        if(this.screen)
            this.screen.classList.remove("active");
    },

    SetData:function(data){
        data=this.Parse(data);

        if(!data)
            return;

        var items=this.Get(data,"Items","items");
        this.items=Array.isArray(items)?items:[];
        this.selectedIndex=this.items.length?0:null;
        this.Render();
    },

    Render:function(){
        this.RenderItems();
        this.RenderDetails();
        this.SetText("inventory-items-count",this.ItemsCountText(this.items.length));
    },

    RenderItems:function(){
        if(!this.grid)
            return;

        this.grid.innerHTML="";

        if(this.empty)
            this.empty.style.display=this.items.length?"none":"flex";

        this.grid.style.display=this.items.length?"grid":"none";

        for(var i=0;i<this.items.length;i++)
            this.grid.appendChild(this.CreateItem(this.items[i],i));
    },

    CreateItem:function(item,index){
        var self=this;
        var title=this.Get(item,"Title","title")||this.Get(item,"Name","name")||"Предмет";
        var count=this.Get(item,"Count","count");
        var image=this.ImagePath(this.Get(item,"Image","image"));

        var button=document.createElement("button");
        button.type="button";
        button.className="inventory-item";

        if(this.selectedIndex===index)
            button.classList.add("active");

        button.innerHTML=
            '<span class="inventory-item-count">x'+this.Escape(count===undefined?1:count)+'</span>'+
            '<span class="inventory-item-image">'+this.ImageHtml(image)+'</span>'+
            '<strong class="inventory-item-name">'+this.Escape(title)+'</strong>';

        button.onclick=function(){
            self.SelectItem(index);
        };

        return button;
    },

    SelectItem:function(index){
        if(index<0||index>=this.items.length)
            return;

        this.selectedIndex=index;
        this.RenderItems();
        this.RenderDetails();
    },

    RenderDetails:function(){
        var item=this.selectedIndex===null?null:this.items[this.selectedIndex];
        var image=document.getElementById("inventory-details-image");
        var params=document.getElementById("inventory-params");
        var use=document.getElementById("inventory-use");

        if(!item){
            if(image){
                image.removeAttribute("src");
                image.style.display="none";
            }

            this.SetText("inventory-details-title","Оберіть предмет");
            this.SetText("inventory-details-description","Оберіть предмет ліворуч, щоб побачити детальну інформацію.");
            this.SetText("inventory-details-count","x0");

            if(params)
                params.innerHTML="";

            if(use)
                use.disabled=true;

            return;
        }

        var title=this.Get(item,"Title","title")||this.Get(item,"Name","name")||"Предмет";
        var description=this.Get(item,"Description","description")||"Опис предмета відсутній.";
        var count=this.Get(item,"Count","count");
        var imagePath=this.ImagePath(this.Get(item,"Image","image"));

        if(image){
            if(imagePath){
                image.src=imagePath;
                image.style.display="block";
            }
            else{
                image.removeAttribute("src");
                image.style.display="none";
            }
        }

        this.SetText("inventory-details-title",title);
        this.SetText("inventory-details-description",description);
        this.SetText("inventory-details-count","x"+(count===undefined?1:count));
        this.RenderParams(item,params);

        if(use)
            use.disabled=false;
    },

    RenderParams:function(item,target){
        if(!target)
            return;

        target.innerHTML="";

        var params=this.Get(item,"Params","params")||this.Get(item,"ItemParams","itemParams")||[];

        if(!Array.isArray(params))
            return;

        for(var i=0;i<params.length;i++){
            var view=this.ParamView(params[i]);

            if(!view)
                continue;

            var row=document.createElement("div");
            row.className="inventory-param";
            row.innerHTML='<span>'+this.Escape(view.Title)+'</span><strong>'+this.Escape(view.Value)+'</strong>';
            target.appendChild(row);
        }
    },

    ParamView:function(param){
        if(!param)
            return null;

        var directTitle=this.Get(param,"Title","title");
        var directValue=this.Get(param,"Value","value");

        if(directTitle!==undefined)
            return {Title:directTitle,Value:this.FormatValue(directValue)};

        var recovery=this.Get(param,"Recovery","recovery");
        var buff=this.Get(param,"Buff","buff");
        var stat=this.Get(param,"Stat","stat");
        var value=directValue;

        if(recovery!==undefined&&recovery!==null)
            return {Title:this.RecoveryName(recovery),Value:this.FormatValue(value)};

        if(buff!==undefined&&buff!==null){
            if(typeof buff==="object"){
                stat=this.Get(buff,"Stat","stat");
                value=this.Get(buff,"Value","value");
            }

            return {Title:this.BuffName(stat===undefined?buff:stat),Value:this.FormatValue(value)};
        }

        if(stat!==undefined&&stat!==null)
            return {Title:this.BuffName(stat),Value:this.FormatValue(value)};

        return null;
    },

    UseSelected:function(){
        if(this.selectedIndex===null||this.selectedIndex<0||this.selectedIndex>=this.items.length)
            return;

        var item=this.items[this.selectedIndex];
        var itemId=this.Get(item,"ItemId","itemId");

        if(itemId===undefined)
            itemId=this.Get(item,"Id","id");

        GameCef.sendJson("inventory:use",{
            Index:this.selectedIndex,
            ItemId:itemId,
        });
    },

    ImagePath:function(value){
        if(!value)
            return "";

        value=String(value);

        if(value.indexOf("/")!==-1||value.indexOf("data:")===0||value.indexOf("http://")===0||value.indexOf("https://")===0)
            return value;

        return "./assets/CSS/Images/Inventory/"+value;
    },

    ImageHtml:function(path){
        if(!path)
            return "";

        return '<img src="'+this.EscapeAttribute(path)+'" alt="">';
    },

    RecoveryName:function(value){
        var names={
            0:"Здоров'я",
            1:"Броня",
            2:"Голод",
            Health:"Здоров'я",
            Armor:"Броня",
            Hunger:"Голод"
        };

        return names[value]||String(value);
    },

    BuffName:function(value){
        var names={
            0:"Витривалість",
            Stamina:"Витривалість"
        };

        return names[value]||String(value===undefined?"Параметр":value);
    },

    FormatValue:function(value){
        if(value===undefined||value===null||value==="")
            return "";

        var number=Number(value);

        if(!isNaN(number))
            return (number>0?"+":"")+number;

        return String(value);
    },

    ItemsCountText:function(count){
        if(count===1)
            return "1 предмет";

        if(count>=2&&count<=4)
            return count+" предмети";

        return count+" предметів";
    },

    SetText:function(id,value){
        var element=document.getElementById(id);

        if(element)
            element.textContent=value;
    },

    Get:function(object,pascal,camel){
        if(!object)
            return undefined;

        if(object[pascal]!==undefined)
            return object[pascal];

        return object[camel];
    },

    Escape:function(value){
        var div=document.createElement("div");
        div.textContent=value===undefined||value===null?"":String(value);
        return div.innerHTML;
    },

    EscapeAttribute:function(value){
        return String(value===undefined||value===null?"":value)
            .replace(/&/g,"&amp;")
            .replace(/"/g,"&quot;")
            .replace(/</g,"&lt;")
            .replace(/>/g,"&gt;");
    },

    Parse:function(data){
        if(typeof data!=="string")
            return data;

        try{
            var parsed=JSON.parse(data);

            if(typeof parsed==="string")
                parsed=JSON.parse(parsed);

            return parsed;
        }
        catch(error){
            return null;
        }
    }
};

GameCef.on("inventory:show",function(data){
    Inventory.Show(data);
});

GameCef.on("inventory:set",function(data){
    Inventory.SetData(data);
});

GameCef.on("inventory:hide",function(){
    Inventory.Hide();
});
