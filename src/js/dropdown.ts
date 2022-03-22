import { $, Callback, fire, on, register, trigger } from "../lib/vine"

/**
 * On mount
 * @param component
 */
const onMount: Callback = ({ element }) => {

    const input = $('input', element) as HTMLInputElement
    const dropdownValue = $('.dropdown-value', element) as HTMLElement

    const isParentOf = (child: HTMLElement) => {

        while (child) {
            if( child == element ){
                return true
            }
            child = child.parentElement
        }

        return false
    }

    on(element, 'click', '.dropdown-value', () => {
        element.classList.add('active')
        const firstLI = $('li', element) as HTMLElement
        fire('setActiveElement', firstLI)
    })

    on(element, 'click', 'li', function(){
        element.classList.remove('active')
        dropdownValue.innerText = this.innerText
        input.value = this.dataset.value
        trigger(input, 'change')
    })

    on(document.body, 'click', (e: Event) => {
        if (!isParentOf(e.target as HTMLElement)) {
            element.classList.remove('active')
        }
    })

    on(window, 'keyup', () => {
        const result = { active: HTMLElement = null }
        fire('getActiveElement', result)

        if (!result.active || !isParentOf(result.active)) {
            element.classList.remove('active')
        }
    })

    const current = $('li[data-value="' + input.value + '"]', element) as HTMLElement
    if (current) {
        dropdownValue.innerText = current.innerText
    }

}

register('[data-dropdown]', {
    onMount
})
