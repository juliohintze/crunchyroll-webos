import { $, Engine, fire, HTTP } from "../lib/vine"

interface Data {
    [key: string]: any
}

/**
 * Make request on Crunchyroll API
 * @param method
 * @param endpoint
 * @param data
 * @returns
 */
const request = (method: string, endpoint: string, data: Data) => {

    let url = 'https://api.crunchyroll.com'
    url += endpoint + '.0.json'

    // const proxy = document.body.dataset.proxy
    // if( proxy ){
    //     url = proxy + encodeURI(url)
    // }

    data.version = '0'
    data.connectivity_type = 'ethernet'

    const sessionId = localStorage.getItem('sessionId')
    const locale = localStorage.getItem('locale')

    if (sessionId && !data.session_id) {
        data.session_id = sessionId
    }
    if (locale && !data.locale) {
        data.locale = locale
    }

    if (method == 'POST') {

        const formData = new FormData()
        for (const key in data) {
            formData.append(key, data[key])
        }

        return HTTP.request(method, url, formData, {})
    }

    return HTTP.request(method, url, data as BodyInit, {})
}

/**
 * Create UUID V4
 * @returns
 */
const createUuid = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.
        replace(/[xy]/g, (c) => {
            const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8)
            return v.toString(16)
        })
}

/**
 * Try login within the set session data on API
 * @returns
 */
const tryLogin = async () => {

    const email = localStorage.getItem('email')
    const password = localStorage.getItem('password')
    const locale = localStorage.getItem('locale')

    const accessToken = 'LNDJgOit5yaRIWN'
    const deviceType = 'com.crunchyroll.windows.desktop'
    const deviceId = createUuid()
    let sessionId = null

    const response = await Api.request('GET', '/start_session', {
        access_token: accessToken,
        device_type: deviceType,
        device_id: deviceId,
        locale: locale
    })

    if (response.error) {
        throw new Error('Session cannot be started.')
    }

    sessionId = response.data.session_id
    const loginResponse = await Api.request('POST', '/login', {
        session_id: sessionId,
        account: email,
        password: password,
        locale: locale
    })

    if (loginResponse.error) {
        throw new Error('Invalid login.')
    }

    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('deviceType', deviceType)
    localStorage.setItem('deviceId', deviceId)
    localStorage.setItem('sessionId', sessionId)
    localStorage.setItem('locale', locale)
    localStorage.setItem('email', email)
    localStorage.setItem('password', password)
    localStorage.setItem('userId', loginResponse.data.user.user_id)
    localStorage.setItem('userName', loginResponse.data.user.username)
    localStorage.setItem('auth', loginResponse.data.auth)
    localStorage.setItem('expires', loginResponse.data.expires)

    await fire('authChanged')

    return true
}

/**
 * Retrieve template as text
 * @param name
 * @param data
 * @returns
 */
const getTemplate = async (name: string, data: any) => {
    const element = $('script#template-' + name)
    const template = element.innerHTML
    return Engine.parse(template, data)
}

/**
 * Transform data into serie item
 * @param data
 * @returns
 */
const toSerie = (data: Data) => ({
    id: data.series_id,
    name: data.name,
    description: data.description,
    image: data.portrait_image.full_url
})

/**
 * Transform data to serie episode item
 * @param data
 * @param source
 * @returns
 */
const toSerieEpisode = (data: Data, source: string) => {

    let serie = data.series || {}
    let episode = data

    if (source == 'history') {
        episode = data.media
    }
    if (source == 'queue') {
        episode = data.most_likely_media
    }

    if (!episode) {
        return
    }

    return {
        serie_id: serie.series_id || episode.series_id,
        serie_name: serie.name || '',
        id: episode.media_id,
        name: episode.name,
        number: episode.episode_number,
        image: episode.screenshot_image.full_url,
        duration: episode.duration,
        playhead: episode.playhead,
        premium: (!episode.free_available) ? 1 : 0
    }
}

export const Api = {
    request,
    tryLogin,
    getTemplate,
    toSerie,
    toSerieEpisode
}
