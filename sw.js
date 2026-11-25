const CACHE_VERSION = 'v2';
const CACHE_NAME = `weak-link-${CACHE_VERSION}`;

const files = [
	'https://cdn.jsdelivr.net/npm/bootstrap@latest/dist/css/bootstrap.min.css',
	'https://cdn.jsdelivr.net/npm/bootstrap@latest/dist/js/bootstrap.bundle.min.js',
	'https://cdn.jsdelivr.net/npm/bootstrap-icons@latest/font/bootstrap-icons.css',
	'https://unpkg.com/petite-vue?module',
	'/basex.js',
	'/index.html',
	'/logo.svg',
];

self.addEventListener('install', (event) => {
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => {
			return cache.addAll(files);
		})
	);
	self.skipWaiting();
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches.keys().then((keys) => Promise.all(
			keys
				.filter((key) => key.startsWith('weak-link-') && key !== CACHE_NAME)
				.map((key) => caches.delete(key))
		)).then(() => self.clients.claim())
	);
});

self.addEventListener('fetch', (event) => {
	if (event.request.method !== 'GET') return;
	if (!(event.request.url.startsWith('http')) || event.request.url.startsWith('https://www.google-analytics.com/')) return;
	event.respondWith(
		caches.match(event.request).then((resp) => {
			return resp || fetch(event.request).then((response) => {
				if (!response || response.status !== 200) return response;
				if (response.type !== 'basic' && response.type !== 'cors') return response;
				return caches.open(CACHE_NAME).then((cache) => {
					cache.put(event.request, response.clone());
					return response;
				});
			});
		})
	);
});
