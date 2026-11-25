window.siteDomain = window.location.host;

document.addEventListener('DOMContentLoaded', () => {
	document.querySelectorAll('[data-site-domain]').forEach((element) => {
		element.textContent = window.siteDomain;
	});
});
