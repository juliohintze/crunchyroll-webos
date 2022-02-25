V.component('[data-dropdown]', {

    /**
     * On mount
     * @return {void}
     */
    onMount: function(){

        var self = this;
        var element = this.element;
        var input = V.$('input', element);
        var dropdownValue = V.$('.dropdown-value', element);

        self.on('click', '.dropdown-value', function(){
            element.classList.add('active');
            window.setActiveElement( V.$('li', element) );
        });

        self.on('click', 'li', function(){
            element.classList.remove('active');
            dropdownValue.innerText = this.innerText;
            input.value = this.dataset.value;
            V.trigger(input, 'change');
        });

        V.on(document.body, 'click', function(event){
            if( !event.target.closest('[data-vid="' + element.dataset.vid + '"]') ){
                element.classList.remove('active');
            }
        });

        var current = V.$('li[data-value="' + input.value + '"]');
        if( current ){
            dropdownValue.innerText = current.innerText;
        }

    }

});