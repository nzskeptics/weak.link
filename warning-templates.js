export const WARNING_TEMPLATES = {
	default: {
		title: 'Warning: Potential Misinformation',
		text: 'The URL you are about to be linked to likely contains misinformation. It has been obfuscated to allow sharing of dubious websites on social media by groups who are skeptical of the site\'s content.',
	},
	brief: {
		title: 'Caution',
		text: 'This destination may contain misinformation.',
	},
	educational: {
		title: 'Educational Warning',
		text: 'This link is shared for skeptical analysis, education, and critique. Please evaluate the destination critically before accepting claims.',
	},
	strong: {
		title: 'High-Risk Content Warning',
		text: 'This destination is flagged as likely misinformation. Proceed only if you intend to critically review or debunk the claims.',
	},
};

export function resolveWarningTemplateName(value) {
	const code = String(value || '').trim().toLowerCase()[0];
	return Object.keys(WARNING_TEMPLATES).find((key) => key[0] === code) || null;
}

export function resolveWarningTemplate(templateName) {
	const resolved = WARNING_TEMPLATES[templateName]
		? templateName
		: (resolveWarningTemplateName(templateName) || 'default');
	return WARNING_TEMPLATES[resolved];
}
