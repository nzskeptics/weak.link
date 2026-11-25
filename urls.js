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

const REDIRECT_RULES = [
	{
		domains: ['facebook.com', 'messenger.com'],
		paths: ['/l.php', '/flx/warn'],
		paramNames: ['u', 'url'],
	},
	{
		domains: ['instagram.com'],
		paths: ['/linkshim'],
		paramNames: ['u', 'url'],
	},
	{
		domains: ['google.com'],
		paths: ['/url', '/imgres'],
		paramNames: ['url', 'q', 'imgurl'],
	},
	{
		domains: ['youtube.com'],
		paths: ['/redirect'],
		paramNames: ['q', 'url'],
	},
	{
		domains: ['duckduckgo.com'],
		paths: ['/l'],
		paramNames: ['uddg'],
	},
	{
		domains: ['linkedin.com'],
		paths: ['/redir/redirect', '/safety/go'],
		paramNames: ['url', 'target', 'dest'],
	},
	{
		domains: ['reddit.com'],
		paths: ['/out'],
		paramNames: ['url'],
	},
	{
		domains: ['slack-redir.net'],
		paths: ['/link'],
		paramNames: ['url'],
	},
	{
		domains: ['discord.com'],
		paths: ['/redirect'],
		paramNames: ['url', 'q'],
	},
	{
		domains: ['steamcommunity.com'],
		paths: ['/linkfilter'],
		paramNames: ['url'],
	},
	{
		domains: ['safelinks.protection.outlook.com'],
		paramNames: ['url'],
	},
	{
		domains: ['teams.microsoft.com', 'teams.live.com'],
		pathPrefix: '/l',
		paramNames: ['url', 'q', 'target', 'weburl'],
	},
	{
		domains: ['microsoft.com'],
		paths: ['/link', '/fwlink'],
		paramNames: ['url', 'target'],
	},
];

function normalizePath(path) {
	if (!path) return '/';
	if (path.length > 1 && path.endsWith('/')) return path.slice(0, -1);
	return path;
}

function ruleMatches(rule, host, path) {
	const hostMatches = rule.domains.some((domain) => isHostOrSubdomain(host, domain));
	if (!hostMatches) return false;
	if (rule.pathPrefix) return path.startsWith(rule.pathPrefix);
	if (!rule.paths || rule.paths.length === 0) return true;
	return rule.paths.includes(path);
}

function getRedirectTarget(url) {
	const host = url.hostname.toLowerCase();
	const path = normalizePath(url.pathname.toLowerCase());
	for (const rule of REDIRECT_RULES) {
		if (!ruleMatches(rule, host, path)) continue;
		const target = getFirstPresentParam(url, rule.paramNames);
		if (target) return target;
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
