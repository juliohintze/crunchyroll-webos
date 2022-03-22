import { Callback, fire, on, register, Route, State, Template, unwatch, watch } from "../lib/vine"
import { Api } from "./api"

/**
 * Initial state
 * @returns
 */
const state: State = () => {
    return {
        pageNumber: 1,
        filter: 'popular',
        search: '',
        loaded: false,
        filters: [],
        items: [],
        nextPage: '',
        previousPage: ''
    }
}

/**
 * Return template
 * @param component
 * @returns
 */
const template: Template = async ({ state }) => {
    return await Api.getTemplate('series', state)
}

/**
 * Parse route params to the component
 * @param component
 */
const parseParams: Callback = (component) => {

    const pageNumber = Number(Route.getParam('pageNumber') || 1)
    const filter = String(Route.getParam('filter') || 'popular')
    const search = String(Route.getQuery('search') || '')

    component.state = {
        ...component.state,
        pageNumber: pageNumber,
        filter: filter,
        search: search
    }

}

/**
 * Retrieve series filter options
 * @param component
 */
const retrieveFilters: Callback = async (component) => {

    let filters = []
    let categories = []

    const local = localStorage.getItem('categories')
    if( local ){
        categories = categories.concat(
            JSON.parse(local) as Array<any>
        )
    }

    // Default filters
    filters.push({ id: '', name: '--- FILTERS' })
    filters.push({ id: 'alpha', name: 'Alphabetical' })
    filters.push({ id: 'featured', name: 'Featured' })
    filters.push({ id: 'newest', name: 'Newest' })
    filters.push({ id: 'popular', name: 'Popular' })
    filters.push({ id: 'updated', name: 'Updated' })
    filters.push({ id: 'simulcast', name: 'Simulcasts' })

    // Retrieve category filters
    if (!categories.length) {

        try {

            const response = await Api.request('POST', '/categories', {
                media_type: 'anime'
            })

            if (response.error
                && response.code == 'bad_session') {
                await Api.tryLogin()
                return retrieveFilters(component)
            }

            categories.push({ id: '-', name: '--- GENRES' })
            response.data.genre.map((item: { tag: any, label: any }) => {
                categories.push({ id: item.tag, name: item.label })
            })

            // categories.push({id: '-', name: '--- SEASONS'})
            // response.data.season.map((item) => {
            //     categories.push({id: item.tag, name: item.label})
            // })

            localStorage.setItem('categories', JSON.stringify(categories))

        } catch (error) {
            console.log(error)
        }

    }

    if (categories && categories.length) {
        categories.map(function (item) {
            filters.push({ id: 'tag:' + item.id, name: item.name })
        })
    }

    component.state = {
        ...component.state,
        filters: filters
    }

}

/**
 * List series
 * @parma component
 */
const listSeries: Callback = async (component) => {

    const limit = 20
    const pageNumber = Number(component.state.pageNumber)
    const search = String(component.state.search)
    let filter = String(component.state.filter)

    if (search) {
        filter = 'prefix:' + search
    }

    // Fields option
    const fields = [
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
    ]

    fire('showLoading')

    try {

        const response = await Api.request('POST', '/list_series', {
            media_type: 'anime',
            filter: filter,
            fields: fields.join(','),
            limit: limit,
            offset: (pageNumber - 1) * limit
        })

        if (response.error
            && response.code == 'bad_session') {
            await Api.tryLogin()
            return listSeries(component)
        }

        const items = response.data.map((item: object) => {
            return Api.toSerie(item)
        })

        const base = 'series/' + filter + '/'
        const nextPage = (items.length) ? base + (pageNumber + 1) : ''
        const previousPage = (pageNumber > 1) ? base + (pageNumber - 1) : ''

        await component.render({
            ...component.state,
            loaded: true,
            items: items,
            nextPage: nextPage,
            previousPage: previousPage
        })

    } catch (error) {
        console.log(error)
    }

    fire('hideLoading')
    fire('setActiveElement')

}

/**
 * On mount
 * @param component
 */
const onMount: Callback = async (component) => {

    const element = component.element

    on(element, 'change', 'input#filter', function () {
        Route.redirect('/series/' + this.value)
    })

    on(element, 'change', 'input#search', function () {
        Route.redirect('/series?search=' + encodeURI(this.value))
    })

    watch('seriesViewReload', async () => {
        await parseParams(component)
        await listSeries(component)
    })

    await parseParams(component)
    await retrieveFilters(component)
    await listSeries(component)

}

/**
 * On destroy
 */
const onDestroy = () => {
    unwatch('seriesViewReload')
}

register('[data-series]', {
    state,
    template,
    onMount,
    onDestroy
})

Route.add({
    id: 'series',
    path: '/series',
    title: 'Series',
    component: '<div data-series></div>',
    authenticated: true
})
Route.add({
    id: 'series',
    path: '/series/:filter',
    title: 'Series',
    component: '<div data-series></div>',
    authenticated: true
})
Route.add({
    id: 'series',
    path: '/series/:filter/:pageNumber',
    title: 'Series',
    component: '<div data-series></div>',
    authenticated: true
})
