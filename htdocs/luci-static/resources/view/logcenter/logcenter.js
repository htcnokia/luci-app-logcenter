'use strict';
'require view';
'require rpc';
'require ui';

var callLog = rpc.declare({
    object: 'logcenter',
    method: 'read',
    expect: { '': {} }
});

function parseLine(line) {
    let event = {
        raw: line,
        type: 'other',
        level: 'info'
    };

    if (line.includes('link is down')) {
        event.type = 'wan_down';
        event.level = 'error';
    }
    else if (line.includes('link is up')) {
        event.type = 'wan_up';
        event.level = 'success';
    }
    else if (line.includes('pppd')) {
        event.type = 'pppoe';
    }
    else if (line.includes('dropbear')) {
        event.type = 'ssh';
    }
    else if (line.includes('dnsmasq')) {
        event.type = 'dhcp';
    }
    else if (line.includes('firewall')) {
        event.type = 'firewall';
    }

    return event;
}

function renderBadge(type) {
    let color = '#999';

    switch(type) {
        case 'wan_down':
            color = '#e74c3c';
            break;
        case 'wan_up':
            color = '#2ecc71';
            break;
        case 'pppoe':
            color = '#3498db';
            break;
        case 'ssh':
            color = '#9b59b6';
            break;
        case 'dhcp':
            color = '#f39c12';
            break;
    }

    return E('span', {
        style: 'display:inline-block;padding:2px 8px;border-radius:12px;background:' + color + ';color:white;font-size:12px;margin-right:8px;'
    }, type.toUpperCase());
}

return view.extend({
    load: function() {
        return callLog();
    },

    render: function(logs) {
        let lines = String(logs || '').split('\n').filter(Boolean);

        let timeline = lines.reverse().map(function(line) {
            let parsed = parseLine(line);

            return E('div', {
                style: 'padding:10px;border-bottom:1px solid #eee;font-family:monospace;'
            }, [
                renderBadge(parsed.type),
                E('span', {}, line)
            ]);
        });

        return E('div', { class: 'cbi-map' }, [
            E('h2', {}, 'LogCenter Timeline'),
            E('div', {
                style: 'background:white;border-radius:8px;padding:10px;'
            }, timeline)
        ]);
    }
});
