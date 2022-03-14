# VARIABLES
export PROJECT_PATH=$(shell pwd)
export BINARIES=${PROJECT_PATH}/node_modules/.bin
export VERSION=1.5.4
export ID=com.crunchyroll.webos
export HOMEPAGE="https://github.com/mateussouzaweb/crunchyroll-webos"
export THUMBNAIL="https://raw.githubusercontent.com/mateussouzaweb/crunchyroll-webos/master/src/img/80px.png"

# DEV METHODS
build:
	compactor \
		--source src/ \
		--destination $(ID)/ \
		--progressive false \
		--exclude "lib/*.d.ts,lib/*.map" \
		--bundle "css/styles.scss:css/_*.scss:css/styles.css" \
		--bundle "js/components.ts:js/components/*.ts:js/components.js"

watch:
	compactor \
		--watch \
		--source src/ \
		--destination $(ID)/ \
		--progressive false \
		--hashed false \
		--exclude "lib/*.d.ts,lib/*.map" \
		--bundle "css/styles.scss:css/_*.scss:css/styles.css" \
		--bundle "js/components.ts:js/components/*.ts:js/components.js"

server:
	statiq --port 5000 --root $(PROJECT_PATH)/$(ID)/

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
	$(BINARIES)/ares-package --no-minify $(ID) --outdir $(PROJECT_PATH)/bin

manifest:
	$(BINARIES)/webosbrew-gen-manifest \
		-a src/appinfo.json -p bin/*.ipk \
		-o bin/webosbrew.manifest.json \
		-i $(THUMBNAIL) -l $(HOMEPAGE)

install:
	$(BINARIES)/ares-install $(PROJECT_PATH)/bin/$(ID)_$(VERSION)_all.ipk

launch:
	$(BINARIES)/ares-launch $(ID)

inspect:
	$(BINARIES)/ares-inspect --app $(ID)