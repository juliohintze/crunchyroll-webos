// @ts-ignore
const Connector = {
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