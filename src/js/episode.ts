import { $, Callback, register } from "../lib/vine"

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
        const progressElement = $('.list-item-progress', element) as HTMLElement
        progressElement.style.width = progress + '%'
        progressElement.classList.remove('hidden')
    }

    if (Number(premium) == 1) {
        const premiumElement = $('.list-item-premium', element) as HTMLElement
        premiumElement.classList.remove('hidden')
    }

}

register('[data-episode]', {
    onMount
})
