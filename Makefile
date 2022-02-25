# App scripts
# http://webostv.developer.lge.com/sdk/tools/using-webos-tv-cli

# VARIABLES
export ID=com.crunchyroll.webos
export VERSION=1.5.4
export PROJECT_PATH=$(shell pwd)

# TV METHODS
device_list:
	ares-setup-device -list

device_setup:
	ares-setup-device

device_check:
	ares-install --list

# APP METHODS
app_build:
	ares-package --no-minify $(ID) --outdir $(PROJECT_PATH)/bin

app_install:
	ares-install $(PROJECT_PATH)/bin/$(ID)_$(VERSION)_all.ipk

app_launch:
	ares-launch $(ID)

app_inspect:
	ares-inspect --app $(ID)

# DEV METHODS
build:
	compactor \
		--source src/ \
		--destination $(ID)/ \
		--progressive false \
		--bundle "css/styles.scss:css/_*.scss:css/styles.css" \
		--bundle "js/components/*.js:js/components.js"

watch:
	compactor \
		--watch \
		--source src/ \
		--destination $(ID)/ \
		--progressive false \
		--hashed false \
		--bundle "css/styles.scss:css/_*.scss:css/styles.css" \
		--bundle "js/components/*.js:js/components.js"

server:
	statiq --port 5000 --root $(PROJECT_PATH)/$(ID)/

develop:
	make -j 2 watch server
