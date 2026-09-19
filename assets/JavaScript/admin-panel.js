var AdminPanel = {
    root: null, tab: "stats", filter: "mine", selectedReport: null, query: "", chatOpen: false, itemCategory: "weapons",
    state: { profile:{id:null,name:"",role:""}, stats:{days:[],period:""}, admins:[], reports:[], commands:[], punishments:[], items:{weapons:[],vehicles:[],skins:[],organizations:[]}, locations:[] },
    quickReplies: [
        {label:"Слідкую",text:"Вітаю! Слідкую за ситуацією, будь ласка, очікуйте."},
        {label:"Зараз допоможу",text:"Вітаю! Зараз допоможу Вам, будь ласка, очікуйте."},
        {label:"РП шляхом",text:"Вітаю! Цю ситуацію необхідно вирішити самостійно в межах ігрового процесу, без втручання адміністрації."},
        {label:"Не офтопте",text:"Будь ласка, не використовуйте репорт не за призначенням. Для спілкування використовуйте ігровий чат."},
        {label:"Передано далі",text:"Вітаю! Ваш репорт передано відповідальному адміністратору, будь ласка, очікуйте."},
        {label:"Приємної гри",text:"Дякуємо за репорт! Приємної гри на Antares RP!"}
    ],
    Init: function() {
        this.root = document.getElementById("admin-panel");
        if (!this.root || this.root.dataset.ready) return;
        this.root.dataset.ready = "1";
        var self = this;
        this.root.querySelector("#admin-close").onclick = function(){ self.Close(); };
        this.root.querySelector("#admin-zone").onclick = function(){ self.Send("admin:zone"); };
        this.root.addEventListener("click", function(e){ self.Click(e); });
        this.root.addEventListener("input", function(e){ self.Input(e); });
        document.addEventListener("keydown", function(e){ if(e.key === "Escape" && self.root.classList.contains("active")) self.Close(); });
        window.addEventListener("resize", function(){ self.Scale(); });
        this.Scale();
    },
    Q: function(s){ return this.root.querySelector(s); },
    Escape: function(v){ var e=document.createElement("div");e.textContent=String(v==null?"":v);return e.innerHTML; },
    Minutes: function(v){v=Math.max(0,Math.floor(Number(v)||0));return v>=60?Math.floor(v/60)+" год "+v%60+" хв":v+" хв";},
    Mine: function(r){return r.status!=="closed" && String(r.adminId)===String(this.state.profile.id) && this.state.profile.id!==null;},
    Report: function(){var self=this;return this.state.reports.find(function(r){return String(r.id)===String(self.selectedReport);});},
    Show: function(data){this.Init();if(data)this.SetData(data);this.root.classList.add("active");this.root.setAttribute("aria-hidden","false");this.Render();},
    Hide: function(){this.Init();this.root.classList.remove("active");this.root.setAttribute("aria-hidden","true");},
    Close: function(){this.Hide();this.Send("admin:close");},
    Send: function(eventName,data){
        if(!window.GameCef)return false;
        if(data===undefined)return GameCef.send(eventName);
        return GameCef.sendJson(eventName,data);
    },
    SetData: function(data){
        if(!data || typeof data!=="object") return false;
        var keys=["admins","reports","commands","punishments","locations"];
        for(var i=0;i<keys.length;i++) if(Array.isArray(data[keys[i]])) this.state[keys[i]]=data[keys[i]];
        if(data.profile&&typeof data.profile==="object")this.state.profile=data.profile;
        if(data.stats&&Array.isArray(data.stats.days))this.state.stats=data.stats;
        if(data.items&&typeof data.items==="object")this.state.items={weapons:[],vehicles:[],skins:[],organizations:[],...data.items};
        if(this.root&&this.root.classList.contains("active"))this.Render();
        return true;
    },
    Scale: function(){if(!this.root)return;var desktop=window.innerWidth>=768;if(!desktop){this.root.style.removeProperty("--admin-panel-scale");return;}this.root.style.setProperty("--admin-panel-scale",Math.min(window.innerWidth*.94/1440,window.innerHeight*.92/810));},
    Toast: function(text){var e=this.Q("#admin-toast");e.textContent=text;e.style.display="block";clearTimeout(this.toastTimer);this.toastTimer=setTimeout(function(){e.style.display="none";},3500);},
    NotConnected: function(){this.Toast("Дію буде підключено розробником");},
    Table: function(headers, rows, foot){return '<table class="admin-table"><thead><tr>'+headers.map(this.Escape).map(function(h){return "<th>"+h+"</th>";}).join("")+'</tr></thead><tbody>'+(rows||'<tr><td colspan="'+headers.length+'" class="admin-empty">Немає даних</td></tr>')+'</tbody>'+(foot||"")+"</table>";},
    Render: function(){if(!this.root)return;var labels={stats:"Статистика",reports:"Репорти",commands:"Адмін-команди",punishments:"Гайд покарань",items:"Довідник ID",spawns:"Швидкі спавни"};var nav=[["stats","▥"],["reports","♧"],["commands","›_"],["punishments","▤"],["items","◇"],["spawns","⌖"]],self=this;this.Q("#admin-nav").innerHTML=nav.map(function(n){return '<button type="button" data-admin-tab="'+n[0]+'" class="'+(self.tab===n[0]?"active":"")+'"><span class="admin-icon">'+n[1]+'</span><span>'+labels[n[0]]+'</span>'+(n[0]==="reports"?'<span class="admin-badge">'+self.state.reports.filter(function(r){return r.status!=="closed";}).length+"</span>":"")+"</button>";}).join("");this.Q("#admin-title").textContent=labels[this.tab];this.Q("#admin-content").innerHTML=({stats:this.Stats,reports:this.Reports,commands:this.Commands,punishments:this.Punishments,items:this.Items,spawns:this.Spawns}[this.tab]).call(this);var m=this.Q(".admin-messages");if(m)m.scrollTop=m.scrollHeight;},
    Stats: function(){var d=this.state.stats.days||[],t=d.reduce(function(a,x){a.online+=Number(x.onlineMinutes)||0;a.closed+=Number(x.closed)||0;return a;},{online:0,closed:0}),self=this;return '<div class="admin-row admin-between"><div class="admin-row"><h2>'+this.Escape(this.state.profile.name||"Адміністратор")+'</h2><span class="admin-badge">'+this.Escape(this.state.profile.role)+"</span></div><small>"+this.Escape(this.state.stats.period||"Поточний тиждень")+'</small></div><div class="admin-cards">'+[["♧","Мої активні репорти",this.state.reports.filter(function(r){return self.Mine(r);}).length],["◷","Онлайн за тиждень",this.Minutes(t.online)],["✓","Закрито репортів за тиждень",t.closed]].map(function(x){return '<div class="admin-card"><span class="admin-icon">'+x[0]+'</span><div><small>'+x[1]+'</small><div class="admin-value">'+x[2]+'</div></div></div>';}).join("")+'</div><div class="admin-stats"><div class="admin-box admin-scroll"><h2>Активність за днями</h2>'+this.Table(["День","Онлайн","Закрито репортів"],d.map(function(x){return "<tr><td>"+self.Escape(x.day)+"</td><td>"+self.Minutes(x.onlineMinutes)+"</td><td>"+self.Escape(x.closed)+"</td></tr>";}).join(""),"<tfoot><tr><td>Разом</td><td>"+this.Minutes(t.online)+"</td><td>"+t.closed+"</td></tr></tfoot>")+'</div><div class="admin-box admin-scroll"><h2>Адміни онлайн <span class="admin-badge">'+this.state.admins.length+'</span></h2>'+this.Table(["ID","Нікнейм"],this.state.admins.map(function(a){return "<tr><td>"+self.Escape(a.id)+"</td><td>"+self.Escape(a.name)+"</td></tr>";}).join(""))+'</div></div>';},
    Filtered: function(){var self=this,q=this.query.toLowerCase();return this.state.reports.filter(function(r){var ok=self.filter==="closed"?r.status==="closed":self.filter==="free"?r.status!=="closed"&&r.adminId==null:self.Mine(r);return ok&&[r.id,r.playerName,r.playerId,r.subject].join(" ").toLowerCase().includes(q);});},
    Reports: function(){var rows=this.Filtered(),self=this;if(!rows.some(function(x){return String(x.id)===String(self.selectedReport);})){this.selectedReport=rows[0]?rows[0].id:null;}var r=this.Report(),counts={free:this.state.reports.filter(function(x){return x.status!=="closed"&&x.adminId==null;}).length,mine:this.state.reports.filter(function(x){return self.Mine(x);}).length,closed:this.state.reports.filter(function(x){return x.status==="closed";}).length};return '<div class="admin-tabs">'+[["free","Вільні"],["mine","Мої"],["closed","Закриті"]].map(function(x){return '<button type="button" data-admin-filter="'+x[0]+'" class="'+(self.filter===x[0]?"active":"")+'">'+x[1]+" · "+counts[x[0]]+"</button>";}).join("")+'</div><div class="admin-report-layout '+(this.chatOpen?"admin-chat-open":"")+'"><div class="admin-tickets"><input class="admin-search" data-admin-search value="'+this.Escape(this.query)+'" placeholder="Пошук за назвою, ID або описом">'+(rows.map(function(x){return '<button type="button" class="admin-ticket '+(String(x.id)===String(self.selectedReport)?"active":"")+'" data-admin-report="'+self.Escape(x.id)+'"><span>#'+self.Escape(x.id)+' · '+self.Escape(x.waitLabel||"")+'</span><strong>'+self.Escape(x.playerName)+' ['+self.Escape(x.playerId)+']</strong><small>'+self.Escape(x.subject)+'</small></button>';}).join("")||'<div class="admin-empty">Репортів немає</div>')+'</div><div class="admin-chat">'+(r?this.Chat(r):'<div class="admin-empty">Оберіть репорт</div>')+'</div></div>';},
    Chat: function(r){var owned=this.Mine(r),closed=r.status==="closed",self=this,admins=this.state.admins.filter(function(a){return String(a.id)!==String(self.state.profile.id);});return '<div class="admin-chat-head"><button type="button" class="admin-back" data-admin-back>‹ Репорти</button><h2>#'+this.Escape(r.id)+' · '+this.Escape(r.subject||r.title||"Репорт")+'</h2><small>'+this.Escape(r.playerName)+' [ID: '+this.Escape(r.playerId)+'] · '+(closed?"Закрито":r.adminId==null?"Вільний":"В роботі")+'</small></div><div class="admin-messages">'+(r.messages||[]).map(function(m){var role=m.role||(m.isAdmin?"admin":"player");return '<div class="admin-message '+(role==="admin"?"admin-own":"")+'"><small>'+self.Escape(m.name||m.senderName)+' · '+self.Escape(m.time||m.date||"")+'</small><div class="admin-bubble">'+self.Escape(m.text||m.message)+'</div></div>';}).join("")+'</div>'+(owned?'<div class="admin-composer"><div class="admin-quick">'+this.quickReplies.map(function(q,i){return '<button type="button" data-admin-quick="'+i+'">'+q.label+'</button>';}).join("")+'</div><div class="admin-send-row"><textarea class="admin-textarea" data-admin-draft placeholder="Напишіть повідомлення…"></textarea><button type="button" class="admin-send" data-admin-action="send">➤</button></div><div class="admin-actions"><select class="admin-select" data-admin-transfer><option value="">Передати адміну…</option>'+admins.map(function(a){return '<option value="'+self.Escape(a.id)+'">'+self.Escape(a.name)+' ['+self.Escape(a.id)+']</option>';}).join("")+'</select><button type="button" data-admin-action="transfer">Передати</button><button type="button" data-admin-action="release">Звільнити</button><button type="button" class="admin-primary" data-admin-action="resolve">✓ Гравцю допомогли</button></div></div>':!closed&&r.adminId==null?'<div class="admin-composer"><button type="button" class="admin-primary" data-admin-action="claim">Взяти репорт</button></div>':'<div class="admin-composer admin-muted">Перегляд історії листування</div>');},
    Search: function(){return '<input class="admin-search" data-admin-search value="'+this.Escape(this.query)+'" placeholder="Пошук за назвою, ID або описом">';},
    Commands: function(){return this.Search()+'<div class="admin-box admin-scroll"><h2>Адмін-команди</h2>'+this.Table(["Команда","Опис","Мін. рівень"],this.state.commands.filter(this.Match.bind(this)).map(this.CommandRow.bind(this)).join(""))+'</div>';},
    CommandRow: function(x){return '<tr><td><code>'+this.Escape(x.name)+'</code></td><td>'+this.Escape(x.description)+'</td><td>'+this.Escape(x.minLevel)+'</td></tr>';},
    Punishments: function(){return this.Search()+'<div class="admin-box admin-scroll"><h2>Гайд покарань</h2>'+this.Table(["Порушення","Покарання","Термін"],this.state.punishments.filter(this.Match.bind(this)).map(function(x){return "<tr><td>"+this.Escape(x.violation)+"</td><td>"+this.Escape(x.type)+"</td><td>"+this.Escape(x.duration)+"</td></tr>";},this).join(""))+'</div>';},
    Items: function(){var self=this,labels={weapons:"Зброя",vehicles:"Авто",skins:"Скіни",organizations:"Організації"};return '<div class="admin-tabs">'+Object.keys(labels).map(function(k){return '<button type="button" data-admin-items="'+k+'" class="'+(self.itemCategory===k?"active":"")+'">'+labels[k]+'</button>';}).join("")+'</div><div class="admin-box admin-scroll"><h2>'+labels[this.itemCategory]+'</h2>'+this.Table(["ID",this.itemCategory==="organizations"?"Назва організації":"Назва"],(this.state.items[this.itemCategory]||[]).filter(this.Match.bind(this)).map(function(x){return "<tr><td>"+self.Escape(x.id)+"</td><td>"+self.Escape(x.name)+"</td></tr>";}).join(""))+'</div>';},
    Spawns: function(){var self=this;return this.Search()+'<small>Натисніть на локацію, щоб телепортуватися</small><div class="admin-spawns">'+this.state.locations.filter(this.Match.bind(this)).map(function(x){return '<button type="button" class="admin-spawn" data-admin-spawn="'+self.Escape(x.id)+'"><span class="admin-icon">⌖</span>'+self.Escape(x.name)+'</button>';}).join("")+'</div>';},
    Match: function(x){return JSON.stringify(x).toLowerCase().includes(this.query.toLowerCase());},
    Click: function(e){
        var b=e.target.closest("button");
        if(!b)return;
        if(b.dataset.adminTab){this.tab=b.dataset.adminTab;this.query="";this.chatOpen=false;this.Render();return;}
        if(b.dataset.adminFilter){this.filter=b.dataset.adminFilter;this.selectedReport=null;this.chatOpen=false;this.Render();return;}
        if(b.dataset.adminReport){this.selectedReport=b.dataset.adminReport;this.chatOpen=true;this.Render();return;}
        if(b.dataset.adminItems){this.itemCategory=b.dataset.adminItems;this.query="";this.Render();return;}
        if(b.dataset.adminBack!==undefined){this.chatOpen=false;this.Render();return;}
        if(b.dataset.adminQuick!==undefined){var q=this.quickReplies[Number(b.dataset.adminQuick)],d=this.Q("[data-admin-draft]");if(q&&d){d.value=q.text;d.focus();}return;}
        if(b.dataset.adminSpawn!==undefined){this.Send("admin:spawn",{LocationId:b.dataset.adminSpawn});return;}
        if(b.dataset.adminAction!==undefined)this.Action(b.dataset.adminAction);
    },
    Action: function(action){
        var reportId=this.selectedReport;
        if(reportId==null)return;
        if(action==="claim"){this.Send("admin:report:claim",{ReportId:Number(reportId)});return;}
        if(action==="release"){this.Send("admin:report:release",{ReportId:Number(reportId)});return;}
        if(action==="resolve"){this.Send("admin:report:close",{ReportId:Number(reportId)});return;}
        if(action==="send"){
            var draft=this.Q("[data-admin-draft]");
            var message=draft?draft.value.trim():"";
            if(!message){this.Toast("Введіть повідомлення");return;}
            this.Send("admin:report:message",{ReportId:Number(reportId),Message:message});
            draft.value="";
            return;
        }
        if(action==="transfer"){
            var select=this.Q("[data-admin-transfer]");
            var adminId=select?select.value:"";
            if(!adminId){this.Toast("Оберіть адміністратора");return;}
            this.Send("admin:report:transfer",{ReportId:Number(reportId),AdminId:Number(adminId)});
        }
    },
    Input: function(e){var input=e.target;if(input.matches&&input.matches("[data-admin-search]")){this.query=input.value;this.Render();var i=this.Q("[data-admin-search]");if(i)i.focus();}}
};
window.addEventListener("DOMContentLoaded", function(){ AdminPanel.Init(); });
function parseAdminPayload(data) {
    if (data && typeof data === "object") return data;
    if (typeof data !== "string" || !data.trim()) return null;
    try { return JSON.parse(data); } catch { return null; }
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
