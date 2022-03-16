# Crunchyroll - WebOS TV App

*Crunchyroll&trade; is a registered trademark of the Sony Pictures Entertainment Inc. This project is not affiliated with Crunchyroll, Team Crunchyroll, or the Sony Pictures Entertainment Inc.*

## About

Unofficial WebOS TV app for Crunchyroll.\
The last Crunchyroll app you will ever need!

## Download

You can download and install this app in your WebOS TV following one of the guides below:

- Using [HomeBrew](https://www.webosbrew.org) TV app (recommended).
- Using [dev-manager-desktop](https://github.com/webosbrew/dev-manager-desktop) from computer.
- Downloading IPK from [latest release](https://github.com/mateussouzaweb/crunchyroll-webos/releases/latest) page and install using [WebOS SDK](<https://webostv.developer.lge.com/sdk/installation/>).

## For Developers

This method will install Crunchyroll as TV app, but is recommended only for developers:

- Install [Compactor](<https://github.com/mateussouzaweb/compactor/>) and [Statiq](<https://github.com/mateussouzaweb/statiq/>).
- Enable TV for [testing with developer mode](<https://webostv.developer.lge.com/develop/app-test/>).
- Clone this repository, then run the following code to install the app:

```bash
# Install packages
npm install

# Build from SRC
npm run build
npm run app-package

# Install app for TV
npm run app-install

# Launch or inspect
npm run app-launch
npm run app-inspect
```

Developer Mode is enabled only for 50 hours, so you will need to renew developer session every 50 hours to keep using Crunchyroll as app... If you want to develop changes on the project, use the ``develop`` command to open a static web server and watch changes / build while you develop:

```bash
# This command creates a static web server available on your desktop
# You can test it direct from the browser
npm run develop
```

## Know Bugs

- Next and previous episode sometimes are buggy and don't work as expected giving a wrong episode.
