import { Engine, mount, on, Route } from "lib/vine"

on(window, 'load', () => {

    // Template helpers
    Engine.helper('store', (key: string, _default: any) => {
        const value = localStorage.getItem(key)
        return value !== null ? value : _default
    })

    // Route definitions
    let base = window.location.pathname.replace('index.html', '')
    if (window.location.protocol == 'file:') {
        base = 'file://' + base
    }

    Route.init({
        mode: 'hash',
        base: base
    })

    // Component mounts
    mount(document.body)

})
