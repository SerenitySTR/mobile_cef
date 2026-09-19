(function() {
    'use strict';

    var frame = document.getElementById('admin-cef-frame');

    if (!frame || !window.GameCef)
        return;

    var frameReady = false;
    var pending = [];

    function parse(value) {
        if (typeof value === 'string') {
            try {
                return JSON.parse(value);
            }
            catch (_) {
                return null;
            }
        }

        return value && typeof value === 'object' ? value : null;
    }

    function sendToFrame(type, data) {
        var message = {
            source: 'antares-admin-host',
            type: type,
            data: data
        };

        if (!frameReady || !frame.contentWindow) {
            pending.push(message);
            return;
        }

        frame.contentWindow.postMessage(message, '*');
    }

    function flush() {
        if (!frameReady || !frame.contentWindow)
            return;

        while (pending.length > 0)
            frame.contentWindow.postMessage(pending.shift(), '*');
    }

    function show(data) {
        frame.hidden = false;
        sendToFrame('show', parse(data));
    }

    function hide() {
        sendToFrame('hide');
        frame.hidden = true;
    }

    window.addEventListener('message', function(event) {
        if (event.source !== frame.contentWindow)
            return;

        var data = event.data;

        if (!data || data.source !== 'antares-admin')
            return;

        if (data.type === 'ready') {
            frameReady = true;
            flush();

            GameCef.sendJson('admin:ready', {
                version: 1,
                page: 'antares-admin',
                layout: data.layout || 'pc',
                build: '1.0'
            });

            return;
        }

        if (data.type === 'action' && typeof data.data === 'string') {
            GameCef.send('admin:action', data.data);
            return;
        }

        if (data.type === 'visible' && data.visible === false)
            frame.hidden = true;
    });

    frame.addEventListener('load', function() {
        frameReady = true;
        flush();
    });

    GameCef.on('admin:show', function(data) {
        show(data);
    });

    GameCef.on('admin:hide', function() {
        hide();
    });

    GameCef.on('admin:snapshot', function(data) {
        sendToFrame('snapshot', parse(data));
    });

    GameCef.on('admin:result', function(data) {
        sendToFrame('result', parse(data));
    });
})();
