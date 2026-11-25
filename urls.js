const TRACKING_PARAM_NAMES = new Set([
	'dclid',
	'fbclid',
	'gclid',
	'gclsrc',
	'gad_source',
	'gbraid',
	'wbraid',
	'igshid',
	'li_fat_id',
	'mc_cid',
	'mc_eid',
	'msclkid',
	'rdt_cid',
	'ttclid',
	'twclid',
	'yclid',
	'_hsenc',
	'_hsmi',
	'hsctatracking',
	'pk_campaign',
	'pk_kwd',
	'si',
	'tag',
	'ascsubtag',
	'linkcode',
	'camp',
	'creative',
	'creativeasin',
]);

function shouldRemoveParam(name) {
	if (!name) return false;
	const normalized = name.toLowerCase();
	if (normalized.startsWith('utm_')) return true;
	return TRACKING_PARAM_NAMES.has(normalized);
}

function getRedirectTarget(url) {
	const host = url.hostname.toLowerCase();
	const path = url.pathname;
	const isFacebookRedirect = (
		(host === 'l.facebook.com' || host === 'lm.facebook.com' || host === 'm.facebook.com')
		&& path === '/l.php'
	);
	if (isFacebookRedirect) {
		return url.searchParams.get('u');
	}

	const isGoogleRedirect = (
		(host === 'www.google.com' || host === 'google.com')
		&& path === '/url'
	);
	if (isGoogleRedirect) {
		return url.searchParams.get('url') || url.searchParams.get('q');
	}

	const isYouTubeRedirect = (
		(host === 'www.youtube.com' || host === 'youtube.com')
		&& path === '/redirect'
	);
	if (isYouTubeRedirect) {
		return url.searchParams.get('q');
	}

	const isDuckDuckGoRedirect = (
		(host === 'duckduckgo.com' || host === 'www.duckduckgo.com')
		&& path === '/l/'
	);
	if (isDuckDuckGoRedirect) {
		return url.searchParams.get('uddg');
	}

	return null;
}

function unwrapRedirectURL(inputURL) {
	let url = inputURL instanceof URL ? new URL(inputURL.toString()) : new URL(inputURL);
	let depth = 0;
	while (depth < 5) {
		const target = getRedirectTarget(url);
		if (!target) break;
		try {
			url = new URL(target);
		} catch (e) {
			break;
		}
		depth += 1;
	}
	return url;
}

function cleanTrackingURL(inputURL) {
	const url = unwrapRedirectURL(inputURL);
	const removed = [];
	const keys = [];
	url.searchParams.forEach((_, key) => {
		keys.push(key);
	});
	for (const key of keys) {
		if (!shouldRemoveParam(key)) continue;
		removed.push(key);
		url.searchParams.delete(key);
	}
	return {
		url,
		removed,
	};
}

export {cleanTrackingURL, shouldRemoveParam, unwrapRedirectURL};
