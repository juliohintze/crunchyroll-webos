import type { Callback, Template } from "./vine"
import { $, fire, on, off, trigger, register, Route, unwatch, watch } from "./vine"
import { Api } from "./api"

declare var Hls: any

let hls = null
let area: HTMLElement = null
let video: HTMLVideoElement = null
let streams = []
let startTime = 0
let playing = false
let trackTimeout = null
let lastPlayhead = 0

/**
 * Return template
 * @param component
 * @returns
 */
const template: Template = async ({ state }) => {
    return await Api.getTemplate('video', state)
}

/**
 * Format time
 * @param time
 * @returns
 */
const formatTime = (time: number) => {

    if (!time) {
        time = 0
    }

    const result = new Date(time * 1000).toISOString().substring(11, 19)
    const minutes = result.substring(3, 5)
    const seconds = result.substring(6, 8)

    return {
        m: minutes,
        s: seconds
    }
}

/**
 * Show error message
 * @param message
 */
const showError = (message: string) => {

    const error = $('.video-error', area)

    area.classList.add('video-has-error')
    error.innerHTML = message

    const closeButton = $('.video-close', area)
    fire('active::element::set', closeButton)
    fire('loading::hide')

}

/**
 * Show video
 */
const showVideo = async () => {
    area.classList.add('video-is-active')
}

/**
 * Hide video
 */
const hideVideo = () => {

    area.classList.remove('video-is-active')

    if (document.fullscreenElement) {
        document.exitFullscreen()
    }

}

/**
 * Load video
 */
const loadVideo = async () => {

    const serie = $('.video-serie', area)
    const title = $('.video-title', area)
    const episodeId = Route.getParam('episodeId')

    const fields = [
        'media.collection_id',
        'media.episode_number',
        'media.name',
        'media.stream_data',
        'media.media_id',
        'media.playhead',
        'media.duration',
        'media.series_id',
        'media.series_name'
    ]

    const response = await Api.request('POST', '/info', {
        media_id: episodeId,
        fields: fields.join(',')
    })

    if (response.error
        && response.code == 'bad_session') {
        await Api.tryLogin()
        return loadVideo()
    }

    if (response.error && response.message) {
        throw new Error(response.message)
    }

    const serieName = response.data.series_name
    const episodeName = response.data.name

    const serieId = Number(response.data.series_id)
    const collectionId = Number(response.data.collection_id)
    const episodeNumber = Number(response.data.episode_number)

    serie.innerHTML = serieName + ' / Episode ' + episodeNumber
    title.innerHTML = episodeName

    let playhead = response.data.playhead || 0
    let duration = response.data.duration || 0

    if (playhead / duration > 0.90 || playhead < 30) {
        playhead = 0
    }

    streams = response.data.stream_data.streams
    startTime = playhead

    loadClosestEpisodes(serieId, collectionId, episodeNumber)

}

/**
 * Load next and previous episodes
 * @param serieId
 * @param collectionId
 * @param episodeNumber
 */
const loadClosestEpisodes = async (
    serieId: number,
    collectionId: number,
    episodeNumber: number
) => {

    const fields = [
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

    // TODO: collection_id filter does not show the next episode of the next season
    // At the current stage, we cannot do much because it's a limitation of the API
    // We also cannot use series_id as filter because results would be very large
    // Offset filter does not work on multiple seasons too...
    const response = await Api.request('POST', '/list_media', {
        collection_id: collectionId,
        sort: 'asc',
        fields: fields.join(','),
        limit: 50
    })

    const episodes: Array<any> = response.data
    const next = $('.video-next-episode', area)
    const previous = $('.video-previous-episode', area)

    previous.classList.add('hide')
    next.classList.add('hide')

    for (const item of episodes) {

        const itemNumber = Number(item.episode_number)
        const itemMedia = item.media_id
        const itemUrl = '/serie/' + serieId + '/episode/' + itemMedia + '/video'

        if (previous.dataset.url && next.dataset.url) {
            break
        }

        if (itemNumber + 1 == episodeNumber) {
            previous.dataset.url = itemUrl
            previous.title = 'Previous Episode - E' + itemNumber
            previous.classList.remove('hide')
        } else if (itemNumber - 1 == episodeNumber) {
            next.dataset.url = itemUrl
            next.title = 'Next Episode - E' + itemNumber
            next.classList.remove('hide')
        }

    }

}

/**
 * Stream video
 */
const streamVideo = async () => {

    if (!streams.length) {
        throw Error('No streams to load.')
    }

    let stream = streams.find((item: any) => {
        return item.quality == 'adaptive'
    })

    if (!stream) {
        stream = [streams.length - 1]
    }

    const proxy = document.body.dataset.proxy
    if (proxy) {
        stream.url = proxy + encodeURI(stream.url)
    }

    area.classList.add('video-is-loading')

    return await new Promise((resolve) => {

        if (!Hls.isSupported()) {
            throw Error('Video format not supported.')
        }

        hls = new Hls({
            autoStartLoad: false,
            startLevel: -1, // auto
            maxBufferLength: 15, // 15s
            backBufferLength: 15, // 15s
            maxBufferSize: 30 * 1000 * 1000, // 30MB
            maxFragLookUpTolerance: 0.2,
            nudgeMaxRetry: 10
        })

        hls.on(Hls.Events.MEDIA_ATTACHED, () => {
            hls.loadSource(stream.url)
        })

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
            hls.startLoad(startTime)
        })

        hls.on(Hls.Events.LEVEL_LOADED, () => {
            area.classList.remove('video-is-loading')
            area.classList.add('video-is-loaded')
        })

        hls.on(Hls.Events.LEVEL_SWITCHED, () => {

            let level = hls.currentLevel
            let next = $('.video-quality div[data-level="' + level + '"]', area)
            let active = $('.video-quality div.active', area)

            if (!next) {
                next = $('.video-quality div[data-level="-1"]', area)
            }

            active.classList.remove('active')
            next.classList.add('active')

        })

        hls.once(Hls.Events.FRAG_LOADED, () => {
            resolve(null)
        })

        hls.on(Hls.Events.ERROR, (_event: Event, data: any) => {

            if (!data.fatal) {
                return
            }

            switch (data.type) {
                case Hls.ErrorTypes.OTHER_ERROR:
                    hls.startLoad()
                break
                case Hls.ErrorTypes.NETWORK_ERROR:
                    if (data.details == 'manifestLoadError') {
                        showError('Episode cannot be played because of CORS error. You must use a proxy.')
                    } else {
                        hls.startLoad()
                    }
                break
                case Hls.ErrorTypes.MEDIA_ERROR:
                    showError('Media error: trying recovery...')
                    hls.recoverMediaError()
                break
                default:
                    showError('Media cannot be recovered: ' + data.details)
                    hls.destroy()
                break
            }

        })

        hls.attachMedia(video)

    })
}

/**
 * Play video
 */
const playVideo = async () => {

    try {
        await video.play()
    } catch (err) {
    }

    area.classList.remove('video-is-paused')
    area.classList.add('video-is-playing')

    playing = true
    trackProgress()

}

/**
 * Pause video
 */
const pauseVideo = () => {

    video.pause()
    area.classList.remove('video-is-playing')
    area.classList.add('video-is-paused')

    playing = false
    stopTrackProgress()

}

/**
 * Stop video
 */
const stopVideo = () => {
    pauseVideo()
    skipAhead(0)
}

/**
 * Toggle video
 */
const toggleVideo = () => {
    if (playing) {
        pauseVideo()
    } else {
        playVideo()
    }
}

/**
 * Forward video
 * @param seconds
 */
const forwardVideo = (seconds: number) => {
    skipAhead(video.currentTime + seconds)
}

/**
 * Backward video
 * @param seconds
 */
const backwardVideo = (seconds: number) => {
    skipAhead(video.currentTime - seconds)
}

/**
 * Skip ahead video
 * @param skipTo
 */
const skipAhead = (skipTo: number) => {

    if (!skipTo) {
        return
    }

    const seek = $('input[type="range"]', area) as HTMLInputElement
    const progress = $('progress', area) as HTMLProgressElement

    video.currentTime = skipTo
    seek.value = String(skipTo)
    progress.value = skipTo

}

/**
 * Toggle full screen mode
 */
const toggleFullScreen = () => {

    if (document.fullscreenElement) {
        document.exitFullscreen()
    } else {
        area.requestFullscreen().catch(() => { })
    }

}

/**
 * Update seek tooltip text and position
 * @param event
 */
const updateSeekTooltip = (event: MouseEvent) => {

    const tooltip = $('.tooltip', area)
    const seek = $('input[type="range"]', area) as HTMLInputElement
    const target = event.target as HTMLElement
    const bcr = target.getBoundingClientRect()

    let offsetX = event.offsetX
    let pageX = event.pageX
    if (window.TouchEvent && event instanceof TouchEvent) {
        offsetX = event.targetTouches[0].clientX - bcr.x
        pageX = event.targetTouches[0].pageX
    }

    let max = Number(seek.max)
    let skipTo = Math.round(
        (offsetX / target.clientWidth)
        * parseInt(target.getAttribute('max'), 10)
    )

    if (skipTo > max) {
        skipTo = max
    }

    const format = formatTime(skipTo)

    seek.dataset.seek = String(skipTo)
    tooltip.textContent = format.m + ':' + format.s
    tooltip.style.left = pageX + 'px'

}

/**
 * Update video duration
 */
const updateDuration = () => {

    const duration = $('.duration', area)
    const seek = $('input[type="range"]', area) as HTMLInputElement
    const progress = $('progress', area) as HTMLProgressElement

    const time = Math.round(video.duration)
    const format = formatTime(time)

    duration.innerText = format.m + ':' + format.s
    duration.setAttribute('datetime', format.m + 'm ' + format.s + 's')

    seek.setAttribute('max', String(time))
    progress.setAttribute('max', String(time))

}

/**
 * Update video time elapsed
 */
const updateTimeElapsed = () => {

    const elapsed = $('.elapsed', area)
    const time = Math.round(video.currentTime)
    const format = formatTime(time)

    elapsed.innerText = format.m + ':' + format.s
    elapsed.setAttribute('datetime', format.m + 'm ' + format.s + 's')

}

/**
 * Update video progress
 */
const updateProgress = () => {

    const seek = $('input[type="range"]', area) as HTMLInputElement
    const progress = $('progress', area) as HTMLProgressElement

    seek.value = String(Math.floor(video.currentTime))
    progress.value = Math.floor(video.currentTime)

}

/**
 * Start progress tracking
 */
const trackProgress = () => {

    if (trackTimeout) {
        stopTrackProgress()
    }

    trackTimeout = setTimeout(() => {
        updatePlaybackStatus()
    }, 15000) // 15s

}

/**
 * Stop progress tracking
 */
const stopTrackProgress = () => {
    if (trackTimeout) {
        clearTimeout(trackTimeout)
    }
}

/**
 * Update playback status at Crunchyroll
 */
const updatePlaybackStatus = async () => {

    const episodeId = Route.getParam('episodeId')
    const elapsed = 15
    const elapsedDelta = 15
    const playhead = video.currentTime

    if (playhead != lastPlayhead) {
        await Api.request('POST', '/log', {
            event: 'playback_status',
            media_id: episodeId,
            playhead: playhead,
            elapsed: elapsed,
            elapsedDelta: elapsedDelta
        })
    }

    lastPlayhead = playhead
    trackProgress()

}

/**
 * Set video as watched at Crunchyroll
 */
const setWatched = async () => {

    const episodeId = Route.getParam('episodeId')
    const duration = Math.floor(video.duration)
    const playhead = Math.floor(video.currentTime)
    const elapsed = duration - playhead
    const elapsedDelta = duration - playhead

    await Api.request('POST', '/log', {
        event: 'playback_status',
        media_id: episodeId,
        playhead: duration,
        elapsed: elapsed,
        elapsedDelta: elapsedDelta
    })

    stopTrackProgress()

}

/**
 * On mount
 * @param component
 */
const onMount: Callback = ({ element, render }) => {

    const serieId = Route.getParam('serieId')
    let controlsTimeout = null

    // UI Events
    on(element, 'click', '.video-close', (event) => {
        event.preventDefault()
        pauseVideo()
        hideVideo()
        Route.redirect('/home')
    })

    on(element, 'click', '.video-watched', (event) => {
        event.preventDefault()
        setWatched()
    })

    on(element, 'click', '.video-episodes', (event) => {
        event.preventDefault()
        pauseVideo()
        hideVideo()
        Route.redirect('/serie/' + serieId)
    })

    on(element, 'click', '.video-previous-episode', (event, target) => {
        event.preventDefault()
        pauseVideo()
        Route.redirect(target.dataset.url)
    })

    on(element, 'click', '.video-next-episode', (event, target) => {
        event.preventDefault()
        pauseVideo()
        Route.redirect(target.dataset.url)
    })

    on(element, 'click', '.video-fullscreen', (event) => {
        event.preventDefault()
        toggleFullScreen()
    })

    on(element, 'click', '.video-pause', (event) => {

        event.preventDefault()
        pauseVideo()

        const playButton = $('.video-play', element)
        fire('active::element::set', playButton)

    })

    on(element, 'click', '.video-play', (event) => {

        event.preventDefault()
        playVideo()

        const pauseButton = $('.video-pause', element)
        fire('active::element::set', pauseButton)

    })

    on(element, 'click', '.video-reload', (event) => {
        event.preventDefault()
        pauseVideo()
        render()
    })

    on(element, 'click', '.video-forward', (event) => {
        event.preventDefault()
        forwardVideo(5)
    })

    on(element, 'click', '.video-backward', (event) => {
        event.preventDefault()
        backwardVideo(5)
    })

    on(element, 'click', '.video-skip-intro', (event) => {
        event.preventDefault()
        forwardVideo(80)
    })

    // Quality
    on(element, 'click', '.video-quality div', (event, target) => {

        event.preventDefault()
        const level = Number(target.dataset.level)

        if (hls) {
            hls.currentLevel = level
            hls.loadLevel = level
        }

    })

    // Mouse Events
    on(element, 'mouseenter mousemove', () => {

        if (area) {
            area.classList.add('show-controls')
        }

        if (controlsTimeout) {
            clearTimeout(controlsTimeout)
        }

        controlsTimeout = setTimeout(() => {
            if (area) {
                area.classList.remove('show-controls')
            }
        }, 2000) // 2s

    })

    on(element, 'mouseleave', () => {
        if (area) {
            area.classList.remove('show-controls')
        }
    })

    on(element, 'mousemove touchmove', 'input[type="range"]', (e: MouseEvent) => {
        updateSeekTooltip(e)
    })

    on(element, 'click input', 'input[type="range"]', (_event, target) => {
        skipAhead(Number(target.dataset.seek))
    })

    // Public
    watch(element, 'video::play', playVideo)
    watch(element, 'video::pause', pauseVideo)
    watch(element, 'video::stop', stopVideo)
    watch(element, 'video::toggle', toggleVideo)
    watch(element, 'video::forward', forwardVideo)
    watch(element, 'video::backward', backwardVideo)
    watch(element, 'view::reload', () => {
        render()
    })

}

/**
 * On render
 * @param component
 */
const onRender: Callback = async ({ element }) => {

    setTimeout(async () => {

        area = $('#video', element)
        video = $('video', element) as HTMLVideoElement
        video.controls = false

        video = video
        playing = false

        // Video Events
        on(video, 'click', (event) => {
            event.preventDefault()
            toggleVideo()
        })

        on(video, 'timeupdate', () => {
            updateDuration()
            updateTimeElapsed()
            updateProgress()
        })

        fire('loading::show')

        try {

            await loadVideo()
            await streamVideo()
            await showVideo()

            trigger(element, 'click', '.video-play')

        } catch (error) {
            showError(error.message)
        }

        fire('loading::hide')

    }, 200)

}

/**
 * On destroy
 * @param component
 */
const onDestroy: Callback = ({ element }) => {

    off(element, 'click', '.video-close')
    off(element, 'click', '.video-watched')
    off(element, 'click', '.video-episodes')
    off(element, 'click', '.video-previous-episode')
    off(element, 'click', '.video-next-episode')
    off(element, 'click', '.video-fullscreen')
    off(element, 'click', '.video-pause')
    off(element, 'click', '.video-play')
    off(element, 'click', '.video-reload')
    off(element, 'click', '.video-forward')
    off(element, 'click', '.video-backward')
    off(element, 'click', '.video-skip-intro')
    off(element, 'click', '.video-quality div')
    off(element, 'mouseenter mousemove')
    off(element, 'mouseleave')
    off(element, 'mousemove touchmove', 'input[type="range"]')
    off(element, 'click input', 'input[type="range"]')

    unwatch(element, 'video::play')
    unwatch(element, 'video::pause')
    unwatch(element, 'video::stop')
    unwatch(element, 'video::toggle')
    unwatch(element, 'video::forward')
    unwatch(element, 'video::backward')
    unwatch(element, 'view::reload')

}

register('[data-video]', {
    template,
    onMount,
    onRender,
    onDestroy
})

Route.add({
    id: 'video',
    path: '/serie/:serieId/episode/:episodeId/video',
    title: 'Episode Video',
    component: '<div data-video></div>',
    authenticated: true
})
