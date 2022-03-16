// @ts-ignore
const Connector = {

    /**
     * Retrieve template as text
     * @param name
     * @returns
     */
    getTemplate: async function(name: string) {
        var template = V.$('script#template-' + name).innerHTML;
        return template;
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