import { Callback, on, register, unwatch, watch } from "../lib/vine"

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
 */
const onDestroy = () => {
    unwatch('showLoading')
    unwatch('hideLoading')
}

register('[data-loading]', {
    onMount,
    onDestroy
})
