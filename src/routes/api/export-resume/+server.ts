import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import puppeteer from 'puppeteer';

export const POST: RequestHandler = async ({ request, url }) => {
	try {
		const browser = await puppeteer.launch({
			headless: true,
			args: ['--no-sandbox', '--disable-setuid-sandbox']
		});

		const page = await browser.newPage();

		// Get the origin from the request
		const origin = url.origin;
		
		// Navigate to the dedicated resume print page
		await page.goto(`${origin}/resume-print`, {
			waitUntil: 'networkidle0',
			timeout: 30000
		});

		// Wait for the resume section to load
		await page.waitForSelector('[aria-label="Resume"]');

		// Inject CSS for clean print output
		await page.addStyleTag({
			content: `
				/* Force white background everywhere */
				html, body {
					background: white !important;
				}
				
				/* Hide navbar */
				header {
					display: none !important;
				}
				
				/* Hide all images except logo.png */
				img:not([src="/logo.png"]) {
					display: none !important;
				}
				
				/* Keep logo visible */
				img[src="/logo.png"] {
					display: inline-block !important;
				}
				
				/* Show avatar with logo */
				[class*="avatar"] {
					display: block !important;
				}
				
				/* Hide export button */
				button:has(svg[viewBox="0 0 24 24"]) {
					display: none !important;
				}
				
				/* Hide accordion expand/collapse icons */
				[data-slot="accordion-trigger"] svg {
					display: none !important;
				}
				
				/* Make all text black for ATS */
				*, h1, h2, h3, h4, h5, h6, p, li, span, div {
					color: #000000 !important;
				}
				
				/* Page break control */
				[data-slot="accordion-item"] {
					page-break-inside: avoid !important;
					break-inside: avoid !important;
					margin-bottom: 12px !important;
				}
				
				h3 {
					page-break-after: avoid !important;
					break-after: avoid !important;
				}
				
				/* Remove backgrounds */
				* {
					background: transparent !important;
				}
				
				body, [aria-label="Resume"] {
					background: white !important;
				}
				
				/* Compact spacing */
				.space-y-6 > * + * {
					margin-top: 16px !important;
				}
				
				.space-y-4 > * + * {
					margin-top: 8px !important;
				}
				
				/* Fix education section flex layout */
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

		// Open all accordions and clean up elements
		await page.evaluate(() => {
			// Open all accordion items
			const triggers = document.querySelectorAll('[data-slot="accordion-trigger"]');
			triggers.forEach((trigger) => {
				(trigger as HTMLElement).click();
			});
		});

		// Wait for accordions to fully expand
		await new Promise((resolve) => setTimeout(resolve, 2000));

		// Force accordion triggers to be visible and clean up buttons
		await page.evaluate(() => {
			// Force all accordion triggers to be visible
			const triggers = document.querySelectorAll('[data-slot="accordion-trigger"]');
			triggers.forEach((trigger) => {
				(trigger as HTMLElement).style.setProperty('display', 'flex', 'important');
				(trigger as HTMLElement).style.setProperty('visibility', 'visible', 'important');
				(trigger as HTMLElement).style.setProperty('opacity', '1', 'important');
				(trigger as HTMLElement).style.marginBottom = '8px';
			});
			
			// Convert email button to clickable link
			const emailBtn = Array.from(document.querySelectorAll('button')).find(
				(btn) => btn.textContent?.includes('Email')
			);
			if (emailBtn) {
				const link = document.createElement('a');
				link.href = 'mailto:essamgouda97@gmail.com';
				link.textContent = 'essamgouda97@gmail.com';
				link.style.color = '#000000';
				link.style.textDecoration = 'underline';
				link.style.fontSize = '14px';
				emailBtn.parentNode?.replaceChild(link, emailBtn);
			}
			
			// Make GitHub button clean
			const githubBtn = Array.from(document.querySelectorAll('a[href*="github"]')).find(
				(btn) => btn.textContent?.includes('GitHub')
			);
			if (githubBtn) {
				(githubBtn as HTMLElement).style.background = 'transparent';
				(githubBtn as HTMLElement).style.border = 'none';
				(githubBtn as HTMLElement).style.padding = '0';
				(githubBtn as HTMLElement).style.color = '#000000';
			}
		});

		// Generate PDF
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

		// Return the PDF as a blob
		return new Response(pdf, {
			headers: {
				'Content-Type': 'application/pdf',
				'Content-Disposition': 'attachment; filename="Essam_Gouda_Resume.pdf"'
			}
		});
	} catch (error) {
		console.error('PDF generation error:', error);
		return json({ error: 'Failed to generate PDF' }, { status: 500 });
	}
};
