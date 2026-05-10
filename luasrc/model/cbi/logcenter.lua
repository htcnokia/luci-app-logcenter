local m = Map("logcenter", "LogCenter Timeline", "View PPPoE, DHCP, SSH, Firewall logs in timeline")
local s = m:section(TypedSection, "logcenter", "Logs")
s.template = "cbi/map"
s.anonymous = true
return m
