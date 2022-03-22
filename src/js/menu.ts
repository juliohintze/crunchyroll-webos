import { $, Callback, register, Route, Template, watch } from "../lib/vine"
import { Api } from "./api"

/**
 * Return template
 * @param component
 * @returns
 */
const template: Template = async ({ state }) => {
    return await Api.getTemplate('menu', state)
}

/**
 * Set active menu item
 * @param component
 */
const setActive: Callback = ({ element }) => {

    const path = Route.active()
    const id = path.id ? path.id : ''

    const next = $('a[href="' + id + '"]', element) as HTMLElement
    const current = $('a.active', element) as HTMLElement

    if (current) {
        current.classList.remove('active')
    }
    if (next) {
        next.classList.add('active')
    }

}

/**
 * On mount
 * @param component
 */
const onMount: Callback = (component) => {

    Route.afterChange(() => {
        setActive(component)
    })

    watch('authChanged', async () => {
        await component.render()
        await setActive(component)
    })

}

/**
 * On render
 * @param component
 */
const onRender: Callback = (component) => {
    setActive(component)
}

register('[data-menu]', {
    template,
    onMount,
    onRender
})
