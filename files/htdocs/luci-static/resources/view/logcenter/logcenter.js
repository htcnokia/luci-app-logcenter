'use strict';
'require view';
'require ubus';

async function fetchLogs() {
    try {
        let logs = await ubus.call("system", "log", {});
        let raw = logs?.messages || [];
        return raw.filter(l => /pppd|netifd|dnsmasq|dropbear|firewall|odhcpd/.test(l.msg))
                  .map(l => `[${l.time}] ${l.msg}`);
    } catch(e) {
        return ['Failed to read logs: ' + e];
    }
}

function parseLine(line) {
    let event = { raw: line, type: 'OTHER', color: '#999' };
    if (line.includes('link is down')) { event.type = 'WAN DOWN'; event.color='#e74c3c'; }
    else if (line.includes('link is up')) { event.type='WAN UP'; event.color='#2ecc71'; }
    else if (line.includes('pppd')) { event.type='PPPOE'; event.color='#3498db'; }
    else if (line.includes('dropbear')) { event.type='SSH'; event.color='#9b59b6'; }
    else if (line.includes('dnsmasq') || line.includes('odhcpd')) { event.type='DHCP'; event.color='#f39c12'; }
    else if (line.includes('firewall')) { event.type='FIREWALL'; event.color='#16a085'; }
    return event;
}

function renderBadge(type,color){
    return E('span',{
        style:`display:inline-block;padding:2px 10px;border-radius:12px;background:${color};color:white;font-size:11px;font-weight:bold;margin-right:8px;min-width:90px;text-align:center;`
    }, type);
}

return view.extend({
    title: _('LogCenter Timeline'),
    load: async function(){ return await fetchLogs(); },
    render: function(logs){
        let lines = logs||[];
        lines.reverse();
        let timeline = lines.map(line=>{
            let parsed=parseLine(line);
            return E('div',{
                style:`padding:10px;border-bottom:1px solid #eee;font-family:monospace;line-height:1.5;word-break:break-all;`
            }, [renderBadge(parsed.type, parsed.color), E('span',{},line)]);
        });
        return E('div',{class:'cbi-map'}, [
            E('h2',{style:'margin-bottom:20px;'}, _('LogCenter Timeline')),
            E('div',{style:'background:white;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);'}, timeline)
        ]);
    }
});
