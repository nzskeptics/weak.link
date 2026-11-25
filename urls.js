const TRACKING_PARAM_NAMES = new Set([
	'dclid',
	'fbclid',
	'gclid',
	'gclsrc',
	'gad_source',
	'gbraid',
	'wbraid',
	'_ga',
	'_gl',
	'igshid',
	'li_fat_id',
	'mc_cid',
	'mc_eid',
	'mkt_tok',
	'msclkid',
	'rdt_cid',
	'rb_clickid',
	's_cid',
	'sc_cid',
	'ttclid',
	'twclid',
	'yclid',
	'_hsenc',
	'_hsmi',
	'hsctatracking',
	'pk_campaign',
	'pk_kwd',
	'epik',
	'irclickid',
	'ml_subscriber',
	'ml_subscriber_hash',
	'oly_anon_id',
	'oly_enc_id',
	'vero_conv',
	'vero_id',
	'wickedid',
	'wickedsource',
]);

const TRACKING_PARAM_PREFIXES = [
	'utm_',
	'mtm_',
	'pk_',
	'hsa_',
	'gad_',
];

const HOST_TRACKING_PARAM_NAMES = [
	{
		domains: [
			'amazon.com',
			'amazon.ca',
			'amazon.co.uk',
			'amazon.de',
			'amazon.fr',
			'amazon.es',
			'amazon.it',
			'amazon.nl',
			'amazon.se',
			'amazon.pl',
			'amazon.com.au',
			'amazon.com.br',
			'amazon.com.mx',
			'amazon.co.jp',
			'amazon.in',
			'amazon.ae',
			'amazon.sa',
			'amazon.sg',
			'amazon.com.tr',
		],
		names: [
			'tag',
			'ascsubtag',
			'linkcode',
			'camp',
			'creative',
			'creativeasin',
		],
	},
	{
		domains: ['ebay.com', 'ebay.co.uk', 'ebay.ca', 'ebay.com.au', 'ebay.de'],
		names: ['campid', 'customid', 'mkevt', 'mkcid', 'mkrid', 'toolid'],
	},
	{
		domains: ['youtube.com', 'youtu.be'],
		names: ['si'],
	},
	{
		domains: ['facebook.com', 'messenger.com', 'instagram.com'],
		names: [
			'__cft__',
			'__tn__',
			'fb_action_ids',
			'fb_action_types',
			'fb_ref',
			'fb_source',
			'mibextid',
			'sfnsn',
		],
	},
];

function shouldRemoveParam(name, url) {
	if (!name) return false;
	const normalized = name.toLowerCase();
	if (TRACKING_PARAM_PREFIXES.some((prefix) => normalized.startsWith(prefix))) return true;
	if (TRACKING_PARAM_NAMES.has(normalized)) return true;
	const nameMatchesAnyHostRule = HOST_TRACKING_PARAM_NAMES.some(
		(rule) => rule.names.includes(normalized)
	);
	if (!(url instanceof URL)) return nameMatchesAnyHostRule;
	const host = url.hostname.toLowerCase();
	return HOST_TRACKING_PARAM_NAMES.some((rule) => (
		rule.domains.some((domain) => isHostOrSubdomain(host, domain))
		&& rule.names.includes(normalized)
	));
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

function cleanSearchParams(url) {
	const removed = [];
	const keys = Array.from(new Set(url.searchParams.keys()));
	for (const key of keys) {
		if (!shouldRemoveParam(key, url)) continue;
		removed.push(key);
		url.searchParams.delete(key);
	}
	return removed;
}

function cleanTrackingFragment(url) {
	const fragment = url.hash.slice(1);
	if (!fragment) return [];
	const queryIndex = fragment.indexOf('?');
	const prefix = queryIndex === -1 ? '' : fragment.slice(0, queryIndex);
	const query = queryIndex === -1 ? fragment : fragment.slice(queryIndex + 1);
	const removed = [];
	const retained = [];

	for (const part of query.split('&')) {
		const key = new URLSearchParams(part).keys().next().value;
		if (key && shouldRemoveParam(key, url)) {
			removed.push(key);
		} else {
			retained.push(part);
		}
	}

	if (removed.length === 0) return [];
	const cleanedQuery = retained.filter((part) => part !== '').join('&');
	url.hash = prefix + (cleanedQuery ? (queryIndex === -1 ? '' : '?') + cleanedQuery : '');
	return removed;
}

function cleanTrackingURL(inputURL) {
	const url = unwrapRedirectURL(inputURL);
	const removed = cleanSearchParams(url);
	removed.push(...cleanTrackingFragment(url));
	// Setting empty values serializes away a bare trailing "?" or "#".
	url.search = url.search;
	url.hash = url.hash;
	return {
		url,
		removed,
	};
}

export {cleanTrackingURL, shouldRemoveParam, unwrapRedirectURL};
