const CACHE_NAME = 'lyrewight-v1';
self.addEventListener('fetch', (event) => {
    // 🌟 FIX: Ignore blob:, data:, and other non-http schemes to stop errors
    if (!event.request.url.startsWith('http')) return;

    // This allows the app to work offline, but always check the network for updates
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request).catch((err) => {
                console.warn("Fetch failed (Offline or missing asset):", event.request.url, err);
                return new Response(null, { status: 503, statusText: "Service Unavailable" });
            });
        })
    );
});