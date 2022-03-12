V.route.add({
    id: 'logout',
    path: '/logout',
    title: 'Logout',
    component: '<div data-logout></div>',
    authenticated: true
});

V.component('[data-logout]', {

    /**
     * On mount
     */
    onMount: async function () {

        window.showLoading();

        var sessionId = V.store.local.get('sessionId', null);
        var locale = V.store.local.get('locale', null);

        if (sessionId) {
            try {
                await Api.request('POST', '/logout', {
                    session_id: sessionId,
                    locale: locale
                });
            } catch (error) {
                console.log(error.message);
            }
        }

        V.store.local.remove('accessToken');
        V.store.local.remove('deviceType');
        V.store.local.remove('deviceId');
        V.store.local.remove('sessionId');
        V.store.local.remove('locale');
        V.store.local.remove('email');
        V.store.local.remove('password');
        V.store.local.remove('userId');
        V.store.local.remove('userName');
        V.store.local.remove('auth');
        V.store.local.remove('expires');

        await V.fire('authChanged', {});

        setTimeout(function () {
            window.hideLoading();
            V.route.redirect('/login');
        }, 1000);

    }

});