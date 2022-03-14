V.on(window, 'load', function () {

    // Template helpers
    V.helper('store', function (key: string, _default: any) {
        return V.store.local.get(key, _default);
    });

    // Route definitions
    var base = window.location.pathname.replace('index.html', '');

    if (window.location.protocol == 'file:') {
        base = 'file://' + base;
    }

    V.route.options.mode = 'hash';
    V.route.options.base = base;
    V.route.attachEvents();

    // Component mounts
    V.mount(document.body);

}, undefined);