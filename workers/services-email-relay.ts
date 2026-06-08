type EmailAddress = string | { address?: string; email?: string; name?: string };

type Attachment = {
    content: string;
    filename: string;
    type: string;
    disposition: "attachment" | "inline";
    contentId?: string;
};

type EmailPayload = {
    from?: EmailAddress;
    to?: string | string[];
    reply_to?: string;
    replyTo?: string;
    subject?: string;
    html?: string;
    text?: string;
    attachments?: Attachment[];
};

type SendEmailBinding = {
    send(message: {
        from: string | { email: string; name?: string };
        to: string | string[];
        replyTo?: string;
        subject: string;
        html?: string;
        text?: string;
        attachments?: Attachment[];
    }): Promise<{ messageId?: string }>;
};

type Env = {
    SEND_EMAIL: SendEmailBinding;
    EMAIL_RELAY_SECRET?: string;
};

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        if (request.method !== "POST") {
            return json({ success: false, error: "Method not allowed." }, 405);
        }

        if (!env.EMAIL_RELAY_SECRET) {
            return json({ success: false, error: "Email relay secret is not configured." }, 500);
        }

        if (request.headers.get("Authorization") !== `Bearer ${env.EMAIL_RELAY_SECRET}`) {
            return json({ success: false, error: "Unauthorized." }, 401);
        }

        let payload: EmailPayload;
        try {
            payload = await request.json();
        } catch {
            return json({ success: false, error: "Invalid JSON body." }, 400);
        }

        const parsed = parsePayload(payload);
        if ("error" in parsed) {
            return json({ success: false, error: parsed.error }, 400);
        }

        try {
            const result = await env.SEND_EMAIL.send(parsed.message);
            return json({ success: true, result });
        } catch (error) {
            const providerError = error instanceof Error
                ? {
                    code: "code" in error ? String(error.code) : "E_EMAIL_SEND_FAILED",
                    message: error.message,
                }
                : { code: "E_EMAIL_SEND_FAILED", message: "Email sending failed." };

            return json({ success: false, error: providerError }, statusForProviderCode(providerError.code));
        }
    },
};

function parsePayload(payload: EmailPayload):
    | {
        message: {
            from: string | { email: string; name?: string };
            to: string | string[];
            replyTo?: string;
            subject: string;
            html?: string;
            text?: string;
            attachments?: Attachment[];
        };
    }
    | { error: string } {
    const from = normalizeAddress(payload.from);
    const to = payload.to;
    const subject = typeof payload.subject === "string" ? payload.subject.trim() : "";
    const html = typeof payload.html === "string" ? payload.html : undefined;
    const text = typeof payload.text === "string" ? payload.text : undefined;
    const replyTo = typeof payload.replyTo === "string"
        ? payload.replyTo.trim()
        : typeof payload.reply_to === "string"
        ? payload.reply_to.trim()
        : undefined;

    if (!from) return { error: "A valid from address is required." };
    if (!isValidRecipient(to)) return { error: "A valid to address is required." };
    if (!subject) return { error: "Subject is required." };
    if (!html && !text) return { error: "Either html or text content is required." };

    return {
        message: {
            from,
            to,
            replyTo,
            subject,
            html,
            text,
            attachments: normalizeAttachments(payload.attachments),
        },
    };
}

function normalizeAddress(address: EmailAddress | undefined) {
    if (typeof address === "string") {
        const email = address.trim();
        return email ? email : null;
    }

    if (!address || typeof address !== "object") return null;
    const email = typeof address.email === "string"
        ? address.email.trim()
        : typeof address.address === "string"
        ? address.address.trim()
        : "";
    const name = typeof address.name === "string" ? address.name.trim() : "";

    if (!email) return null;
    return name ? { email, name } : email;
}

function isValidRecipient(to: EmailPayload["to"]) {
    if (typeof to === "string") return Boolean(to.trim());
    return Array.isArray(to) && to.length > 0 && to.every((recipient) => typeof recipient === "string" && recipient.trim());
}

function normalizeAttachments(attachments: Attachment[] | undefined) {
    if (!Array.isArray(attachments)) return undefined;
    return attachments.filter((attachment) =>
        attachment &&
        typeof attachment.content === "string" &&
        typeof attachment.filename === "string" &&
        typeof attachment.type === "string" &&
        (attachment.disposition === "attachment" || attachment.disposition === "inline")
    );
}

function statusForProviderCode(code: string) {
    switch (code) {
        case "E_VALIDATION_ERROR":
        case "E_FIELD_MISSING":
        case "E_SENDER_NOT_VERIFIED":
        case "E_RECIPIENT_NOT_ALLOWED":
        case "E_SENDER_DOMAIN_NOT_AVAILABLE":
        case "E_CONTENT_TOO_LARGE":
            return 400;
        case "E_RATE_LIMIT_EXCEEDED":
        case "E_DAILY_LIMIT_EXCEEDED":
            return 429;
        default:
            return 502;
    }
}

function json(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "no-store",
        },
    });
}
