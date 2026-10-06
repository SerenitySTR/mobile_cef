var Inventory={
    screen:null,
    grid:null,
    empty:null,
    character:null,
    items:[],
    defaultCharacterImage:"./assets/CSS/Images/Inventory/equipment-character-default-transparent.webp",
    equipment:[],
    currentWeight:0,
    maxWeight:0,
    selectedSource:"inventory",
    selectedIndex:null,
    selectedSlot:null,

    Init:function(){
        this.screen=document.getElementById("inventory");
        this.grid=document.getElementById("inventory-grid");
        this.empty=document.getElementById("inventory-empty");
        this.character=document.getElementById("equipment-character");

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
        var equipment=document.querySelector(".inventory-equipment");

        if(close)
            close.onclick=function(){
                self.Hide();
                GameCef.sendJson("inventory:close",{});
            };

        if(use)
            use.onclick=function(){
                self.UseSelected();
            };

        if(equipment)
            equipment.onclick=function(event){
                var button=event.target.closest("[data-equipment-slot]");

                if(button)
                    self.SelectEquipment(button.getAttribute("data-equipment-slot"));
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

            if(event.key!=="Enter"||!self.SelectedItem())
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
        this.Init();
        data=this.Parse(data);

        if(!data)
            return;

        var items=this.Get(data,"Items","items");
        var equipment=this.Get(data,"Equipment","equipment");
        var characterImage=this.Get(data,"CharacterImage","characterImage");
        var currentWeight=this.Get(data,"CurrentWeight","currentWeight");
        var maxWeight=this.Get(data,"MaxWeight","maxWeight");

        this.items=Array.isArray(items)?items:[];
        this.equipment=this.NormalizeEquipment(equipment);
        this.currentWeight=Number(currentWeight)||0;
        this.maxWeight=Number(maxWeight)||0;
        this.SetCharacterImage(characterImage||this.defaultCharacterImage);

        if(this.items.length){
            this.selectedSource="inventory";
            this.selectedIndex=0;
            this.selectedSlot=null;
        }
        else if(this.equipment.length){
            this.selectedSource="equipment";
            this.selectedIndex=null;
            this.selectedSlot=this.equipment[0].Slot;
        }
        else{
            this.selectedSource="inventory";
            this.selectedIndex=null;
            this.selectedSlot=null;
        }

        this.Render();
    },

    SetCharacterImage:function(image){
        if(!this.character)
            return;

        this.character.src=this.ImagePath(image||this.defaultCharacterImage);
    },

    NormalizeEquipment:function(source){
        var result=[];
        var self=this;

        if(Array.isArray(source)){
            for(var i=0;i<source.length;i++){
                var entry=source[i];

                if(!entry)
                    continue;

                var item=self.Get(entry,"Item","item")||entry;
                var slot=self.Get(entry,"Slot","slot");

                if(slot===undefined||slot===null||slot==="")
                    slot=self.Get(item,"Slot","slot");

                if(slot===undefined||slot===null||slot==="")
                    slot=self.SlotFromIndex(i);

                slot=self.SlotKey(slot);

                if(slot)
                    result.push({Slot:slot,Item:item});
            }

            return result;
        }

        if(source&&typeof source==="object")
            Object.keys(source).forEach(function(slot){
                var item=source[slot];
                var key=self.SlotKey(slot);

                if(item&&key)
                    result.push({Slot:key,Item:item});
            });

        return result;
    },

    Render:function(){
        this.RenderEquipment();
        this.RenderItems();
        this.RenderDetails();
        this.RenderWeight();
        this.SetText("inventory-items-count",this.ItemsCountText(this.items.length));
    },

    RenderWeight:function(){
        var weight=document.getElementById("inventory-weight");
        var fill=document.getElementById("inventory-weight-fill");
        var percent=this.maxWeight>0?(this.currentWeight/this.maxWeight)*100:0;

        percent=Math.max(0,Math.min(percent,100));

        if(weight)
            weight.textContent=this.FormatWeight(this.currentWeight)+" / "+this.FormatWeight(this.maxWeight)+" кг";

        if(fill){
            fill.style.width=percent+"%";
            fill.classList.toggle("warning",percent>=80&&percent<100);
            fill.classList.toggle("full",percent>=100);
        }
    },

    RenderEquipment:function(){
        var self=this;
        var slots=document.querySelectorAll("[data-equipment-slot]");

        slots.forEach(function(button){
            var slot=self.SlotKey(button.getAttribute("data-equipment-slot"));
            var item=self.EquipmentItem(slot);
            var image=button.querySelector(".equipment-slot-image");
            var title=item
                ? self.Get(item,"Title","title")||self.Get(item,"Name","name")||self.SlotName(slot)
                : self.SlotName(slot)+" — порожньо";

            button.classList.toggle("occupied",!!item);
            button.classList.toggle("active",self.selectedSource==="equipment"&&self.selectedSlot===slot);
            button.setAttribute("title",title);

            if(image){
                if(item)
                    image.innerHTML=self.ImageHtml(self.ImagePath(self.Get(item,"Image","image")));
                else
                    image.innerHTML=self.EmptySlotIcon();
            }
        });
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

        if(this.selectedSource==="inventory"&&this.selectedIndex===index)
            button.classList.add("active");

        var countHtml=Number(count)>1
            ? '<span class="inventory-item-count">x'+this.Escape(count)+'</span>'
            : '';

        button.innerHTML=
            countHtml+
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

        this.selectedSource="inventory";
        this.selectedIndex=index;
        this.selectedSlot=null;
        this.RenderEquipment();
        this.RenderItems();
        this.RenderDetails();
    },

    SelectEquipment:function(slot){
        slot=this.SlotKey(slot);

        if(!slot)
            return;

        this.selectedSource="equipment";
        this.selectedIndex=null;
        this.selectedSlot=slot;
        this.RenderEquipment();
        this.RenderItems();
        this.RenderDetails();
    },

    SelectedItem:function(){
        if(this.selectedSource==="equipment")
            return this.EquipmentItem(this.selectedSlot);

        if(this.selectedIndex===null||this.selectedIndex<0||this.selectedIndex>=this.items.length)
            return null;

        return this.items[this.selectedIndex];
    },

    EquipmentItem:function(slot){
        slot=this.SlotKey(slot);

        for(var i=0;i<this.equipment.length;i++)
            if(this.equipment[i].Slot===slot)
                return this.equipment[i].Item;

        return null;
    },

    RenderDetails:function(){
        var item=this.SelectedItem();
        var image=document.getElementById("inventory-details-image");
        var params=document.getElementById("inventory-params");
        var countElement=document.getElementById("inventory-details-count");
        var use=document.getElementById("inventory-use");

        if(!item){
            if(image){
                image.removeAttribute("src");
                image.style.display="none";
            }

            if(this.selectedSource==="equipment"&&this.selectedSlot){
                this.SetText("inventory-details-title",this.SlotName(this.selectedSlot));
                this.SetText("inventory-details-type","Слот екіпірування");
                this.SetText("inventory-details-description","Слот порожній. Одягніть сумісний предмет з інвентарю.");
            }
            else{
                this.SetText("inventory-details-title","Оберіть предмет");
                this.SetText("inventory-details-type","");
                this.SetText("inventory-details-description","Оберіть предмет або слот екіпірування, щоб побачити детальну інформацію.");
            }

            if(countElement)
                countElement.style.display="none";

            if(params)
                params.innerHTML='<div class="inventory-param-empty">Немає додаткових властивостей</div>';

            if(use){
                use.disabled=true;
                use.style.display="none";
            }

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
        this.SetText("inventory-details-type",this.ItemMetaText(item));
        this.SetText("inventory-details-description",description);

        if(countElement){
            countElement.textContent="x"+(count===undefined?1:count);
            countElement.style.display=this.selectedSource==="inventory"&&Number(count)>1?"block":"none";
        }

        this.RenderParams(item,params);
        this.RenderAction(item,use);
    },

    RenderParams:function(item,target){
        if(!target)
            return;

        target.innerHTML="";

        var params=this.Get(item,"Params","params")||this.Get(item,"ItemParams","itemParams")||[];

        if(!Array.isArray(params)||!params.length){
            target.innerHTML='<div class="inventory-param-empty">Немає додаткових властивостей</div>';
            return;
        }

        for(var i=0;i<params.length;i++){
            var view=this.ParamView(params[i]);

            if(!view)
                continue;

            var row=document.createElement("div");
            row.className="inventory-param";
            row.innerHTML=
                '<span class="inventory-param-main">'+
                    '<span class="inventory-param-icon inventory-param-icon-'+this.EscapeAttribute(view.Kind)+'">'+this.ParamIcon(view.Kind)+'</span>'+
                    '<span class="inventory-param-name">'+this.Escape(view.Title)+'</span>'+
                '</span>'+
                '<strong>'+this.Escape(view.Value)+'</strong>';
            target.appendChild(row);
        }
    },

    ParamView:function(param){
        if(!param)
            return null;

        var directTitle=this.Get(param,"Title","title");
        var directValue=this.Get(param,"Value","value");

        if(directTitle!==undefined)
            return {Title:directTitle,Value:this.FormatValue(directValue),Kind:"default"};

        var recovery=this.Get(param,"Recovery","recovery");
        var buff=this.Get(param,"Buff","buff");
        var stat=this.Get(param,"Stat","stat");
        var value=directValue;

        if(recovery!==undefined&&recovery!==null)
            return {Title:this.RecoveryName(recovery),Value:this.FormatValue(value),Kind:this.RecoveryKey(recovery)};

        if(buff!==undefined&&buff!==null){
            if(typeof buff==="object"){
                stat=this.Get(buff,"Stat","stat");
                value=this.Get(buff,"Value","value");
            }

            var buffValue=stat===undefined?buff:stat;
            return {Title:this.BuffName(buffValue),Value:this.FormatValue(value),Kind:this.BuffKey(buffValue)};
        }

        if(stat!==undefined&&stat!==null)
            return {Title:this.BuffName(stat),Value:this.FormatValue(value),Kind:this.BuffKey(stat)};

        return null;
    },

    RenderAction:function(item,use){
        if(!use)
            return;

        var action=this.ActionView(item);
        var text=document.getElementById("inventory-use-text");

        use.style.display=action.Visible?"flex":"none";
        use.disabled=!action.Enabled;

        if(text)
            text.textContent=action.Title;
    },

    ActionView:function(item){
        if(this.selectedSource==="equipment")
            return {Title:"Зняти",Visible:true,Enabled:!!item};

        var type=this.Get(item,"Type","type");

        if(type===undefined||type===null||type==="")
            return {Title:"Використати",Visible:true,Enabled:true};

        type=String(type).toLowerCase();

        if(type==="0"||type==="consumable")
            return {Title:"Використати",Visible:true,Enabled:true};

        if(type==="1"||type==="equipment")
            return {Title:"Одягнути",Visible:true,Enabled:true};

        return {Title:"",Visible:false,Enabled:false};
    },

    ItemMetaText:function(item){
        var type=this.Get(item,"Type","type");
        var params=this.Get(item,"Params","params")||this.Get(item,"ItemParams","itemParams")||[];
        var hasHunger=false;

        if(Array.isArray(params))
            for(var i=0;i<params.length;i++){
                var recovery=this.Get(params[i],"Recovery","recovery");
                if(recovery===2||String(recovery).toLowerCase()==="hunger"){
                    hasHunger=true;
                    break;
                }
            }

        if(type===undefined||type===null||type==="")
            return hasHunger?"Їжа • Витратний предмет":"Витратний предмет";

        type=String(type).toLowerCase();

        if(type==="0"||type==="consumable")
            return hasHunger?"Їжа • Витратний предмет":"Витратний предмет";

        if(type==="1"||type==="equipment"){
            var slot=this.selectedSource==="equipment"?this.selectedSlot:this.ItemSlot(item);
            return slot?"Екіпірування • "+this.SlotName(slot):"Екіпірування";
        }

        return "Інший предмет";
    },

    ItemSlot:function(item){
        var slot=this.Get(item,"Slot","slot");

        if(slot===undefined||slot===null||slot==="")
            slot=this.Get(item,"EquipmentSlot","equipmentSlot");

        return this.SlotKey(slot);
    },

    SlotKey:function(value){
        if(value===undefined||value===null||value==="")
            return null;

        var keys={
            0:"Head",
            1:"Face",
            2:"Hand",
            3:"Back",
            4:"Body",
            5:"ShoulderMount",
            head:"Head",
            face:"Face",
            hand:"Hand",
            back:"Back",
            body:"Body",
            shoulder:"ShoulderMount",
            shouldermount:"ShoulderMount"
        };

        var key=typeof value==="number"?value:String(value).toLowerCase();
        return keys[key]||null;
    },

    SlotFromIndex:function(index){
        return ["Head","Face","Hand","Back","Body","ShoulderMount"][index]||null;
    },

    SlotName:function(value){
        var names={
            Head:"Голова",
            Face:"Обличчя",
            Hand:"Рука",
            Back:"Спина",
            Body:"Тіло",
            ShoulderMount:"Плече"
        };

        return names[this.SlotKey(value)]||"Екіпірування";
    },

    RecoveryKey:function(value){
        var keys={
            0:"health",
            1:"armor",
            2:"hunger",
            Health:"health",
            Armor:"armor",
            Hunger:"hunger"
        };

        return keys[value]||"default";
    },

    BuffKey:function(value){
        var keys={
            0:"stamina",
            Stamina:"stamina"
        };

        return keys[value]||"default";
    },

    ParamIcon:function(kind){
        var icons={
            health:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"></path></svg>',
            armor:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 5 6v5c0 4.5 2.8 8.1 7 10 4.2-1.9 7-5.5 7-10V6l-7-3Z"></path></svg>',
            hunger:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3v7M4 3v4c0 2 1 3 3 3s3-1 3-3V3M7 10v11M16 3v18M16 3c3 2 4 5 4 8h-4"></path></svg>',
            stamina:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m13 2-7 12h6l-1 8 7-12h-6l1-8Z"></path></svg>',
            default:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"></circle><path d="M12 8v4l3 2"></path></svg>'
        };

        return icons[kind]||icons.default;
    },

    EmptySlotIcon:function(){
        return '<svg class="equipment-slot-empty-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 7v10M7 12h10"></path></svg>';
    },

    UseSelected:function(){
        var item=this.SelectedItem();

        if(!item)
            return;

        if(this.selectedSource==="equipment"){
            GameCef.sendJson("inventory:unequip",{
                Slot:this.selectedSlot
            });
            return;
        }

        if(this.selectedIndex===null||this.selectedIndex<0||this.selectedIndex>=this.items.length)
            return;

        var itemId=this.Get(item,"ItemId","itemId");
        var type=this.Get(item,"Type","type");

        if(itemId===undefined)
            itemId=this.Get(item,"Id","id");

        type=String(type===undefined?"":type).toLowerCase();

        if(type==="1"||type==="equipment"){
            GameCef.sendJson("inventory:equip",{
                Index:this.selectedIndex,
                ItemId:itemId,
                Slot:this.ItemSlot(item)
            });
            return;
        }

        GameCef.sendJson("inventory:use",{
            Index:this.selectedIndex,
            ItemId:itemId
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

    FormatWeight:function(value){
        var number=Number(value);

        if(isNaN(number))
            number=0;

        return number.toFixed(2).replace(/\.00$/,"").replace(/(\.\d)0$/,"$1");
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
