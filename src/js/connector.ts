const _timestamp = Date.now();
const _templates = {};

// @ts-ignore
const Connector = {

    /**
     * Retrieve template as text
     * @param name
     * @returns
     */
    getTemplate: async function(name: string) {

        if( _templates[name] ){
            return _templates[name];
        }

        var path = 'templates/' + name + '.html?t=' + _timestamp;
        var request = await fetch(path);
        var text = request.text();
        _templates[name] = text;

        return text;
    },

    // Keyboard
    setActiveElement: function(_element?: HTMLElement): void {},
    getActiveElement: function(): HTMLElement|null { return null },

    // Loading
    showLoading: function(): void {},
    hideLoading: function(): void {},

    // Video
    playVideo: function(): void {},
    pauseVideo: function(): void {},
    stopVideo: function(): void {},
    toggleVideo: function(): void {},
    forwardVideo: function(_seconds: number): void {},
    backwardVideo: function(_seconds: number): void {}
}