window.siteDomain = window.location.host;
window.siteOrigin = window.location.origin;

document.addEventListener('DOMContentLoaded', () => {
	document.querySelectorAll('[data-site-domain]').forEach((element) => {
		element.textContent = window.siteDomain;
	});
	document.querySelectorAll('[data-site-origin]').forEach((element) => {
		element.textContent = window.siteOrigin;
	});
});
