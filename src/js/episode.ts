import type { Callback } from "./vine.js"
import { $, register } from "./vine.js"

/**
 * On mount
 * @param component
 */
const onMount: Callback = ({ element }) => {

    const duration = element.dataset.episodeDuration
    const playhead = element.dataset.episodePlayhead
    const premium = element.dataset.episodePremium
    const progress = (100 / Number(duration)) * Number(playhead)

    if (progress) {
        const progressElement = $('.list-item-progress', element)
        progressElement.style.width = progress + '%'
        progressElement.classList.remove('hidden')
    }

    if (Number(premium) == 1) {
        const premiumElement = $('.list-item-premium', element)
        premiumElement.classList.remove('hidden')
    }

}

register('[data-episode]', {
    onMount
})
