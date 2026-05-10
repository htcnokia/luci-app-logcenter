m = Map("logcenter", "LogCenter Timeline")
s = m:section(TypedSection, "section", "测试Section")
o = s:option(DummyValue, "dummy", "日志内容")
o.rawhtml = true
o.template = "cbi/dummy"
o.cfgvalue = function(self, section)
    return "<div>这里显示日志内容</div>"
end
return m
