// Home-screen apps (iOS) keep old pages in memory/cache: check for a newer build and reload.
let checking = false

async function check() {
  if (checking || import.meta.env.DEV) return
  checking = true
  try {
    const res = await fetch(`./version.json?t=${Date.now()}`, { cache: 'no-store' })
    const { build } = await res.json()
    if (build && build !== __BUILD_ID__) {
      const url = new URL(location.href)
      if (url.searchParams.get('v') !== build) {
        url.searchParams.set('v', build)
        location.replace(url.toString())
      }
    }
  } catch { /* offline */ }
  checking = false
}

export function watchUpdates() {
  check()
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') check() })
  window.addEventListener('pageshow', (e) => { if (e.persisted) check() })
}
