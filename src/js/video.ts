import { $, Callback, fire, on, register, Route, Template, unwatch, watch } from "../lib/vine"
import { Hls } from "../lib/hls"
import { Api } from "./api"

let hls = null
let area: HTMLElement = null
let video: HTMLVideoElement = null
let streams = []
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

    const error = $('.video-error', area) as HTMLElement

    area.classList.add('video-has-error')
    error.innerHTML = message

}

/**
 * Show video
 */
const showVideo = async () => {

    const playButton = $('.video-play', area) as HTMLElement

    area.classList.add('video-is-active')
    fire('setActiveElement', playButton)

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

    const serie = $('.video-serie', area) as HTMLElement
    const title = $('.video-title', area) as HTMLElement
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

    try {

        const response = await Api.request('POST', '/info', {
            media_id: episodeId,
            fields: fields.join(',')
        })

        if (response.error
            && response.code == 'bad_session') {
            await Api.tryLogin()
            return loadVideo()
        }

        const episodeNumber = response.data.episode_number
        const episodeName = response.data.name
        const serieId = response.data.series_id
        const serieName = response.data.series_name
        const collectionId = response.data.collection_id

        serie.innerHTML = serieName + ' / Episode ' + episodeNumber
        title.innerHTML = episodeName

        let startTime = response.data.playhead || 0
        let duration = response.data.duration || 0

        if (startTime / duration > 0.90 || startTime < 30) {
            startTime = 0
        }

        streams = response.data.stream_data.streams
        video.currentTime = startTime

        loadClosestEpisodes(serieId, collectionId, episodeNumber)

    } catch (error) {
        showError(error.message)
    }

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

    const offset = Number(episodeNumber) + 1
    const response = await Api.request('POST', '/list_media', {
        collection_id: collectionId,
        sort: 'asc',
        fields: fields.join(','),
        limit: 3,
        offset: (offset >= 0) ? offset : 0
    })

    const episodes = response.data
    const next = $('.video-next-episode', area) as HTMLElement
    const previous = $('.video-previous-episode', area) as HTMLElement

    previous.classList.add('hide')
    next.classList.add('hide')

    if (episodes.length) {

        const first = episodes[0]
        const last = (episodes.length == 3) ? episodes[2] : episodes[1]

        if (Number(first.episode_number) < Number(episodeNumber)) {
            previous.dataset.url = '/serie/' + serieId + '/episode/' + first.media_id + '/video'
            previous.title = 'Previous Episode - E' + first.episode_number
            previous.classList.remove('hide')
        }

        if (Number(last.episode_number) > Number(episodeNumber)) {
            next.dataset.url = '/serie/' + serieId + '/episode/' + last.media_id + '/video'
            next.title = 'Next Episode - E' + last.episode_number
            next.classList.remove('hide')
        }

    }

}

/**
 * Stream video
 */
const streamVideo = async () => {

    const currentTime = video.currentTime || 0

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

    if (video.canPlayType('application/vnd.apple.mpegurl')) {

        area.classList.remove('video-is-loading')
        area.classList.add('video-is-loaded')

        video.src = stream.url
        video.currentTime = currentTime

        return
    }

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
            hls.startLoad(currentTime)
        })

        hls.on(Hls.Events.LEVEL_LOADED, () => {
            area.classList.remove('video-is-loading')
            area.classList.add('video-is-loaded')
        })

        hls.on(Hls.Events.LEVEL_SWITCHED, () => {

            let level = hls.currentLevel
            let next = $('.video-quality div[data-level="' + level + '"]', area) as HTMLElement
            let active = $('.video-quality div.active', area) as HTMLElement

            if (!next) {
                next = $('.video-quality div[data-level="-1"]', area) as HTMLElement
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

    const tooltip = $('.tooltip', area) as HTMLElement
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

    const duration = $('.duration', area) as HTMLElement
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

    const elapsed = $('.elapsed', area) as HTMLElement
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

    trackTimeout = window.setTimeout(() => {
        updatePlaybackStatus()
    }, 15000) // 15s

}

/**
 * Stop progress tracking
 */
const stopTrackProgress = () => {
    if (trackTimeout) {
        window.clearTimeout(trackTimeout)
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
    area = element

    // UI Events
    on(element, 'click', '.video-close', (e: Event) => {
        e.preventDefault()
        pauseVideo()
        hideVideo()
        Route.redirect('/home')
    })

    on(element, 'click', '.video-watched', (e: Event) => {
        e.preventDefault()
        setWatched()
    })

    on(element, 'click', '.video-episodes', (e: Event) => {
        e.preventDefault()
        pauseVideo()
        hideVideo()
        Route.redirect('/serie/' + serieId)
    })

    on(element, 'click', '.video-previous-episode', function (e: Event) {
        Route.redirect(this.dataset.url)
        e.preventDefault()
        pauseVideo()
        render()
    })

    on(element, 'click', '.video-next-episode', function (e: Event) {
        Route.redirect(this.dataset.url)
        e.preventDefault()
        pauseVideo()
        render()
    })

    on(element, 'click', '.video-fullscreen', (e: Event) => {
        e.preventDefault()
        toggleFullScreen()
    })

    on(element, 'click', '.video-pause', (e: Event) => {
        e.preventDefault()
        pauseVideo()
    })

    on(element, 'click', '.video-play', (e: Event) => {
        e.preventDefault()
        playVideo()
    })

    on(element, 'click', '.video-reload', (e: Event) => {
        e.preventDefault()
        pauseVideo()
        render()
    })

    on(element, 'click', '.video-forward', (e: Event) => {
        e.preventDefault()
        forwardVideo(5)
    })

    on(element, 'click', '.video-backward', (e: Event) => {
        e.preventDefault()
        backwardVideo(5)
    })

    on(element, 'click', '.video-skip-intro', (e: Event) => {
        e.preventDefault()
        forwardVideo(80)
    })

    // Quality
    on(element, 'click', '.video-quality div', function (e: Event) {

        e.preventDefault()
        const level = Number(this.dataset.level)

        if (hls) {
            hls.currentLevel = level
            hls.loadLevel = level
        }

    })

    // Mouse Events
    on(element, 'mouseenter mousemove', () => {

        element.classList.add('show-controls')

        if (controlsTimeout) {
            window.clearTimeout(controlsTimeout)
        }

        controlsTimeout = window.setTimeout(() => {
            element.classList.remove('show-controls')
        }, 2000) // 2s

    })

    on(element, 'mouseleave', () => {
        element.classList.remove('show-controls')
    })

    on(element, 'mousemove touchmove', 'input[type="range"]', (e: MouseEvent) => {
        updateSeekTooltip(e)
    })

    on(element, 'click input', 'input[type="range"]', (e: Event) => {
        skipAhead(Number((e.target as HTMLElement).dataset.seek))
    })

    // Public
    watch('playVideo', playVideo)
    watch('pauseVideo', pauseVideo)
    watch('stopVideo', stopVideo)
    watch('toggleVideo', toggleVideo)
    watch('forwardVideo', forwardVideo)
    watch('backwardVideo', backwardVideo)

}

/**
 * On render
 * @param component
 */
const onRender: Callback = async ({ element }) => {

    element.classList.remove('video-has-error')
    element.classList.remove('video-is-active')
    element.classList.remove('video-is-loading')
    element.classList.remove('video-is-loaded')
    element.classList.remove('video-is-playing')
    element.classList.remove('video-is-paused')

    window.setTimeout(async () => {

        video = $('video', element) as HTMLVideoElement
        video.controls = false

        video = video
        playing = false

        // Video Events
        on(video, 'click', (e: Event) => {
            e.preventDefault()
            toggleVideo()
        })

        on(video, 'timeupdate', () => {
            updateDuration()
            updateTimeElapsed()
            updateProgress()
        })

        fire('showLoading')

        try {
            await loadVideo()
            await streamVideo()
            await showVideo()
            await playVideo()
        } catch (error) {
            showError(error.message)
        }

        fire('hideLoading')

    }, 500)

}

/**
 * On destroy
 */
const onDestroy = () => {
    unwatch('playVideo')
    unwatch('pauseVideo')
    unwatch('stopVideo')
    unwatch('toggleVideo')
    unwatch('forwardVideo')
    unwatch('backwardVideo')
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
