# SPDX-License-Identifier: GPL-2.0-only
include $(TOPDIR)/rules.mk

LUCI_TITLE:=LogCenter Timeline
LUCI_PKGARCH:=all
VERSION:=0.1.0
include $(INCLUDE_DIR)/package.mk

define Package/luci-app-logcenter
  SECTION:=luci
  CATEGORY:=LuCI
  SUBMENU:=3. Applications
  TITLE:=LogCenter Timeline
  DEPENDS:=+luci-base
endef

define Package/luci-app-logcenter/install
	$(INSTALL_DIR) $(1)/www/luci-static/resources/view/logcenter
	$(INSTALL_DATA) ./package/luci-app-logcenter/files/htdocs/luci-static/resources/view/logcenter/logcenter.js $(1)/www/luci-static/resources/view/logcenter/

	$(INSTALL_DIR) $(1)/etc/rpcd/acl.d
	$(INSTALL_DATA) ./package/luci-app-logcenter/files/etc/rpcd/acl.d/luci-app-logcenter.json $(1)/etc/rpcd/acl.d/

	$(INSTALL_DIR) $(1)/usr/lib/lua/luci/controller
	$(INSTALL_DATA) ./package/luci-app-logcenter/luasrc/controller/logcenter.lua $(1)/usr/lib/lua/luci/controller/

	$(INSTALL_DIR) $(1)/usr/lib/lua/luci/model/cbi
	$(INSTALL_DATA) ./package/luci-app-logcenter/luasrc/model/cbi/logcenter.lua $(1)/usr/lib/lua/luci/model/cbi/
endef

$(eval $(call BuildPackage,luci-app-logcenter))
