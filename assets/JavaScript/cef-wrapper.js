window.GameCef={
    events:{},
    boundEvents:{},
    pending:[],
    bridge:null,
    sync(){
        const bridge=window.cef;
        if(!bridge)return false;

        if(this.bridge!==bridge){
            this.bridge=bridge;
            this.boundEvents={};
        }

        const canSend=typeof bridge.emit==="function"||typeof bridge.sendEvent==="function";
        const canReceive=typeof bridge.on==="function";

        if(canReceive){
            for(const eventName in this.events){
                const callback=this.events[eventName];
                const boundCallback=this.boundEvents[eventName];

                if(boundCallback===callback)
                    continue;

                if(boundCallback&&typeof bridge.off==="function")
                    bridge.off(eventName,boundCallback);

                bridge.on(eventName,callback);
                this.boundEvents[eventName]=callback;
            }
        }

        if(canSend&&this.pending.length>0){
            const pending=this.pending.splice(0);

            for(const event of pending)
                this.send(event.eventName,event.data);
        }

        return canSend&&canReceive;
    },
    send(eventName,data=""){
        const bridge=window.cef;

        if(!bridge){
            this.pending.push({eventName,data});
            return false;
        }

        if(typeof bridge.emit==="function"){
            bridge.emit(eventName,data);
            return true;
        }

        if(typeof bridge.sendEvent==="function"){
            bridge.sendEvent(eventName,data);
            return true;
        }

        this.pending.push({eventName,data});
        return false;
    },
    sendJson(eventName,data){
        return this.send(eventName,JSON.stringify(data));
    },
    on(eventName,callback){
        const oldCallback=this.events[eventName];

        if(oldCallback&&oldCallback!==callback&&this.bridge&&typeof this.bridge.off==="function"&&this.boundEvents[eventName]===oldCallback)
            this.bridge.off(eventName,oldCallback);

        this.events[eventName]=callback;
        delete this.boundEvents[eventName];
        return this.sync();
    },
    off(eventName){
        const callback=this.events[eventName];
        if(!callback)return;

        if(this.bridge&&typeof this.bridge.off==="function"&&this.boundEvents[eventName]===callback)
            this.bridge.off(eventName,callback);

        delete this.events[eventName];
        delete this.boundEvents[eventName];
    },
    receive(eventName,data=""){
        const callback=this.events[eventName];
        if(!callback)return;
        callback(data);
    }
};

const cefSyncTimer=setInterval(()=>{
    if(GameCef.sync())
        clearInterval(cefSyncTimer);
},25);

window.addEventListener("DOMContentLoaded",()=>{
    GameCef.sync();
    GameCef.send("browser:ready");
});

window.addEventListener("load",()=>{
    GameCef.sync();
    requestAnimationFrame(()=>{
        GameCef.sync();
        GameCef.send("browser:ui-ready");
    });
});


GameCef.on("cef:test", data => {
    const json = JSON.parse(data);
    const now = Date.now();
    const delay = now - json.Timestamp;

    console.log(`[CEF TEST] RECEIVE | Delay: ${delay} ms`);
});