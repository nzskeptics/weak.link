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

function isHostOrSubdomain(host, expectedHost) {
	return host === expectedHost || host.endsWith('.' + expectedHost);
}

function getFirstPresentParam(url, paramNames) {
	for (const name of paramNames) {
		const value = url.searchParams.get(name);
		if (value) return value;
	}
	return null;
}

function getRedirectTarget(url) {
	const host = url.hostname.toLowerCase();
	const path = url.pathname.toLowerCase();

	const isFacebookRedirect = (
		(isHostOrSubdomain(host, 'facebook.com') || isHostOrSubdomain(host, 'messenger.com'))
		&& (path === '/l.php' || path === '/flx/warn/' || path === '/flx/warn')
	);
	if (isFacebookRedirect) {
		return getFirstPresentParam(url, ['u', 'url']);
	}

	const isInstagramRedirect = (
		isHostOrSubdomain(host, 'instagram.com')
		&& (path === '/linkshim/' || path === '/linkshim')
	);
	if (isInstagramRedirect) {
		return getFirstPresentParam(url, ['u', 'url']);
	}

	const isGoogleRedirect = (
		isHostOrSubdomain(host, 'google.com')
		&& (path === '/url' || path === '/imgres')
	);
	if (isGoogleRedirect) {
		return getFirstPresentParam(url, ['url', 'q', 'imgurl']);
	}

	const isYouTubeRedirect = (
		isHostOrSubdomain(host, 'youtube.com')
		&& path === '/redirect'
	);
	if (isYouTubeRedirect) {
		return getFirstPresentParam(url, ['q', 'url']);
	}

	const isDuckDuckGoRedirect = (
		isHostOrSubdomain(host, 'duckduckgo.com')
		&& path === '/l/'
	);
	if (isDuckDuckGoRedirect) {
		return url.searchParams.get('uddg');
	}

	const isLinkedInRedirect = (
		isHostOrSubdomain(host, 'linkedin.com')
		&& (path === '/redir/redirect' || path === '/safety/go')
	);
	if (isLinkedInRedirect) {
		return getFirstPresentParam(url, ['url', 'target', 'dest']);
	}

	const isRedditRedirect = (
		isHostOrSubdomain(host, 'reddit.com')
		&& path === '/out'
	);
	if (isRedditRedirect) {
		return getFirstPresentParam(url, ['url']);
	}

	const isSlackRedirect = (
		isHostOrSubdomain(host, 'slack-redir.net')
		&& path === '/link'
	);
	if (isSlackRedirect) {
		return getFirstPresentParam(url, ['url']);
	}

	const isDiscordRedirect = (
		isHostOrSubdomain(host, 'discord.com')
		&& path === '/redirect'
	);
	if (isDiscordRedirect) {
		return getFirstPresentParam(url, ['url', 'q']);
	}

	const isSteamRedirect = (
		isHostOrSubdomain(host, 'steamcommunity.com')
		&& path === '/linkfilter/'
	);
	if (isSteamRedirect) {
		return getFirstPresentParam(url, ['url']);
	}

	const isOutlookSafeLinks = isHostOrSubdomain(host, 'safelinks.protection.outlook.com');
	if (isOutlookSafeLinks) {
		return getFirstPresentParam(url, ['url']);
	}

	const isTeamsRedirect = (
		(isHostOrSubdomain(host, 'teams.microsoft.com') || isHostOrSubdomain(host, 'teams.live.com'))
		&& path.startsWith('/l/')
	);
	if (isTeamsRedirect) {
		return getFirstPresentParam(url, ['url', 'q', 'target', 'weburl']);
	}

	const isOfficeRedirect = (
		isHostOrSubdomain(host, 'microsoft.com')
		&& (path === '/link' || path === '/fwlink' || path === '/fwlink/')
	);
	if (isOfficeRedirect) {
		return getFirstPresentParam(url, ['url', 'target']);
	}

	return null;
}

function unwrapRedirectURL(inputURL) {
	let url = inputURL instanceof URL ? new URL(inputURL.toString()) : new URL(inputURL);
	let depth = 0;
	while (depth < 8) {
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
