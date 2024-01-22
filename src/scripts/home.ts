import type { Callback, State, Template } from "./vine"
import { fire, register, Route, unwatch, watch } from "./vine"
import { App } from "./app"

/**
 * Initial state
 * @returns
 */
const state: State = () => {
    return {
        loaded: false,
        history: [],
        watchlist: [],
        recommendations: [],
        popular: [],
        error: false,
        message: ''
    }
}

/**
 * Return template
 * @param component
 * @returns
 */
const template: Template = async ({ state }) => {
    return await App.getTemplate('home', state)
}

/**
 * List results
 * @param component
 */
const listResults: Callback = async ({ state, render }) => {

    fire('loading::show')

    try {

        // const validLists = [
        //     'recommendations',
        //     'history',
        //     'browse',
        //     'series',
        //     'because_you_watched',
        // ]

        // const listsResponse = await App.homeFeed({})
        // const lists = listsResponse.data.filter((list: any) => {
        //     return validLists.includes(list.response_type)
        // })

        const recommendationsResponse = await App.recommendations({'n': '4'})
        const recommendations = (recommendationsResponse.data || []).map((item) => {
            return {
                id: item.id,
                name: item.title,
                description: item.description,
                image: item.images.poster_wide[0][0].source
            }
        })

        const historyResponse = await App.history({'page_size': '4'})
        const history = (historyResponse.data || []).filter((item) => {
            return item.panel.type === 'episode'
        }).map((item) => {
            return {
                id: item.panel.id,
                image: item.panel.images.thumbnail[0][0].source,
                number: item.panel.episode_metadata.episode_number,
                name: item.panel.title,
                description: item.panel.description,
                duration: item.panel.episode_metadata.duration_ms / 1000,
                playhead: item.playhead,
                premium: item.panel.episode_metadata.is_premium_only,
                season_id: item.panel.episode_metadata.season_id,
                season_name: item.panel.episode_metadata.season_title,
                serie_id: item.panel.episode_metadata.series_id,
                serie_name: item.panel.episode_metadata.series_title,
            }
        })

        const watchlistResponse = await App.watchlist({'n': '4'})
        const watchlist = (watchlistResponse.data || []).map((item) => {
            return {
                id: item.panel.id,
                image: item.panel.images.thumbnail[0][0].source,
                number: item.panel.episode_metadata.episode_number,
                name: item.panel.title,
                description: item.panel.description,
                duration: item.panel.episode_metadata.duration_ms / 1000,
                playhead: item.playhead,
                premium: item.panel.episode_metadata.is_premium_only,
                season_id: item.panel.episode_metadata.season_id,
                season_name: item.panel.episode_metadata.season_title,
                serie_id: item.panel.episode_metadata.series_id,
                serie_name: item.panel.episode_metadata.series_title,
            }
        })

        const popularResponse = await App.browser({'n': '4', 'sort_by': 'popularity'})
        const popular = (popularResponse.data || []).map((item) => {
            return {
                id: item.id,
                name: item.title,
                description: item.description,
                image: item.images.poster_wide[0][0].source
            }
        })

        await render({
            loaded: true,
            history: history,
            watchlist: watchlist,
            recommendations: recommendations,
            popular: popular,
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

    watch(element, 'view::reload', async () => {
        await listResults(component)
    })

    await listResults(component)

}

/**
 * On destroy
 * @param component
 */
const onDestroy: Callback = ({ element }) => {
    unwatch(element, 'view::reload')
}

register('[data-home]', {
    state,
    template,
    onMount,
    onDestroy
})

Route.add({
    id: 'home',
    menuId: 'home',
    path: '/',
    title: 'Home',
    component: '<div data-home></div>',
    authenticated: true
})
Route.add({
    id: 'home',
    menuId: 'home',
    path: '/home',
    title: 'Home',
    component: '<div data-home></div>',
    authenticated: true
})