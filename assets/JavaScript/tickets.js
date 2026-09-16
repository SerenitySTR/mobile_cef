var Tickets={
    data:{
        IsAdmin:false,Tickets:[]
    }
    ,selectedId:0,filter:"all",Init:function(){
        this.screen=document.getElementById("tickets");
        this.list=document.getElementById("tickets-list");
        this.messages=document.getElementById("tickets-messages")
    }
    ,Parse:function(data){
        if(!data)return{
        }
        ;
        if(typeof data==="string"){
            try{
                return JSON.parse(data)
            }
            catch(e){
                return{
                }
            }
        }
        return data
    }
    ,GetTicket:function(id){
        return this.data.Tickets.find(function(x){
            return Number(x.Id)===Number(id)
        }
        )
    }
    ,Show:function(data){
        this.Init();
        this.data=this.Parse(data);
        if(!Array.isArray(this.data.Tickets))this.data.Tickets=[];
        this.screen.classList.add("active");
        this.Render();
        if(this.data.Tickets.length)this.Open(this.data.Tickets[0].Id)
    }
    ,Hide:function(){
        this.Init();
        this.screen.classList.remove("active")
    }
    ,Render:function(){
        var self=this;
        this.list.innerHTML="";
        this.data.Tickets.filter(function(t){
            return self.filter==="all"||String(t.Status).toLowerCase()===self.filter
        }
        ).forEach(function(t){
            var b=document.createElement("button");
            b.className="ticket-row"+(Number(t.Id)===Number(self.selectedId)?" active":"");
            b.innerHTML='<span class="ticket-row-top"><span>#'+Number(t.Id)+'</span><span>'+self.Escape(t.Date||"")+'</span></span><strong>'+self.Escape(t.Title||"Без теми")+'</strong><small>'+self.Escape(t.Author||"")+' · '+self.StatusText(t.Status)+'</small>';
            b.onclick=function(){
                self.Open(t.Id)
            }
            ;
            self.list.appendChild(b)
        }
        )
    }
    ,Open:function(id){
        var t=this.GetTicket(id);
        if(!t)return;
        this.selectedId=Number(id);
        document.getElementById("tickets-empty").classList.add("hidden");
        document.getElementById("tickets-thread").classList.remove("hidden");
        document.getElementById("tickets-title").textContent="#"+t.Id+"  "+t.Title;
        document.getElementById("tickets-meta").textContent=(t.Author||"")+(t.Date?" · "+t.Date:"");
        var s=document.getElementById("tickets-status");
        s.textContent=this.StatusText(t.Status);
        s.className="tickets-status"+(String(t.Status).toLowerCase()==="closed"?" closed":"");
        var closed=String(t.Status).toLowerCase()==="closed";
        document.getElementById("tickets-reply").classList.toggle("hidden",closed);
        document.getElementById("tickets-finish").classList.toggle("hidden",closed);
        this.messages.innerHTML="";
        (t.Messages||[]).forEach(this.AddMessage.bind(this));
        this.messages.scrollTop=this.messages.scrollHeight;
        this.Render();
        GameCef.sendJson("ticket:open",{
            TicketId:Number(id)
        }
        )
    }
    ,AddMessage:function(m){
        var d=document.createElement("div");
        d.className="ticket-message"+(m.IsAdmin?" admin":"");
        d.innerHTML="<b>"+this.Escape(m.Author||"Гравець")+"</b><time>"+this.Escape(m.Time||"")+"</time><p>"+this.Escape(m.Text||"")+"</p>";
        this.messages.appendChild(d)
    }
    ,StatusText:function(s){
        return String(s).toLowerCase()==="closed"?"Закрито":"Відкрито"
    }
    ,Escape:function(v){
        var d=document.createElement("div");
        d.textContent=String(v==null?"":v);
        return d.innerHTML
    }
    ,Update:function(data){
        var t=this.Parse(data);
        var i=this.data.Tickets.findIndex(function(x){
            return Number(x.Id)===Number(t.Id)
        }
        );
        if(i>=0)this.data.Tickets[i]=t;
        else this.data.Tickets.unshift(t);
        this.Render();
        if(Number(t.Id)===this.selectedId)this.OpenLocal(t.Id)
    }
    ,OpenLocal:function(id){
        var old=GameCef.sendJson;
        GameCef.sendJson=function(){
        }
        ;
        this.Open(id);
        GameCef.sendJson=old
    }
}
;
window.addEventListener("DOMContentLoaded",function(){
    Tickets.Init();
    document.getElementById("tickets-close").onclick=function(){
        GameCef.sendJson("ticket:close-ui",{
        }
        );
        Tickets.Hide()
    }
    ;
    document.getElementById("tickets-create").onclick=function(){
        document.getElementById("tickets-create-modal").classList.remove("hidden")
    }
    ;
    document.getElementById("tickets-create-cancel").onclick=function(){
        document.getElementById("tickets-create-modal").classList.add("hidden")
    }
    ;
    document.getElementById("tickets-create-submit").onclick=function(){
        var title=document.getElementById("tickets-new-title").value.trim(),message=document.getElementById("tickets-new-message").value.trim();
        if(!title||!message)return;
        GameCef.sendJson("ticket:create",{
            Title:encodeURIComponent(title),Message:encodeURIComponent(message)
        }
        );
        document.getElementById("tickets-create-modal").classList.add("hidden")
    }
    ;
    document.getElementById("tickets-send").onclick=function(){
        var i=document.getElementById("tickets-message"),text=i.value.trim();
        if(!text||!Tickets.selectedId)return;
        GameCef.sendJson("ticket:message",{
            TicketId:Tickets.selectedId,Message:encodeURIComponent(text)
        }
        );
        i.value=""
    }
    ;
    document.getElementById("tickets-finish").onclick=function(){
        if(Tickets.selectedId)GameCef.sendJson("ticket:close",{
            TicketId:Tickets.selectedId
        }
        )
    }
    ;
    document.querySelectorAll(".tickets-tabs button").forEach(function(b){
        b.onclick=function(){
            document.querySelectorAll(".tickets-tabs button").forEach(function(x){
                x.classList.remove("active")
            }
            );
            b.classList.add("active");
            Tickets.filter=b.dataset.filter;
            Tickets.Render()
        }
    }
    )
}
);
GameCef.on("ticket:show",function(data){
    Tickets.Show(data)
}
);
GameCef.on("ticket:hide",function(){
    Tickets.Hide()
}
);
GameCef.on("ticket:update",function(data){
    Tickets.Update(data)
}
);
