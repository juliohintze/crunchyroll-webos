/*! Vine JS (2.0.2) - https://github.com/mateussouzaweb/vine */

declare global {
    interface Window {
        Vine: {}
    }
}

export const __version = "2.0.2"
declare type Selectable = HTMLElement | Document
declare type Context = string | Selectable

/**
 * Retrieve the resolved valid context
 * @param context
 * @returns
 */
function getContext(context?: Context) {
    context = (typeof context === 'string') ? $(context) : context
    context = (context instanceof Node) ? context : document
    return context as Selectable
}

/**
 * Select an single element
 * @param selector
 * @param context
 * @returns
 */
function $(selector: string, context?: Context) {
    return getContext(context).querySelector(selector) as Selectable
}

/**
 * Select multiple elements
 * @param selector
 * @param context
 * @returns
 */
function $$(selector: any, context?: Context) {

    const items: Array<Selectable> = []

    if (typeof selector === 'string') {
        selector = getContext(context).querySelectorAll(selector)
    }

    if (selector instanceof Node) {
        items.push(selector as Selectable)
    }

    if (selector instanceof NodeList) {
        Array.prototype.forEach.call(selector, (item: Selectable) => {
            items.push(item)
        })
    }

    return items
}

export type { Selectable, Context }
export { $, $$ }

declare interface Trigger {
    event: string
    namespace: string,
    callback: Function
}

declare interface WithEvents extends EventTarget {
    __events?: Array<Trigger>
}

/**
 * Attach or detach event on element
 * @param action
 * @param element
 * @param event
 * @param selector
 * @param callback
 */
function _event(
    action: "add" | "remove",
    element: any,
    event: string,
    selector?: string | Function,
    callback?: Function
) {

    const events = event.split(' ')

    // Multi events
    if (events.length > 1) {
        for (const theEvent of events) {
            _event(action, element, theEvent, selector, callback)
        }
        return
    }

    let handler: Function

    // Determine handler
    if (callback === undefined && selector === undefined) {

        // None
        handler = null
        selector = null

    } else if (callback === undefined) {

        // Bind
        handler = <Function>selector
        selector = null

    } else {

        // Delegated
        handler = (event: Event) => {
            const target = (event.target as HTMLElement).closest(<string>selector)
            if (target) {
                callback.apply(target, [event])
            }
        }

    }

    const split = event.split('.')
    const theEvent = split.shift()
    const namespace = split.join('.')
    const items: Array<WithEvents> = element instanceof Window ? [element] : $$(element)

    if (action === 'add' && typeof handler === 'function') {

        for (const item of items) {

            if (item.__events === undefined) {
                item.__events = []
            }

            item.__events.push({
                event: theEvent,
                namespace: namespace,
                callback: handler
            })

            item.addEventListener(
                theEvent,
                handler.bind(item),
                false
            )

        }

    } else if (action === 'remove') {

        for (const item of items) {

            if (item.__events === undefined) {
                continue
            }

            item.__events = item.__events.filter((watcher) => {
                const pass = Boolean(
                    theEvent !== watcher.event
                    && (namespace === '' || namespace !== watcher.namespace)
                    && (typeof handler !== 'function' || handler !== watcher.callback)
                )

                if (!pass) {
                    item.removeEventListener(
                        watcher.event,
                        watcher.callback.bind(item),
                        false
                    )
                }

                return pass
            })

        }

    }

    return handler
}

/**
 * Add event to element
 * @param element
 * @param event
 * @param selector
 * @param callback
 */
function on(element: any, event: string, selector: string | Function, callback?: Function) {
    return _event('add', element, event, selector, callback)
}

/**
 * Remove event from element
 * @param element
 * @param event
 * @param selector
 * @param callback
 */
function off(element: any, event: string, selector?: string | Function, callback?: Function) {
    return _event('remove', element, event, selector, callback)
}

/**
 * Trigger event on element
 * @param element
 * @param event
 * @param selector
 */
function trigger(element: any, event: string, selector?: string) {

    const items = (selector !== undefined)
        ? $$(selector, element)
        : (element instanceof Window) ? [element] : $$(element)

    const theEvent = new Event(event, {
        'bubbles': true,
        'cancelable': true
    })

    for (const item of items) {
        item.dispatchEvent(theEvent)
    }

}

export type { Trigger }
export { on, off, trigger }
declare interface Watcher {
    event: string
    callback: Function
}

let _watches: Array<Watcher> = []

/**
 * Add watch to a event
 * @param event
 * @param callback
 */
function watch(event: string, callback: Function) {
    _watches.push({ event: event, callback: callback })
}

/**
 * Unwatch a event
 * @param event
 * @param callback
 */
function unwatch(event: string, callback?: Function) {
    _watches = _watches.filter((watcher) => {
        return event !== watcher.event
            && (callback === undefined || callback !== watcher.callback)
    })
}

/**
 * Fire event data
 * @param event
 * @param data
 */
async function fire(event: string, data?: any) {
    for (const watcher of _watches) {
        if (event === watcher.event) {
            try {
                await watcher.callback.apply({}, [data])
            } catch (error) {
                return Promise.reject(error)
            }
        }
    }
}

export type { Watcher }
export { watch, unwatch, fire }

declare type SelectorType = string | Array<string>
declare type SelectorFunction = () => SelectorType | Promise<SelectorType>
declare type Selector = SelectorType | SelectorFunction

declare type TemplateFunction = (component: Component) => string | Promise<string>
declare type Template = string | TemplateFunction

declare type State = any

declare type Callback = (component: Component) => void | Promise<void>

declare type Component = {
    element: HTMLElement,
    state: State,
    template: Template,
    render: (state?: State) => void | Promise<void>
}

declare type Definition = {
    namespace: string,
    selector: Selector,
    state: State,
    template: Template,
    onMount: Callback,
    onRender: Callback,
    onDestroy: Callback
}

declare interface WithComponents extends HTMLElement {
    __components?: Record<string, Component>
}

/**
 * Store registered definitions
 */
const _definitions: Array<Definition> = []

/**
 * Solves a value, being a function promise or not and return the final value
 * @param value
 * @param data
 * @returns
 */
async function solveResult(value: any, data?: any) {
    try {
        if (typeof value === 'function') {
            return await value.apply({}, [data])
        }
        return value
    } catch (error) {
        return Promise.reject(error)
    }
}

/**
 * Solves the selector to final array
 * @param selector
 * @returns
 */
async function solveSelector(selector: Selector) {
    const solved = await solveResult(selector)
    const selectors = !Array.isArray(solved) ? [solved] : solved
    return selectors
}

/**
 * Register a new component definition
 * @param selector
 * @param definition
 */
async function register(selector: Selector, definition: {
    selector?: Selector,
    namespace?: string,
    state?: State,
    template?: Template,
    onMount?: Callback,
    onRender?: Callback,
    onDestroy?: Callback
}) {

    if (!definition.selector) {
        definition.selector = selector
    }
    if (!definition.namespace) {
        definition.namespace = Math.random().toString(16).substring(2, 10)
    }
    if (typeof definition.onMount !== 'function') {
        definition.onMount = () => { }
    }
    if (typeof definition.onRender !== 'function') {
        definition.onRender = () => { }
    }
    if (typeof definition.onDestroy !== 'function') {
        definition.onDestroy = () => { }
    }

    _definitions.push(definition as Definition)

}

/**
 * Remove the registered component definition.
 * This method will not destroy current instances of the matching selector.
 * You must destroy the current live components first if there is any.
 * Tip: you can do it using the ${selector} as resolve function
 * @param selector
 */
async function unregister(selector: Selector) {

    const solved = await solveSelector(selector)

    for (let i = 0; i < _definitions.length; i++) {
        const definition = _definitions[i]
        const definitionSolved = await solveSelector(definition.selector)
        const match = definitionSolved.some((item) => solved.indexOf(item) !== -1)

        if (match) {
            delete _definitions[i]
        }
    }

}

/**
 * Render the component by updating its final HTML.
 * Also destroy and mount child elements if necessary.
 * You must provide the final parsed template with the replaced state.
 * Tip: Use the component template as function when need to replace state
 * @param component
 * @param callback
 */
async function render(component: Component, callback: Callback) {

    // Fetch live template
    const result = await solveResult(component.template, component)
    const current = component.element.innerHTML

    // If has no valid result, no need to continue
    if (typeof result !== 'string') {
        return
    }

    if (result !== current) {

        // Destroy existing child elements
        await destroy(component.element)

        // Mount new HTML result
        component.element.innerHTML = result

    }

    // Render callback
    await callback(component)

    // Mount child elements
    await mount(component.element)

}

/**
 * Mount components on given target element
 * @param target
 */
async function mount(target: HTMLElement) {

    for (const definition of _definitions) {

        const selector = await solveSelector(definition.selector)
        const found = $$(selector.join(', '), target) as Array<WithComponents>

        const namespace = definition.namespace
        const onMount = definition.onMount
        const onRender = definition.onRender

        for (const element of found) {

            if (element.__components === undefined) {
                element.__components = {}
            }

            // Already mounted
            if (element.__components[namespace] !== undefined) {
                continue
            }

            // Solve the state result
            // State as function avoid pointer reference on objects
            const state = await solveResult(definition.state)

            // Make template be valid
            // Also fallback to the element HTML if not defined
            const template = definition.template !== undefined
                ? definition.template : async () => { return element.innerHTML }

            // Prevent render and mount infinity loop
            let isMounting = true

            const component: Component = {
                element: element,
                state: state,
                template: template,
                render: async (state?: State) => {
                    if (state !== undefined) {
                        component.state = state
                    }
                    if (!isMounting) {
                        await render(component, onRender)
                    }
                }
            }

            element.__components[namespace] = component

            await onMount(component)
            isMounting = false
            await render(component, onRender)

        }

    }

}

/**
 * Destroy components on given target element
 * @param target
 */
async function destroy(target: HTMLElement) {

    for (const definition of _definitions) {

        const selector = await solveSelector(definition.selector)
        const found = $$(selector.join(', '), target) as Array<WithComponents>

        const namespace = definition.namespace
        const onDestroy = definition.onDestroy

        for (const element of found) {

            // Component not mounted yet
            if (element.__components === undefined) {
                continue
            }
            if (element.__components[namespace] === undefined) {
                continue
            }

            // Destroy the component instance
            const component = element.__components[namespace]
            await onDestroy(component)
            delete element.__components[namespace]

        }

    }

}

export type { Selector, Template, State, Component, Callback }
export { register, unregister, render, mount, destroy }
let _helpers: Record<string, Function> = {}

/**
 * Register a template helper
 * @param key
 * @param callback
 */
function helper(key: string, callback?: Function) {
    _helpers[key] = callback
}

/**
 * Clean line
 * @param line
 * @returns
 */
function clean(line: string) {
    return line
        .replace(/\s+/g, ' ') // Remove double space
        .replace(/^{{\s?/, '') // Remove starting tag
        .replace(/\s?}}$/, '') // Remove ending tag
}

/**
 * Parse conditions in line
 * @param line
 * @returns
 */
function parseConditions(line: string) {
    return line
        .replace(/^if\s?(.*)$/, 'if( $1 ){') // if condition
        .replace(/^elseif\s?(.*)$/, '}else if( $1 ){') // else if condition
        .replace(/^else$/, '}else{') // else condition
        .replace(/^end$/, '}') // Close end if/for/each
}

/**
 * Parse loops in line
 * @param line
 * @returns
 */
function parseLoops(line: string) {
    return line
        .replace(/^for\s?(.*)\sin\s(.*)$/, 'for( var $1 in $2 ){') // for condition
        .replace(/^each\s?(.*)\s?=>\s?(.*)\sin\s(.*)$/, 'for( var $1 in $3 ){ var $2 = $3[$1];') // each condition
        .replace(/^each\s?(.*)\sin\s(.*)$/, 'for( var _$1 in $2 ){ var $1 = $2[_$1];') // each condition
}

/**
 * Find variables in line
 * @param line
 * @returns
 */
function findVariables(line: string) {

    const vars: Array<string> = []
    const add = (regex: RegExp) => {
        const match = line.match(regex)
        if (match) {
            vars.push(match[1])
        }
    }

    if (line.match(/^(}|for\(|if\()/) === null) {
        add(/^([A-Za-z0-9_]+)/) // Single var
    }

    add(/^if\(\s?!?([A-Za-z0-9_]+)/) // If vars
    add(/^}else\sif\(\s?!?([A-Za-z0-9_]+)/) // Else if vars
    add(/&&\s?!?([A-Za-z0-9_]+)/) // && condition vars
    add(/\|\|\s?!?([A-Za-z0-9_]+)/) // || condition vars
    add(/in\s([A-Za-z0-9_]+)\s\)/) // For vars

    return vars
}

/**
 * Parse a template with custom data.
 * Template patterns:
 *
 * {{ VARIABLE }} - simple variable
 *
 * {{ if VARIABLE }} - if condition
 * {{ elseif VARIABLE }} - else if condition (requires if)
 * {{ else }} - else condition (requires if)
 * {{ end }} - end if/else condition
 *
 * {{ for index in VARIABLE }}> - for loop
 *   {{ VARIABLE[index] }} - simple variable in loop
 * {{ end }} - end for loop
 *
 * {{ each key => item in VARIABLE }}> - each loop
 *   {{ key }} - {{ item }} - simple variable in loop
 * {{ end }} - end each loop
 *
 * {{ each item in VARIABLE }}> - each loop
 *   {{ item }} - simple variable in loop
 * {{ end }} - end each loop
 *
 * @param template
 * @param data
 * @returns
 */
function parse(template: string, data?: Object) {

    let tagRegex = /{{([^}}]+)?}}/g
    let parser = []
    let cursor = 0
    let line = ''
    let before = ''
    let after = ''
    let match: RegExpExecArray | null

    data = Object.assign({}, _helpers, data || {})

    const keys = Object.keys(data)
    for (const key of keys) {
        parser.push('var ' + key + ' = this["' + key + '"];')
    }

    parser.push('var r = [];')

    while ((match = tagRegex.exec(template))) {

        line = clean(match[0])
        line = parseConditions(line)
        line = parseLoops(line)

        before = template.slice(cursor, match.index)
        cursor = match.index + match[0].length
        parser.push('r.push(`' + before.replace(/"/g, '\\"') + '`);')

        findVariables(line).filter((value) => {
            if (data[value] === undefined) {
                parser.push('var ' + value + ';')
            }
        })

        parser.push(line.match(/^(}|{|for\(|if\()/) ? line : 'r.push(' + line + ');')

    }

    after = template.substring(cursor, cursor + (template.length - cursor))
    parser.push('r.push(`' + after.replace(/"/g, '\\"') + '`);')
    parser.push('return r.join("");')

    const code = parser.join("\n")
    const result = new Function(code.replace(/[\r\t\n]/g, '')).apply(data || {})

    return result as string
}

export const Engine = {
    helper,
    parse
}

declare interface HTTPRequest extends RequestInit {
    method: string
    url: string
    data: BodyInit
    headers: HeadersInit
}

declare interface HTTPResult {
    request: HTTPRequest
    response: Response
    body: string
}

declare type HTTPCallback = (details: HTTPRequest | HTTPResult) => void | Promise<void>

/**
 * Add interceptor callback before each HTTP request
 * @param callback
 */
function interceptBefore(callback: HTTPCallback) {
    watch('HTTPInterceptBefore', callback)
}

/**
 * Add interceptor callback after each HTTP request
 * @param callback
 */
function interceptAfter(callback: HTTPCallback) {
    watch('HTTPInterceptAfter', callback)
}

/**
 * Make HTTP requests
 * @param method
 * @param url
 * @param data
 * @param headers
 * @returns
 */
async function request(method: string, url: string, data?: BodyInit, headers?: HeadersInit): Promise<any> {

    const request: HTTPRequest = {
        method: method,
        url: url,
        data: data,
        headers: headers
    }

    await fire('HTTPInterceptBefore', request)
    const options = Object.assign({}, request)

    delete options.url
    delete options.data

    if (options.method != 'GET') {

        if (options.body === undefined || options.body === null) {
            options.body = request.data

            if (options.body instanceof FormData === false) {
                options.body = JSON.stringify(options.body)
                options.headers['Content-Type'] = 'application/json; charset=utf8'
            }
        }

    } else {

        let query = ''

        if (typeof request.data === 'string') {
            query = request.data
        } else if (request.data) {
            query = Object.keys(request.data).map((k) => {
                const _k = encodeURIComponent(k)
                const _v = encodeURIComponent(request.data[k])
                return _k + "=" + _v
            }).join('&')
        }

        if (query) {
            request.url += '?' + query
        }

    }

    const response = await fetch(request.url, options)
    let body = await response.text()

    try {
        const json = JSON.parse(body)
        body = json
    } catch (error) {
    }

    const details: HTTPResult = {
        request: request,
        response: response,
        body: body
    }

    await fire('HTTPInterceptAfter', details)

    if (!response.ok) {
        throw details
    }

    return body
}

/**
 * Make OPTIONS HTTP requests
 * @param url
 * @param data
 * @param headers
 * @returns
 */
async function options(url: string, data?: BodyInit, headers?: HeadersInit) {
    return await request('OPTIONS', url, data, headers)
}

/**
 * Make HEAD HTTP requests
 * @param url
 * @param data
 * @param headers
 * @returns
 */
async function head(url: string, data?: BodyInit, headers?: HeadersInit) {
    return await request('HEAD', url, data, headers)
}

/**
 * Make GET HTTP requests
 * @param url
 * @param data
 * @param headers
 * @returns
 */
async function get(url: string, data?: BodyInit, headers?: HeadersInit) {
    return await request('GET', url, data, headers)
}

/**
 * Make POST HTTP requests
 * @param url
 * @param data
 * @param headers
 * @returns
 */
async function post(url: string, data?: BodyInit, headers?: HeadersInit) {
    return await request('POST', url, data, headers)
}

/**
 * Make PUT HTTP requests
 * @param url
 * @param data
 * @param headers
 * @returns
 */
async function put(url: string, data?: BodyInit, headers?: HeadersInit) {
    return await request('PUT', url, data, headers)
}

/**
 * Make PATCH HTTP requests
 * @param url
 * @param data
 * @param headers
 * @returns
 */
async function patch(url: string, data?: BodyInit, headers?: HeadersInit) {
    return await request('PATCH', url, data, headers)
}

/**
 * Make DELETE HTTP requests
 * @param url
 * @param data
 * @param headers
 * @returns
 */
async function _delete(url: string, data?: BodyInit, headers?: HeadersInit) {
    return await request('DELETE', url, data, headers)
}

export type { HTTPRequest, HTTPResult, HTTPCallback }

export const HTTP = {
    interceptBefore,
    interceptAfter,
    request,
    options,
    head,
    get,
    post,
    put,
    patch,
    _delete
}

declare interface RoutePath {
    path: string
    regex?: RegExp
    location?: string,
    [key: string]: any
}

declare interface RouteChange {
    previous: RoutePath,
    next: RoutePath,
    toLocation: string,
    replace: boolean
}

declare type RouteCallback = (change: RouteChange) => void | Promise<void>

let _routes: Array<RoutePath> = []
let _active: RoutePath

const _options = {

    /**
     * Route mode definition
     */
    mode: window.history.pushState ? 'history' : 'hash',

    /**
     * Route base URL
     */
    base: '',

    /**
     * Route change prevention
     */
    prevent: false

}

/**
 * Add callback before each route transition
 * @param callback
 */
function beforeChange(callback: RouteCallback) {
    watch('RouteChangeBefore', callback)
}

/**
 * Add callback after each route transition
 * @param callback
 */
function afterChange(callback: RouteCallback) {
    watch('RouteChangeAfter', callback)
}

/**
 * Normalize string path
 * @param path
 * @param removeQuery
 * @returns
 */
function normalizePath(path: string, removeQuery?: boolean) {

    path = path.replace(window.location.origin, '')
    path = path.replace(_options.base, '')
    path = path.replace('/?', '?')
    path = path.replace(new RegExp('[/]*$'), '')
    path = path.replace(new RegExp('^[/]*'), '')
    path = ('/' + path).replace('//', '/')

    if (removeQuery) {
        path = path.split('?')[0]
    }

    return path
}

/**
 * Process URL and retrieve route params
 * @param path
 * @param format
 * @returns
 */
function paramsFor(path: string, format: string) {

    const url = normalizePath(path, true)
        .split('/')
        .filter(Boolean)

    const parts = normalizePath(format, true)
        .split('/')
        .filter(Boolean)

    const params: Record<string, string> = {}
    url.forEach((value: string, index: number) => {
        if (parts[index] !== undefined
            && ':'.charCodeAt(0) === parts[index].charCodeAt(0)) {
            const key = parts[index].substring(1)
            params[key] = decodeURIComponent(value)
        }
    })

    return params
}

/**
 * Process URL and retrieve query params
 * @param location
 * @returns
 */
function queryFor(location: string) {

    const query: Record<string, string> = {}
    let search = (location.indexOf('?') !== -1) ? location.split('?')[1] : ''
    search = String(search).trim().replace(/^(\?|#|&)/, '')

    if (search === '') {
        return query
    }

    search.split('&').forEach((param) => {

        const parts = param.replace(/\+/g, ' ').split('=')
        const key = decodeURIComponent(parts.shift())
        const value = parts.length > 0 ? decodeURIComponent(parts.join('=')) : null

        if (query[key] === undefined) {
            query[key] = value
        }

    })

    return query
}

/**
 * Retrieve route param value
 * @param name
 * @param route
 * @returns
 */
function getParam(name?: string, route?: RoutePath) {

    if (route === undefined) {
        route = active()
    }

    const params = paramsFor(route.location, route.path)

    if (name === undefined) {
        return params
    }

    return params[name]
}

/**
 * Retrieve query value
 * @param name
 * @param route
 * @returns
 */
function getQuery(name?: string, route?: RoutePath) {

    if (route === undefined) {
        route = active()
    }

    const query = queryFor(route.location)

    if (name === undefined) {
        return query
    }

    return query[name]
}

/**
 * Create and retrieve parsed route path location
 * @param route
 * @param params
 * @returns
 */
function getLocation(route?: RoutePath, params?: Record<string, string>) {

    if (route === undefined) {
        route = active()
    }

    let theParams = (params !== undefined) ? params : paramsFor(route.location, route.path)
    let location = route.path

    for (const key in theParams) {
        if (theParams.hasOwnProperty(key)) {
            location = location.replace(':' + key, theParams[key])
        }
    }

    return location
}

/**
 * Add route to routes
 * @param definition
 */
function add(definition: RoutePath) {

    const route: RoutePath = Object.assign({
        path: '',
        regex: ''
    }, definition)

    route.path = normalizePath(route.path, true)

    let regex = route.path
    const pattern = ['(:[a-zA-Z]+)']
    const replace = ['([^\/]+)']

    pattern.forEach((value, index) => {
        regex = regex.replace(
            new RegExp(value, 'g'), replace[index]
        )
    })

    route.regex = new RegExp('^' + regex + '$', 'i')
    _routes.push(route)

}

/**
 * Match and return the route based on given path
 * @param path
 * @returns
 */
function match(path: string): null | RoutePath {

    const url = normalizePath(path, true)
    let match = null

    for (const item of _routes) {
        if (url.match(item.regex)) {
            match = item
            break
        }
    }

    return match
}

/**
 * Return the current active route
 * @returns
 */
function active(): RoutePath {

    if (_active === null || _active === undefined) {
        _active = { path: '', regex: new RegExp(''), location: '' }
    }

    return _active
}

/**
 * Process route change
 * @param toLocation
 * @param replace
 */
async function change(toLocation: string, replace?: boolean) {

    const next = match(toLocation)
    if (next !== null) {
        next.location = toLocation
    }

    const change: RouteChange = {
        previous: _active,
        next: next,
        toLocation: normalizePath(toLocation),
        replace: replace
    }

    await fire('RouteChangeBefore', change)

    if (change.replace) {
        _options.prevent = true

        if (_options.mode === 'history') {
            history.pushState({}, null, change.toLocation)
        } else {
            window.location.hash = change.toLocation
        }

        _options.prevent = false
    }

    _active = (change.next) ? change.next : null

    await fire('RouteChangeAfter', change)

}

/**
 * Redirect route to given location path
 * @param toLocation
 */
function redirect(toLocation: string) {
    return change(toLocation, true)
}

/**
 * Navigate on history
 * @param delta
 */
function go(delta?: number) {
    window.history.go(delta)
}

/**
 * Go to the next route
 * @param delta
 */
function forward(delta?: number) {
    go(delta === undefined ? 1 : delta)
}

/**
 * Go back to the previous route
 * @param delta
 */
function back(delta?: number) {
    go(delta === undefined ? -1 : delta)
}

/**
 * Execute route change on popstate event
 */
function onPopState() {

    if (_options.prevent) {
        return
    }

    return change(
        (_options.mode === 'hash')
            ? window.location.hash.replace('#', '')
            : window.location.href
    )
}

/**
 * Execute route change on link click event
 * @param event
 */
function onLinkClick(event: MouseEvent) {

    const link = (event.target as HTMLAnchorElement).closest('a')
    const location = window.location

    const stripHash = (location: Location | HTMLAnchorElement) => {
        return location.href.replace(/#.*/, '')
    }

    // Middle click, cmd click, and ctrl click should open
    // links in a new tab as normal.
    if (event.metaKey
        || event.ctrlKey
        || event.shiftKey
        || event.altKey) {
        return
    }

    // Ignore cross origin links
    if (link.protocol && location.protocol !== link.protocol
        || link.hostname && location.hostname !== link.hostname) {
        return
    }

    // Ignore case when a hash is being tacked on the current URL
    if (_options.mode !== 'hash'
        && link.href
        && link.href.indexOf('#') > -1
        && stripHash(link) === stripHash(location)) {
        return
    }

    // Ignore when opening a new or in the same tab
    // _blank, _self, ...
    if (link.target
        && link.target !== '') {
        return
    }

    // Ignore event with default prevented
    if (event.defaultPrevented) {
        return
    }

    redirect(link.href)
    event.preventDefault()

}

/**
 * Attach events route automation
 */
function attachEvents() {
    on(window, 'popstate', onPopState)
    on(document, 'click', 'a', onLinkClick)
}

/**
 * Init route by setting options and attaching events
 * @param options
 */
function init(options: Record<string, string>) {

    Object.keys(options).map((key) => {
        _options[key] = options[key]
    })

    attachEvents()
}

export type { RoutePath, RouteChange, RouteCallback }
export const Route = {
    beforeChange,
    afterChange,
    normalizePath,
    paramsFor,
    queryFor,
    getParam,
    getQuery,
    getLocation,
    add,
    match,
    change,
    active,
    redirect,
    go,
    forward,
    back,
    init
}
