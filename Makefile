# VARIABLES
export PROJECT_PATH=$(shell pwd)
export BINARIES=${PROJECT_PATH}/node_modules/.bin

export VERSION=1.8.0
export ID=com.crunchyroll.webos
export HOMEPAGE="https://github.com/mateussouzaweb/crunchyroll-webos"
export THUMBNAIL="https://raw.githubusercontent.com/mateussouzaweb/crunchyroll-webos/master/src/images/80px.png"

# DEV METHODS
build:
	compactor \
		--source $(PROJECT_PATH)/src/ \
		--destination $(PROJECT_PATH)/dist/ \
		--progressive false \
		--hashed false

watch:
	compactor --watch \
		--source $(PROJECT_PATH)/src/ \
		--destination $(PROJECT_PATH)/dist/ \
		--progressive false \
		--hashed false

bundle:
	rollup \
		--input $(PROJECT_PATH)/dist/scripts/main.js \
		--file $(PROJECT_PATH)/dist/scripts/main.js \
		--context window \
		--format iife \
		--inlineDynamicImports \
		--sourcemap \
		--compact \
	&& sed -i 's/type="module"/defer="defer"/g' dist/index.html

server:
	statiq --port 5000 --root $(PROJECT_PATH)/dist/

develop:
	make -j 2 watch server

# TV METHODS
devices:
	$(BINARIES)/ares-setup-device -list

setup:
	$(BINARIES)/ares-setup-device

check:
	$(BINARIES)/ares-install --list

# APP METHODS
package:
	cp -r $(PROJECT_PATH)/dist/ $(PROJECT_PATH)/$(ID)/ \
	&& $(BINARIES)/ares-package \
		$(PROJECT_PATH)/$(ID) \
		--no-minify \
		--outdir $(PROJECT_PATH)/bin \
	&& rm -r $(PROJECT_PATH)/$(ID)

manifest:
	$(BINARIES)/webosbrew-gen-manifest \
		-a $(PROJECT_PATH)/src/appinfo.json \
		-p $(PROJECT_PATH)/bin/$(ID)_$(VERSION)_all.ipk \
		-o $(PROJECT_PATH)/bin/webosbrew.manifest.json \
		-i $(THUMBNAIL) -l $(HOMEPAGE)

install:
	$(BINARIES)/ares-install $(PROJECT_PATH)/bin/$(ID)_$(VERSION)_all.ipk

launch:
	$(BINARIES)/ares-launch $(ID)

inspect:
	$(BINARIES)/ares-inspect --app $(ID) --host-port 9222
