window.AntaresAdminContent = {
  "commands": [],
  "punishments": [],
  "items": {
    "weapons": [],
    "vehicles": [],
    "skins": [],
    "organizations": []
  },
  "quickReplies": [
    {
      "label": "Слідкую",
      "text": "Вітаю! Слідкую за ситуацією, будь ласка, очікуйте."
    },
    {
      "label": "Зараз допоможу",
      "text": "Вітаю! Зараз допоможу Вам, будь ласка, очікуйте."
    },
    {
      "label": "РП шляхом",
      "text": "Вітаю! Цю ситуацію необхідно вирішити самостійно в межах ігрового процесу, без втручання адміністрації."
    },
    {
      "label": "Не офтопте",
      "text": "Будь ласка, не використовуйте репорт не за призначенням. Для спілкування використовуйте ігровий чат."
    },
    {
      "label": "Передано далі",
      "text": "Вітаю! Ваше звернення передано відповідальному адміністратору, будь ласка, очікуйте."
    },
    {
      "label": "Приємної гри",
      "text": "Дякуємо за звернення! Приємної гри на Antares RP!"
    }
  ]
};
(function(){'use strict';
 function resize(){
  var desktop=typeof window.matchMedia==='function'?window.matchMedia('(min-width: 768px)').matches:window.innerWidth>=768;
  if(!desktop){document.documentElement.style.removeProperty('--pc-scale');return;}
  var width=Math.max(1,window.innerWidth),height=Math.max(1,window.innerHeight);
  document.documentElement.style.setProperty('--pc-scale',String(Math.min(width*.94/1440,height*.92/810)));
 }
 resize();window.addEventListener('resize',resize);if(typeof window.matchMedia==='function'){var query=window.matchMedia('(min-width: 768px)');if(query.addEventListener)query.addEventListener('change',resize);else if(query.addListener)query.addListener(resize);}
})();
'use strict';
(function(){
const $=s=>document.querySelector(s), esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const localContent=window.AntaresAdminContent||{};
const demo=new URLSearchParams(location.search).get('demo')==='1';
let state={profile:{id:null,name:'',role:''},stats:{days:[],period:''},admins:[],reports:[],commands:[],punishments:[],items:{weapons:[],vehicles:[],skins:[],organizations:[]},locations:[],quickReplies:[]};
state.commands=localContent.commands||[];state.punishments=localContent.punishments||[];state.items=localContent.items||state.items;state.quickReplies=localContent.quickReplies||[];
let mobileChatOpen=false;
let itemCategory='weapons';
let tab='stats',reportFilter='mine',selectedReport=null,selectedCommand=null,query='',category='Усі',drafts={};
const nav=[['stats','▥','Статистика'],['reports','♧','Репорти'],['commands','›_','Адмін-команди'],['punishments','▤','Гайд покарань'],['items','◇','Довідник ID'],['spawns','♧','Швидкі спавни']];
function toast(s){$('#toast').textContent=s;$('#toast').style.display='block';clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('#toast').style.display='none',4000)}
function minutes(v){v=Math.max(0,Math.floor(Number(v)||0));return v>=60?`${Math.floor(v/60)} год ${v%60} хв`:`${v} хв`}
function table(head,rows,foot=''){return `<table><thead><tr>${head.map(x=>`<th>${esc(x)}</th>`).join('')}</tr></thead><tbody>${rows||`<tr><td colspan="${head.length}" class="empty">Немає даних</td></tr>`}</tbody>${foot}</table>`}
function matches(...xs){return xs.join(' ').toLocaleLowerCase().includes(query.toLocaleLowerCase())}
function mine(r){return r.status!=='closed'&&String(r.adminId)===String(state.profile.id)&&state.profile.id!==null}
function currentReport(){return state.reports.find(r=>String(r.id)===String(selectedReport))}
function drawNav(){ $('#nav').innerHTML=nav.map(([id,icon,label])=>`<button data-tab="${id}" class="${tab===id?'active':''}"><span class="icon">${icon}</span><span class="label">${label}</span>${id==='reports'?`<span class="badge">${state.reports.filter(r=>r.status!=='closed').length}</span>`:''}</button>`).join('');$('#title').textContent=nav.find(n=>n[0]===tab)[2] }
function render(){drawNav();$('#content').innerHTML=({stats:renderStats,reports:renderReports,commands:renderCommands,punishments:renderPunishments,items:renderItems,spawns:renderSpawns}[tab])();if(tab==='reports'){const m=$('.messages');if(m)m.scrollTop=m.scrollHeight} }
function search(){return `<input class="search" data-search value="${esc(query)}" placeholder="Пошук за назвою, ID або описом" aria-label="Пошук">`}
function renderStats(){const ds=state.stats.days||[],total=ds.reduce((a,d)=>({online:a.online+(Number(d.onlineMinutes)||0),closed:a.closed+(Number(d.closed)||0)}),{online:0,closed:0});return `<div class="row between"><div class="row"><h2 style="margin:0">${esc(state.profile.name||'Адміністратор')}</h2><span class="badge">${esc(state.profile.role)}</span></div><small>${esc(state.stats.period||'Поточний тиждень')}</small></div><div class="cards">${[['♧','Мої активні репорти',state.reports.filter(mine).length],['◷','Онлайн за тиждень',minutes(total.online)],['✓','Закрито репортів за тиждень',total.closed]].map(([i,t,v])=>`<div class="card"><span class="icon">${i}</span><div><small>${t}</small><div class="value">${v}</div></div></div>`).join('')}</div><div class="stats"><div class="box scroll"><h2>Активність за днями</h2>${table(['День','Онлайн','Закрито репортів'],ds.map(d=>`<tr><td>${esc(d.day)}</td><td>${minutes(d.onlineMinutes)}</td><td>${esc(d.closed)}</td></tr>`).join(''),`<tfoot><tr><td>Разом</td><td>${minutes(total.online)}</td><td>${total.closed}</td></tr></tfoot>`)}</div><div class="box scroll"><h2>Адміни онлайн <span class="badge">${state.admins.length}</span></h2>${table(['ID','Нікнейм'],state.admins.map(a=>`<tr><td>${esc(a.id)}</td><td>${esc(a.name)}</td></tr>`).join(''))}</div></div>`}
function filteredReports(){return state.reports.filter(r=>(reportFilter==='closed'?r.status==='closed':reportFilter==='free'?r.status!=='closed'&&r.adminId==null:mine(r))&&matches(r.id,r.playerName,r.playerId,r.subject))}
function renderReports(){const rows=filteredReports();if(!rows.some(r=>String(r.id)===String(selectedReport)))selectedReport=rows[0]?.id??null;const r=currentReport();return `<div class="tabs">${[['free','Вільні'],['mine','Мої'],['closed','Закриті']].map(([v,t])=>`<button data-filter="${v}" class="${reportFilter===v?'active':''}">${t} · ${state.reports.filter(r=>v==='closed'?r.status==='closed':v==='free'?r.status!=='closed'&&r.adminId==null:mine(r)).length}</button>`).join('')}</div><div class="report-layout ${mobileChatOpen?'mobile-chat':'mobile-list'}"><div class="tickets">${search()}${rows.map(t=>`<button class="ticket ${String(t.id)===String(selectedReport)?'active':''}" data-report="${esc(t.id)}"><div class="row between"><span>#${esc(t.id)}</span><small>${esc(t.waitLabel||'')}</small></div><strong>${esc(t.playerName)} [${esc(t.playerId)}]</strong><span>${esc(t.subject)}</span>${t.unread?'<small>● Нове повідомлення</small>':''}</button>`).join('')||'<div class="empty">Репортів немає</div>'}</div><div class="chat">${r?chat(r):'<div class="empty">Оберіть репорт</div>'}</div></div>`}
function chat(r){const owned=mine(r),closed=r.status==='closed';return `<div class="chat-head"><button class="back-to-list" data-back-reports="1">‹ Репорти</button><h2>#${esc(r.id)} · ${esc(r.subject)}</h2><div class="row between"><span>${esc(r.playerName)} [ID: ${esc(r.playerId)}]</span><small>${closed?'Закрито':r.adminId==null?'Вільний':'В роботі'}</small></div></div><div class="messages">${(r.messages||[]).map(m=>`<div class="message ${m.role==='admin'?'admin':''}"><small>${esc(m.name)} &nbsp; ${esc(m.time)}</small><div><div class="bubble">${esc(m.text)}</div></div></div>`).join('')}</div>${owned?`<div class="composer"><div class="quick">${state.quickReplies.map((q,i)=>`<button data-quick="${i}">${esc(q.label)}</button>`).join('')}</div><div class="send-row"><textarea id="draft" maxlength="1000" placeholder="Напишіть повідомлення…" aria-label="Повідомлення">${esc(drafts[r.id]||'')}</textarea><button data-action="send" aria-label="Надіслати">➤</button></div><div class="actions"><select id="transferTarget" aria-label="Адміністратор для передачі"><option value="">Передати адміну…</option>${state.admins.filter(a=>String(a.id)!==String(state.profile.id)).map(a=>`<option value="${esc(a.id)}">${esc(a.name)} [${esc(a.id)}]</option>`).join('')}</select><button data-action="transfer">Передати</button><button class="primary" data-action="resolve">✓ Гравцю допомогли</button></div></div>`:!closed&&r.adminId==null?'<div class="composer"><button class="primary" data-action="claim">Взяти репорт</button></div>':'<div class="composer muted">Перегляд історії листування</div>'}`}
function renderCommands(){const rows=state.commands.filter(c=>(category==='Усі'||c.category===category)&&matches(c.name,c.description));if(!rows.some(c=>c.name===selectedCommand))selectedCommand=rows[0]?.name;const c=rows.find(c=>c.name===selectedCommand);const cats=['Усі',...new Set(state.commands.map(c=>c.category))];return `${search()}<div class="tabs">${cats.map(c=>`<button data-category="${esc(c)}" class="${category===c?'active':''}">${esc(c)}</button>`).join('')}</div><div class="command-layout"><div class="box scroll">${table(['Команда','Опис','Мін. рівень'],rows.map(c=>`<tr class="command-row ${c.name===selectedCommand?'selected':''}" tabindex="0" role="button" data-command="${esc(c.name)}"><td><code>${esc(c.name)}</code></td><td>${esc(c.description)}</td><td>${esc(c.minLevel)}</td></tr>`).join(''))}</div><div class="box details scroll">${c?`<h2>${esc(c.name)}</h2><p>${esc(c.description)}</p><p>Мінімальний рівень адміністратора: ${esc(c.minLevel)}</p><h3>Синтаксис</h3><code>${esc(c.syntax)}</code><h3>Параметри</h3><p>${esc(c.parameters)}</p><h3>Приклад</h3><code>${esc(c.example)}</code><p><button data-copy="${esc(c.syntax)}">Копіювати команду</button></p>`:'<div class="empty">Команд не знайдено</div>'}</div></div>`}
function renderPunishments(){return `${search()}<div class="box scroll">${table(['Порушення','Покарання','Термін'],state.punishments.filter(p=>matches(p.violation,p.type,p.duration)).map(p=>`<tr><td>${esc(p.violation)}</td><td>${esc(p.type)}</td><td><strong>${esc(p.duration)}</strong></td></tr>`).join(''))}</div>`}
function renderItems(){const categories=[['weapons','Зброя'],['vehicles','Авто'],['skins','Скіни'],['organizations','Організації']];const label=categories.find(c=>c[0]===itemCategory)[1];return `${search()}<div class="tabs" aria-label="Категорії довідника">${categories.map(([k,t])=>`<button data-item-category="${k}" aria-pressed="${itemCategory===k}" class="${itemCategory===k?'active':''}">${t}</button>`).join('')}</div><div class="box scroll"><h2>${label}</h2>${table(['ID',itemCategory==='organizations'?'Назва організації':'Назва'],(state.items[itemCategory]||[]).filter(i=>matches(i.id,i.name)).map(i=>`<tr><td>${esc(i.id)}</td><td>${esc(i.name)}</td></tr>`).join(''))}</div>${demo?'<small class="note">Демонстраційні ID та назви — замінити даними сервера.</small>':''}`}

function renderSpawns(){return `${search()}<small>Натисніть на локацію, щоб телепортуватися</small><div class="spawns">${state.locations.filter(l=>matches(l.name)).map(l=>`<button class="spawn" data-spawn="${esc(l.id)}"><span class="icon">⌖</span>${esc(l.name)}</button>`).join('')||'<div class="empty">Локацій не знайдено</div>'}</div>`}
let transport=null,seq=0;const pending=new Map();
function request(action,payload={}){
 if(demo){demoAction({action,payload});return}
 const key=action+':'+(payload.reportId??payload.locationId??'');
 if([...pending.values()].some(p=>p.key===key)){toast('Очікуємо відповідь сервера');return}
 if(!transport){toast('Немає підключення до клієнта');return}
 const id='admin-'+Date.now()+'-'+(++seq),timer=setTimeout(()=>{pending.delete(id);toast('Немає підтвердження сервера. Перевірте стан перед повтором.')},15000);
 pending.set(id,{key,timer,action,payload});
 try{transport(JSON.stringify({version:1,id,action,payload}))}catch(e){clearTimeout(timer);pending.delete(id);toast('Не вдалося передати дію клієнту')}
}
function receive(msg){if(!msg||typeof msg!=='object')return false;
 if(msg.type==='snapshot')return setData(msg.data);
 if(msg.type==='result'){const p=pending.get(msg.id);if(!p)return false;clearTimeout(p.timer);pending.delete(msg.id);
 if(msg.ok&&p.action==='report.message'&&(drafts[p.payload.reportId]||'').trim()===p.payload.text){drafts[p.payload.reportId]='';if(String(selectedReport)===String(p.payload.reportId)&&$('#draft'))$('#draft').value=''}
 if(msg.ok&&p.action==='panel.close')window.AntaresAdmin.setVisible(false);
 toast(msg.message||(msg.ok?'Дію виконано':'Дію відхилено'));return true}return false}

function setData(d){if(!d||typeof d!=='object')return false;for(const k of ['admins','reports','locations'])if(Array.isArray(d[k]))state[k]=d[k];if(d.profile&&typeof d.profile==='object')state.profile=d.profile;if(d.stats&&Array.isArray(d.stats.days))state.stats=d.stats;render();return true}
async function copy(text){try{if(navigator.clipboard&&window.isSecureContext)await navigator.clipboard.writeText(text);else{const t=document.createElement('textarea');t.value=text;document.body.appendChild(t);t.select();const ok=document.execCommand('copy');t.remove();if(!ok)throw Error()}toast('Команду скопійовано')}catch(e){toast('Копіювання недоступне. Виділіть текст команди вручну.')}}
document.addEventListener('click',e=>{const b=e.target.closest('button,[data-command]');if(!b)return;if(b.dataset.tab){tab=b.dataset.tab;mobileChatOpen=false;query='';render()}else if(b.dataset.backReports){mobileChatOpen=false;render()}else if(b.dataset.itemCategory){if(['weapons','vehicles','skins','organizations'].includes(b.dataset.itemCategory)){itemCategory=b.dataset.itemCategory;query='';render()}}else if(b.dataset.filter){reportFilter=b.dataset.filter;mobileChatOpen=false;query='';selectedReport=null;render()}else if(b.dataset.report){selectedReport=b.dataset.report;mobileChatOpen=true;render()}else if(b.dataset.category){category=b.dataset.category;render()}else if(b.dataset.command){selectedCommand=b.dataset.command;render()}else if(b.dataset.copy)copy(b.dataset.copy);else if(b.dataset.quick!=null){const r=currentReport();if(r&&$('#draft')&&state.quickReplies[Number(b.dataset.quick)]&&typeof state.quickReplies[Number(b.dataset.quick)].text==='string'){$('#draft').value=state.quickReplies[Number(b.dataset.quick)].text;drafts[r.id]=$('#draft').value;$('#draft').focus()}}else if(b.dataset.spawn)request('teleport',{locationId:b.dataset.spawn});else if(b.dataset.action){const r=currentReport();if(!r)return;const payload={reportId:r.id};switch(b.dataset.action){case 'send':{const text=($('#draft')?.value||'').trim();if(!text)return;request('report.message',{...payload,text});break}case 'claim':request('report.claim',payload);break;case 'resolve':request('report.resolve',payload);break;case 'transfer':{const adminId=$('#transferTarget').value;if(!adminId){toast('Оберіть адміністратора');return}request('report.transfer',{...payload,adminId});break}}}});
document.addEventListener('input',e=>{if(e.target.matches('[data-search]')){const pos=e.target.selectionStart;query=e.target.value;render();const i=$('[data-search]');i.focus();i.setSelectionRange(pos,pos)}if(e.target.id==='draft'){const r=currentReport();if(r)drafts[r.id]=e.target.value}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();close()}if(demo&&e.key==='F2'){e.preventDefault();window.AntaresAdmin.setVisible(true)}if(e.target.id==='draft'&&e.key==='Enter'&&!e.shiftKey){e.preventDefault();$('[data-action="send"]').click()}if(e.target.matches('[data-command]')&&(e.key==='Enter'||e.key===' ')){e.preventDefault();e.target.click()}});
function close(){if(demo)window.AntaresAdmin.setVisible(false);else request('panel.close')}
$('#close').onclick=close;$('#adminZone').onclick=()=>request('teleport.adminZone');
window.AntaresAdmin={setData,receive,setTransport(fn){if(typeof fn!=='function')throw Error('Invalid transport');transport=fn},setVisible(v){$('#panel').hidden=!v;if(v)render();try{if(window.parent&&window.parent!==window)window.parent.postMessage({source:'antares-admin',type:'visible',visible:!!v},'*')}catch(_){}}};
function demoAction(m){const p=m.payload,r=state.reports.find(r=>String(r.id)===String(p.reportId));switch(m.action){case'report.claim':if(r&&r.adminId==null){r.adminId=state.profile.id;r.status='open';reportFilter='mine';selectedReport=r.id}break;case'report.message':if(r&&mine(r)){r.messages.push({role:'admin',name:state.profile.name,time:new Date().toLocaleTimeString('uk-UA',{hour:'2-digit',minute:'2-digit'}),text:p.text});drafts[r.id]=''}break;case'report.resolve':if(r&&mine(r)){r.status='closed';state.stats.days[5].closed++;reportFilter='closed';selectedReport=r.id}break;case'report.transfer':if(r&&mine(r)){r.adminId=p.adminId;selectedReport=null}break;case'teleport':toast('Демо: телепортація → '+(state.locations.find(l=>l.id===p.locationId)?.name||p.locationId));return;case'teleport.adminZone':toast('Демо: телепортація в адмін-зону');return}render();toast('Демо: дію виконано')}
if(demo){document.body.classList.add('demo');$('#demoBar').hidden=false;state={quickReplies:localContent.quickReplies||[],profile:{id:12,name:'Maria Antares',role:'Адміністратор'},stats:{period:'Поточний тиждень',days:['Понеділок','Вівторок','Середа','Четвер','П’ятниця','Субота','Неділя'].map((day,i)=>({day,onlineMinutes:[192,168,245,217,250,50,0][i],closed:[22,19,31,24,27,5,0][i]}))},admins:[{id:12,name:'Maria Antares'},{id:27,name:'Alex Cooper'},{id:48,name:'Kate Miller'},{id:63,name:'Max Carter'},{id:91,name:'Anna Brooks'},{id:115,name:'Daniel Smith'},{id:204,name:'Nick Wilson'}],reports:[{id:1042,playerName:'Alex Morgan',playerId:248,subject:'Застряг під картою',adminId:12,status:'open',unread:true,waitLabel:'2 хв',messages:[{role:'player',name:'Alex Morgan',time:'22:14',text:'Вітаю! Застряг під картою біля лікарні.'},{role:'admin',name:'Maria Antares',time:'22:15',text:'Вітаю! Зараз допоможу. Залишайтеся на місці.'},{role:'player',name:'Alex Morgan',time:'22:16',text:'Добре, дякую.'}]},{id:1039,playerName:'Max Cooper',playerId:115,subject:'Питання щодо роботи',adminId:12,status:'open',messages:[]},{id:1037,playerName:'Kate Miller',playerId:76,subject:'Не можу відкрити авто',adminId:12,status:'open',messages:[]},{id:1045,playerName:'Nick Wilson',playerId:204,subject:'Потрібна допомога',adminId:null,status:'open',messages:[{role:'player',name:'Nick Wilson',time:'22:20',text:'Як почати працювати?'}]},{id:1001,playerName:'Anna Brooks',playerId:91,subject:'Питання вирішено',adminId:12,status:'closed',messages:[]}],commands:[['/spec','Спостерігати за гравцем',2,'Гравці'],['/goto','Телепортуватися до гравця',2,'Телепортація'],['/gethere','Перемістити гравця до себе',3,'Телепортація'],['/freeze','Заморозити гравця',2,'Гравці'],['/unfreeze','Розморозити гравця',2,'Гравці'],['/veh','Створити транспорт',4,'Транспорт'],['/mute','Обмежити чат гравця',2,'Покарання'],['/kick','Відключити гравця',3,'Покарання']].map(([name,description,minLevel,category])=>({name,description,minLevel,category,syntax:name+' [параметри]',parameters:'Демонстраційна команда. Уточніть синтаксис сервера.',example:name+' …'})),punishments:[['Флуд у чаті','Мут','10 хв'],['Образа гравця','Мут','30 хв'],['DM — напад без RP-причини','Деморган','60 хв'],['Використання читів','Бан','30 діб']].map(([violation,type,duration])=>({violation,type,duration})),items:{weapons:[{id:22,name:'Colt 45'},{id:24,name:'Desert Eagle'},{id:30,name:'AK-47'},{id:31,name:'M4'}],vehicles:[{id:400,name:'Landstalker'},{id:411,name:'Infernus'},{id:560,name:'Sultan'}],organizations:[{id:1,name:'Мерія'},{id:2,name:'Поліція'},{id:3,name:'Лікарня'},{id:4,name:'Військова частина'},{id:5,name:'ЗМІ'},{id:6,name:'Албанська мафія'},{id:7,name:'Італійська мафія'},{id:8,name:'Японська мафія'}],skins:[{id:0,name:'CJ'},{id:1,name:'Truth'},{id:285,name:'SWAT'}]},locations:['Спавн гравців','Мерія','Лікарня','Поліція','Військова частина','ЗМІ','Албанська мафія','Італійська мафія','Японська мафія','Автосалон','Пляж','Лісопилка'].map((name,i)=>({id:'location_'+i,name}))};state.commands=localContent.commands||[];state.punishments=localContent.punishments||[];state.items=localContent.items||{weapons:[],vehicles:[],skins:[],organizations:[]};window.AntaresAdmin.setVisible(true)}
})();

(function() {
    function parse(data) {
        if (data == null || data === "")
            return null;

        if (typeof data === "object")
            return data;

        try {
            return JSON.parse(data);
        } catch (error) {
            try {
                return JSON.parse(decodeURIComponent(data));
            } catch (ignored) {
                return null;
            }
        }
    }

    function show(data) {
        var parsed = parse(data);

        if (parsed)
            AntaresAdmin.receive({ type: "snapshot", data: parsed });

        AntaresAdmin.setVisible(true);
        document.getElementById("admin-panel").setAttribute("aria-hidden", "false");
    }

    function hide() {
        AntaresAdmin.setVisible(false);
        document.getElementById("admin-panel").setAttribute("aria-hidden", "true");
    }

    AntaresAdmin.setTransport(function(json) {
        GameCef.send("admin:action", json);
    });

    GameCef.on("admin:show", function(data) {
        show(data);
    });

    GameCef.on("admin:hide", function() {
        hide();
    });

    GameCef.on("admin:snapshot", function(data) {
        var parsed = parse(data);

        if (parsed)
            AntaresAdmin.receive({ type: "snapshot", data: parsed });
    });

    GameCef.on("admin:result", function(data) {
        var parsed = parse(data);

        if (!parsed)
            return;

        AntaresAdmin.receive({
            type: "result",
            id: parsed.id,
            ok: parsed.ok,
            message: parsed.message
        });
    });
})();
