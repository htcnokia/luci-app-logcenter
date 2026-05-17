'use strict';
'require view';
'require fs';
'require ui';
'require poll';

var LOG_LEVELS = {
	emerg:   { label: 'EMERG',   cls: 'level-emerg'   },
	alert:   { label: 'ALERT',   cls: 'level-alert'   },
	crit:    { label: 'CRIT',    cls: 'level-crit'    },
	err:     { label: 'ERR',     cls: 'level-err'     },
	warning: { label: 'WARN',    cls: 'level-warning' },
	notice:  { label: 'NOTICE',  cls: 'level-notice'  },
	info:    { label: 'INFO',    cls: 'level-info'    },
	debug:   { label: 'DEBUG',   cls: 'level-debug'   }
};

function detectLevel(line) {
	var lower = line.toLowerCase();
	for (var key in LOG_LEVELS) {
		if (lower.indexOf(key + ':') !== -1 || lower.indexOf('.' + key) !== -1)
			return key;
	}
	if (lower.indexOf('error') !== -1 || lower.indexOf('fail') !== -1)
		return 'err';
	if (lower.indexOf('warn') !== -1)
		return 'warning';
	return 'info';
}

function parseLogLine(line) {
	var m = line.match(/^(\w+\s+\d+\s+[\d:]+)\s+(\S+)\s+([^:]+):\s*(.*)$/);
	if (m) {
		return { time: m[1], host: m[2], proc: m[3], msg: m[4], raw: line };
	}
	return { time: '', host: '', proc: '', msg: line, raw: line };
}

function escapeHtml(str) {
	return String(str)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
}

function buildTimeline(lines, filterLevel, filterText) {
	var items = [];
	var filterLow = filterText ? filterText.toLowerCase() : '';

	for (var i = lines.length - 1; i >= 0; i--) {
		var line = lines[i].trim();
		if (!line) continue;

		var level = detectLevel(line);
		var parsed = parseLogLine(line);

		if (filterLevel && filterLevel !== 'all' && level !== filterLevel)
			continue;
		if (filterLow && line.toLowerCase().indexOf(filterLow) === -1)
			continue;

		var info = LOG_LEVELS[level] || LOG_LEVELS['info'];
		var procParts = parsed.proc ? parsed.proc.split('[') : [''];
		var procName = procParts[0];
		var procPid  = procParts[1] ? procParts[1].replace(']', '') : '';

		items.push(E('div', { 'class': 'timeline-item ' + info.cls }, [
			E('div', { 'class': 'timeline-dot' }),
			E('div', { 'class': 'timeline-content' }, [
				E('div', { 'class': 'timeline-header' }, [
					E('span', { 'class': 'log-level-badge' }, info.label),
					parsed.time ? E('span', { 'class': 'log-time' }, parsed.time) : '',
					procName   ? E('span', { 'class': 'log-proc' }, [
						escapeHtml(procName),
						procPid ? E('span', { 'class': 'log-pid' }, '[' + procPid + ']') : ''
					]) : ''
				]),
				E('div', { 'class': 'log-msg' }, escapeHtml(parsed.msg || line))
			])
		]));
	}

	if (items.length === 0) {
		items.push(E('div', { 'class': 'timeline-empty' }, _('No log entries found.')));
	}

	return items;
}

return view.extend({
	_filterLevel: 'all',
	_filterText: '',
	_autoScroll: false,
	_lines: [],

	load: function() {
		return fs.exec('/sbin/logread', []).then(function(res) {
			return (res.stdout || '').split('\n');
		}).catch(function() {
			return [];
		});
	},

	_refresh: function() {
		var self = this;
		return fs.exec('/sbin/logread', []).then(function(res) {
			self._lines = (res.stdout || '').split('\n');
			self._renderTimeline();
		}).catch(function() {});
	},

	_renderTimeline: function() {
		var container = document.getElementById('lc-timeline');
		if (!container) return;

		var items = buildTimeline(this._lines, this._filterLevel, this._filterText);
		while (container.firstChild) container.removeChild(container.firstChild);
		items.forEach(function(el) { container.appendChild(el); });

		var stat = document.getElementById('lc-stat');
		if (stat) stat.textContent = _('Total: %d lines').format(
			this._lines.filter(function(l) { return l.trim(); }).length
		);
	},

	render: function(lines) {
		var self = this;
		self._lines = lines;

		var filterBar = E('div', { 'class': 'lc-toolbar' }, [
			E('div', { 'class': 'lc-toolbar-left' }, [
				E('label', {}, _('Level:')),
				E('select', {
					'id': 'lc-level-select',
					'class': 'lc-select',
					'change': function(ev) {
						self._filterLevel = ev.target.value;
						self._renderTimeline();
					}
				}, [
					E('option', { value: 'all' }, _('All')),
					E('option', { value: 'emerg' },   'EMERG'),
					E('option', { value: 'alert' },   'ALERT'),
					E('option', { value: 'crit' },    'CRIT'),
					E('option', { value: 'err' },     'ERR'),
					E('option', { value: 'warning' }, 'WARN'),
					E('option', { value: 'notice' },  'NOTICE'),
					E('option', { value: 'info' },    'INFO'),
					E('option', { value: 'debug' },   'DEBUG')
				]),
				E('label', {}, _('Search:')),
				E('input', {
					'id': 'lc-search',
					'class': 'lc-input',
					'type': 'text',
					'placeholder': _('Filter logs...'),
					'input': function(ev) {
						self._filterText = ev.target.value;
						self._renderTimeline();
					}
				})
			]),
			E('div', { 'class': 'lc-toolbar-right' }, [
				E('span', { 'id': 'lc-stat', 'class': 'lc-stat' }),
				E('button', {
					'class': 'btn cbi-button',
					'click': function() { self._refresh(); }
				}, [ E('span', { 'class': 'lc-icon' }, '↺'), ' ', _('Refresh') ]),
				E('button', {
					'class': 'btn cbi-button',
					'click': function() {
						var text = self._lines.join('\n');
						var blob = new Blob([text], { type: 'text/plain' });
						var a = document.createElement('a');
						a.href = URL.createObjectURL(blob);
						a.download = 'syslog.txt';
						a.click();
					}
				}, [ E('span', { 'class': 'lc-icon' }, '⬇'), ' ', _('Download') ])
			])
		]);

		var timeline = E('div', { 'id': 'lc-timeline', 'class': 'lc-timeline' });

		var view = E('div', { 'class': 'lc-wrapper' }, [
			E('style', {}, [this._css()]),
			E('h2', { 'class': 'lc-title' }, [
				E('span', { 'class': 'lc-icon-title' }, '📋'),
				' ', _('Log Center')
			]),
			filterBar,
			timeline
		]);

		setTimeout(function() { self._renderTimeline(); }, 0);

		poll.add(function() { return self._refresh(); }, 10);

		return view;
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null,

	_css: function() {
		return [
			'.lc-wrapper { max-width: 100%; }',
			'.lc-title { font-size: 1.4em; margin-bottom: 12px; display: flex; align-items: center; gap: 6px; }',
			'.lc-toolbar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 14px; padding: 10px 14px; background: var(--background-color-low, #f8f9fa); border-radius: 8px; border: 1px solid var(--border-color-low, #dee2e6); }',
			'.lc-toolbar-left, .lc-toolbar-right { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }',
			'.lc-select, .lc-input { padding: 4px 8px; border-radius: 5px; border: 1px solid var(--border-color-low, #ccc); font-size: 0.9em; background: var(--background-color-high, #fff); color: var(--text-color, inherit); }',
			'.lc-input { min-width: 180px; }',
			'.lc-stat { font-size: 0.82em; color: var(--text-color-low, #888); }',
			'.lc-timeline { position: relative; padding-left: 24px; }',
			'.lc-timeline::before { content: ""; position: absolute; left: 9px; top: 0; bottom: 0; width: 2px; background: var(--border-color-low, #dee2e6); }',
			'.timeline-item { position: relative; margin-bottom: 6px; display: flex; align-items: flex-start; gap: 10px; }',
			'.timeline-dot { position: absolute; left: -20px; top: 8px; width: 10px; height: 10px; border-radius: 50%; background: #6c757d; flex-shrink: 0; z-index: 1; }',
			'.timeline-content { flex: 1; min-width: 0; padding: 7px 12px; border-radius: 7px; background: var(--background-color-low, #f8f9fa); border: 1px solid var(--border-color-low, #e9ecef); transition: box-shadow 0.15s; }',
			'.timeline-content:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.08); }',
			'.timeline-header { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-bottom: 3px; }',
			'.log-level-badge { font-size: 0.72em; font-weight: 700; padding: 1px 6px; border-radius: 4px; letter-spacing: 0.04em; color: #fff; }',
			'.log-time { font-size: 0.78em; color: var(--text-color-low, #888); font-family: monospace; }',
			'.log-proc { font-size: 0.82em; font-weight: 600; color: var(--text-color, inherit); }',
			'.log-pid { font-size: 0.75em; color: var(--text-color-low, #aaa); }',
			'.log-msg { font-family: monospace; font-size: 0.85em; word-break: break-word; overflow-wrap: anywhere; color: var(--text-color, inherit); }',
			'.timeline-empty { padding: 32px; text-align: center; color: var(--text-color-low, #888); font-style: italic; }',
			'.level-emerg   .timeline-dot, .level-alert  .timeline-dot { background: #7b0000; }',
			'.level-crit    .timeline-dot, .level-err    .timeline-dot { background: #dc3545; }',
			'.level-warning .timeline-dot                               { background: #fd7e14; }',
			'.level-notice  .timeline-dot                               { background: #0d6efd; }',
			'.level-info    .timeline-dot                               { background: #198754; }',
			'.level-debug   .timeline-dot                               { background: #adb5bd; }',
			'.level-emerg   .timeline-content, .level-alert  .timeline-content { border-left: 3px solid #7b0000; background: #fff5f5; }',
			'.level-crit    .timeline-content, .level-err    .timeline-content { border-left: 3px solid #dc3545; background: #fff5f5; }',
			'.level-warning .timeline-content                                   { border-left: 3px solid #fd7e14; background: #fff8f0; }',
			'.level-notice  .timeline-content                                   { border-left: 3px solid #0d6efd; background: #f0f4ff; }',
			'.level-info    .timeline-content                                   { border-left: 3px solid #198754; }',
			'.level-debug   .timeline-content                                   { border-left: 3px solid #adb5bd; opacity: 0.75; }',
			'.level-emerg   .log-level-badge, .level-alert  .log-level-badge { background: #7b0000; }',
			'.level-crit    .log-level-badge, .level-err    .log-level-badge { background: #dc3545; }',
			'.level-warning .log-level-badge                                  { background: #fd7e14; }',
			'.level-notice  .log-level-badge                                  { background: #0d6efd; }',
			'.level-info    .log-level-badge                                  { background: #198754; }',
			'.level-debug   .log-level-badge                                  { background: #adb5bd; }',
			'.lc-icon { display: inline-block; }',
			'.lc-icon-title { font-size: 0.9em; }'
		].join('\n');
	}
});
