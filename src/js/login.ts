V.route.add({
    id: 'login',
    path: '/login',
    title: 'Login',
    component: '<div data-login></div>',
    unauthenticated: true
});

V.component('[data-login]', {

    /**
     * Return template data
     * @returns
     */
    template: async function () {
        return await Api.getTemplate('/templates/login.html');
    },

    /**
     * On mount
     */
    onMount: function () {

        var self = this;

        self.on('submit', 'form', function (e: Event) {
            e.preventDefault();
            self.makeLogin();
        });

    },

    /**
     * Try make login from input data
     */
    makeLogin: async function () {

        var self = this;
        var element = self.element;

        var email = V.$('input#email', element);
        var password = V.$('input#password', element);
        var locale = V.$('input#locale', element);

        V.store.local.set('email', email.value);
        V.store.local.set('password', password.value);
        V.store.local.set('locale', locale.value);

        Connector.showLoading();

        try {
            await Api.tryLogin();
            V.route.redirect('/home');
        } catch (error) {
            self.render({ message: error.message });
        }

        Connector.hideLoading();

    }

});