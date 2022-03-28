import type { Callback } from "lib/vine"
import { destroy, fire, mount, register, Route, trigger } from "lib/vine"

/**
 * Attach route component changes
 * @param component
 */
const onMount: Callback = ({ element }) => {

    const isLoggedIn = () => {
        const expires = localStorage.getItem('expires')
        return expires && new Date() < new Date(expires)
    }

    Route.beforeChange( (change) => {

        // Kind of 404
        if (!change.next) {
            change.next = Route.match('/queue')
        }

        // Check login
        if (!isLoggedIn()) {
            change.next = Route.match('/login')
        }

    })

    Route.afterChange(async (change) => {

        const previous = change.previous
        const next = change.next
        const body = document.body

        // Prevent in case of change to the same URL
        if (previous && next) {
            if (previous.path === next.path) {
                fire(next.id + 'ViewReload')
                return
            }
        }

        // Destroy previous route
        if (previous && previous.id) {
            body.classList.remove('page-' + previous.id)
        }

        if (previous && previous.component) {
            await destroy(element)
        }

        // Route unauthenticated only
        if (next && next.unauthenticated) {
            if (isLoggedIn()) {
                return Route.redirect('/queue')
            }
        }

        // Route authenticated only
        if (next && next.authenticated) {
            if (!isLoggedIn()) {
                return Route.redirect('/login')
            }
        }

        // Mount next component
        if (next && next.id) {
            body.classList.add('page-' + next.id)
        }

        if (next && next.component) {
            element.innerHTML = next.component
            await mount(element)
        }

    })

}

/**
 * Trigger initial popstate event
 */
const onRender: Callback = () => {
    trigger(window, 'popstate')
}

register('[data-view]', {
    onMount,
    onRender
})