V.route.add({
    id: 'series',
    path: '/series',
    title: 'Series',
    component: '<div data-series></div>',
    authenticated: true
});
V.route.add({
    id: 'series',
    path: '/series/:filter',
    title: 'Series',
    component: '<div data-series></div>',
    authenticated: true
});
V.route.add({
    id: 'series',
    path: '/series/:filter/:pageNumber',
    title: 'Series',
    component: '<div data-series></div>',
    authenticated: true
});

V.component('[data-series]', {

    /**
     * Return template data
     * @return {string}
     */
    template: function(){
        return V.$('#template-series').innerHTML;
    },

     /**
     * On mount
     * @return {void}
     */
    onMount: async function(){

        var self = this;

        self.on('change', 'input#filter' , function(){
            V.route.redirect('/series/' + this.value);
        });

        self.on('change', 'input#search' , function(){
            V.route.redirect('/series?search=' + encodeURI(this.value));
        });

        self.watch('currentViewReload', function(){
            self.parseParams();
            self.listSeries();
        });

        self.parseParams();
        self.retrieveFilters();
        self.listSeries();

    },

    /**
     * Parse route params to the component
     * @return {void}
     */
    parseParams: function(){

        var self = this;
        var active = V.route.active();
        var pageNumber = Number( active.param('pageNumber') || 1 );
        var filter = String( active.param('filter') || 'popular' );
        var search = String( active.query('search') || '' );

        self.set({
            pageNumber: pageNumber,
            filter: filter,
            search: search
        });

    },

    /**
     * Retrieve series filter options
     * @return {void}
     */
    retrieveFilters: async function(){

        var self = this;
        var filters = [];
        var categories = V.store.local.get('categories', []);

        // Default filters
        filters.push({id: '', name: '--- FILTERS'});
        filters.push({id: 'alpha', name: 'Alphabetical'});
        filters.push({id: 'featured', name: 'Featured'});
        filters.push({id: 'newest', name: 'Newest'});
        filters.push({id: 'popular', name: 'Popular'});
        filters.push({id: 'updated', name: 'Updated'});
        filters.push({id: 'simulcast', name: 'Simulcasts'});

        // Retrieve category filters
        if( !categories.length ){

            try {

                var response = await Api.request('POST', '/categories', {
                    media_type: 'anime'
                });

                if( response.error
                    && response.code == 'bad_session' ){
                    return Api.tryLogin().then(function(){
                        self.retrieveFilters();
                    });
                }

                categories.push({id: '-', name: '--- GENRES'});
                response.data.genre.map(function(item){
                    categories.push({id: item.tag, name: item.label});
                });

                // categories.push({id: '-', name: '--- SEASONS'});
                // response.data.season.map(function(item){
                //     categories.push({id: item.tag, name: item.label});
                // });

                await V.store.local.set('categories', categories);

            } catch (error) {
                console.log(error);
            }

        }

        if( categories && categories.length ){
            categories.map(function(item){
                filters.push({id: 'tag:' + item.id, name: item.name});
            });
        }

        self.set({
            filters: filters
        });

    },

    /**
     * List series
     * @return {Promise}
     */
    listSeries: async function(){

        var self = this;
        var pageNumber = Number( self.get('pageNumber') );
        var filter = String( self.get('filter') );
        var search = String( self.get('search') );
        var limit = 20;

        if( search ){
            filter = 'prefix:' + search;
        }

        // Fields option
        var fields = [
            'series.series_id',
            'series.name',
            'series.in_queue',
            'series.description',
            'series.portrait_image',
            'series.landscape_image',
            'series.media_count',
            'series.publisher_name',
            'series.year',
            'series.rating',
            'series.url',
            'series.media_type',
            'series.genres',
            'series.etp_guid',
            'image.wide_url',
            'image.fwide_url',
            'image.widestar_url',
            'image.fwidestar_url',
            'image.full_url'
        ];

        window.showLoading();

        try {

            var response = await Api.request('POST', '/list_series', {
                media_type: 'anime',
                filter: filter,
                fields: fields.join(','),
                limit: limit,
                offset: (pageNumber - 1) * limit
            });

            if( response.error
                && response.code == 'bad_session' ){
                return Api.tryLogin().then(function(){
                    self.listSeries();
                });
            }

            var items = response.data.map(function(item){
                return Api.toSerie(item);
            });

            var base = 'series/' + filter + '/';
            var nextPage = ( items.length ) ? base + (pageNumber + 1) : '';
            var previousPage = ( pageNumber > 1 ) ? base + (pageNumber - 1) : '';

            await self.render({
                loaded: true,
                items: items,
                nextPage: nextPage,
                previousPage: previousPage
            });

            window.hideLoading();
            window.setActiveElement();

        } catch (error) {
            console.log(error);
        }

        window.hideLoading();

    }

});