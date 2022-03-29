import type { Callback } from "../lib/vine.js"
import { $, $$, fire, off, on, register, trigger, unwatch, watch } from "../lib/vine.js"

interface CursorStateChangeEvent {
    detail: {
        visibility: any
    }
}

/**
 * Keys mapping
 */
const keys = {
    STOP: 413,
    PAUSE: 19,
    PLAY: 415,
    OK: 13,
    FORWARD: 417,
    BACKWARD: 412,
    BACK: 461,
    RIGHT: 39,
    LEFT: 37,
    UP: 38,
    DOWN: 40,
    INFO: 457,
    TAB: 9,
    SPACE: 32,
    BACKSPACE: 8,
    DELETE: 46
}

let activeElement = null
let usingMouse = false

/**
 * Find on parent elements the closest available navigable element
 * @param direction
 * @param element
 * @param parent
 * @returns
 */
const findClosestOnParents = (direction: string, element: HTMLElement, parent: HTMLElement) => {

    let items = []
    let closest = null

    while (parent && closest == null) {
        items = $$('[tabindex]', parent)
        closest = findClosest(direction, element, items)
        parent = parent.parentElement
    }

    return closest
}

/**
 * Find next/closest available navigable element
 * @param direction
 * @param element
 * @param items
 * @returns
 */
const findClosest = (direction: string, element: HTMLElement, items: Array<any>) => {

    const current = getPosition(element)
    let matches = []

    // Find matches
    items.forEach((itemElement) => {

        if (itemElement === element) {
            return
        }

        const item = getPosition(itemElement)

        // Item not visible in document
        if (item.width == 0 || item.height == 0) {
            return
        }

        let diff: number

        if (direction == 'up') {
            if (item.top < current.top) {
                diff = current.top - item.top
            }
        } else if (direction == 'down') {
            if (item.top > current.bottom) {
                diff = item.top - current.bottom
            }
        } else if (direction == 'left') {
            if (item.right < current.left) {
                diff = current.left - item.right
            }
        } else if (direction == 'right') {
            if (item.left > current.right) {
                diff = item.left - current.right
            }
        }

        if (diff !== undefined) {
            matches.push({
                element: itemElement,
                diff: diff,
                xDiff: Math.abs(current.top - item.top),
                yDiff: Math.abs(current.left - item.left)
            })
        }
    })

    // Sort elements
    matches = matches.sort((a, b) => {
        return (a.diff + a.xDiff + a.yDiff) - (b.diff + b.xDiff + b.yDiff)
    })

    return (matches.length) ? matches[0].element : null
}

/**
 * Find the next TAB stop element respecting only [tabindex]
 * @param direction
 * @param element
 * @returns
 */
const findTabStopElement = (direction: string, element: HTMLElement) => {

    let items = $$('[tabindex]') as Array<HTMLElement>
    let index: number

    items = items.filter((item) => {
        return item.offsetWidth > 0
            || item.offsetHeight > 0
            || item === element
    })

    index = items.indexOf(element)
    index = (direction == 'next') ? index + 1 : index - 1

    return (items[index] || items[0])
}

/**
 * Retrieve the position of an element
 * @param element
 * @returns
 */
const getPosition = (element: HTMLElement) => {

    const rect = element.getBoundingClientRect()
    const style = window.getComputedStyle(element)
    const margin = {
        left: parseInt(style['margin-left']),
        right: parseInt(style['margin-right']),
        top: parseInt(style['margin-top']),
        bottom: parseInt(style['margin-bottom'])
    }
    const padding = {
        left: parseInt(style['padding-left']),
        right: parseInt(style['padding-right']),
        top: parseInt(style['padding-top']),
        bottom: parseInt(style['padding-bottom'])
    }
    const border = {
        left: parseInt(style['border-left']),
        right: parseInt(style['border-right']),
        top: parseInt(style['border-top']),
        bottom: parseInt(style['border-bottom'])
    }

    const left = rect.left - margin.left
    const right = rect.right - margin.right - padding.left - padding.right
    const top = rect.top - margin.top
    const bottom = rect.bottom - margin.bottom - padding.top - padding.bottom - border.bottom
    const width = rect.right - rect.left
    const height = rect.bottom - rect.top

    return {
        left: left,
        right: right,
        top: top,
        bottom: bottom,
        width: width,
        height: height
    }
}

/**
 * Set the current active element for navigation
 * @param element
 */
const setActiveElement = (element: HTMLElement) => {

    if (activeElement) {
        activeElement.classList.remove('hover')
        activeElement.blur()
    }

    if (!element) {
        element = $('#content .list-item')
    }
    if (!element) {
        element = $('#menu .links a')
    }

    if (element) {
        element.scrollIntoView()
        element.classList.add('hover')

        if (element.nodeName !== 'INPUT') {
            element.focus()
        }

        activeElement = element
    }

}

/**
 * Handle key press
 * @param event
 * @returns
 */
const handleKeyPress = (event: KeyboardEvent) => {

    const body = document.body
    const videoActive = body.classList.contains('page-video')
    let result: boolean

    if (videoActive) {
        result = handleKeyOnVideo(event)
    } else {
        result = handleKeyNavigation(event)
    }

    return result
}

/**
 * Handle key press for navigation
 * @param event
 * @returns
 */
const handleKeyNavigation = (event: KeyboardEvent) => {

    const current = activeElement
    const key = Number(event.key)

    if (!current) {
        return
    }

    const directions = {}
    directions[keys.RIGHT] = 'right'
    directions[keys.LEFT] = 'left'
    directions[keys.UP] = 'up'
    directions[keys.DOWN] = 'down'

    // OK / INFO / SPACE
    if (key == keys.OK
        || key == keys.INFO
        || key == keys.SPACE) {

        if (current && current.classList.contains('dropdown')) {
            trigger(current, 'click', '.dropdown-value')
        } else if (current && current.nodeName == 'INPUT') {
            current.focus()
        } else if (current) {
            trigger(current, 'click')
        }

        return true

    // TAB
    } else if (key == keys.TAB) {

        const next = findTabStopElement(
            (event.shiftKey) ? 'prev' : 'next',
            current
        )

        if (next != null) {
            setActiveElement(next)
        }

        return true

    // RIGHT / LEFT / UP / DOWN
    } else if (directions[key]) {

        const closest = findClosestOnParents(
            directions[key],
            current,
            current.parentElement
        )

        if (closest != null) {
            setActiveElement(closest)
        }

        return true
    }

    return false
}

/**
 * Handle key press specific to video
 * @param event
 * @returns
 */
const handleKeyOnVideo = (event: KeyboardEvent) => {

    const key = Number(event.key)

    // STOP
    if (key == keys.STOP) {
        fire('stopVideo')
        return true

    // PAUSE
    } else if (key == keys.PAUSE) {
        fire('pauseVideo')
        return true

    // PLAY
    } else if (key == keys.PLAY) {
        fire('playVideo')
        return true

    // OK / SPACE
    } else if (key == keys.OK
        || key == keys.SPACE) {
        fire('toggleVideo')
        return true

    // FORWARD
    } else if (key == keys.FORWARD) {
        fire('forwardVideo', 1)
        return true

    // BACKWARD
    } else if (key == keys.BACKWARD) {
        fire('backwardVideo', 1)
        return true

    // RIGHT
    } else if (key == keys.RIGHT) {
        fire('forwardVideo', 10)
        return true

    // LEFT
    } else if (key == keys.LEFT) {
        fire('backwardVideo', 10)
        return true

    // BACK
    } else if (key == keys.BACK
        || key == keys.BACKSPACE
        || key == keys.DELETE) {
        fire('pauseVideo')
        return true

    // UP (behavior as left navigation)
    // DOWN (behavior as right navigation)
    } else if (key == keys.UP
        || key == keys.DOWN) {

        const current = activeElement
        const parent = current.parentElement;

        const closest = findClosestOnParents(
            (key == keys.UP) ? 'left' : 'right',
            current,
            parent
        )

        if (closest != null) {
            setActiveElement(closest)
        }

        return true
    }

    return false
}

/**
 * On mount
 */
const onMount: Callback = () => {

    // Mouse events
    const handleMouse = () => {

        if (usingMouse) {
            document.body.classList.add('mouse')
        } else {
            document.body.classList.remove('mouse')
        }

        if (!activeElement) {
            return
        }

        if (usingMouse) {
            activeElement.classList.remove('hover')
        } else {
            activeElement.classList.add('hover')
        }

    }

    on(document, 'cursorStateChange.keyboard', (e: CursorStateChangeEvent) => {
        usingMouse = e.detail.visibility
        handleMouse()
    })

    on(document, 'mouseenter.keyboard mousemove.keyboard', () => {
        usingMouse = true
        handleMouse()
    })

    on(document, 'mouseleave.keyboard', () => {
        usingMouse = false
        handleMouse()
    })

    // Keyboard Events
    on(window, 'keydown.keyboard', (e: KeyboardEvent) => {
        const values = Object.values(keys)
        if (values.indexOf(Number(e.key)) !== -1
            && handleKeyPress(e)) {
            e.preventDefault()
        }
    })

    // Public
    watch('setActiveElement', setActiveElement)
    watch('getActiveElement', (result: any) => {
        result.active = activeElement
    })

}

/**
 * On destroy
 */
const onDestroy: Callback = () => {

    unwatch('setActiveElement')
    unwatch('getActiveElement')

    off(document, 'cursorStateChange.keyboard')
    off(document, 'mouseenter.keyboard')
    off(document, 'mousemove.keyboard')
    off(document, 'mouseleave.keyboard')
    off(window, 'keydown.keyboard')

}

register('[data-keyboard-navigation]', {
    onMount,
    onDestroy
})
