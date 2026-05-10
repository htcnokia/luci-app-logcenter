module("luci.controller.logcenter", package.seeall)

function index()
    entry({"admin", "services", "logcenter"}, cbi("logcenter"), _("LogCenter Timeline"), 30).dependent=false
end
