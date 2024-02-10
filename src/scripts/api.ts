/**
 * Generic data for API
 */
interface Data {
    [key: string]: any
}

/**
 * Generic result for API
 */
interface Result {
    [key: string]: any
}

// Base constants
const authToken = 'b2VkYXJteHN0bGgxanZhd2ltbnE6OWxFaHZIWkpEMzJqdVY1ZFc5Vk9TNTdkb3BkSnBnbzE='
const apiUrl = 'https://beta-api.crunchyroll.com'
const staticUrl = 'https://static.crunchyroll.com'

/**
 * Encode data for API
 * @param data
 * @returns
 */
const encode = (data: Data) => {
    const encoded = Object.keys(data).map((k) => {
        const _k = encodeURIComponent(k)
        const _v = encodeURIComponent(data[k])
        return _k + "=" + _v
    }).join('&')

    return encoded
}

/**
 * Make request on Crunchyroll API
 * @param method
 * @param endpoint
 * @param body
 * @param headers
 * @returns
 */
const request = async (method: string, endpoint: string, body: any, headers: HeadersInit) => {

    const proxyUrl = document.body.dataset.proxyUrl
    const proxyEncode = document.body.dataset.proxyEncode

    let url = apiUrl + endpoint
    if (endpoint.includes('https://')){
        url = endpoint
    }
    if (proxyUrl) {
        url = proxyUrl + (proxyEncode === "true" ? encodeURIComponent(url) : url)
    }

    const requestOptions = {
        method: method,
        headers: headers,
        body: body,
        referrerPolicy: 'no-referrer' as ReferrerPolicy
    }

    const result = await fetch(url, requestOptions)
    
    if( result.status === 204 ){
        return {} as Result
    }

    const response = await result.json()
    return response as Result
}

/**
 * Login on Crunchyroll with given credentials
 * @param username
 * @param password
 * @returns
 */
const makeLogin = async (username: string, password: string) => {

    const data = encode({
        username: username,
        password: password,
        grant_type: 'password',
        scope: 'offline_access',
    })

    const headers = {
        'Authorization': 'Basic ' + authToken,
        'Content-Type': 'application/x-www-form-urlencoded'
    }

    const result = await request('POST', '/auth/v1/token', data, headers)
    return result
}

/**
 * Refresh login on Crunchyroll with refresh token
 * @param refreshToken
 * @returns
 */
const refreshLogin = async (refreshToken: string) => {

    const data = encode({
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
        scope: 'offline_access',
    })

    const headers = {
        'Authorization': 'Basic ' + authToken,
        'Content-Type': 'application/x-www-form-urlencoded',
    }

    const result = await request('POST', '/auth/v1/token', data, headers)
    return result
}

/**
 * Retrieve cookies
 * @param accessToken
 * @returns
 */
const getCookies = async (accessToken: string) => {

    const headers = {
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': 'application/x-www-form-urlencoded'
    }

    const result = await request('GET', '/index/v2', null, headers)
    return result
}

/**
 * Retrieve profile data
 * @param accessToken
 * @returns
 */
const getProfile = async (accessToken: string) => {

    const headers = {
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': 'application/x-www-form-urlencoded'
    }

    const result = await request('GET', '/accounts/v1/me/profile', null, headers)
    return result
}

/**
 * Update profile data
 * @param accessToken
 * @param data
 * @returns
 */
const updateProfile = async (accessToken: string, data: Data) => {

    const headers = {
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': 'application/json'
    }

    const body = JSON.stringify(data)
    const result = await request('PATCH', '/accounts/v1/me/profile', body, headers)
    return result
}

/**
 * Retrieve home feed data. Possible filter parameters:
 *
 * - ``preferred_audio_language`` (string): user preferred language
 * - ``locale`` (string): user locale
 * - ``n`` (number): results per request
 * - ``start`` (number): start offset
 *
 * @param accessToken
 * @param accountId
 * @param filters
 * @returns
 */
const homeFeed = async (accessToken: string, accountId: string, filters: Data) => {

    const headers = {
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': 'application/x-www-form-urlencoded'
    }

    const params = encode(filters)
    const endpoint = '/content/v2/discover/' + accountId + '/home_feed?' + params
    const result = await request('GET', endpoint, null, headers)

    return result
}

/**
 * Retrieve browser data. Possible filter parameters:
 *
 * - ``preferred_audio_language`` (string): user preferred language
 * - ``locale`` (string): user locale
 * - ``type`` (string): type filter
 * - ``categories`` (string): categories filter, comma separated
 * - ``sort_by`` (string): sort results by specific order
 * - ``seasonal_tag`` (string): filter results by specific tag
 * - ``ratings`` (string): true to include, false to remove
 * - ``is_subbed`` (string): set true to include only results with this key
 * - ``is_dubbed`` (string): set true to include only results with this key
 * - ``n`` (number): results per request
 * - ``start`` (number): start offset
 *
 * @param accessToken
 * @param filters
 * @returns
 */
const browser = async (accessToken: string, filters: Data) => {

    const headers = {
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': 'application/x-www-form-urlencoded'
    }

    const params = encode(filters)
    const endpoint = '/content/v2/discover/browse?' + params
    const result = await request('GET', endpoint, null, headers)

    return result
}

/**
 * Retrieve search results. Possible filter parameters:
 *
 * - ``locale`` (string): user locale
 * - ``type`` (string): type filter
 * - ``q`` (string): search terms filter
 * - ``n`` (number): results per request
 * - ``start`` (number): results start offset
 *
 * @param accessToken
 * @param filters
 * @returns
 */
const search = async (accessToken: string, filters: Data) => {

    const headers = {
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': 'application/x-www-form-urlencoded'
    }

    const params = encode(filters)
    const endpoint = '/content/v2/discover/search?' + params
    const result = await request('GET', endpoint, null, headers)

    return result
}

/**
 * Retrieve recommendations results. Possible filter parameters:
 *
 * - ``preferred_audio_language`` (string): user preferred language
 * - ``locale`` (string): user locale
 * - ``n`` (number): results per request
 * - ``start`` (number): results start offset
 *
 * @param accessToken
 * @param accountId
 * @param filters
 * @returns
 */
const recommendations = async (accessToken: string, accountId: string, filters: Data) => {

    const headers = {
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': 'application/x-www-form-urlencoded'
    }

    const params = encode(filters)
    const endpoint = '/content/v2/discover/' + accountId + '/recommendations?' + params
    const result = await request('GET', endpoint, null, headers)

    return result
}

/**
 * Retrieve watchlist results. Possible filter parameters:
 *
 * - ``preferred_audio_language`` (string): user preferred language
 * - ``locale`` (string): user locale
 * - ``content_ids`` (string): list of content to filter, comma separated
 * - ``n`` (number): results per request
 * - ``start`` (number): results start offset
 * - ``order`` (string): results order
 *
 * @param accessToken
 * @param accountId
 * @param filters
 * @returns
 */
const watchlist = async (accessToken: string, accountId: string, filters: Data) => {

    const headers = {
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': 'application/x-www-form-urlencoded'
    }

    const params = encode(filters)
    const endpoint = '/content/v2/discover/' + accountId + '/watchlist?' + params
    const result = await request('GET', endpoint, null, headers)

    return result
}

/**
 * Check results in watchlist. Possible filter parameters:
 *
 * - ``preferred_audio_language`` (string): user preferred language
 * - ``locale`` (string): user locale
 * - ``content_ids`` (string): list of content to filter, comma separated
 *
 * @param accessToken
 * @param accountId
 * @param contentId
 * @param filters
 * @returns
 */
const inWatchlist = async (accessToken: string, accountId: string, filters: Data) => {
    
    const headers = {
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': 'application/x-www-form-urlencoded'
    }

    const params = encode(filters)
    const endpoint = '/content/v2/' + accountId + '/watchlist?' + params
    const result = await request('GET', endpoint, null, headers)

    return result
}

/**
 * Add serie to watchlist. Possible filter parameters:
 *
 * - ``preferred_audio_language`` (string): user preferred language
 * - ``locale`` (string): user locale
 *
 * @param accessToken
 * @param accountId
 * @param contentId
 * @param filters
 * @returns
 */
const addToWatchlist = async (accessToken: string, accountId: string, contentId: string, filters: Data) => {

    const headers = {
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': 'application/json'
    }

    const body = JSON.stringify({
        content_id: contentId
    })

    const params = encode(filters)
    const result = await request('POST', '/content/v2/' + accountId + '/watchlist?' + params, body, headers)

    return result
}

/**
 * Remove serie from watchlist. Possible filter parameters:
 *
 * - ``preferred_audio_language`` (string): user preferred language
 * - ``locale`` (string): user locale
 *
 * @param accessToken
 * @param accountId
 * @param contentId
 * @param filters
 * @returns
 */
const removeFromWatchlist = async (accessToken: string, accountId: string, contentId: string, filters: Data) => {

    const headers = {
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': 'application/json'
    }

    const params = encode(filters)
    const result = await request('DELETE', '/content/v2/' + accountId + '/watchlist/' + contentId + '?' + params, null, headers)

    return result
}

/**
 * Retrieve history results. Possible filter parameters:
 *
 * - ``preferred_audio_language`` (string): user preferred language
 * - ``locale`` (string): user locale
 * - ``page_size`` (number): results per request
 * - ``page`` (number): results page number
 * - ``order`` (string): results order
 *
 * @param accessToken
 * @param accountId
 * @param filters
 * @returns
 */
const history = async (accessToken: string, accountId: string, filters: Data) => {

    const headers = {
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': 'application/x-www-form-urlencoded'
    }

    const params = encode(filters)
    const endpoint = '/content/v2/' + accountId + '/watch-history?' + params
    const result = await request('GET', endpoint, null, headers)

    return result
}

/**
 * Retrieve up next episode. Possible filter parameters:
 *
 * - ``preferred_audio_language`` (string): user preferred language
 * - ``locale`` (string): user locale
 *
 * @param accessToken
 * @param contentId
 * @param filters
 * @returns
 */
const upNext = async (accessToken: string, contentId: string, filters: Data) => {

    const headers = {
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': 'application/x-www-form-urlencoded'
    }

    const params = encode(filters)
    const endpoint = '/content/v2/discover/up_next/' + contentId + '?' + params
    const result = await request('GET', endpoint, null, headers)

    return result
}

/**
 * Retrieve previous episode. Possible filter parameters:
 *
 * - ``preferred_audio_language`` (string): user preferred language
 * - ``locale`` (string): user locale
 *
 * @param accessToken
 * @param contentId
 * @param filters
 * @returns
 */
const previousEpisode = async (accessToken: string, contentId: string, filters: Data) => {

    const headers = {
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': 'application/x-www-form-urlencoded'
    }

    const params = encode(filters)
    const endpoint = '/content/v2/discover/previous_episode/' + contentId + '?' + params
    const result = await request('GET', endpoint, null, headers)

    return result
}

/**
 * Retrieve playheads results. Possible filter parameters:
 *
 * - ``preferred_audio_language`` (string): user preferred language
 * - ``locale`` (string): user locale
 * - ``content_ids`` (string): list of content to filter, comma separated
 *
 * @param accessToken
 * @param accountId
 * @param filters
 * @returns
 */
const playHeads = async (accessToken: string, accountId: string, filters: Data) => {

    const headers = {
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': 'application/x-www-form-urlencoded'
    }

    const params = encode(filters)
    const endpoint = '/content/v2/' + accountId + '/playheads?' + params
    const result = await request('GET', endpoint, null, headers)

    return result
}

/**
 * Set progress. Possible filter parameters:
 *
 * - ``preferred_audio_language`` (string): user preferred language
 * - ``locale`` (string): user locale
 *
 * @param accessToken
 * @param accountId
 * @param filters
 * @param data
 * @returns
 */
const setProgress = async (accessToken: string, accountId: string, filters: Data, data: Data) => {

    const headers = {
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': 'application/json'
    }

    const params = encode(filters)
    const body = JSON.stringify(data)
    const result = await request('POST', '/content/v2/' + accountId + '/playheads?' + params, body, headers)

    return result
}

/**
 * Retrieve categories results. Possible filter parameters:
 *
 * - ``include_subcategories`` (string): true to include, false to remove
 * - ``locale`` (string): user locale
 *
 * @param accessToken
 * @param filters
 * @returns
 */
const categories = async (accessToken: string, filters: Data) => {

    const headers = {
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': 'application/x-www-form-urlencoded'
    }

    const params = encode(filters)
    const endpoint = '/content/v1/tenant_categories?' + params
    const result = await request('GET', endpoint, null, headers)

    return result
}

/**
 * Retrieve serie information. Possible filter parameters:
 *
 * - ``preferred_audio_language`` (string): user preferred language
 * - ``locale`` (string): user locale
 *
 * @param accessToken
 * @param serieId
 * @param filters
 * @returns
 */
const serie = async (accessToken: string, serieId: string, filters: Data) => {

    const headers = {
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': 'application/x-www-form-urlencoded'
    }

    const params = encode(filters)
    const endpoint = '/content/v2/cms/series/' + serieId + '?' + params
    const result = await request('GET', endpoint, null, headers)

    return result
}

/**
 * Retrieve seasons results. Possible filter parameters:
 *
 * - ``Signature`` (string): cookies signature - REQUIRED
 * - ``Policy`` (string): cookies policy - REQUIRED
 * - ``Key-Pair-Id`` (string): cookies key-par id - REQUIRED
 * - ``preferred_audio_language`` (string): user preferred language
 * - ``locale`` (string): user locale
 * - ``series_id`` (string): series id filter
 *
 * @param accessToken
 * @param bucket
 * @param filters
 * @returns
 */
const seasons = async (accessToken: string, bucket: string, filters: Data) => {

    const headers = {
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': 'application/x-www-form-urlencoded'
    }

    const params = encode(filters)
    const endpoint = '/cms/v2' + bucket + '/seasons?' + params
    const result = await request('GET', endpoint, null, headers)

    return result
}

/**
 * Retrieve episodes results. Possible filter parameters:
 *
 * - ``Signature`` (string): cookies signature - REQUIRED
 * - ``Policy`` (string): cookies policy - REQUIRED
 * - ``Key-Pair-Id`` (string): cookies key-par id - REQUIRED
 * - ``preferred_audio_language`` (string): user preferred language
 * - ``locale`` (string): user locale
 * - ``season_id`` (string): season_id filter
 *
 * @param accessToken
 * @param bucket
 * @param filters
 * @returns
 */
const episodes = async (accessToken: string, bucket: string, filters: Data) => {

    const headers = {
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': 'application/x-www-form-urlencoded'
    }

    const params = encode(filters)
    const endpoint = '/cms/v2' + bucket + '/episodes?' + params
    const result = await request('GET', endpoint, null, headers)

    return result
}

/**
 * Retrieve episode information. Possible filter parameters:
 *
 * - ``preferred_audio_language`` (string): user preferred language
 * - ``locale`` (string): user locale
 *
 * @param accessToken
 * @param contentId
 * @param filters
 * @returns
 */
const episode = async (accessToken: string, contentId: string, filters: Data) => {

    const headers = {
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': 'application/x-www-form-urlencoded'
    }

    const params = encode(filters)
    const endpoint = '/content/v2/cms/objects/' + contentId + '?' + params
    const result = await request('GET', endpoint, null, headers)

    return result
}

/**
 * Retrieve streams results. Possible filter parameters:
 *
 * - ``Signature`` (string): cookies signature - REQUIRED
 * - ``Policy`` (string): cookies policy - REQUIRED
 * - ``Key-Pair-Id`` (string): cookies key-par id - REQUIRED
 * - ``preferred_audio_language`` (string): user preferred language
 * - ``locale`` (string): user locale
 *
 * @param accessToken
 * @param bucket
 * @param contentId
 * @param filters
 * @returns
 */
const streams = async (accessToken: string, bucket: string, contentId: string, filters: Data) => {

    const headers = {
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': 'application/x-www-form-urlencoded'
    }

    const params = encode(filters)
    const endpoint = '/cms/v2' + bucket + '/videos/' + contentId + '/streams?' + params
    const result = await request('GET', endpoint, null, headers)

    return result
}

/**
 * Retrieve text languages results
 * @returns
 */
const textLanguages = async () => {

    const headers = {}
    const endpoint = staticUrl + '/config/i18n/v3/timed_text_languages.json'
    const result = await request('GET', endpoint, null, headers)

    return result
}

/**
 * Retrieve audio languages results
 * @returns
 */
const audioLanguages = async () => {

    const headers = {}
    const endpoint = staticUrl + '/config/i18n/v3/audio_languages.json'
    const result = await request('GET', endpoint, null, headers)

    return result
}

/**
 * Retrieve episode intro
 * @param contentId
 */
const intro = async (contentId: string) => {

    const headers = {}
    const endpoint = staticUrl + '/datalab-intro-v2/' + contentId + '.json'
    const result = await request('GET', endpoint, null, headers)

    return result
}

/**
 * Return avatar image URL with given size
 * @param reference
 * @param size
 * @returns
 */
const avatar = (reference: string, size: number) => {
    const endpoint = staticUrl + '/assets/avatar/' + size + 'x' + size + '/' + reference
    return endpoint
}

export type {
    Data,
    Result,
}

export const Api = {
    encode,
    request,
    makeLogin,
    refreshLogin,
    getCookies,
    getProfile,
    updateProfile,
    homeFeed,
    browser,
    search,
    recommendations,
    watchlist,
    inWatchlist,
    addToWatchlist,
    removeFromWatchlist,
    history,
    upNext,
    previousEpisode,
    playHeads,
    setProgress,
    categories,
    serie,
    seasons,
    episodes,
    episode,
    streams,
    textLanguages,
    audioLanguages,
    intro,
    avatar
}