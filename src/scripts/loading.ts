import type { Callback } from "./vine"
import { on, off, register, unwatch, watch } from "./vine"

/**
 * On mount
 * @param component
 */
const onMount: Callback = ({ element }) => {

    const showLoading = () => {
        element.classList.add('active')
    }
    const hideLoading = () => {
        element.classList.remove('active')
    }

    // Private
    on(element, 'show', (e: Event) => {
        e.preventDefault()
        showLoading()
    })

    on(element, 'hide', (e: Event) => {
        e.preventDefault()
        hideLoading()
    })

    // Public
    watch('showLoading', showLoading)
    watch('hideLoading', hideLoading)

}

/**
 * On destroy
 * @param component
 */
const onDestroy: Callback = ({ element }) => {

    unwatch('showLoading')
    unwatch('hideLoading')
    off(element, 'show')
    off(element, 'hide')

}

register('[data-loading]', {
    onMount,
    onDestroy
})
