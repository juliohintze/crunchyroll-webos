import { $, Callback, fire, on, register, Route, State, Template, watch } from "../lib/vine"
import { Api } from "./api"

/**
 * Initial state
 * @returns
 */
const state: State = () => {
    return {
        serieId: null,
        serieName: '',
        inQueue: false,
        pageNumber: 1,
        sort: 'desc',
        loaded: false,
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
    return await Api.getTemplate('serie', state)
}

/**
 * Parse route params to the component
 * @param component
 */
const parseParams: Callback = (component) => {

    const serieId = Route.getParam('serieId')
    const sort = Route.getParam('sort') || 'desc'
    const pageNumber = Route.getParam('pageNumber') || 1

    component.state = {
        serieId: serieId,
        sort: sort,
        pageNumber: pageNumber
    }

}

/**
 * Add serie to queue
 * @param component
 * @returns
 */
const addToQueue: Callback = (component) => {

    const serieId = component.state.serieId
    const element = component.element

    const addToQueue = $('.add-to-queue', element) as HTMLElement
    const removeFromQueue = $('.remove-from-queue', element) as HTMLElement

    addToQueue.classList.add('hidden')
    removeFromQueue.classList.remove('hidden')

    return Api.request('POST', '/add_to_queue', {
        series_id: serieId,
        group_id: serieId
    })
}

/**
 * Remove serie from queue
 * @param component
 * @returns
 */
const removeFromQueue: Callback = (component) => {

    const serieId = component.state.serieId
    const element = component.element

    const addToQueue = $('.add-to-queue', element) as HTMLElement
    const removeFromQueue = $('.remove-from-queue', element) as HTMLElement

    addToQueue.classList.remove('hidden')
    removeFromQueue.classList.add('hidden')

    return Api.request('POST', '/remove_from_queue', {
        series_id: serieId,
        group_id: serieId
    })
}

/**
 * List serie info
 * @param component
 */
const listSerieInfo: Callback = async (component) => {

    const serieId = component.state.serieId
    const fields = [
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

        const response = await Api.request('POST', '/info', {
            series_id: serieId,
            fields: fields.join(',')
        })

        if (response.error
            && response.code == 'bad_session') {
            await Api.tryLogin()
            return listSerieInfo(component)
        }

        const serieName = response.data.name
        const inQueue = response.data.in_queue

        component.state = {
            ...component.state,
            serieName: serieName,
            inQueue: inQueue
        }

    } catch (error) {
        console.log(error)
    }

    fire('hideLoading')

}

/**
 * List episodes
 * @param component
 */
const listEpisodes: Callback = async function (component) {

    const serieId = Number(component.state.serieId)
    const pageNumber = Number(component.state.pageNumber)
    const sort = String(component.state.sort)
    const limit = 20

    const fields = [
        'most_likely_media',
        'media',
        'media.name',
        'media.description',
        'media.episode_number',
        'media.duration',
        'media.playhead',
        'media.screenshot_image',
        'media.media_id',
        'media.series_id',
        'media.series_name',
        'media.collection_id',
        'media.url',
        'media.free_available'
    ]

    fire('showLoading')

    try {

        const response = await Api.request('POST', '/list_media', {
            series_id: serieId,
            sort: sort,
            fields: fields.join(','),
            limit: limit,
            offset: (pageNumber - 1) * limit
        })

        if (response.error
            && response.code == 'bad_session') {
            await Api.tryLogin()
            return listEpisodes(component)
        }

        const items = response.data.map((item: object) => {
            return Api.toSerieEpisode(item, 'serie')
        })

        const base = 'serie/' + serieId + '/' + sort + "/"
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

    on(element, 'change', 'input#sort', function () {
        Route.redirect('/serie/' + component.state.serieId + '/' + this.value)
    })

    on(element, 'click', '.add-to-queue', (e: Event) => {
        e.preventDefault()
        addToQueue(component)
    })

    on(element, 'click', '.remove-from-queue', (e: Event) => {
        e.preventDefault()
        removeFromQueue(component)
    })

    watch('currentViewReload', async () => {
        await parseParams(component)
        await listSerieInfo(component)
        await listEpisodes(component)
    })

    await parseParams(component)
    await listSerieInfo(component)
    await listEpisodes(component)

}

register('[data-serie]', {
    state,
    template,
    onMount
})

Route.add({
    id: 'series',
    path: '/serie/:serieId',
    title: 'Serie',
    component: '<div data-serie></div>',
    authenticated: true
})
Route.add({
    id: 'series',
    path: '/serie/:serieId/:sort',
    title: 'Serie',
    component: '<div data-serie></div>',
    authenticated: true
})
Route.add({
    id: 'series',
    path: '/serie/:serieId/:sort/:pageNumber',
    title: 'Serie',
    component: '<div data-serie></div>',
    authenticated: true
})
