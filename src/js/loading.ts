V.component('[data-loading]', {

    /**
     * On mount
     */
    onMount: function () {

        var self = this;

        // Private
        self.on('show', function (e: Event) {
            e.preventDefault();
            self.showLoading();
        });

        self.on('hide', function (e: Event) {
            e.preventDefault();
            self.hideLoading();
        });

        // Public
        Connector.showLoading = function () {
            return self.showLoading();
        };
        Connector.hideLoading = function () {
            return self.hideLoading();
        };

    },

    /**
     * Show loading box
     */
    showLoading: function () {
        var element = this.element;
        element.classList.add('active');
    },

    /**
     * Hide loading box
     */
    hideLoading: function () {
        var element = this.element;
        element.classList.remove('active');
    }

});