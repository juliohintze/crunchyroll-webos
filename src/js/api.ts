interface Data {
    [key: string]: any;
}

// @ts-ignore
const Api = {

    /**
     * Make request on Crunchyroll API
     * @param method
     * @param endpoint
     * @param data
     * @returns
     */
    request: function (method: string, endpoint: string, data: Data): Promise<any> {

        var url = 'https://api.crunchyroll.com';
        url += endpoint + '.0.json';

        // var proxy = document.body.dataset.proxy;
        // if( proxy ){
        //     url = proxy + encodeURI(url);
        // }

        data.version = '0';
        data.connectivity_type = 'ethernet';

        var sessionId = V.store.local.get('sessionId', null);
        var locale = V.store.local.get('locale', null);

        if (sessionId && !data.session_id) {
            data.session_id = sessionId;
        }
        if (locale && !data.locale) {
            data.locale = locale;
        }

        if (method == 'POST') {

            var formData = new FormData();
            for (var key in data) {
                formData.append(key, data[key]);
            }

            return V.http.request(method, url, formData, {});
        }

        return V.http.request(method, url, data, {});
    },

    /**
     * Create UUID V4
     * @returns
     */
    createUuid: function (): string {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.
            replace(/[xy]/g, function (c) {
                var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
    },

    /**
     * Try login within the set session data on API
     * @returns
     */
    tryLogin: async function (): Promise<any> {

        var email = V.store.local.get('email', null);
        var password = V.store.local.get('password', null);
        var locale = V.store.local.get('locale', null);

        var accessToken = 'LNDJgOit5yaRIWN';
        var deviceType = 'com.crunchyroll.windows.desktop';
        var deviceId = this.createUuid();
        var sessionId = null;

        var response = await this.request('GET', '/start_session', {
            access_token: accessToken,
            device_type: deviceType,
            device_id: deviceId,
            locale: locale
        });

        if (response.error) {
            throw new Error('Session cannot be started.');
        }

        sessionId = response.data.session_id;
        response = await this.request('POST', '/login', {
            session_id: sessionId,
            account: email,
            password: password,
            locale: locale
        });

        if (response.error) {
            throw new Error('Invalid login.');
        }

        V.store.local.set('accessToken', accessToken);
        V.store.local.set('deviceType', deviceType);
        V.store.local.set('deviceId', deviceId);
        V.store.local.set('sessionId', sessionId);
        V.store.local.set('locale', locale);
        V.store.local.set('email', email);
        V.store.local.set('password', password);
        V.store.local.set('userId', response.data.user.user_id);
        V.store.local.set('userName', response.data.user.username);
        V.store.local.set('auth', response.data.auth);
        V.store.local.set('expires', response.data.expires);

        await V.fire('authChanged', {});

        return true;
    },

    /**
     * Transform data into serie item
     * @param data
     * @returns
     */
    toSerie: function (data: Data): object {
        return {
            id: data.series_id,
            name: data.name,
            description: data.description,
            image: data.portrait_image.full_url
        };
    },

    /**
     * Transform data to serie episode item
     * @param data
     * @param source
     * @returns
     */
    toSerieEpisode: function (data: Data, source: string): object {

        var serie = data.series || {};
        var episode = data;

        if (source == 'history') {
            episode = data.media;
        }
        if (source == 'queue') {
            episode = data.most_likely_media;
        }

        if (!episode) {
            return;
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
        };
    }
}