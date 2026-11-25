export const WARNING_TEMPLATE_TO_CODE = Object.freeze({
	brief: 'b',
	educational: 'e',
	strong: 's',
});

export const WARNING_CODE_TO_TEMPLATE = Object.freeze({
	b: 'brief',
	e: 'educational',
	s: 'strong',
});

export const WARNING_TEMPLATES = Object.freeze({
	standard: Object.freeze({
		title: 'Warning: Potential Misinformation',
		text: 'The URL you are about to be linked to likely contains misinformation. It has been obfuscated to allow sharing of dubious websites on social media by groups who are skeptical of the site\'s content.',
	}),
	brief: Object.freeze({
		title: 'Caution',
		text: 'This destination may contain misinformation.',
	}),
	educational: Object.freeze({
		title: 'Educational Warning',
		text: 'This link is shared for skeptical analysis, education, and critique. Please evaluate the destination critically before accepting claims.',
	}),
	strong: Object.freeze({
		title: 'High-Risk Content Warning',
		text: 'This destination is flagged as likely misinformation. Proceed only if you intend to critically review or debunk the claims.',
	}),
});

export function resolveWarningTemplate(templateName) {
	return WARNING_TEMPLATES[templateName] || WARNING_TEMPLATES.standard;
}
