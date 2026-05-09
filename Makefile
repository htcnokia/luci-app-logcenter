include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-logcenter
PKG_VERSION:=0.1.0
PKG_RELEASE:=1

PKG_LICENSE:=MIT
PKG_MAINTAINER:=htc

LUCI_TITLE:=LuCI LogCenter
LUCI_DEPENDS:=+luci-base +rpcd +logd
LUCI_PKGARCH:=all

include ../../luci.mk

# call BuildPackage - OpenWrt buildroot signature
