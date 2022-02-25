# Crunchyroll - WebOS TV App

*Crunchyroll&trade; is a registered trademark of the Sony Pictures Entertainment Inc. This project is not affiliated with Crunchyroll, Team Crunchyroll, or the Sony Pictures Entertainment Inc.*

## About

Unofficial WebOS TV App for Crunchyroll.\
The last Crunchyroll app you will ever need!

## Download

You can download and install this app in your WebOS TV following one of the guides below:

- [Easy installation with dev-manager-desktop](https://github.com/webosbrew/dev-manager-desktop) (recommended).
- Download IPK from [latest release](https://github.com/mateussouzaweb/crunchyroll-webos/releases/latest) page and install with the [WebOS SDK](<https://webostv.developer.lge.com/sdk/installation/>).

## For Developers

This method will install Crunchyroll as TV App, but is recommended only for developers:

- Install Compactor (<https://github.com/mateussouzaweb/compactor/>)
- Install Statiq (<https://github.com/mateussouzaweb/statiq/>)
- Install WebOS SDK (<https://webostv.developer.lge.com/sdk/installation/>)
- Enable TV for Testing (<https://webostv.developer.lge.com/develop/app-test/>)
- Clone this repository, then run the following code to install the App:

```bash
# Build from SRC
make build

# Create App for TV
make app_build
make app_install

# Launch or inspect
make app_launch
make app_inspect
```

Developer Mode is enabled only for 50 hours, so you will need to renew developer session every 50 hours to keep using Crunchyroll as app... :(

If you want to develop changes on the project, use the ``develop`` command to open a static web server and watch changes / build while you develop:

```bash
# This command creates a static web server available on your desktop
# You can test it direct from the browser
make develop
```

## Know Bugs

- Next and previous episode sometimes are buggy and don't work as expected giving a wrong episode.
