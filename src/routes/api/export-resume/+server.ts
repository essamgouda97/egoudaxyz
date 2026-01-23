import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import puppeteer from 'puppeteer';

export const POST: RequestHandler = async ({ url }) => {
	let browser;
	try {
		const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
		browser = await puppeteer.launch({
			headless: true,
			executablePath: executablePath || undefined,
			args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
		});

		const page = await browser.newPage();
		const origin = url.origin;

		await page.goto(`${origin}/resume-print`, {
			waitUntil: 'networkidle0',
			timeout: 30000
		});

		await page.waitForSelector('[aria-label="Resume"]');

		// Inject print styles
		await page.addStyleTag({
			content: `
				html, body {
					background: white !important;
				}

				header {
					display: none !important;
				}

				img:not([src="/logo.png"]) {
					display: none !important;
				}

				img[src="/logo.png"] {
					display: inline-block !important;
				}

				[class*="avatar"] {
					display: block !important;
				}

				button {
					display: none !important;
				}

				a[href*="github"] {
					display: none !important;
				}

				[data-slot="accordion-trigger"] svg {
					display: none !important;
				}

				*, h1, h2, h3, h4, h5, h6, p, li, span, div {
					color: #000000 !important;
				}

				[data-slot="accordion-item"] {
					page-break-inside: avoid !important;
					break-inside: avoid !important;
					margin-bottom: 12px !important;
				}

				h3 {
					page-break-after: avoid !important;
					break-after: avoid !important;
				}

				* {
					background: transparent !important;
				}

				body, [aria-label="Resume"] {
					background: white !important;
				}

				.space-y-6 > * + * {
					margin-top: 16px !important;
				}

				.space-y-4 > * + * {
					margin-top: 8px !important;
				}

				.flex.justify-between {
					display: flex !important;
					justify-content: space-between !important;
					align-items: flex-start !important;
					gap: 16px !important;
				}

				.flex.justify-between p:first-child {
					flex: 1 !important;
					min-width: 0 !important;
				}

				.flex.justify-between p:last-child {
					white-space: nowrap !important;
					flex-shrink: 0 !important;
					min-width: max-content !important;
				}
			`
		});

		// Open all accordions
		await page.evaluate(() => {
			const triggers = document.querySelectorAll('[data-slot="accordion-trigger"]');
			triggers.forEach((trigger) => (trigger as HTMLElement).click());
		});

		await new Promise((resolve) => setTimeout(resolve, 1000));

		// Clean up and prepare for print
		await page.evaluate(() => {
			const triggers = document.querySelectorAll('[data-slot="accordion-trigger"]');
			triggers.forEach((trigger) => {
				(trigger as HTMLElement).style.setProperty('display', 'flex', 'important');
				(trigger as HTMLElement).style.setProperty('visibility', 'visible', 'important');
				(trigger as HTMLElement).style.setProperty('opacity', '1', 'important');
				(trigger as HTMLElement).style.marginBottom = '8px';
			});

			// Add email as plain text
			const emailBtn = Array.from(document.querySelectorAll('button')).find(
				(btn) => btn.textContent?.includes('Email')
			);
			if (emailBtn) {
				const span = document.createElement('span');
				span.textContent = 'essamgouda97@gmail.com';
				span.style.fontSize = '14px';
				emailBtn.parentNode?.replaceChild(span, emailBtn);
			}
		});

		const pdf = await page.pdf({
			format: 'A4',
			printBackground: false,
			margin: {
				top: '10mm',
				right: '10mm',
				bottom: '10mm',
				left: '10mm'
			},
			preferCSSPageSize: false,
			displayHeaderFooter: false
		});

		await browser.close();

		return new Response(Buffer.from(pdf), {
			headers: {
				'Content-Type': 'application/pdf',
				'Content-Disposition': 'attachment; filename="Essam_Gouda_Resume.pdf"'
			}
		});
	} catch (error) {
		console.error('PDF generation error:', error);
		if (browser) await browser.close();
		return json({ error: 'Failed to generate PDF' }, { status: 500 });
	}
};
