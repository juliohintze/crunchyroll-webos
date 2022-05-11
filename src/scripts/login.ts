import type { Callback, Template } from "./vine"
import { $, fire, on, off, register, Route } from "./vine"
import { Api } from "./api"

/**
 * Return template
 * @param component
 * @returns
 */
const template: Template = async ({ state }) => {
    return await Api.getTemplate('login', state)
}

/**
 * Try make login from input data
 * @param component
 */
const makeLogin: Callback = async ({ element, render }) => {

    const email = $('input#email', element) as HTMLInputElement
    const password = $('input#password', element) as HTMLInputElement
    const locale = $('input#locale', element) as HTMLInputElement

    localStorage.setItem('email', email.value)
    localStorage.setItem('password', password.value)
    localStorage.setItem('locale', locale.value)

    fire('showLoading')

    try {
        await Api.tryLogin()
        Route.redirect('/home')
    } catch (error) {
        await render({ message: error.message })
    }

    fire('hideLoading')

}

/**
 * On mount
 * @param component
 */
const onMount: Callback = (component) => {

    const element = component.element

    on(element, 'submit', 'form', (e: Event) => {
        e.preventDefault()
        makeLogin(component)
    })

    on(element, 'click', 'button', (e: Event) => {
        e.preventDefault()
        makeLogin(component)
    })

}

/**
 * On render
 * @param component
 */
const onRender: Callback = ({ element }) => {
    const email = $('input#email', element)
    fire('setActiveElement', email)
}

/**
 * On destroy
 * @param component
 */
const onDestroy: Callback = ({ element }) => {
    off(element, 'submit')
    off(element, 'click')
}

register('[data-login]', {
    template,
    onMount,
    onRender,
    onDestroy
})

Route.add({
    id: 'login',
    path: '/login',
    title: 'Login',
    component: '<div data-login></div>',
    unauthenticated: true
})
