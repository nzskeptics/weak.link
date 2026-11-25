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

function cleanTrackingURL(inputURL) {
	const url = inputURL instanceof URL ? new URL(inputURL.toString()) : new URL(inputURL);
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

export {cleanTrackingURL, shouldRemoveParam};
