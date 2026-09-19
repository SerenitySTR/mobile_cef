var AdminPanel = {
    root: null, tab: "stats", filter: "mine", selectedTicket: null, query: "", chatOpen: false, ticketFocus: false, itemCategory: "weapons", pendingClaimTicket: null, quickOpen: false, transferOpen: false, transferAdminId: null, searchTimer: null, composingSearch: false,
    state: {
        profile: {
            id:null,name:"",role:""
        }, stats: {
            days:[],period:""
        }, admins:[], tickets:[], commands:[], punishments:[], items: {
            weapons:[],vehicles:[],skins:[],organizations:[]
        }, locations:[]
    },
    quickReplies: [
    {
        label:"Слідкую",text:"Вітаю! Слідкую за ситуацією, будь ласка, очікуйте."
    },
    {
        label:"Зараз допоможу",text:"Вітаю! Зараз допоможу Вам, будь ласка, очікуйте."
    },
    {
        label:"РП шляхом",text:"Вітаю! Цю ситуацію необхідно вирішити самостійно в межах ігрового процесу, без втручання адміністрації."
    },
    {
        label:"Не офтопте",text:"Будь ласка, не використовуйте звернення не за призначенням. Для спілкування використовуйте ігровий чат."
    },
    {
        label:"Передано далі",text:"Вітаю! Ваше звернення передано відповідальному адміністратору, будь ласка, очікуйте."
    },
    {
        label:"Приємної гри",text:"Дякуємо за звернення! Приємної гри на Antares RP!"
    }
    ],
    Init: function() {
        this.root = document.getElementById("admin-panel");
        if (!this.root || this.root.dataset.ready) return;
        this.root.dataset.ready = "1";
        var self = this;
        this.root.querySelector("#admin-close").onclick = function() {
            self.Close();
        };
        this.root.querySelector("#admin-zone").onclick = function() {
            self.Send("admin:zone");
        };
        this.root.addEventListener("click", function(e){ self.Click(e); });
        this.root.addEventListener("input", function(e){ self.Input(e); });
        this.root.addEventListener("compositionstart", function(e){
            if(e.target.matches && e.target.matches("[data-admin-search]")) self.composingSearch=true;
        });
        this.root.addEventListener("compositionend", function(e){
            if(e.target.matches && e.target.matches("[data-admin-search]")) {
                self.composingSearch=false;
                self.Input(e);
            }
        });
        document.addEventListener("keydown", function(e){ if(e.key === "Escape" && self.root.classList.contains("active")) self.Close(); });
        window.addEventListener("resize", function(){ self.Scale(); });
        this.Scale();
    },
    Q: function(s) {
        return this.root.querySelector(s);
    },
    Escape: function(v) {
        var e=document.createElement("div");
        e.textContent=String(v==null?"":v);
        return e.innerHTML;
    },
    Minutes: function(v) {
        v=Math.max(0,Math.floor(Number(v)||0));
        return v>=60?Math.floor(v/60)+" год "+v%60+" хв":v+" хв";
    },
    Mine: function(r) {
        return r.status!=="closed" && String(r.adminId)===String(this.state.profile.id) && this.state.profile.id!==null;
    },
    Ticket: function() {
        var self=this;
        return this.state.tickets.find(function(r){return String(r.id)===String(self.selectedTicket);});
    },
    Show: function(data) {
        this.Init();
        if(data)this.SetData(data);
        this.root.classList.add("active");
        this.root.setAttribute("aria-hidden","false");
        this.Render();
    },
    Hide: function() {
        this.Init();
        this.root.classList.remove("active");
        this.root.setAttribute("aria-hidden","true");
    },
    Close: function() {
        this.Hide();
        this.Send("admin:close");
    },
    Send: function(eventName,data) {
        if(!window.GameCef)return false;
        if(data===undefined)return GameCef.send(eventName);
        return GameCef.sendJson(eventName,data);
    },
    NormalizeProfile: function(profile) {
        profile=profile||{};
        return {
            id: profile.id ?? profile.Id ?? profile.accountId ?? profile.AccountId ?? profile.playerId ?? profile.PlayerId ?? null,
            playerId: profile.playerId ?? profile.PlayerId ?? null,
            name: profile.name ?? profile.Name ?? "",
            role: profile.role ?? profile.Role ?? ""
        };
    },
    NormalizeAdmin: function(admin) {
        admin=admin||{};
        return {
            id: admin.id ?? admin.Id ?? admin.accountId ?? admin.AccountId ?? admin.playerId ?? admin.PlayerId ?? null,
            playerId: admin.playerId ?? admin.PlayerId ?? admin.id ?? admin.Id ?? null,
            accountId: admin.accountId ?? admin.AccountId ?? null,
            name: admin.name ?? admin.Name ?? ""
        };
    },
    NormalizeMessage: function(message) {
        message=message||{};
        return {
            senderId: message.senderId ?? message.SenderId ?? null,
            senderName: message.senderName ?? message.SenderName ?? message.name ?? message.Name ?? "",
            name: message.name ?? message.Name ?? message.senderName ?? message.SenderName ?? "",
            message: message.message ?? message.Message ?? message.text ?? message.Text ?? "",
            text: message.text ?? message.Text ?? message.message ?? message.Message ?? "",
            isAdmin: message.isAdmin ?? message.IsAdmin ?? false,
            role: message.role ?? message.Role ?? null,
            date: message.date ?? message.Date ?? message.time ?? message.Time ?? "",
            time: message.time ?? message.Time ?? message.date ?? message.Date ?? ""
        };
    },
    NormalizeTicket: function(ticket) {
        ticket=ticket||{};
        var status=ticket.status ?? ticket.Status ?? "open";
        if(typeof status==="number") status=status===1?"closed":"open";
        status=String(status).toLowerCase();

        return {
            id: ticket.id ?? ticket.Id ?? null,
            playerId: ticket.playerId ?? ticket.PlayerId ?? null,
            playerName: ticket.playerName ?? ticket.PlayerName ?? "",
            subject: ticket.subject ?? ticket.Subject ?? ticket.title ?? ticket.Title ?? "Звернення",
            title: ticket.title ?? ticket.Title ?? ticket.subject ?? ticket.Subject ?? "Звернення",
            status: status,
            adminId: ticket.adminId ?? ticket.AdminId ?? ticket.assignedAdminId ?? ticket.AssignedAdminId ?? null,
            adminName: ticket.adminName ?? ticket.AdminName ?? ticket.assignedAdminName ?? ticket.AssignedAdminName ?? null,
            waitLabel: ticket.waitLabel ?? ticket.WaitLabel ?? "",
            messages: (ticket.messages ?? ticket.Messages ?? []).map(this.NormalizeMessage.bind(this))
        };
    },
    SetData: function(data) {
        if(!data || typeof data!=="object") return false;

        var tickets=Array.isArray(data.tickets)?data.tickets:(Array.isArray(data.Tickets)?data.Tickets:null);
        if(tickets)this.state.tickets=tickets.map(this.NormalizeTicket.bind(this));

        var admins=Array.isArray(data.admins)?data.admins:(Array.isArray(data.Admins)?data.Admins:null);
        if(admins)this.state.admins=admins.map(this.NormalizeAdmin.bind(this));

        var commands=Array.isArray(data.commands)?data.commands:(Array.isArray(data.Commands)?data.Commands:null);
        if(commands)this.state.commands=commands;
        var punishments=Array.isArray(data.punishments)?data.punishments:(Array.isArray(data.Punishments)?data.Punishments:null);
        if(punishments)this.state.punishments=punishments;
        var locations=Array.isArray(data.locations)?data.locations:(Array.isArray(data.Locations)?data.Locations:null);
        if(locations)this.state.locations=locations;

        var profile=data.profile||data.Profile;
        if(profile&&typeof profile==="object")this.state.profile=this.NormalizeProfile(profile);

        var stats=data.stats||data.Stats;
        if(stats&&typeof stats==="object") {
            this.state.stats={
                days: stats.days ?? stats.Days ?? [],
                period: stats.period ?? stats.Period ?? ""
            };
        }

        var items=data.items||data.Items;
        if(items&&typeof items==="object")this.state.items= {
            weapons:items.weapons ?? items.Weapons ?? [],
            vehicles:items.vehicles ?? items.Vehicles ?? [],
            skins:items.skins ?? items.Skins ?? [],
            organizations:items.organizations ?? items.Organizations ?? []
        };
        if(this.pendingClaimTicket!=null) {
            var claimedId=this.pendingClaimTicket;
            var claimed=this.state.tickets.find(function(ticket){return String(ticket.id)===String(claimedId);});
            if(claimed&&String(claimed.adminId)===String(this.state.profile.id)) {
                this.tab="tickets";
                this.filter="mine";
                this.selectedTicket=claimed.id;
                this.chatOpen=true;
                this.pendingClaimTicket=null;
            }
        }
        if(this.root&&this.root.classList.contains("active"))this.Render();
        return true;
    },
    IsMobileLandscape: function() {
        return window.innerWidth > window.innerHeight && window.innerHeight <= 600;
    },
    Scale: function() {
        if(!this.root)return;

        var width=window.innerWidth;
        var height=window.innerHeight;
        var mobileLandscape=this.IsMobileLandscape();

        this.root.classList.toggle("admin-mobile-landscape",mobileLandscape);

        var baseWidth=mobileLandscape?1280:1440;
        var baseHeight=mobileLandscape?(height<=390?590:620):810;
        var widthRatio=(mobileLandscape?0.88:0.92);
        var heightRatio=(mobileLandscape?0.84:0.88);
        var scale=Math.min(width*widthRatio/baseWidth,height*heightRatio/baseHeight,1);

        this.root.style.setProperty("--admin-panel-scale",scale);
    },
    Toast: function(text) {
        var e=this.Q("#admin-toast");
        e.textContent=text;
        e.style.display="block";
        clearTimeout(this.toastTimer);
        this.toastTimer=setTimeout(function(){e.style.display="none";},3500);
    },
    NotConnected: function() {
        this.Toast("Дію буде підключено розробником");
    },
    Table: function(headers, rows, foot) {
        return '<table class="admin-table"><thead><tr>'+headers.map(this.Escape).map(function(h){return "<th>"+h+"</th>";}).join("")+'</tr></thead><tbody>'+(rows||'<tr><td colspan="'+headers.length+'" class="admin-empty">Немає даних</td></tr>')+'</tbody>'+(foot||"")+"</table>";
    },
    Render: function() {
        if(!this.root)return;
        var labels= {
            stats:"Статистика",tickets:"Звернення",commands:"Адмін-команди",punishments:"Гайд покарань",items:"Довідник ID",spawns:"Швидкі спавни"
        };
        var nav=[["stats","▥"],["tickets","♧"],["commands","›_"],["punishments","▤"],["items","◇"],["spawns","⌖"]],self=this;
        this.Q("#admin-nav").innerHTML=nav.map(function(n){return '<button type="button" data-admin-tab="'+n[0]+'" class="'+(self.tab===n[0]?"active":"")+'"><span class="admin-icon">'+n[1]+'</span><span>'+labels[n[0]]+'</span>'+(n[0]==="tickets"?'<span class="admin-badge">'+self.state.tickets.filter(function(r){return r.status!=="closed";}).length+"</span>":"")+"</button>";}).join("");
        this.Q("#admin-title").textContent=labels[this.tab];
        this.Q("#admin-content").innerHTML=({stats:this.Stats,tickets:this.Tickets,commands:this.Commands,punishments:this.Punishments,items:this.Items,spawns:this.Spawns}[this.tab]).call(this);
        var m=this.Q(".admin-messages");
        if(m)m.scrollTop=m.scrollHeight;

        var oldTransferLayer=this.root.querySelector(".admin-transfer-mobile-layer");
        if(oldTransferLayer)oldTransferLayer.remove();

        if(this.transferOpen) {
            if(this.IsMobileLandscape()) {
                this.RenderMobileTransfer();
            } else {
                var self=this;
                requestAnimationFrame(function(){ self.PositionTransferMenu(); });
            }
        }
    },
    RenderMobileTransfer: function() {
        var self=this;
        var admins=this.state.admins.filter(function(admin){
            return String(admin.id)!==String(self.state.profile.id);
        });

        var layer=document.createElement("div");
        layer.className="admin-transfer-mobile-layer";
        layer.innerHTML='<button type="button" class="admin-transfer-mobile-backdrop" data-admin-transfer-close aria-label="Закрити"></button>'
            +'<div class="admin-transfer-mobile-sheet" role="dialog" aria-modal="true" aria-label="Передати звернення">'
            +'<div class="admin-transfer-mobile-head"><div><strong>Передати звернення</strong><small>Оберіть адміністратора</small></div><button type="button" class="admin-transfer-mobile-close" data-admin-transfer-close>×</button></div>'
            +'<div class="admin-transfer-mobile-list">'
            +(admins.length?admins.map(function(admin){
                var active=String(self.transferAdminId)===String(admin.id)?" active":"";
                return '<button type="button" class="admin-transfer-mobile-option'+active+'" data-admin-transfer-option="'+self.Escape(admin.id)+'"><span>'+self.Escape(admin.name)+'</span><small>ID: '+self.Escape(admin.id)+'</small></button>';
            }).join(""):'<div class="admin-transfer-mobile-empty">Немає адміністраторів онлайн</div>')
            +'</div>'
            +'</div>';
        this.root.appendChild(layer);
    },
    PositionTransferMenu: function() {
        var menu=this.Q(".admin-transfer-menu");
        var toggle=this.Q(".admin-transfer-toggle");
        if(!menu || !toggle) return;

        menu.classList.remove("admin-transfer-menu-down");
        menu.style.maxHeight="";

        var toggleRect=toggle.getBoundingClientRect();
        var rootRect=this.root.getBoundingClientRect();
        var scale=this.root.offsetWidth ? rootRect.width / this.root.offsetWidth : 1;
        if(!isFinite(scale) || scale<=0) scale=1;

        var safeTop=Math.max(8,rootRect.top+8);
        var safeBottom=Math.min(window.innerHeight-8,rootRect.bottom-8);
        var spaceAbove=Math.max(0,toggleRect.top-safeTop-6);
        var spaceBelow=Math.max(0,safeBottom-toggleRect.bottom-6);
        var openDown=spaceBelow>spaceAbove;

        menu.classList.toggle("admin-transfer-menu-down",openDown);

        var available=openDown?spaceBelow:spaceAbove;
        var maxLocal=Math.max(72,Math.floor(available/scale));
        menu.style.maxHeight=Math.min(220,maxLocal)+"px";
    },
    Stats: function() {
        var d=this.state.stats.days||[],t=d.reduce(function(a,x){a.online+=Number(x.onlineMinutes)||0;a.closed+=Number(x.closed)||0;return a;},{online:0,closed:0}),self=this;
        return '<div class="admin-row admin-between"><div class="admin-row"><h2>'+this.Escape(this.state.profile.name||"Адміністратор")+'</h2><span class="admin-badge">'+this.Escape(this.state.profile.role)+"</span></div><small>"+this.Escape(this.state.stats.period||"Поточний тиждень")+'</small></div><div class="admin-cards">'+[["♧","Мої активні звернення",this.state.tickets.filter(function(r){return self.Mine(r);}).length],["◷","Онлайн за тиждень",this.Minutes(t.online)],["✓","Закрито звернень за тиждень",t.closed]].map(function(x){return '<div class="admin-card"><span class="admin-icon">'+x[0]+'</span><div><small>'+x[1]+'</small><div class="admin-value">'+x[2]+'</div></div></div>';}).join("")+'</div><div class="admin-stats"><div class="admin-box admin-scroll"><h2>Активність за днями</h2>'+this.Table(["День","Онлайн","Закрито звернень"],d.map(function(x){return "<tr><td>"+self.Escape(x.day)+"</td><td>"+self.Minutes(x.onlineMinutes)+"</td><td>"+self.Escape(x.closed)+"</td></tr>";}).join(""),"<tfoot><tr><td>Разом</td><td>"+this.Minutes(t.online)+"</td><td>"+t.closed+"</td></tr></tfoot>")+'</div><div class="admin-box admin-scroll"><h2>Адміни онлайн <span class="admin-badge">'+this.state.admins.length+'</span></h2>'+this.Table(["ID","Нікнейм"],this.state.admins.map(function(a){return "<tr><td>"+self.Escape(a.id)+"</td><td>"+self.Escape(a.name)+"</td></tr>";}).join(""))+'</div></div>';
    },
    FilteredTickets: function() {
        var self=this,q=this.query.toLowerCase();
        return this.state.tickets.filter(function(r){var ok=self.filter==="closed"?r.status==="closed":self.filter==="free"?r.status!=="closed"&&r.adminId==null:self.Mine(r);return ok&&[r.id,r.playerName,r.playerId,r.subject].join(" ").toLowerCase().includes(q);});
    },
    Tickets: function() {
        var rows=this.FilteredTickets(),self=this;
        if(!rows.some(function(x){return String(x.id)===String(self.selectedTicket);})) {
            this.selectedTicket=rows[0]?rows[0].id:null;
        }
        var r=this.Ticket(),counts= {
            free:this.state.tickets.filter(function(x){return x.status!=="closed"&&x.adminId==null;}).length,mine:this.state.tickets.filter(function(x){return self.Mine(x);}).length,closed:this.state.tickets.filter(function(x){return x.status==="closed";}).length
        };
        return '<div class="admin-tabs">'+[["free","Вільні"],["mine","Мої"],["closed","Закриті"]].map(function(x){return '<button type="button" data-admin-filter="'+x[0]+'" class="'+(self.filter===x[0]?"active":"")+'">'+x[1]+" · "+counts[x[0]]+"</button>";}).join("")+'</div><div class="admin-ticket-layout '+(this.chatOpen?"admin-chat-open ":"")+(this.ticketFocus?"admin-ticket-focus":"")+'"><div class="admin-tickets"><input class="admin-search" data-admin-search value="'+this.Escape(this.query)+'" placeholder="Пошук за назвою, ID або описом">'+(rows.map(function(x){return '<button type="button" class="admin-ticket '+(String(x.id)===String(self.selectedTicket)?"active":"")+'" data-admin-ticket="'+self.Escape(x.id)+'"><span>#'+self.Escape(x.id)+' · '+self.Escape(x.waitLabel||"")+'</span><strong>'+self.Escape(x.playerName)+' ['+self.Escape(x.playerId)+']</strong><small>'+self.Escape(x.subject)+'</small></button>';}).join("")||'<div class="admin-empty">Звернень немає</div>')+'</div><div class="admin-chat">'+(r?this.Chat(r):'<div class="admin-empty">Оберіть звернення</div>')+'</div></div>';
    },
    Chat: function(r) {
        var owned=this.Mine(r),closed=r.status==="closed",self=this,admins=this.state.admins.filter(function(a){return String(a.id)!==String(self.state.profile.id);});
        var quickMenu=this.quickOpen?'<div class="admin-quick-menu">'+this.quickReplies.map(function(q,i){return '<button type="button" data-admin-quick="'+i+'">'+self.Escape(q.label)+'</button>';}).join("")+'</div>':'';
        var messages=(r.messages||[]).map(function(m){var role=m.role||(m.isAdmin?"admin":"player");return '<div class="admin-message '+(role==="admin"?"admin-own":"admin-player")+'"><small>'+self.Escape(m.name||m.senderName)+' · '+self.Escape(m.time||m.date||"")+'</small><div class="admin-bubble">'+self.Escape(m.text||m.message)+'</div></div>';}).join("");
        var controls='';
        if(owned) {
            controls='<div class="admin-composer">'
            +'<div class="admin-ticket-controls">'
            +'<div class="admin-quick-wrap"><button type="button" class="admin-quick-toggle" data-admin-quick-toggle>Швидкі відповіді '+(this.quickOpen?'▴':'▾')+'</button>'+quickMenu+'</div>'
            +'<div class="admin-transfer-row"><div class="admin-transfer-select"><button type="button" class="admin-select admin-transfer-toggle" data-admin-transfer-toggle>'+this.TransferAdminLabel(admins)+'</button>'+(this.transferOpen&&!this.IsMobileLandscape()?'<div class="admin-transfer-menu">'+(admins.length?admins.map(function(a){return '<button type="button" class="admin-transfer-option '+(String(self.transferAdminId)===String(a.id)?"active":"")+'" data-admin-transfer-option="'+self.Escape(a.id)+'">'+self.Escape(a.name)+' ['+self.Escape(a.id)+']</button>';}).join(""):'<div class="admin-transfer-empty">Немає адміністраторів онлайн</div>')+'</div>':'')+'</div><button type="button" data-admin-action="transfer">Передати</button><button type="button" data-admin-action="release">Звільнити</button></div>'
            +'</div>'
            +'<div class="admin-send-row"><textarea class="admin-textarea" data-admin-draft placeholder="Напишіть повідомлення…"></textarea><button type="button" class="admin-send admin-primary" data-admin-action="send">Надіслати</button></div>'
            +'<button type="button" class="admin-close-ticket" data-admin-action="resolve">Закрити тікет</button>'
            +'</div>';
        }else if(!closed&&r.adminId==null) {
            controls='<div class="admin-composer"><button type="button" class="admin-primary admin-claim-ticket" data-admin-action="claim">Взяти звернення</button></div>';
        }else {
            controls='<div class="admin-composer admin-muted">Перегляд історії листування</div>';
        }
        return '<div class="admin-chat-head"><div class="admin-chat-title-row"><div><h2>#'+this.Escape(r.id)+' · '+this.Escape(r.subject||r.title||"Звернення")+'</h2><small>'+this.Escape(r.playerName)+' [ID: '+this.Escape(r.playerId)+'] · '+(closed?"Закрито":r.adminId==null?"Вільний":"В роботі")+'</small></div><button type="button" class="admin-ticket-focus-toggle" data-admin-ticket-focus>'+(this.ticketFocus?"Показати звернення":"Сховати звернення")+'</button></div></div><div class="admin-messages">'+messages+'</div>'+controls;
    },
    TransferAdminLabel: function(admins) {
        var self=this;
        var admin=(admins||[]).find(function(a){ return String(a.id)===String(self.transferAdminId); });
        return admin ? this.Escape(admin.name)+" ["+this.Escape(admin.id)+"] ▾" : "Передати адміну… ▾";
    },
    Search: function() {
        return '<input class="admin-search" data-admin-search value="'+this.Escape(this.query)+'" placeholder="Пошук за назвою, ID або описом">';
    },
    Commands: function() {
        return this.Search()+'<div class="admin-box admin-scroll"><h2>Адмін-команди</h2>'+this.Table(["Команда","Опис","Мін. рівень"],this.state.commands.filter(this.Match.bind(this)).map(this.CommandRow.bind(this)).join(""))+'</div>';
    },
    CommandRow: function(x) {
        return '<tr><td><code>'+this.Escape(x.name)+'</code></td><td>'+this.Escape(x.description)+'</td><td>'+this.Escape(x.minLevel)+'</td></tr>';
    },
    Punishments: function() {
        return this.Search()+'<div class="admin-box admin-scroll"><h2>Гайд покарань</h2>'+this.Table(["Порушення","Покарання","Термін"],this.state.punishments.filter(this.Match.bind(this)).map(function(x){return "<tr><td>"+this.Escape(x.violation)+"</td><td>"+this.Escape(x.type)+"</td><td>"+this.Escape(x.duration)+"</td></tr>";},this).join(""))+'</div>';
    },
    Items: function() {
        var self=this,labels= {
            weapons:"Зброя",vehicles:"Авто",skins:"Скіни",organizations:"Організації"
        };
        return '<div class="admin-tabs">'+Object.keys(labels).map(function(k){return '<button type="button" data-admin-items="'+k+'" class="'+(self.itemCategory===k?"active":"")+'">'+labels[k]+'</button>';}).join("")+'</div><div class="admin-box admin-scroll"><h2>'+labels[this.itemCategory]+'</h2>'+this.Table(["ID",this.itemCategory==="organizations"?"Назва організації":"Назва"],(this.state.items[this.itemCategory]||[]).filter(this.Match.bind(this)).map(function(x){return "<tr><td>"+self.Escape(x.id)+"</td><td>"+self.Escape(x.name)+"</td></tr>";}).join(""))+'</div>';
    },
    Spawns: function() {
        var self=this;
        return this.Search()+'<small>Натисніть на локацію, щоб телепортуватися</small><div class="admin-spawns">'+this.state.locations.filter(this.Match.bind(this)).map(function(x){return '<button type="button" class="admin-spawn" data-admin-spawn="'+self.Escape(x.id)+'"><span class="admin-icon">⌖</span>'+self.Escape(x.name)+'</button>';}).join("")+'</div>';
    },
    Match: function(x) {
        return JSON.stringify(x).toLowerCase().includes(this.query.toLowerCase());
    },
    Click: function(e) {
        var b=e.target.closest("button");
        if(!b)return;
        if(b.dataset.adminTab) {
            this.tab=b.dataset.adminTab;
            this.query="";
            this.chatOpen=false;
            this.ticketFocus=false;
            this.transferOpen=false;
            this.transferAdminId=null;
            this.Render();
            return;
        }
        if(b.dataset.adminFilter) {
            this.filter=b.dataset.adminFilter;
            this.selectedTicket=null;
            this.chatOpen=false;
            this.ticketFocus=false;
            this.transferOpen=false;
            this.transferAdminId=null;
            this.Render();
            return;
        }
        if(b.dataset.adminTicket) {
            this.selectedTicket=b.dataset.adminTicket;
            this.chatOpen=true;
            this.transferOpen=false;
            this.transferAdminId=null;
            this.Render();
            return;
        }
        if(b.dataset.adminItems) {
            this.itemCategory=b.dataset.adminItems;
            this.query="";
            this.Render();
            return;
        }
        if(b.dataset.adminTicketFocus!==undefined) {
            this.ticketFocus=!this.ticketFocus;
            this.Render();
            return;
        }
        if(b.dataset.adminBack!==undefined) {
            this.chatOpen=false;
            this.quickOpen=false;
            this.Render();
            return;
        }
        if(b.dataset.adminQuickToggle!==undefined) {
            this.quickOpen=!this.quickOpen;
            this.Render();
            return;
        }
        if(b.dataset.adminQuick!==undefined) {
            var q=this.quickReplies[Number(b.dataset.adminQuick)],d=this.Q("[data-admin-draft]");
            if(q&&d) {
                d.value=q.text;
                this.quickOpen=false;
                d.focus();
                var menu=this.Q(".admin-quick-menu");
                if(menu)menu.style.display="none";
            }
            return;
        }
        if(b.dataset.adminTransferClose!==undefined) {
            this.transferOpen=false;
            this.Render();
            return;
        }
        if(b.dataset.adminTransferToggle!==undefined) {
            this.transferOpen=!this.transferOpen;
            this.Render();
            return;
        }
        if(b.dataset.adminTransferOption!==undefined) {
            this.transferAdminId=b.dataset.adminTransferOption;
            this.transferOpen=false;
            this.Render();
            return;
        }
        if(b.dataset.adminSpawn!==undefined) {
            this.Send("admin:spawn",{LocationId:b.dataset.adminSpawn});
            return;
        }
        if(b.dataset.adminAction!==undefined)this.Action(b.dataset.adminAction);
    },
    Action: function(action) {
        var ticketId=this.selectedTicket;
        if(ticketId==null)return;
        if(action==="claim") {
            this.pendingClaimTicket=Number(ticketId);
            this.Send("admin:ticket:claim",{TicketId:Number(ticketId)});
            return;
        }
        if(action==="release") {
            this.Send("admin:ticket:release",{TicketId:Number(ticketId)});
            return;
        }
        if(action==="resolve") {
            this.Send("admin:ticket:close",{TicketId:Number(ticketId)});
            return;
        }
        if(action==="send") {
            var draft=this.Q("[data-admin-draft]");
            var message=draft?draft.value.trim():"";
            if(!message) {
                this.Toast("Введіть повідомлення");
                return;
            }
            this.Send("admin:ticket:message",{TicketId:Number(ticketId),Message:message});
            draft.value="";
            return;
        }
        if(action==="transfer") {
            var adminId=this.transferAdminId;
            if(!adminId) {
                this.Toast("Оберіть адміністратора");
                return;
            }

            var selectedAdmin=this.state.admins.find(function(admin){
                return String(admin.id)===String(adminId);
            });
            if(!selectedAdmin) {
                this.Toast("Адміністратора не знайдено");
                return;
            }

            var targetId=Number(selectedAdmin.id);
            var targetPlayerId=Number(selectedAdmin.playerId ?? selectedAdmin.id);
            var targetAccountId=selectedAdmin.accountId==null?null:Number(selectedAdmin.accountId);

            var sent=this.Send("admin:ticket:transfer",{
                TicketId:Number(ticketId),
                AdminId:targetId,
                TargetAdminId:targetId,
                TargetId:targetId,
                AdminPlayerId:targetPlayerId,
                TargetPlayerId:targetPlayerId,
                AccountId:targetAccountId
            });

            if(!sent) this.Toast("CEF bridge недоступний");
            this.transferOpen=false;
        }
    },
    Input: function(e) {
        var input=e.target;
        if(!input.matches || !input.matches("[data-admin-search]")) return;

        this.query=input.value;
        clearTimeout(this.searchTimer);

        // Do not rebuild the input on every key press. In Android/CEF that
        // resets the caret/IME composition and characters can appear reversed.
        var self=this;
        this.searchTimer=setTimeout(function(){
            if(self.composingSearch) return;
            self.Render();
            var search=self.Q("[data-admin-search]");
            if(search) {
                search.focus();
                try { search.setSelectionRange(search.value.length, search.value.length); } catch (_) {}
            }
        },180);
    }
};
window.addEventListener("DOMContentLoaded", function(){ AdminPanel.Init(); });
function parseAdminPayload(data) {
    if (data && typeof data === "object") return data;
    if (typeof data !== "string" || !data.trim()) return null;
    try {
        return JSON.parse(data);
    } catch {
        return null;
    }
}
if (window.GameCef) {
    GameCef.on("admin:show", function(data) {
    AdminPanel.Show(parseAdminPayload(data));
    });
    GameCef.on("admin:hide", function() {
    AdminPanel.Hide();
    });
    GameCef.on("admin:update", function(data) {
    var payload = parseAdminPayload(data);
    if (payload) AdminPanel.SetData(payload);
    });
}
