import { Callback, fire, register, Route } from "../lib/vine"
import { Api } from "./api"

/**
 * On mount
 */
const onMount: Callback = async () => {

    fire('showLoading')

    const sessionId = localStorage.getItem('sessionId')
    const locale = localStorage.getItem('locale')

    if (sessionId) {
        try {
            await Api.request('POST', '/logout', {
                session_id: sessionId,
                locale: locale
            })
        } catch (error) {
            console.log(error.message)
        }
    }

    localStorage.removeItem('accessToken')
    localStorage.removeItem('deviceType')
    localStorage.removeItem('deviceId')
    localStorage.removeItem('sessionId')
    localStorage.removeItem('locale')
    localStorage.removeItem('email')
    localStorage.removeItem('password')
    localStorage.removeItem('userId')
    localStorage.removeItem('userName')
    localStorage.removeItem('auth')
    localStorage.removeItem('expires')

    await fire('authChanged', {})

    setTimeout(() => {
        fire('hideLoading')
        Route.redirect('/login')
    }, 1000)

}

register('[data-logout]', {
    onMount
})

Route.add({
    id: 'logout',
    path: '/logout',
    title: 'Logout',
    component: '<div data-logout></div>',
    authenticated: true
})
