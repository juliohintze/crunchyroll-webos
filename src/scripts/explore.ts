import type { Callback, State, Template } from "./vine"
import { fire, on, off, register, Route, unwatch, watch } from "./vine"
import { App } from "./app"

/**
 * Initial state
 * @returns
 */
const state: State = () => {
    return {
        limit: 20,
        pageNumber: 1,
        filter: 'popular',
        category: '',
        search: '',
        loaded: false,
        error: false,
        message: '',
        filters: [],
        categories: [],
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
    return await App.getTemplate('explore', state)
}

/**
 * Parse route params to the component
 * @param component
 */
const parseParams: Callback = ({ state }) => {

    const pageNumber = Number(Route.getParam('pageNumber') || 1)
    const filter = String(Route.getParam('filter') || 'popular')
    const category = String(Route.getQuery('category') || '')
    const search = String(Route.getQuery('search') || '')

    state.pageNumber = pageNumber
    state.filter = filter
    state.category = category
    state.search = search

}

/**
 * Retrieve filter options
 * @param component
 */
const retrieveFilters: Callback = async ({ state }) => {

    // General filters
    const filters = []
    filters.push({ id: 'alpha', name: 'Alphabetical' })
    filters.push({ id: 'featured', name: 'Featured' })
    filters.push({ id: 'newest', name: 'Newest' })
    filters.push({ id: 'popular', name: 'Popular' })
    filters.push({ id: 'updated', name: 'Updated' })
    filters.push({ id: 'simulcast', name: 'Simulcasts' })

    state.filters = filters

    // Categories
    const categories = []
    App.getCategories().map((item) => {
        categories.push({
            id: item.slug,
            name: item.localization.title
        })
    })

    state.categories = categories

}

/**
 * List results
 * @param component
 */
const listResults: Callback = async ({ state, render }) => {

    const pageNumber = Number(state.pageNumber)
    const limit = Number(state.limit)
    const filter = String(state.filter)
    const category = String(state.category)
    const search = String(state.search)

    fire('loading::show')

    try {

        const offset = (pageNumber - 1) * limit
        let total = 0
        let items = []

        if(search){
            const response = await App.search({
                'type': 'series',
                'q': search, 
                'start': offset.toString(), 
                'n': limit.toString()
            })

            total = response.data[0].count
            items = response.data[0].items.map((item) => {
                return {
                    id: item.id,
                    name: item.title,
                    description: item.description,
                    image: item.images.poster_wide[0][0].source
                }
            })
        } else if ( category ){

        } else if( filter ){

        }

        const base = 'explore/' + filter + '/'
        const nextPage = (items.length) ? base + (pageNumber + 1) : ''
        const previousPage = (pageNumber > 1) ? base + (pageNumber - 1) : ''

        await render({
            loaded: true,
            items: items,
            nextPage: nextPage,
            previousPage: previousPage,
            error: false,
            message: ''
        })

    } catch (error) {

        await render({
            loaded: true,
            error: true,
            message: error.message
        })

    }

    fire('loading::hide')
    fire('active::element::set')

}

/**
 * On mount
 * @param component
 */
const onMount: Callback = async (component) => {

    const element = component.element

    on(element, 'change', 'input#filter', (_event, target: HTMLInputElement) => {
        Route.redirect('/explore/' + target.value)
    })

    on(element, 'change', 'input#category', (_event, target: HTMLInputElement) => {
        Route.redirect('/explore/' + target.value)
    })

    on(element, 'change', 'input#search', (_event, target: HTMLInputElement) => {
        Route.redirect('/explore?search=' + encodeURI(target.value))
    })

    watch(element, 'view::reload', async () => {
        await parseParams(component)
        await listResults(component)
    })

    await parseParams(component)
    await retrieveFilters(component)
    await listResults(component)

}

/**
 * On destroy
 * @param component
 */
const onDestroy: Callback = ({ element }) => {

    off(element, 'change', 'input#filter')
    off(element, 'change', 'input#category')
    off(element, 'change', 'input#search')

    unwatch(element, 'view::reload')

}

register('[data-explore]', {
    state,
    template,
    onMount,
    onDestroy
})

Route.add({
    id: 'explore',
    menuId: 'explore',
    path: '/explore',
    title: 'Explore',
    component: '<div data-explore></div>',
    authenticated: true
})
Route.add({
    id: 'explore',
    menuId: 'explore',
    path: '/explore/:filter',
    title: 'Explore',
    component: '<div data-explore></div>',
    authenticated: true
})
Route.add({
    id: 'explore',
    menuId: 'explore',
    path: '/explore/:filter/:pageNumber',
    title: 'Explore',
    component: '<div data-explore></div>',
    authenticated: true
})
