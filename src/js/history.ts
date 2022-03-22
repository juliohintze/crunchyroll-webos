import { Callback, fire, register, Route, State, Template, watch } from "../lib/vine"
import { Api } from "./api"

/**
 * Initial state
 * @returns
 */
const state: State = () => {
    return {
        pageNumber: Route.getParam('pageNumber') || 1,
        loaded: false,
        items: []
    }
}

/**
 * Return template
 * @param component
 * @returns
 */
const template: Template = async ({ state }) => {
    return await Api.getTemplate('history', state)
}

/**
 * List history
 * @param component
 */
const listHistory: Callback = async (component) => {

    const pageNumber = Number(component.state.pageNumber)
    const limit = 8
    const fields = [
        'media',
        'media.availability_notes',
        'media.available',
        'media.available_time',
        'media.bif_url',
        'media.class',
        'media.clip',
        'media.collection_id',
        'media.collection_name',
        'media.created',
        'media.description',
        'media.duration',
        'media.episode_number',
        'media.free_available',
        'media.free_available_time',
        'media.free_unavailable_time',
        'media.media_id',
        'media.media_type',
        'media.name',
        'media.playhead',
        'media.premium_available',
        'media.premium_available_time',
        'media.premium_only',
        'media.premium_unavailable_time',
        'media.screenshot_image',
        'media.series_id',
        'media.series_name',
        'media.stream_data',
        'media.unavailable_time',
        'media.url',
        'playhead',
        'timestamp',
        'series',
        'series.class',
        'series.collection_count',
        'series.description',
        'series.genres',
        'series.in_queue',
        'series.landscape_image',
        'series.media_count',
        'series.media_type',
        'series.name',
        'series.portrait_image',
        'series.publisher_name',
        'series.rating',
        'series.series_id',
        'series.url',
        'series.year'
    ]

    fire('showLoading')

    try {

        const response = await Api.request('POST', '/recently_watched', {
            fields: fields.join(','),
            limit: limit,
            offset: (pageNumber - 1) * limit
        })

        if (response.error
            && response.code == 'bad_session') {
            await Api.tryLogin()
            return listHistory(component)
        }

        const items = response.data.map((item: object) => {
            Api.toSerieEpisode(item, 'history')
        })

        await component.render({
            ...component.state,
            loaded: true,
            items: items
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
const onMount: Callback = (component) => {

    watch('currentViewReload', function () {
        listHistory(component)
    })

    listHistory(component)

}

register('[data-history]', {
    state,
    template,
    onMount
})

Route.add({
    id: 'history',
    path: '/history',
    title: 'History',
    component: '<div data-history></div>',
    authenticated: true
})
Route.add({
    id: 'history',
    path: '/history/:pageNumber',
    title: 'History',
    component: '<div data-history></div>',
    authenticated: true
})
