/*---------------------------------------------------------------------------------------------
 *  SideX — Tauri-based VSCode port
 *  Entry point. Globals set by inline script in index.html.
 *--------------------------------------------------------------------------------------------*/

async function boot() {
	const stages = [
		['common',       () => import('./vs/workbench/workbench.common.main.js')],
		['web.main',     () => import('./vs/workbench/browser/web.main.js')],
		['web-dialog',   () => import('./vs/workbench/browser/parts/dialogs/dialog.web.contribution.js')],
		['web-services', () => import('./vs/workbench/workbench.web.main.js')],
	] as const;

	for (const [label, loader] of stages) {
		try {
			await loader();
		} catch (e) {
			console.warn(`[SideX] Barrel stage "${label}" failed (non-fatal):`, e);
		}
	}

	const { create } = await import('./vs/workbench/browser/web.factory.js');

	if (document.readyState === 'loading') {
		await new Promise<void>(r => window.addEventListener('DOMContentLoaded', () => r()));
	}

	const urlParams = new URLSearchParams(window.location.search);
	const folderParam = urlParams.get('folder');

	const options: any = {
		windowIndicator: {
			label: folderParam ? decodeURIComponent(folderParam.split('/').pop() || 'SideX') : 'SideX',
			tooltip: 'SideX — Tauri Code Editor',
			command: undefined,
		},
		productConfiguration: {
			nameShort: 'SideX',
			nameLong: 'SideX',
			applicationName: 'sidex',
			dataFolderName: '.sidex',
			version: '0.1.0',
		},
		settingsSyncOptions: {
			enabled: false,
		},
		additionalBuiltinExtensions: [],
		// Don't open Getting Started or any default editors
		welcomeBanner: undefined,
		defaultLayout: {
			editors: [],
			layout: { editors: {} },
		},
		// Disable features that call home to Microsoft
		configurationDefaults: {
			'workbench.startupEditor': 'none',
			'workbench.enableExperiments': false,
			'telemetry.telemetryLevel': 'off',
			'update.mode': 'none',
			'extensions.autoUpdate': false,
			'extensions.autoCheckUpdates': false,
			'workbench.settings.enableNaturalLanguageSearch': false,
		},
	};

	if (folderParam) {
		const { URI } = await import('./vs/base/common/uri.js');
		options.folderUri = URI.parse(folderParam);
	}

	create(document.body, options);

	console.log('[SideX] Workbench created' + (folderParam ? ` (folder: ${folderParam})` : ''));
}

boot().catch((err) => {
	console.error('[SideX] Fatal:', err);
	document.body.innerHTML = `<div style="padding:40px;color:#ccc;font-family:system-ui">
		<h2>SideX failed to start</h2>
		<pre style="color:#f88;white-space:pre-wrap">${(err as Error)?.stack || err}</pre>
	</div>`;
});
