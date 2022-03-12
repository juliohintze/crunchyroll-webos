V.component('[data-dropdown]', {

    /**
     * On mount
     */
    onMount: function (): void {

        var self = this;
        var element = this.element;
        var input = V.$('input', element);
        var dropdownValue = V.$('.dropdown-value', element);

        self.on('click', '.dropdown-value', function () {
            element.classList.add('active');
            window.setActiveElement(V.$('li', element));
        });

        self.on('click', 'li', function () {
            element.classList.remove('active');
            dropdownValue.innerText = this.innerText;
            input.value = this.dataset.value;
            V.trigger(input, 'change', undefined);
        });

        V.on(document.body, 'click', function (e: Event) {
            if (!(e.target as HTMLElement).closest('[data-vid="' + element.dataset.vid + '"]')) {
                element.classList.remove('active');
            }
        }, undefined);

        V.on(window, 'keyup', function () {
            var active = window.getActiveElement();
            if (!active || !active.closest('[data-vid="' + element.dataset.vid + '"]')) {
                element.classList.remove('active');
            }
        }, undefined);

        var current = V.$('li[data-value="' + input.value + '"]', undefined);
        if (current) {
            dropdownValue.innerText = current.innerText;
        }

    }

});