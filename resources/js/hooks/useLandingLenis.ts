import { useEffect } from 'react'
import Lenis from 'lenis'

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'
const NAVBAR_OFFSET = -80
const ANCHOR_SCROLL_DURATION = 1.05

function getSamePageAnchorTarget(anchor: HTMLAnchorElement): HTMLElement | null {
    const href = anchor.getAttribute('href')

    if (!href || href === '#') {
        return null
    }

    let hash = ''

    if (href.startsWith('#')) {
        hash = href
    } else {
        const url = new URL(href, window.location.href)
        const isSamePage =
            url.origin === window.location.origin &&
            url.pathname === window.location.pathname &&
            url.search === window.location.search

        if (!isSamePage) {
            return null
        }

        hash = url.hash
    }

    if (!hash || hash.length <= 1) {
        return null
    }

    return document.getElementById(decodeURIComponent(hash.slice(1)))
}

export function useLandingLenis() {
    useEffect(() => {
        const reducedMotion = window.matchMedia(REDUCED_MOTION_QUERY)

        if (reducedMotion.matches) {
            return
        }

        const lenis = new Lenis({
            easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)),
            lerp: 0.07,
            smoothWheel: true,
            syncTouch: false,
            touchMultiplier: 0.95,
            wheelMultiplier: 0.82,
        })

        let rafId = 0

        const raf = (time: number) => {
            lenis.raf(time)
            rafId = requestAnimationFrame(raf)
        }

        const handleAnchorClick = (event: MouseEvent) => {
            if (
                event.defaultPrevented ||
                event.button !== 0 ||
                event.metaKey ||
                event.ctrlKey ||
                event.shiftKey ||
                event.altKey
            ) {
                return
            }

            const anchor = (event.target as Element | null)?.closest<HTMLAnchorElement>('a[href]')

            if (!anchor || anchor.target || anchor.hasAttribute('download')) {
                return
            }

            const target = getSamePageAnchorTarget(anchor)

            if (!target) {
                return
            }

            event.preventDefault()
            lenis.scrollTo(target, {
                offset: NAVBAR_OFFSET,
                duration: ANCHOR_SCROLL_DURATION,
            })
        }

        document.addEventListener('click', handleAnchorClick)
        rafId = requestAnimationFrame(raf)

        return () => {
            document.removeEventListener('click', handleAnchorClick)
            cancelAnimationFrame(rafId)
            lenis.destroy()
        }
    }, [])
}
