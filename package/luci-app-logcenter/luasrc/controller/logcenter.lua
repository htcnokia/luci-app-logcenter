module("luci.controller.logcenter", package.seeall)

function index()
    entry({"admin", "services", "logcenter"}, cbi("logcenter"), "LogCenter Timeline", 30).dependent = true
end
