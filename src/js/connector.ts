// @ts-ignore
const Connector = {
    _timestamp: Date.now(),
    _templates: {},

    /**
     * Retrieve template as text
     * @param name
     * @returns
     */
    getTemplate: async function(name: string) {

        if( this._template[name] ){
            return this._template[name];
        }

        var path = 'templates/' + name + '.html?t=' + this._timestamp;
        var request = await fetch(path);
        var text = request.text();
        this._template[name] = text;

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