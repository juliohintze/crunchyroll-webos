import type { Callback, State, Template } from "./vine"
import { $, fire, on, off, register, Route, unwatch, watch } from "./vine"
import { App } from "./app"

/**
 * Initial state
 * @returns
 */
const state: State = () => {
    return {
        serieId: null,
        serieName: '',
        totalSeasons: 0,
        totalEpisodes: 0,
        seasons: [],
        seasonId: null,
        inWatchlist: false,
        pageNumber: 1,
        sort: 'desc',
        loaded: false,
        error: false,
        message: '',
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
    return await App.getTemplate('serie', state)
}

/**
 * Parse route params to the component
 * @param component
 */
const parseParams: Callback = ({ state }) => {

    const serieId = String(Route.getParam('serieId') || '')
    const seasonId = String(Route.getParam('seasonId') || '')
    const sort = String(Route.getParam('sort') || 'desc')
    const pageNumber = Number(Route.getParam('pageNumber') || 1)

    state.serieId = serieId
    state.seasonId = seasonId
    state.sort = sort
    state.pageNumber = pageNumber

}

/**
 * Add serie to watchlist
 * @param component
 * @returns
 */
const addToWatchlist: Callback = async ({ element, state }) => {

    const serieId = state.serieId
    const addToWatchlist = $('.add-to-watchlist', element)
    const removeFromWatchlist = $('.remove-from-watchlist', element)

    addToWatchlist.classList.add('hidden')
    removeFromWatchlist.classList.remove('hidden')

    await App.addToWatchlist(serieId, {})

}

/**
 * Remove serie from watchlist
 * @param component
 * @returns
 */
const removeFromWatchlist: Callback = async ({ element, state }) => {

    const serieId = state.serieId
    const addToWatchlist = $('.add-to-watchlist', element)
    const removeFromWatchlist = $('.remove-from-watchlist', element)

    addToWatchlist.classList.remove('hidden')
    removeFromWatchlist.classList.add('hidden')

    await App.removeFromWatchlist(serieId, {})

}

/**
 * List serie info
 * @param component
 */
const listSerieInfo: Callback = async ({ state }) => {

    fire('loading::show')

    try {

        const serieId = state.serieId
        const serieResponse = await App.serie(serieId, {})
        const serieInfo = serieResponse.data[0]

        const serieName = serieInfo.title
        const totalSeasons = serieInfo.season_count
        const totalEpisodes = serieInfo.episode_count

        state.serieName = serieName
        state.totalSeasons = totalSeasons
        state.totalEpisodes = totalEpisodes

        const watchlistResponse = await App.inWatchlist({
            'content_ids': serieId
        })

        const inWatchlist = watchlistResponse.data.length > 0
        state.inWatchlist = inWatchlist

        const seasonsResponse = await App.seasons(serieId, {})
        const seasons = seasonsResponse.items.map((item) => {
            return {
                id: item.id,
                name: 'S' + item.season_number + ': ' + item.title
            }
        })

        state.seasons = seasons

        if( !state.seasonId && seasons.length ){
            state.seasonId = seasons[0].id
        }

    } catch (error) {
        state.error = true
        state.message = error.message
    }

    fire('loading::hide')

}

/**
 * List episodes
 * @param component
 */
const listEpisodes: Callback = async ({ state, render }) => {

    const serieId = String(state.serieId)
    const seasonId = String(state.seasonId)
    const pageNumber = Number(state.pageNumber)
    const sort = String(state.sort)
    const limit = 20

    if( !serieId || !seasonId ){
        return
    }

    fire('loading::show')

    try {

        const response = await App.episodes(seasonId, {
            'order': sort,
            'n': limit.toString()
        })

        const items = response.items.map((item) => {
            return {
                id: item.id,
                image: item.images.thumbnail[0][0].source,
                number: item.episode_number,
                name: item.title,
                description: item.description,
                duration: item.duration_ms / 1000,
                playhead: item.playhead,
                premium: item.is_premium_only,
                season_id: item.season_id,
                season_name: item.season_title,
                serie_id: item.series_id,
                serie_name: item.series_title,
            }
        })

        const base = 'serie/' + serieId + '/season/' + seasonId + '/' + sort + '/'
        const nextPage = (items.length) ? base + (pageNumber + 1) : ''
        const previousPage = (pageNumber > 1) ? base + (pageNumber - 1) : ''

        await render({
            loaded: true,
            items: items,
            nextPage: nextPage,
            previousPage: previousPage,
            error: response.error,
            message: response.message || ''
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

    on(element, 'change', 'input#season', (_event, target: HTMLInputElement) => {
        const serieId = component.state.serieId
        Route.redirect('/serie/' + serieId + '/season/' + target.value)
    })
    
    on(element, 'change', 'input#sort', (_event, target: HTMLInputElement) => {
        const serieId = component.state.serieId
        const seasonId = component.state.seasonId
        Route.redirect('/serie/' + serieId + '/season/' + seasonId + '/' + target.value)
    })

    on(element, 'click', '.add-to-watchlist', (event) => {
        event.preventDefault()
        addToWatchlist(component)
    })

    on(element, 'click', '.remove-from-watchlist', (event) => {
        event.preventDefault()
        removeFromWatchlist(component)
    })

    watch(element, 'view::reload', async () => {
        await parseParams(component)
        await listSerieInfo(component)
        await listEpisodes(component)
    })

    await parseParams(component)
    await listSerieInfo(component)
    await listEpisodes(component)

}

/**
 * On destroy
 * @param component
 */
const onDestroy: Callback = ({ element }) => {

    off(element, 'change', 'input#season')
    off(element, 'change', 'input#sort')
    off(element, 'click', '.add-to-watchlist')
    off(element, 'click', '.remove-to-watchlist')

    unwatch(element, 'view::reload')

}

register('[data-serie]', {
    state,
    template,
    onMount,
    onDestroy
})

Route.add({
    id: 'serie',
    menuId: 'explore',
    path: '/serie/:serieId',
    title: 'Serie',
    component: '<div data-serie></div>',
    authenticated: true
})
Route.add({
    id: 'serie',
    menuId: 'explore',
    path: '/serie/:serieId/season/:seasonId',
    title: 'Serie',
    component: '<div data-serie></div>',
    authenticated: true
})
Route.add({
    id: 'serie',
    menuId: 'explore',
    path: '/serie/:serieId/season/:seasonId/:sort',
    title: 'Serie',
    component: '<div data-serie></div>',
    authenticated: true
})
Route.add({
    id: 'serie',
    menuId: 'explore',
    path: '/serie/:serieId/season/:seasonId/:sort/:pageNumber',
    title: 'Serie',
    component: '<div data-serie></div>',
    authenticated: true
})
