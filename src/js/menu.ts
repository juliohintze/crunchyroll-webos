V.component('[data-menu]', {

    /**
     * Return template
     * @returns
     */
    template: async function () {
        return await Api.getTemplate('/templates/menu.html');
    },

    /**
     * On mount
     */
    onMount: function () {

        var self = this;

        V.route.afterChange(function () {
            self.setActive();
        });

        self.watch('authChanged', async function () {
            await self.render();
            await self.setActive();
        });

    },

    /**
     * After render
     */
    afterRender: function () {
        this.setActive();
    },

    /**
     * Set active menu item
     */
    setActive: function () {

        var self = this;
        var path = V.route.active() as any;
        var id = path.id;

        var next = V.$('a[href="' + id + '"]', self.element);
        var current = V.$('a.active', self.element);

        if (current) {
            current.classList.remove('active');
        }
        if (next) {
            next.classList.add('active');
        }

    }

});