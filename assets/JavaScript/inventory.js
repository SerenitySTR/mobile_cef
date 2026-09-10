var Inventory={
    screen:null,
    grid:null,
    empty:null,
    search:null,
    selectedId:null,
    category:"all",
    items:[],
    equipment:{},
    quick:[],
    weight:0,
    maxWeight:50,

    icons:{
        food:'<path d="M4 12h16"></path><path d="M6 12c0-4 2.5-7 6-7s6 3 6 7"></path><path d="M5 16h14"></path><path d="M7 16v2h10v-2"></path>',
        drink:'<path d="M9 3h6"></path><path d="M10 3v4l-2 3v10h8V10l-2-3V3"></path><path d="M8 12h8"></path>',
        medicine:'<rect x="4" y="7" width="16" height="13" rx="2"></rect><path d="M9 7V4h6v3"></path><path d="M12 10v7"></path><path d="M8.5 13.5h7"></path>',
        phone:'<rect x="7" y="2" width="10" height="20" rx="2"></rect><path d="M10 5h4"></path><circle cx="12" cy="18" r="1"></circle>',
        ammo:'<path d="M7 19V8l2-4 2 4v11"></path><path d="M14 19V7l2-3 2 3v12"></path><path d="M5 19h15"></path>',
        fish:'<path d="M4 12c3-4 8-5 12-2l4-3v10l-4-3c-4 3-9 2-12-2Z"></path><circle cx="9" cy="11" r=".8"></circle>',
        tool:'<path d="m14 5 5 5"></path><path d="m12 7 5 5"></path><path d="M3 21 14 10"></path><path d="M14 5c2-2 4-2 6-1-1 2-1 4-3 6"></path>',
        radio:'<rect x="6" y="6" width="12" height="15" rx="2"></rect><path d="m10 6 5-4"></path><path d="M9 10h6"></path><circle cx="12" cy="15" r="2"></circle>',
        document:'<rect x="4" y="5" width="16" height="14" rx="2"></rect><circle cx="9" cy="11" r="2"></circle><path d="M13 10h4"></path><path d="M13 13h4"></path><path d="M7 16h10"></path>',
        rod:'<path d="M5 19 16 5"></path><path d="M16 5c3 2 3 5 1 7"></path><path d="M17 12v5"></path><circle cx="17" cy="19" r="1"></circle>',
        mask:'<path d="M5 7c4-3 10-3 14 0v7c0 4-3 7-7 7s-7-3-7-7V7Z"></path><path d="M8 12h2"></path><path d="M14 12h2"></path>',
        diamond:'<path d="m4 8 4-4h8l4 4-8 12L4 8Z"></path><path d="M4 8h16"></path><path d="m8 4 4 16 4-16"></path>',
        backpack:'<path d="M8 8V6a4 4 0 0 1 8 0v2"></path><rect x="5" y="8" width="14" height="13" rx="3"></rect><path d="M8 12h8"></path>',
        cash:'<rect x="4" y="7" width="16" height="10" rx="2"></rect><circle cx="12" cy="12" r="2"></circle><path d="M7 10h1"></path><path d="M16 14h1"></path>',
        clothes:'<path d="m8 5 4-2 4 2 4 3-3 4v9H7v-9L4 8l4-3Z"></path>',
        shoes:'<path d="M4 15c3 0 5-2 6-5 2 3 4 4 8 5 2 1 2 4-1 4H6c-2 0-3-2-2-4Z"></path>',
        weapon:'<path d="M4 10h11l4 3-2 3h-5l-2 4H7l1-5H4v-5Z"></path>',
        head:'<path d="M6 13c1-5 3-8 6-8s5 3 6 8"></path><path d="M4 13h16"></path>',
        accessory:'<circle cx="8" cy="12" r="4"></circle><circle cx="16" cy="12" r="4"></circle><path d="M12 12h0"></path>',
        extra:'<circle cx="12" cy="12" r="7"></circle><path d="M12 8v4l3 2"></path>',
        other:'<path d="M5 12h14"></path><path d="M12 5v14"></path>'
    },

    Init:function(){
        this.screen=document.getElementById("inventory");
        this.grid=document.getElementById("inventory-grid");
        this.empty=document.getElementById("inventory-empty");
        this.search=document.getElementById("inventory-search");

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
        var tabs=document.getElementById("inventory-tabs");
        var use=document.getElementById("inventory-use");
        var transfer=document.getElementById("inventory-transfer");
        var drop=document.getElementById("inventory-drop");

        if(close)
            close.onclick=function(){
                self.Hide();
                GameCef.sendJson("inventory:close",{});
            };

        if(tabs)
            tabs.onclick=function(event){
                var target=event.target;

                if(!target||target.tagName!=="BUTTON")
                    return;

                self.category=target.getAttribute("data-category")||"all";

                var buttons=tabs.getElementsByTagName("button");

                for(var i=0;i<buttons.length;i++)
                    buttons[i].classList.remove("active");

                target.classList.add("active");
                self.RenderItems();
            };

        if(this.search){
            this.search.oninput=function(){
                self.RenderItems();
            };

            this.search.oncompositionend=function(){
                self.RenderItems();
            };
        }

        if(use)
            use.onclick=function(){
                self.SendAction("inventory:use");
            };

        if(transfer)
            transfer.onclick=function(){
                self.SendAction("inventory:transfer");
            };

        if(drop)
            drop.onclick=function(){
                self.SendAction("inventory:drop");
            };
    },

    Show:function(data){
        this.Init();

        if(!this.screen)
            return;

        if(data)
            this.SetData(data);

        this.screen.classList.add("active");

        if(typeof Loading!=="undefined"&&Loading.Hide)
            Loading.Hide();
    },

    Hide:function(){
        this.Init();

        if(this.screen)
            this.screen.classList.remove("active");
    },

    SetData:function(data){
        data=this.Parse(data);

        if(!data)
            return;

        var items=this.Get(data,"Items","items");
        var equipment=this.Get(data,"Equipment","equipment");
        var quick=this.Get(data,"QuickSlots","quickSlots");
        var weight=this.Get(data,"Weight","weight");
        var maxWeight=this.Get(data,"MaxWeight","maxWeight");

        if(items)
            this.items=items;

        if(equipment)
            this.equipment=equipment;

        if(quick)
            this.quick=quick;

        if(weight!==undefined)
            this.weight=Number(weight)||0;

        if(maxWeight!==undefined)
            this.maxWeight=Math.max(1,Number(maxWeight)||50);

        this.RenderAll();
    },

    ClearItems:function(){
        this.items=[];
        this.selectedId=null;
        this.RenderItems();
        this.RenderDetails(null);
    },

    AddItem:function(data){
        var item=this.Parse(data);

        if(!item)
            return;

        var id=this.Get(item,"Id","id");
        var replaced=false;

        for(var i=0;i<this.items.length;i++){
            if(String(this.Get(this.items[i],"Id","id"))===String(id)){
                this.items[i]=item;
                replaced=true;
                break;
            }
        }

        if(!replaced)
            this.items.push(item);

        this.RenderItems();
    },

    SetWeight:function(data){
        data=this.Parse(data);

        if(data&&typeof data==="object"){
            var weight=this.Get(data,"Weight","weight");
            var maxWeight=this.Get(data,"MaxWeight","maxWeight");

            if(weight!==undefined)
                this.weight=Number(weight)||0;

            if(maxWeight!==undefined)
                this.maxWeight=Math.max(1,Number(maxWeight)||50);
        }

        this.RenderWeight();
    },

    SetEquipment:function(data){
        data=this.Parse(data);

        if(data)
            this.equipment=data;

        this.RenderEquipment();
    },

    SetQuick:function(data){
        data=this.Parse(data);

        if(data)
            this.quick=data;

        this.RenderQuick();
    },

    RenderAll:function(){
        this.RenderWeight();
        this.RenderEquipment();
        this.RenderQuick();
        this.RenderItems();

        if(this.selectedId!==null)
            this.SelectItem(this.selectedId);
        else
            this.RenderDetails(null);
    },

    RenderWeight:function(){
        var text=this.weight.toFixed(1)+" / "+this.maxWeight.toFixed(0)+" кг";
        var percent=Math.max(0,Math.min(100,this.weight/this.maxWeight*100));

        this.SetText("inventory-weight-text",text);
        this.SetText("inventory-weight-small",text);

        var progress=document.getElementById("inventory-weight-progress");
        var small=document.getElementById("inventory-weight-small-progress");

        if(progress)
            progress.style.width=percent+"%";

        if(small)
            small.style.width=percent+"%";
    },

    RenderEquipment:function(){
        var slots=["head","accessory","body","backpack","legs","weapon","feet","extra"];

        for(var i=0;i<slots.length;i++){
            var name=slots[i];
            var target=document.getElementById("equipment-"+name+"-icon");
            var button=document.querySelector('[data-slot="'+name+'"]');
            var item=this.equipment[name]||this.equipment[this.Capitalize(name)]||null;

            if(target)
                target.innerHTML=item?this.Visual(item,this.Get(item,"Icon","icon")||name):this.Icon(name);

            if(button){
                if(item)
                    button.classList.add("filled");
                else
                    button.classList.remove("filled");
            }
        }
    },

    RenderQuick:function(){
        var target=document.getElementById("inventory-quick");

        if(!target)
            return;

        target.innerHTML="";

        for(var i=0;i<5;i++){
            var slot=document.createElement("div");
            slot.className="inventory-quick-slot";

            var item=this.quick[i]||null;
            var html='<span class="slot-number">'+(i+1)+'</span>';

            if(item){
                html+=this.Visual(item,this.Get(item,"Icon","icon")||"other");
                var count=this.Get(item,"Count","count");

                if(count!==undefined)
                    html+='<span class="quick-count">x'+this.Escape(count)+'</span>';
            }
            else{
                html+='<span style="color:#31566c;font-size:22px;font-weight:300">+</span>';
            }

            slot.innerHTML=html;
            target.appendChild(slot);
        }
    },

    RenderItems:function(){
        if(!this.grid)
            return;

        this.grid.innerHTML="";

        var query=this.search?this.search.value.toLowerCase().replace(/^\s+|\s+$/g,""):"";
        var visible=[];

        for(var i=0;i<this.items.length;i++){
            var item=this.items[i];
            var category=String(this.Get(item,"Category","category")||"other").toLowerCase();
            var title=String(this.Get(item,"Title","title")||"").toLowerCase();

            if(this.category!=="all"&&category!==this.category)
                continue;

            if(query&&title.indexOf(query)===-1)
                continue;

            visible.push(item);
        }

        if(this.empty)
            this.empty.style.display=visible.length?"none":"flex";

        this.grid.style.display=visible.length?"grid":"none";

        for(var j=0;j<visible.length;j++)
            this.grid.appendChild(this.CreateItem(visible[j]));
    },

    CreateItem:function(item){
        var self=this;
        var id=this.Get(item,"Id","id");
        var title=this.Get(item,"Title","title")||"Предмет";
        var icon=this.Get(item,"Icon","icon")||"other";
        var count=this.Get(item,"Count","count");
        var weight=this.Get(item,"Weight","weight");

        var button=document.createElement("button");
        button.type="button";
        button.className="inventory-item";

        if(this.selectedId!==null&&String(this.selectedId)===String(id))
            button.classList.add("active");

        button.innerHTML=
            '<span class="inventory-item-count">x'+this.Escape(count!==undefined?count:1)+'</span>'+
            '<span class="inventory-item-weight">'+this.Escape(this.Weight(weight))+'</span>'+
            '<span class="inventory-item-icon">'+this.Visual(item,icon)+'</span>'+
            '<strong>'+this.Escape(title)+'</strong>';

        button.onclick=function(){
            self.SelectItem(id);
        };

        return button;
    },

    SelectItem:function(id){
        this.selectedId=id;

        var item=null;

        for(var i=0;i<this.items.length;i++){
            if(String(this.Get(this.items[i],"Id","id"))===String(id)){
                item=this.items[i];
                break;
            }
        }

        var cards=this.grid?this.grid.getElementsByClassName("inventory-item"):[];

        for(var j=0;j<cards.length;j++)
            cards[j].classList.remove("active");

        if(item)
            this.RenderItems();

        this.RenderDetails(item);
    },

    RenderDetails:function(item){
        var image=document.getElementById("inventory-details-image");
        var effects=document.getElementById("inventory-effects");
        var use=document.getElementById("inventory-use");
        var transfer=document.getElementById("inventory-transfer");
        var drop=document.getElementById("inventory-drop");

        if(!item){
            if(image)
                image.innerHTML=this.Icon("backpack");

            this.SetText("inventory-details-title","Оберіть предмет");
            this.SetText("inventory-details-category","Інше");
            this.SetText("inventory-details-weight","0 кг");
            this.SetText("inventory-details-count","x0");
            this.SetText("inventory-details-description","Оберіть предмет у рюкзаку, щоб побачити детальну інформацію.");
            this.SetText("inventory-meta-weight","0 кг");
            this.SetText("inventory-meta-count","0 шт.");

            if(effects)
                effects.innerHTML="";

            if(use)
                use.disabled=true;

            if(transfer)
                transfer.disabled=true;

            if(drop)
                drop.disabled=true;

            return;
        }

        var title=this.Get(item,"Title","title")||"Предмет";
        var category=this.Get(item,"Category","category")||"other";
        var count=this.Get(item,"Count","count");
        var weight=this.Get(item,"Weight","weight");
        var description=this.Get(item,"Description","description")||"";
        var icon=this.Get(item,"Icon","icon")||"other";
        var itemEffects=this.Get(item,"Effects","effects")||[];

        if(image)
            image.innerHTML=this.Visual(item,icon);

        this.SetText("inventory-details-title",title);
        this.SetText("inventory-details-category",this.CategoryName(category));
        this.SetText("inventory-details-weight",this.Weight(weight));
        this.SetText("inventory-details-count","x"+(count!==undefined?count:1));
        this.SetText("inventory-details-description",description);
        this.SetText("inventory-meta-weight",this.Weight(weight));
        this.SetText("inventory-meta-count",(count!==undefined?count:1)+" шт.");

        if(effects){
            effects.innerHTML="";

            for(var i=0;i<itemEffects.length;i++){
                var effect=itemEffects[i];
                var row=document.createElement("div");
                row.className="inventory-effect";
                row.innerHTML='<span>'+this.Escape(this.Get(effect,"Title","title")||"")+'</span><strong>'+this.Escape(this.Get(effect,"Value","value")||"")+'</strong>';
                effects.appendChild(row);
            }
        }

        if(use)
            use.disabled=this.Get(item,"CanUse","canUse")===false;

        if(transfer)
            transfer.disabled=this.Get(item,"CanTransfer","canTransfer")===false;

        if(drop)
            drop.disabled=this.Get(item,"CanDrop","canDrop")===false;
    },

    SendAction:function(eventName){
        if(this.selectedId===null)
            return;

        GameCef.sendJson(eventName,{ItemId:this.selectedId});
    },

    Visual:function(item,fallbackIcon){
        if(item){
            var image=this.Get(item,"Image","image");

            if(image){
                return '<img src="'+this.EscapeAttribute(image)+'" alt="" style="width:100%;height:100%;object-fit:contain;display:block;pointer-events:none">';
            }
        }

        return this.Icon(fallbackIcon||"other");
    },

    EscapeAttribute:function(value){
        return String(value===undefined||value===null?"":value)
            .replace(/&/g,"&amp;")
            .replace(/"/g,"&quot;")
            .replace(/</g,"&lt;")
            .replace(/>/g,"&gt;");
    },

    Icon:function(name){
        var key=String(name||"other").toLowerCase();
        var path=this.icons[key]||this.icons.other;
        return '<svg viewBox="0 0 24 24" aria-hidden="true">'+path+'</svg>';
    },

    CategoryName:function(category){
        var names={
            food:"Їжа",
            drink:"Напої",
            medicine:"Ліки",
            materials:"Матеріали",
            other:"Інше"
        };

        return names[String(category||"other").toLowerCase()]||"Інше";
    },

    Weight:function(value){
        var number=Number(value);

        if(isNaN(number))
            number=0;

        return number.toFixed(number%1===0?0:1)+" кг";
    },

    SetText:function(id,value){
        var element=document.getElementById(id);

        if(element)
            element.textContent=value;
    },

    Escape:function(value){
        var div=document.createElement("div");
        div.textContent=value===undefined||value===null?"":String(value);
        return div.innerHTML;
    },

    Get:function(object,pascal,camel){
        if(!object)
            return undefined;

        if(object[pascal]!==undefined)
            return object[pascal];

        return object[camel];
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
    },

    Capitalize:function(value){
        return value.charAt(0).toUpperCase()+value.slice(1);
    }
};

GameCef.on("inventory:show",function(data){
    Inventory.Show(data);
});

GameCef.on("inventory:hide",function(){
    Inventory.Hide();
});

GameCef.on("inventory:set",function(data){
    Inventory.SetData(data);
});

GameCef.on("inventory:clear",function(){
    Inventory.ClearItems();
});

GameCef.on("inventory:item-add",function(data){
    Inventory.AddItem(data);
});

GameCef.on("inventory:weight",function(data){
    Inventory.SetWeight(data);
});

GameCef.on("inventory:equipment",function(data){
    Inventory.SetEquipment(data);
});

GameCef.on("inventory:quick",function(data){
    Inventory.SetQuick(data);
});

Inventory.Show(data);
