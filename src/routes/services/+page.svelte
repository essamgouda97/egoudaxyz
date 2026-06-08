<script lang="ts">
    import { onMount, tick } from "svelte";
    import { browser } from "$app/environment";
    import MarkdownIt from "markdown-it";
    import { Badge } from "$lib/components/ui/badge";
    import { Button } from "$lib/components/ui/button";
    import { servicesLanguage } from "$lib/stores/services-language.svelte";
    import type { PageData } from "./$types";
    import {
        ArrowLeft,
        ArrowRight,
        Bot,
        Check,
        CircleStop,
        Copy,
        Mail,
        Mic,
        MicOff,
        MessageSquareText,
        RotateCcw,
        Send,
        Sparkles,
    } from "@lucide/svelte";

    let { data }: { data: PageData } = $props();

    const storageKey = "egouda-services-chat-v1";
    const markdown = new MarkdownIt({
        html: false,
        linkify: true,
        breaks: true,
    });

    type LanguageKey = "en" | "ar";
    type ChatRole = "assistant" | "user";

    type ChatMessage = {
        id: string;
        role: ChatRole;
        content: string;
        createdAt: string;
        learned?: string | null;
        question?: string | null;
        suggestedReplies?: string[];
        usedTools?: string[];
    };

    type PocPackage = {
        title: string;
        markdown: string;
        html?: string;
        ready: boolean;
        updatedAt?: string;
    };

    type StoredChat = {
        messages: ChatMessage[];
        package: PocPackage | null;
        signalProgress?: boolean[];
        visitorEmail: string;
        updatedAt: string;
    };

    type SpeechRecognitionResult = {
        readonly isFinal: boolean;
        readonly [index: number]: { readonly transcript: string };
    };

    type SpeechRecognitionEvent = Event & {
        readonly resultIndex: number;
        readonly results: {
            readonly length: number;
            readonly [index: number]: SpeechRecognitionResult;
        };
    };

    type SpeechRecognitionInstance = EventTarget & {
        continuous: boolean;
        interimResults: boolean;
        lang: string;
        onresult: ((event: SpeechRecognitionEvent) => void) | null;
        onend: (() => void) | null;
        onerror: (() => void) | null;
        start: () => void;
        stop: () => void;
    };

    type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

    const pageCopy = {
        en: {
            lang: "en",
            dir: "ltr",
            metaTitle: "Agentic Pipeline Intake | Essam Gouda",
            metaDescription:
                "Chat with Essam Gouda's agentic pipeline intake agent. It grills your workflow, saves the transcript locally, and packages a POC brief for follow-up.",
            badges: ["Agents consultant", "Free design POC"],
            h1: "Let your workflow brief my agent.",
            sub:
                "Answer the grill. When the POC package is ready, leave your email and it sends me the transcript plus the brief.",
            status: "DeepSeek intake",
            transcriptSaved: "Transcript saves in this browser.",
            chatHeading: "Pipeline intake",
            chatSub:
                "One question at a time. It looks for contradictions, vague handoffs, missing owners, and the smallest useful POC.",
            inputLabel: "Reply",
            inputPlaceholder: "Describe the workflow you want to improve...",
            send: "Send",
            thinking: "Thinking",
            working: "Working",
            workingSteps: ["Reading context", "Drafting brief"],
            stop: "Stop",
            stopped: "Stopped. Send a shorter answer or try again.",
            signal: "Planning agent",
            nextQuestion: "Next question",
            tapToAnswer: "Tap to answer",
            usedTools: "Checked public context",
            dictate: "Dictate",
            stopDictation: "Stop dictation",
            dictating: "Listening",
            reset: "Reset chat",
            copied: "Copied",
            copyReport: "Copy report",
            emailHeading: "Send the POC package",
            emailSub:
                "Leave an email so I can reply after reviewing the transcript and package.",
            emailLabel: "Your email",
            emailPlaceholder: "you@company.com",
            submit: "Send package",
            submitting: "Sending",
            submitted: "Package prepared",
            submitConfigured:
                "The package was sent. I have the transcript, report, and reply email.",
            submitFallback:
                "The package is ready locally. Email delivery is not configured yet, so use the mail draft or copied report.",
            packageHeading: "POC package",
            packageEmpty:
                "The draft package appears here as the chat develops.",
            packageProgress: "Signals collected",
            packageExpectation:
                "Ends at 6/6, then I ask for your email. Most briefs take 6-8 short answers.",
            packageSections: ["Context", "Workflow", "Pain", "Data", "Boundaries", "POC"],
            viewDraft: "View draft Markdown",
            draftPrefix: "Drafting as you answer",
            mailDraft: "Open mail draft",
            portfolio: "Check my Portfolio",
            configMissing:
                "The intake agent is temporarily unavailable. Please try again in a moment.",
            genericError:
                "I could not get a clean response. Send that again.",
            intro:
                "I am Essam's intake agent. I will grill the workflow until there is enough signal for a free agentic design POC. Start with the workflow you want to improve: who does it, what triggers it, and what makes it painful today?",
            starterLearned: "I’ll build the POC package as you answer.",
            starterQuestion: "Which workflow should we improve first?",
            starterReplies: ["Customer support intake", "Ops handoff", "Document review"],
            readyPrefix: "Ready for package",
            assistantLabel: "Essam intake agent",
            visitorLabel: "You",
        },
        ar: {
            lang: "ar",
            dir: "rtl",
            metaTitle: "Agentic Pipeline Intake | عصام جودة",
            metaDescription:
                "اتكلم مع وكيل عصام جودة لتصميم AI pipeline. سيحلل سير العمل، يحفظ المحادثة محليًا، ويجهز POC brief للمتابعة.",
            badges: ["استشارات AI Agents", "تصميم POC مجاني"],
            h1: "خلّي شغلك يشرح نفسه للـ AI.",
            sub:
                "جاوب على الأسئلة. لما الباكدج تجهز، سيب إيميلك عشان أبعتلك بعد ما أراجع الترانسكريبت والبريف.",
            status: "DeepSeek intake",
            transcriptSaved: "المحادثة محفوظة في المتصفح ده.",
            chatHeading: "تحليل الـ Pipeline",
            chatSub:
                "سؤال واحد كل مرة. بيدور على التناقضات، التسليمات المبهمة، ملاك القرار الغايبين، وأصغر POC مفيد.",
            inputLabel: "ردّك",
            inputPlaceholder: "اشرح سير العمل اللي عايز تحسّنه...",
            send: "إرسال",
            thinking: "يفكر",
            working: "شغال",
            workingSteps: ["بيقرأ السياق", "بيجهز البريف"],
            stop: "إيقاف",
            stopped: "وقفت الرد. ابعت إجابة أقصر أو جرّب تاني.",
            signal: "وكيل التخطيط",
            nextQuestion: "السؤال الجاي",
            tapToAnswer: "اضغط للرد",
            usedTools: "راجع سياق عام",
            dictate: "إملاء",
            stopDictation: "إيقاف الإملاء",
            dictating: "بيسمع",
            reset: "ابدأ من جديد",
            copied: "تم النسخ",
            copyReport: "انسخ التقرير",
            emailHeading: "ابعث POC package",
            emailSub:
                "سيب إيميلك عشان أقدر أرد عليك بعد مراجعة المحادثة والباكدج.",
            emailLabel: "إيميلك",
            emailPlaceholder: "you@company.com",
            submit: "إرسال الباكدج",
            submitting: "جاري الإرسال",
            submitted: "الباكدج جاهزة",
            submitConfigured:
                "تم إرسال الباكدج. وصلني الترانسكريبت، التقرير، وإيميل الرد.",
            submitFallback:
                "الباكدج جاهزة محليًا. إرسال الإيميل من السيرفر غير مضبوط حاليًا، استخدم مسودة الإيميل أو انسخ التقرير.",
            packageHeading: "POC package",
            packageEmpty:
                "مسودة الباكدج بتظهر هنا مع تطور المحادثة.",
            packageProgress: "الإشارات اللي اتجمعت",
            packageExpectation:
                "بتخلص عند ٦/٦، وبعدها هطلب الإيميل. غالبًا ٦-٨ إجابات قصيرة.",
            packageSections: ["السياق", "السير", "الألم", "الداتا", "الحدود", "الـ POC"],
            viewDraft: "اعرض مسودة Markdown",
            draftPrefix: "مسودة بتتحدث مع إجاباتك",
            mailDraft: "افتح مسودة إيميل",
            portfolio: "شوف البورتفوليو",
            configMissing:
                "وكيل التحليل غير متاح مؤقتًا. جرّب تاني بعد لحظة.",
            genericError:
                "الرد طلع مش واضح. ابعته تاني.",
            intro:
                "أنا وكيل عصام للتحليل الأولي. هسألك لحد ما يكون عندي تفاصيل كفاية لتصميم POC مجاني لـ agentic pipeline. ابدأ بسير العمل اللي عايز تحسّنه: مين بيعمله، إيه اللي بيبدأه، وإيه المؤلم فيه دلوقتي؟",
            starterLearned: "هجهز الباكدج وإنت بتجاوب.",
            starterQuestion: "أنهي workflow نبدأ نحسّنه؟",
            starterReplies: ["دعم العملاء", "تسليمات العمليات", "مراجعة مستندات"],
            readyPrefix: "جاهزة كباكدج",
            assistantLabel: "وكيل عصام",
            visitorLabel: "أنت",
        },
    } as const;

    const packageSectionNeedles = [
        ["business snapshot"],
        ["current workflow"],
        ["pain and opportunity"],
        ["tools, data, and access"],
        ["human review boundaries"],
        ["recommended free design poc"],
    ] as const;
    const emptySignalProgress = () => packageSectionNeedles.map(() => false);

    const selectedLanguage = $derived<LanguageKey>(
        browser ? servicesLanguage.current : data.language,
    );
    const selectedCopy = $derived(pageCopy[selectedLanguage]);

    let messages = $state<ChatMessage[]>([]);
    let draft = $state("");
    let visitorEmail = $state("");
    let pocPackage = $state<PocPackage | null>(null);
    let signalProgress = $state<boolean[]>(emptySignalProgress());
    let hydrated = $state(false);
    let isSending = $state(false);
    let isSubmitting = $state(false);
    let copiedReport = $state(false);
    let submitMessage = $state("");
    let mailtoHref = $state("");
    let chatViewport: HTMLDivElement | undefined = $state();
    let canDictate = $state(false);
    let isDictating = $state(false);
    let speechRecognition: SpeechRecognitionInstance | null = null;
    let activeChatRequest: AbortController | null = null;

    const canSend = $derived(draft.trim().length > 0 && !isSending);
    const canSubmit = $derived(
        Boolean(pocPackage?.ready) && isEmail(visitorEmail) && !isSubmitting && !isSending,
    );
    const reportMarkdown = $derived(buildLocalMarkdown());
    const packageProgress = $derived(getPackageProgress(signalProgress, selectedLanguage));
    const completedPackageItems = $derived(packageProgress.filter((item) => item.complete).length);
    const packageProgressPercent = $derived(
        packageProgress.length ? Math.round((completedPackageItems / packageProgress.length) * 100) : 0,
    );

    onMount(() => {
        loadStoredChat();
        setupDictation();
        hydrated = true;
    });

    $effect(() => {
        if (!browser || !hydrated) return;

        const payload: StoredChat = {
            messages,
            package: pocPackage,
            signalProgress,
            visitorEmail,
            updatedAt: new Date().toISOString(),
        };

        localStorage.setItem(storageKey, JSON.stringify(payload));
    });

    $effect(() => {
        messages.length;
        if (!browser || !chatViewport) return;
        tick().then(() => {
            chatViewport?.scrollTo({ top: chatViewport.scrollHeight, behavior: "smooth" });
        });
    });

    function createMessage(
        role: ChatRole,
        content: string,
        options: Partial<Pick<ChatMessage, "learned" | "question" | "suggestedReplies" | "usedTools">> = {},
    ): ChatMessage {
        return {
            id: crypto.randomUUID(),
            role,
            content,
            createdAt: new Date().toISOString(),
            ...options,
        };
    }

    function setupDictation() {
        if (!browser) return;
        const windowWithSpeech = window as typeof window & {
            SpeechRecognition?: SpeechRecognitionConstructor;
            webkitSpeechRecognition?: SpeechRecognitionConstructor;
        };
        const Recognition = windowWithSpeech.SpeechRecognition || windowWithSpeech.webkitSpeechRecognition;

        if (!Recognition) return;

        canDictate = true;
        speechRecognition = new Recognition();
        speechRecognition.continuous = false;
        speechRecognition.interimResults = true;
        speechRecognition.lang = selectedLanguage === "ar" ? "ar-EG" : "en-US";
        speechRecognition.onresult = (event) => {
            let transcript = "";
            for (let index = event.resultIndex; index < event.results.length; index += 1) {
                transcript += event.results[index][0]?.transcript || "";
            }
            if (!transcript.trim()) return;
            draft = `${draft ? `${draft.trimEnd()} ` : ""}${transcript.trim()}`;
        };
        speechRecognition.onend = () => {
            isDictating = false;
        };
        speechRecognition.onerror = () => {
            isDictating = false;
        };
    }

    function initialMessage(language: LanguageKey): ChatMessage {
        return createMessage("assistant", pageCopy[language].intro, {
            learned: pageCopy[language].starterLearned,
            question: pageCopy[language].starterQuestion,
            suggestedReplies: [...pageCopy[language].starterReplies],
        });
    }

    function loadStoredChat() {
        if (!browser) return;

        try {
            const raw = localStorage.getItem(storageKey);
            if (!raw) {
                messages = [initialMessage(selectedLanguage)];
                return;
            }

            const parsed = JSON.parse(raw) as Partial<StoredChat>;
            messages = Array.isArray(parsed.messages) && parsed.messages.length > 0
                ? parsed.messages.filter((message) =>
                    (message.role === "assistant" || message.role === "user") &&
                    typeof message.content === "string",
                )
                : [initialMessage(selectedLanguage)];
            pocPackage = parsed.package?.markdown ? parsed.package as PocPackage : null;
            signalProgress = normalizeStoredProgress(parsed.signalProgress);
            if (pocPackage?.markdown) {
                signalProgress = mergeSignalProgress(signalProgress, pocPackage.markdown, pocPackage.ready);
            }
            visitorEmail = typeof parsed.visitorEmail === "string" ? parsed.visitorEmail : "";
        } catch {
            messages = [initialMessage(selectedLanguage)];
        }
    }

    async function sendMessage(override?: string) {
        const content = (override ?? draft).trim();
        if (!content || isSending) return;

        const nextMessages = [...messages, createMessage("user", content)];
        messages = nextMessages;
        draft = "";
        isSending = true;
        submitMessage = "";
        mailtoHref = "";
        const controller = new AbortController();
        activeChatRequest = controller;

        try {
            const response = await fetch("/api/services-chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                signal: controller.signal,
                body: JSON.stringify({
                    language: selectedLanguage,
                    messages: nextMessages,
                }),
            });

            const result = await response.json();

            if (result?.code === "missing_deepseek_key") {
                messages = [...nextMessages, createMessage("assistant", selectedCopy.configMissing)];
                return;
            }

            if (!response.ok) {
                const message = result?.message || selectedCopy.genericError;
                messages = [...nextMessages, createMessage("assistant", message)];
                return;
            }

            const assistantMessage = typeof result.assistantMessage === "string"
                ? result.assistantMessage
                : selectedCopy.genericError;
            const suggestedReplies = Array.isArray(result.suggestedReplies)
                ? result.suggestedReplies.filter((item: unknown) => typeof item === "string").slice(0, 3)
                : [];
            const usedTools = Array.isArray(result.usedTools)
                ? result.usedTools.filter((item: unknown) => typeof item === "string").slice(0, 3)
                : [];

            messages = [
                ...nextMessages,
                createMessage("assistant", assistantMessage, {
                    learned: typeof result.learned === "string" ? result.learned : null,
                    question: typeof result.question === "string" ? result.question : null,
                    suggestedReplies,
                    usedTools,
                }),
            ];

            const packageMarkdown = typeof result.packageMarkdown === "string" && result.packageMarkdown
                ? result.packageMarkdown
                : typeof result.draftPackageMarkdown === "string"
                ? result.draftPackageMarkdown
                : "";

            if (packageMarkdown) {
                pocPackage = {
                    title: result.packageTitle || "Agentic pipeline POC package",
                    markdown: packageMarkdown,
                    html: typeof result.packageHtml === "string" ? result.packageHtml : undefined,
                    ready: result.ready === true && Boolean(result.packageMarkdown),
                    updatedAt: new Date().toISOString(),
                };
                signalProgress = mergeSignalProgress(signalProgress, packageMarkdown, pocPackage.ready);
            }
        } catch (error) {
            messages = [
                ...nextMessages,
                createMessage(
                    "assistant",
                    isAbortError(error) ? selectedCopy.stopped : selectedCopy.genericError,
                ),
            ];
        } finally {
            if (activeChatRequest === controller) {
                activeChatRequest = null;
                isSending = false;
            }
        }
    }

    function handleKeydown(event: KeyboardEvent) {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }
    }

    function sendSuggestedReply(reply: string) {
        if (isSending) return;
        sendMessage(reply);
    }

    function stopResponse() {
        activeChatRequest?.abort();
    }

    function toggleDictation() {
        if (!speechRecognition || !canDictate) return;

        speechRecognition.lang = selectedLanguage === "ar" ? "ar-EG" : "en-US";
        if (isDictating) {
            speechRecognition.stop();
            isDictating = false;
            return;
        }

        try {
            speechRecognition.start();
            isDictating = true;
        } catch {
            isDictating = false;
        }
    }

    function renderAssistantMarkdown(content: string) {
        return markdown.render(content);
    }

    async function submitPackage() {
        if (!canSubmit || !pocPackage) return;

        isSubmitting = true;
        submitMessage = "";
        mailtoHref = "";

        let stored: StoredChat | undefined;
        if (browser) {
            try {
                stored = JSON.parse(localStorage.getItem(storageKey) || "{}") as StoredChat;
            } catch {
                stored = undefined;
            }
        }

        const storedMessages = stored?.messages?.length ? stored.messages : [];
        const transcript = storedMessages.length ? storedMessages : messages;

        try {
            const response = await fetch("/api/services-package", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    language: selectedLanguage,
                    visitorEmail,
                    transcript,
                    packageMarkdown: pocPackage.markdown,
                    packageHtml: pocPackage.html,
                    source: "services-chat",
                }),
            });

            const result = await response.json();
            mailtoHref = !result.sent && typeof result.mailtoHref === "string" ? result.mailtoHref : "";
            submitMessage = result.sent
                ? selectedCopy.submitConfigured
                : selectedCopy.submitFallback;

            if (!response.ok && result.message) {
                submitMessage = result.message;
            }
        } catch {
            submitMessage = selectedCopy.genericError;
        } finally {
            isSubmitting = false;
        }
    }

    async function copyReport() {
        try {
            await navigator.clipboard.writeText(reportMarkdown);
            copiedReport = true;
            setTimeout(() => {
                copiedReport = false;
            }, 2200);
        } catch {
            window.prompt("Copy report", reportMarkdown);
        }
    }

    function resetChat() {
        activeChatRequest?.abort();
        activeChatRequest = null;
        messages = [initialMessage(selectedLanguage)];
        draft = "";
        pocPackage = null;
        signalProgress = emptySignalProgress();
        visitorEmail = "";
        submitMessage = "";
        mailtoHref = "";
        isSending = false;
        if (browser) {
            localStorage.removeItem(storageKey);
        }
    }

    function buildLocalMarkdown() {
        const lines = [
            "# Agentic POC Package",
            "",
            `Contact: ${visitorEmail || "not provided yet"}`,
            `Generated: ${new Date().toISOString()}`,
            "",
            "## Package",
            "",
            pocPackage?.markdown || "Package is not ready yet.",
            "",
            "## Full Transcript",
            "",
            ...messages.map((message) => [
                `### ${message.role === "user" ? "Visitor" : "Essam intake agent"}`,
                "",
                message.content,
                "",
            ].join("\n")),
        ];

        return lines.join("\n");
    }

    function isEmail(value: string) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
    }

    function isAbortError(error: unknown) {
        return error instanceof DOMException && error.name === "AbortError";
    }

    function normalizeStoredProgress(value: unknown) {
        if (!Array.isArray(value)) return emptySignalProgress();
        return packageSectionNeedles.map((_, index) => value[index] === true);
    }

    function mergeSignalProgress(current: boolean[], markdownValue: string, ready = false) {
        if (ready) return packageSectionNeedles.map(() => true);
        const next = normalizeStoredProgress(current);
        packageSectionNeedles.forEach((needles, index) => {
            next[index] = next[index] || sectionIsComplete(markdownValue, needles);
        });
        return next;
    }

    function getPackageProgress(progressState: boolean[], language: LanguageKey) {
        const normalizedProgress = normalizeStoredProgress(progressState);
        return packageSectionNeedles.map((_, index) => ({
            label: pageCopy[language].packageSections[index],
            complete: normalizedProgress[index],
        }));
    }

    function sectionIsComplete(markdownValue: string, needles: readonly string[]) {
        const normalized = markdownValue.toLowerCase();
        const sectionIndex = needles
            .map((needle) => normalized.indexOf(needle))
            .find((index) => index >= 0);

        if (sectionIndex === undefined || sectionIndex < 0) return false;

        const section = markdownValue.slice(sectionIndex);
        const nextSection = section.search(/\n##\s+\d+\./);
        const body = (nextSection > 0 ? section.slice(0, nextSection) : section)
            .replace(/^.*$/m, "")
            .trim();

        return body.length > 35 && !/\btbd\b/i.test(body.slice(0, 260));
    }
</script>

<svelte:head>
    <title>{selectedCopy.metaTitle}</title>
    <meta name="description" content={selectedCopy.metaDescription} />
    <link rel="canonical" href="https://egouda.xyz/services" />
    <link rel="alternate" type="text/plain" href="https://egouda.xyz/llm.txt" />

    <meta property="og:title" content={selectedCopy.metaTitle} />
    <meta property="og:description" content={selectedCopy.metaDescription} />
    <meta property="og:url" content="https://egouda.xyz/services" />
    <meta property="og:image" content="https://egouda.xyz/og-image.png" />

    <meta name="twitter:title" content={selectedCopy.metaTitle} />
    <meta name="twitter:description" content={selectedCopy.metaDescription} />
    <meta name="twitter:image" content="https://egouda.xyz/og-image.png" />
</svelte:head>

<section
    class="mx-auto flex w-full max-w-[92rem] flex-col gap-7 py-6 md:py-10"
    lang={selectedCopy.lang}
    dir={selectedCopy.dir}
>
    <div class="grid gap-6 border-b pb-7">
        <div class="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{selectedCopy.badges[0]}</Badge>
            <Badge variant="outline">{selectedCopy.badges[1]}</Badge>
            <span class="inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs text-muted-foreground">
                <Sparkles class="size-3.5" />
                {selectedCopy.status}
            </span>
        </div>

        <div class="grid gap-3">
            <h1 class="max-w-4xl text-4xl font-bold leading-tight tracking-normal md:text-6xl">
                {selectedCopy.h1}
            </h1>
            <p class="max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
                {selectedCopy.sub}
            </p>
        </div>
    </div>

    <div class="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_21rem]">
        <section aria-labelledby="chat-heading" class="min-w-0">
            <div class="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h2 id="chat-heading" class="text-xl font-semibold">
                        {selectedCopy.chatHeading}
                    </h2>
                    <p class="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                        {selectedCopy.chatSub}
                    </p>
                </div>
                <Button variant="outline" size="sm" onclick={resetChat}>
                    <RotateCcw class="size-4" />
                    {selectedCopy.reset}
                </Button>
            </div>

            <div class="overflow-hidden rounded-lg border bg-background">
                <div
                    bind:this={chatViewport}
                    class="flex max-h-[68vh] min-h-[32rem] flex-col gap-4 overflow-y-auto p-4 md:p-5"
                    role="log"
                    aria-live="polite"
                    aria-relevant="additions text"
                    aria-atomic="false"
                    aria-labelledby="chat-heading"
                    aria-busy={isSending}
                >
                    {#each messages as message (message.id)}
                        <article
                            class={`flex gap-3 ${
                                message.role === "user"
                                    ? selectedLanguage === "ar" ? "justify-start" : "justify-end"
                                    : selectedLanguage === "ar" ? "justify-end" : "justify-start"
                            }`}
                            aria-label={message.role === "user" ? selectedCopy.visitorLabel : selectedCopy.assistantLabel}
                        >
                            {#if message.role === "assistant"}
                                <div class="mt-1 grid size-8 shrink-0 place-items-center rounded-md border bg-primary/5 text-primary">
                                    <Bot class="size-4" />
                                </div>
                            {/if}

                            {#if message.role === "assistant"}
                                {#if message.learned || message.question || message.suggestedReplies?.length}
                                    <div
                                        class="w-full max-w-[95%] rounded-lg border bg-card p-3 text-sm text-card-foreground shadow-sm md:max-w-[52rem] md:p-4"
                                        dir={selectedCopy.dir}
                                    >
                                        {#if message.usedTools?.length}
                                            <span class="mb-3 inline-flex rounded-full border bg-background px-2 py-1 text-[0.68rem] font-medium text-muted-foreground">
                                                {selectedCopy.usedTools}
                                            </span>
                                        {/if}

                                        {#if message.learned}
                                            <div class="rounded-md bg-muted/45 p-3">
                                                <p class="text-[0.7rem] font-semibold uppercase tracking-wide text-muted-foreground">
                                                    {selectedCopy.signal}
                                                </p>
                                                <p class="mt-1 leading-6">{message.learned}</p>
                                            </div>
                                        {/if}

                                        {#if message.question}
                                            <div class="mt-3 rounded-md border bg-background/75 p-3">
                                                <p class="text-[0.7rem] font-semibold uppercase tracking-wide text-muted-foreground">
                                                    {selectedCopy.nextQuestion}
                                                </p>
                                                <p class="mt-1 text-base font-semibold leading-7">
                                                    {message.question}
                                                </p>
                                            </div>
                                        {:else}
                                            <div class="assistant-markdown leading-6">
                                                {@html renderAssistantMarkdown(message.content)}
                                            </div>
                                        {/if}

                                        {#if message.suggestedReplies?.length}
                                            <div class="mt-3 flex flex-wrap gap-2" aria-label={selectedCopy.tapToAnswer}>
                                                {#each message.suggestedReplies as reply}
                                                    <button
                                                        type="button"
                                                        class="rounded-full border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-primary/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60"
                                                        disabled={isSending}
                                                        onclick={() => sendSuggestedReply(reply)}
                                                    >
                                                        {reply}
                                                    </button>
                                                {/each}
                                            </div>
                                        {/if}
                                    </div>
                                {:else}
                                    <div
                                        class="assistant-markdown w-full max-w-[95%] rounded-lg border bg-card px-4 py-3 text-sm leading-6 text-card-foreground shadow-sm md:max-w-[52rem]"
                                        dir={selectedCopy.dir}
                                    >
                                        {@html renderAssistantMarkdown(message.content)}
                                    </div>
                                {/if}
                            {:else}
                                <div
                                    class="max-w-[92%] whitespace-pre-wrap rounded-lg bg-primary px-4 py-3 text-sm leading-6 text-primary-foreground md:max-w-2xl"
                                    dir={selectedCopy.dir}
                                >
                                    {message.content}
                                </div>
                            {/if}
                        </article>
                    {/each}

                    {#if isSending}
                        <div class={`flex gap-3 ${selectedLanguage === "ar" ? "justify-end" : "justify-start"}`}>
                            <div class="mt-1 grid size-8 shrink-0 place-items-center rounded-md border bg-primary/5 text-primary">
                                <Bot class="size-4" />
                            </div>
                            <div
                                class="w-full max-w-[95%] rounded-lg border bg-card px-4 py-3 text-sm text-card-foreground shadow-sm md:max-w-[52rem]"
                                role="status"
                            >
                                <div class="flex items-center gap-2 font-medium">
                                    <span>{selectedCopy.working}</span>
                                    <span class="typing-dots" aria-hidden="true">
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                    </span>
                                </div>
                                <div class="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                                    {#each selectedCopy.workingSteps as step}
                                        <span class="rounded-full border bg-background px-2 py-1">{step}</span>
                                    {/each}
                                </div>
                            </div>
                        </div>
                    {/if}
                </div>

                <form
                    class="border-t p-3 md:p-4"
                    onsubmit={(event) => {
                        event.preventDefault();
                        sendMessage();
                    }}
                >
                    <label class="sr-only" for="services-chat-input">
                        {selectedCopy.inputLabel}
                    </label>
                    <div class="flex flex-col gap-3 sm:flex-row">
                        <textarea
                            id="services-chat-input"
                            bind:value={draft}
                            rows="3"
                            class="min-h-24 flex-1 resize-none rounded-md border bg-background px-3 py-2 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
                            placeholder={selectedCopy.inputPlaceholder}
                            onkeydown={handleKeydown}
                            dir={selectedCopy.dir}
                        ></textarea>
                        <div class="flex shrink-0 gap-2 sm:self-end">
                            {#if canDictate}
                                <Button
                                    type="button"
                                    variant={isDictating ? "secondary" : "outline"}
                                    aria-label={isDictating ? selectedCopy.stopDictation : selectedCopy.dictate}
                                    title={isDictating ? selectedCopy.stopDictation : selectedCopy.dictate}
                                    onclick={toggleDictation}
                                >
                                    {#if isDictating}
                                        <MicOff class="size-4" />
                                        <span class="sr-only">{selectedCopy.stopDictation}</span>
                                    {:else}
                                        <Mic class="size-4" />
                                        <span class="sr-only">{selectedCopy.dictate}</span>
                                    {/if}
                                </Button>
                            {/if}
                            {#if isSending}
                                <Button
                                    type="button"
                                    variant="outline"
                                    onclick={stopResponse}
                                    aria-label={selectedCopy.stop}
                                >
                                    <CircleStop class="size-4" />
                                    {selectedCopy.stop}
                                </Button>
                            {/if}
                            <Button type="submit" disabled={!canSend}>
                                {#if isSending}
                                    {selectedCopy.thinking}
                                {:else}
                                    <Send class="size-4" />
                                    {selectedCopy.send}
                                {/if}
                            </Button>
                        </div>
                    </div>
                    <p class="mt-2 text-xs text-muted-foreground">
                        {#if isDictating}
                            {selectedCopy.dictating}...
                        {:else}
                            {selectedCopy.transcriptSaved}
                        {/if}
                    </p>
                </form>
            </div>
        </section>

        <aside class="min-w-0 space-y-5">
            <section class="rounded-lg border bg-card p-4 text-card-foreground">
                <div class="flex items-start justify-between gap-3">
                    <div>
                        <h2 class="text-base font-semibold">
                            {selectedCopy.packageHeading}
                        </h2>
                        <p class="mt-1 text-sm leading-6 text-muted-foreground">
                            {pocPackage?.ready
                                ? selectedCopy.readyPrefix
                                : pocPackage?.markdown
                                ? selectedCopy.draftPrefix
                                : selectedCopy.packageEmpty}
                        </p>
                    </div>
                    <MessageSquareText class="mt-1 size-5 text-muted-foreground" />
                </div>

                <div class="mt-4 rounded-md border bg-background p-3">
                    <div class="flex items-center justify-between gap-3">
                        <p class="text-sm font-medium">{selectedCopy.packageProgress}</p>
                        <span class="text-xs text-muted-foreground">
                            {completedPackageItems}/{packageProgress.length}
                        </span>
                    </div>
                    <p class="mt-1 text-xs leading-5 text-muted-foreground">
                        {selectedCopy.packageExpectation}
                    </p>
                    <div class="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                        <div
                            class="h-full rounded-full bg-primary transition-all duration-500"
                            style={`width: ${packageProgressPercent}%`}
                        ></div>
                    </div>
                    <div class="mt-3 grid grid-cols-2 gap-2">
                        {#each packageProgress as item}
                            <div
                                class={`flex items-center gap-2 rounded-md border px-2.5 py-2 text-xs ${
                                    item.complete
                                        ? "border-primary/35 bg-primary/10 text-foreground"
                                        : "bg-muted/20 text-muted-foreground"
                                }`}
                            >
                                <Check class={`size-3.5 ${item.complete ? "opacity-100" : "opacity-25"}`} />
                                <span class="min-w-0 truncate">{item.label}</span>
                            </div>
                        {/each}
                    </div>
                </div>

                <details class="mt-3 rounded-md border bg-background">
                    <summary class="cursor-pointer px-3 py-2 text-sm font-medium">
                        {selectedCopy.viewDraft}
                    </summary>
                    <div class="max-h-72 overflow-auto border-t p-3">
                        {#if pocPackage?.markdown}
                            <pre class="whitespace-pre-wrap break-words text-xs leading-5 text-muted-foreground">{pocPackage.markdown}</pre>
                        {:else}
                            <p class="text-sm leading-6 text-muted-foreground">
                                {selectedCopy.packageEmpty}
                            </p>
                        {/if}
                    </div>
                </details>

                <div class="mt-3 flex flex-col gap-2">
                    <Button variant="outline" onclick={copyReport}>
                        {#if copiedReport}
                            <Check class="size-4" />
                            {selectedCopy.copied}
                        {:else}
                            <Copy class="size-4" />
                            {selectedCopy.copyReport}
                        {/if}
                    </Button>
                    <Button href="/portfolio" variant="outline">
                        {selectedCopy.portfolio}
                        {#if selectedLanguage === "ar"}
                            <ArrowLeft class="size-4" />
                        {:else}
                            <ArrowRight class="size-4" />
                        {/if}
                    </Button>
                </div>
            </section>

            <section class="rounded-lg border bg-card p-4 text-card-foreground">
                <h2 class="text-base font-semibold">
                    {selectedCopy.emailHeading}
                </h2>
                <p class="mt-1 text-sm leading-6 text-muted-foreground">
                    {selectedCopy.emailSub}
                </p>

                <form
                    class="mt-4 space-y-3"
                    onsubmit={(event) => {
                        event.preventDefault();
                        submitPackage();
                    }}
                >
                    <label class="block text-sm font-medium" for="visitor-email">
                        {selectedCopy.emailLabel}
                    </label>
                    <input
                        id="visitor-email"
                        type="email"
                        bind:value={visitorEmail}
                        placeholder={selectedCopy.emailPlaceholder}
                        class="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
                        dir="ltr"
                    />
                    <Button type="submit" disabled={!canSubmit} class="w-full">
                        {#if isSubmitting}
                            {selectedCopy.submitting}
                        {:else}
                            <Mail class="size-4" />
                            {selectedCopy.submit}
                        {/if}
                    </Button>
                </form>

                {#if submitMessage}
                    <p class="mt-3 text-sm leading-6 text-muted-foreground">
                        {submitMessage}
                    </p>
                {/if}

                {#if mailtoHref}
                    <Button href={mailtoHref} variant="outline" class="mt-3 w-full">
                        <Mail class="size-4" />
                        {selectedCopy.mailDraft}
                    </Button>
                {/if}
            </section>
        </aside>
    </div>
</section>

<style>
    .assistant-markdown {
        overflow-wrap: anywhere;
    }

    .assistant-markdown :global(:first-child) {
        margin-top: 0;
    }

    .assistant-markdown :global(:last-child) {
        margin-bottom: 0;
    }

    .assistant-markdown :global(p) {
        margin: 0 0 0.8rem;
    }

    .assistant-markdown :global(ul),
    .assistant-markdown :global(ol) {
        margin: 0.65rem 0 0.9rem;
        padding-inline-start: 1.25rem;
    }

    .assistant-markdown :global(li) {
        margin: 0.3rem 0;
    }

    .assistant-markdown :global(strong) {
        color: hsl(var(--foreground));
        font-weight: 700;
    }

    .assistant-markdown :global(a) {
        color: hsl(var(--primary));
        text-decoration: underline;
        text-underline-offset: 0.2em;
    }

    .assistant-markdown :global(code) {
        border: 1px solid hsl(var(--border));
        border-radius: 0.25rem;
        background: hsl(var(--muted) / 0.35);
        padding: 0.08rem 0.3rem;
        font-size: 0.92em;
    }

    .typing-dots {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
    }

    .typing-dots span {
        width: 0.35rem;
        height: 0.35rem;
        border-radius: 999px;
        background: currentColor;
        opacity: 0.35;
        animation: typing-pulse 1s ease-in-out infinite;
    }

    .typing-dots span:nth-child(2) {
        animation-delay: 0.15s;
    }

    .typing-dots span:nth-child(3) {
        animation-delay: 0.3s;
    }

    @keyframes typing-pulse {
        0%,
        80%,
        100% {
            transform: translateY(0);
            opacity: 0.35;
        }

        40% {
            transform: translateY(-0.18rem);
            opacity: 0.9;
        }
    }
</style>
