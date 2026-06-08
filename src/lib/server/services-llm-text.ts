export const servicesLlmText = `# egouda.xyz

Homepage: https://egouda.xyz/services
Portfolio: https://egouda.xyz/portfolio
Contact: me@egouda.xyz
Languages: English and Arabic

## What This Page Is

Essam Gouda is an agents consultant. The services homepage is an embedded DeepSeek-backed intake chat for people who want an agentic pipeline designed around their real workflow.

The visitor should:
1. Chat with Essam's intake agent directly on the page.
2. Answer one workflow question at a time.
3. Let the agent challenge vague or inconsistent answers.
4. Continue until the agent has enough detail to generate an agentic POC package.
5. Leave a reply email.
6. Submit the package so Essam receives the full transcript and Markdown/HTML report.

The chat transcript is persisted in the visitor's browser localStorage and then sent with the package submission.

## Agent Behavior

The intake agent should:
- Interview one question at a time.
- Match the interviewee's language, tone, vocabulary, and level of detail.
- Find vague answers, contradictions, unclear owners, missing handoffs, and mismatched goals.
- Slow down when answers conflict, explain the mismatch neutrally, and ask for confirmation.
- Infer likely pain points when the user cannot name them clearly.
- Make the value of an agentic pipeline tangible while interviewing.
- Produce a Markdown and HTML-ready package Essam can use to design a free POC and potentially help build the pipeline.

## Runtime Configuration

- Chat model: DeepSeek chat completions via DEEPSEEK_API_KEY.
- Default model: deepseek-v4-pro, overridable with DEEPSEEK_MODEL. DEEPSEEK_API_URL is only a private test override. DEEPSEEK_TIMEOUT_MS defaults to 30000.
- Chat tools: DeepSeek receives controlled function tools when configured. fetch_web_page uses Cloudflare Browser Run Markdown via CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID. web_search is disabled unless BRAVE_SEARCH_API_KEY or SERVICES_WEB_SEARCH_API_URL is configured. Tool results stay server-side and are compacted before being sent back to the model. SERVICES_TOOL_TIMEOUT_MS defaults to 12000.
- The chat returns a draft POC package on each turn. Submission remains locked until ready=true and the final Markdown package is complete.
- Deterministic testing: SERVICES_CHAT_MODE=mock. Otherwise DEEPSEEK_API_KEY is required, including in local dev.
- Email delivery: Cloudflare Email Service via the CLOUDFLARE_EMAIL_WORKER_URL relay and CLOUDFLARE_EMAIL_WORKER_SECRET. The relay uses a Cloudflare Worker send_email binding. REST fallback uses CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID. REPORT_EMAIL_FROM and REPORT_EMAIL_TO default to me@egouda.xyz. CLOUDFLARE_EMAIL_API_URL is only a private test override. CLOUDFLARE_EMAIL_TIMEOUT_MS defaults to 20000.
- Delivered emails include Markdown and HTML report attachments.
- Deterministic email UI testing: REPORT_EMAIL_MODE=mock.
- If email delivery is not configured, the page still prepares the report and exposes a mail draft/manual handoff.
- Public intake endpoints are rate-limited by client address.

## Arabic Summary

هذه الصفحة هي الصفحة الرئيسية للخدمات. الهدف بسيط: يتكلم الزائر مباشرة مع وكيل intake مبني على DeepSeek، يجاوب على أسئلة سير العمل، والوكيل يتحدّى الإجابات المبهمة أو المتناقضة حتى يجمع تفاصيل كافية لتجهيز POC package.

المحادثة تحفظ في localStorage داخل المتصفح، ثم تُرسل مع التقرير إلى عصام عند ترك إيميل للمتابعة. إذا لم يكن إرسال الإيميل من السيرفر مضبوطًا بعد، تبقى الباكدج جاهزة للنسخ أو الإرسال اليدوي.
`;
