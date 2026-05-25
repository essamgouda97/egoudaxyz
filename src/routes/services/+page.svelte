<script lang="ts">
    import { Badge } from "$lib/components/ui/badge";
    import { Button } from "$lib/components/ui/button";
    import { browser } from "$app/environment";
    import { servicesLanguage } from "$lib/stores/services-language.svelte";
    import type { PageData } from "./$types";
    import {
        ArrowDown,
        ArrowLeft,
        ArrowRight,
        Bot,
        Check,
        ChevronDown,
        ClipboardCheck,
        Copy,
        FileText,
        MessageSquareText,
    } from "@lucide/svelte";

    let { data }: { data: PageData } = $props();

    const contactEmail = "me@egouda.xyz";

    type LanguageKey = typeof servicesLanguage.current;

    const pageCopy = {
        en: {
            lang: "en",
            dir: "ltr",
            metaTitle: "Agentic Pipeline Prompt | Essam Gouda",
            metaDescription:
                "Copy a provider-tuned prompt, let your AI agent interview you, then email the generated agentic pipeline brief to Essam Gouda.",
            ogDescription:
                "Copy a prompt for ChatGPT, Claude, Gemini, or another LLM. Your agent will grill your workflow and create a Markdown brief.",
            twitterDescription:
                "Let your agent create a Markdown brief for an agentic pipeline design POC.",
            badges: ["Agents consultant", "Free design POC"],
            h1: "Let your agent brief mine.",
            workflow: ["Pick AI", "Copy Prompt", "Send & Answer", "Email Brief"],
            languageLabel: "Language",
            aiHeading: "Your go-to AI",
            providerNote:
                "Each option uses the prompt style that works best for that provider.",
            copyPrompt: "Copy prompt",
            copied: "Copied",
            copyEmail: "Copy email",
            emailCopied: "Email copied",
            portfolio: "Check my Portfolio",
            fullPrompt: "View full system prompt",
            footerPrefix: "Send the generated Markdown to",
            footerSuffix:
                "or let your AI send the email. If your AI is not sending your emails, we need to talk.",
        },
        ar: {
            lang: "ar",
            dir: "rtl",
            metaTitle: "برومبت AI Pipeline | عصام جودة",
            metaDescription:
                "انسخ برومبت مضبوط للمزوّد، خلّي الـ AI يقابلك، ثم أرسل ملخص AI pipeline إلى عصام جودة.",
            ogDescription:
                "انسخ برومبت لـ ChatGPT أو Claude أو Gemini أو أي LLM آخر. الـ AI سيحلل سير العمل ويجهز ملف Markdown.",
            twitterDescription:
                "خلّي الـ AI يجهز ملف Markdown لتصميم AI pipeline.",
            badges: ["استشارات AI Agents", "تصميم POC مجاني"],
            h1: "خلينا نتكلم AI لـ AI.",
            workflow: ["اختار AI", "انسخ البرومبت", "ابعت وجاوب", "أرسل البريف"],
            languageLabel: "اللغة",
            aiHeading: "اختار الـ AI بتاعك",
            providerNote:
                "كل اختيار يستخدم أسلوب البرومبت الأنسب للمزوّد.",
            copyPrompt: "انسخ البرومبت",
            copied: "تم النسخ",
            copyEmail: "انسخ الإيميل",
            emailCopied: "تم نسخ الإيميل",
            portfolio: "شوف البورتفوليو",
            fullPrompt: "اعرض برومبت النظام كامل",
            footerPrefix: "أرسل ملف Markdown الناتج إلى",
            footerSuffix:
                "أو خلّي الـ AI يرسل الإيميل. لو الـ AI بتاعك لا يرسل إيميلاتك، لازم نتكلم.",
        },
    } as const;

    const commonRules = {
        en: [
            "You are interviewing the person who pasted this prompt. You are not Essam Gouda.",
            "Ask one question at a time.",
            "Use the same language the interviewee uses unless they ask otherwise. Match their answer style, vocabulary, and level of detail.",
            "After each answer, briefly state what you learned, name the likely business implication, then ask the next highest-leverage question.",
            "Track facts across the conversation. If two answers are inconsistent or contradict each other, slow down, explain the mismatch neutrally, propose the cleanest interpretation, and ask them to confirm or correct it.",
            "If an answer is vague, challenge it and ask for concrete examples, volumes, systems, exceptions, owners, costs, cycle time, or constraints.",
            "If the person is unsure, propose a sensible default answer and ask them to confirm or correct it.",
            "If they cannot name the pain clearly, infer likely pain points from their workflow and offer two or three hypotheses for them to react to.",
            "Make the value of an agentic pipeline tangible as the interview progresses: point out where automation, retrieval, tool use, approvals, monitoring, or human review could remove friction.",
            "Keep the tone consultative, not pushy. The sales motion is to prove Essam's value by understanding the workflow better than a generic automation pitch would.",
            "Do not design the solution until you understand the current workflow, stakeholders, tools, data, approval boundaries, risks, and success metric.",
            "Do not ask for secrets, passwords, tokens, API keys, private customer data, or regulated data. Ask for safe descriptions instead.",
            "Keep internal reasoning private. Show concise rationale, useful assumptions, and the next question.",
        ].join("\n- "),
        ar: [
            "أنت تجري مقابلة مع الشخص الذي لصق هذا البرومبت. أنت لست عصام جودة.",
            "اسأل سؤالًا واحدًا في كل مرة.",
            "استخدم نفس لغة الشخص ما لم يطلب غير ذلك. طابق أسلوبه، مفرداته، ومستوى التفاصيل في إجاباته.",
            "بعد كل إجابة، لخّص باختصار ما فهمته، اذكر الأثر التجاري المحتمل، ثم اسأل السؤال التالي الأعلى قيمة.",
            "تتبّع الحقائق خلال الحوار. إذا ظهرت إجابتان غير متسقتين أو متناقضتين، تمهّل، اشرح التعارض بهدوء، اقترح أوضح تفسير، واطلب منه التأكيد أو التصحيح.",
            "إذا كانت الإجابة عامة أو مبهمة، تحدّاها بلطف واطلب أمثلة محددة، أحجام عمل، أنظمة، استثناءات، ملاك قرار، تكلفة، زمن دورة، أو قيود.",
            "إذا كان الشخص غير متأكد، اقترح إجابة افتراضية منطقية واطلب منه تأكيدها أو تعديلها.",
            "إذا لم يستطع تسمية الألم بوضوح، استنتج نقاط الألم المحتملة من سير العمل وقدّم فرضيتين أو ثلاثًا ليرد عليها.",
            "اجعل قيمة الـ AI pipeline ملموسة أثناء المقابلة: وضّح أين يمكن للأتمتة، الاسترجاع، استخدام الأدوات، الموافقات، المراقبة، أو المراجعة البشرية إزالة الاحتكاك.",
            "حافظ على نبرة استشارية غير ضاغطة. الهدف البيعي هو إثبات قيمة عصام عبر فهم سير العمل بعمق أكبر من عرض أتمتة عام.",
            "لا تصمم الحل قبل فهم سير العمل الحالي، أصحاب المصلحة، الأدوات، البيانات، حدود الموافقة، المخاطر، ومقياس النجاح.",
            "لا تطلب أسرارًا، كلمات مرور، توكنات، مفاتيح API، بيانات عملاء خاصة، أو بيانات منظمة حساسة. اطلب أوصافًا آمنة بدلًا من ذلك.",
            "احتفظ بالتفكير الداخلي لنفسك. اعرض سببًا مختصرًا، افتراضات مفيدة، والسؤال التالي.",
        ].join("\n- "),
    } as const;

    const interviewMap = {
        en: [
            "Business context: what the team does, who the workflow serves, and how often the work happens.",
            "Current workflow: trigger, inputs, systems, human decisions, outputs, handoffs, and exceptions.",
            "Pain: bottlenecks, delays, rework, quality issues, cost, compliance risk, or missed revenue.",
            "Consistency check: assumptions, contradictions, missing owners, unclear handoffs, and places where the user's stated goals do not match the current process.",
            "Tool and data reality: where context lives, what systems exist, what APIs or files are available, and who owns access.",
            "Decision boundaries: what can be automated, what needs approval, and what must never be automated.",
            "Success criteria: what a free design POC should prove in one or two weeks.",
            "Candidate agentic pipelines: practical options with impact, complexity, and risk.",
            "Build recommendation: the first thin slice worth building if the design looks useful.",
        ].join("\n"),
        ar: [
            "سياق العمل: ماذا يفعل الفريق، من يخدمه سير العمل، وكم مرة يحدث.",
            "سير العمل الحالي: المحفّز، المدخلات، الأنظمة، قرارات البشر، المخرجات، التسليمات، والاستثناءات.",
            "الألم: الاختناقات، التأخير، إعادة العمل، مشاكل الجودة، التكلفة، مخاطر الامتثال، أو الإيراد الضائع.",
            "فحص الاتساق: الافتراضات، التناقضات، غياب ملاك القرار، التسليمات غير الواضحة، وأي فجوة بين الأهداف المعلنة والعملية الحالية.",
            "واقع الأدوات والبيانات: أين يعيش السياق، ما الأنظمة الموجودة، ما واجهات API أو الملفات المتاحة، ومن يملك الوصول.",
            "حدود القرار: ما يمكن أتمتته، ما يحتاج موافقة، وما يجب أن يبقى بيد البشر.",
            "معايير النجاح: ما الذي يجب أن يثبته تصميم POC مجاني خلال أسبوع أو أسبوعين.",
            "AI pipelines مرشحة: خيارات عملية مع الأثر، التعقيد، والمخاطر.",
            "توصية البناء: أصغر شريحة تستحق البناء إذا بدا التصميم مفيدًا.",
        ].join("\n"),
    } as const;

    const markdownOutput = {
        en: [
            "# Agentic Pipeline Brief",
            "",
            "## 1. Business Snapshot",
            "Company/team, audience served, workflow owner, rough volume, and why this matters now.",
            "",
            "## 2. Current Workflow",
            "Trigger, inputs, systems, steps, human decisions, outputs, handoffs, and exceptions.",
            "",
            "## 3. Workflow Pain And Opportunity",
            "Where time, money, quality, risk, or customer experience is currently leaking. Include confirmed pain points and likely pain hypotheses.",
            "",
            "## 4. Contradictions And Clarifications",
            "Inconsistencies found during the interview, how they were resolved, and what still needs confirmation.",
            "",
            "## 5. Systems, Tools, And Data",
            "Relevant apps, documents, databases, APIs, permissions, and data sensitivity notes. Do not include secrets.",
            "",
            "## 6. Human Approval And Risk Boundaries",
            "What an agent may do alone, what needs review, and what must stay human-owned.",
            "",
            "## 7. Candidate Agentic Pipelines",
            "Create a table with these columns: Pipeline | User | Trigger | Inputs | Agent Actions | Human Review | Output | Risk | Expected Value | Complexity.",
            "",
            "## 8. Recommended Free Design POC",
            "The smallest useful POC Essam should design first, what it proves, and what should be out of scope.",
            "",
            "## 9. Where Essam Adds Leverage",
            "Explain why a consultant who understands agents, tools, workflow boundaries, and implementation tradeoffs would help this pipeline succeed.",
            "",
            "## 10. Build Scope If The POC Looks Right",
            "A practical build path if the user wants Essam to help build it too.",
            "",
            "## 11. Open Questions For Essam",
            "Questions that still need a consultant's judgment.",
        ].join("\n"),
        ar: [
            "# ملخص AI Pipeline",
            "",
            "## 1. لمحة عن العمل",
            "الشركة/الفريق، الجمهور الذي يتم خدمته، مالك سير العمل، الحجم التقريبي، ولماذا هذا مهم الآن.",
            "",
            "## 2. سير العمل الحالي",
            "المحفّز، المدخلات، الأنظمة، الخطوات، قرارات البشر، المخرجات، التسليمات، والاستثناءات.",
            "",
            "## 3. الألم والفرصة في سير العمل",
            "أين يتسرب الوقت، المال، الجودة، المخاطر، أو تجربة العميل. اذكر نقاط الألم المؤكدة وفرضيات الألم المحتملة.",
            "",
            "## 4. التناقضات والتوضيحات",
            "التناقضات التي ظهرت أثناء المقابلة، كيف تم حلها، وما الذي ما زال يحتاج تأكيدًا.",
            "",
            "## 5. الأنظمة والأدوات والبيانات",
            "التطبيقات، المستندات، قواعد البيانات، واجهات API، الصلاحيات، وملاحظات حساسية البيانات ذات الصلة. لا تدرج أي أسرار.",
            "",
            "## 6. حدود المراجعة البشرية والمخاطر",
            "ما يمكن للـ AI فعله وحده، ما يحتاج مراجعة، وما يجب أن يبقى مملوكًا للبشر.",
            "",
            "## 7. AI Pipelines مرشحة",
            "أنشئ جدولًا بهذه الأعمدة: خط الأنابيب | المستخدم | المحفّز | المدخلات | إجراءات الوكيل | المراجعة البشرية | المخرج | المخاطر | القيمة المتوقعة | التعقيد.",
            "",
            "## 8. تصميم POC مجاني موصى به",
            "أصغر POC مفيد يجب أن يصممه عصام أولًا، ما الذي يثبته، وما الذي يجب أن يكون خارج النطاق.",
            "",
            "## 9. أين يضيف عصام قيمة",
            "اشرح لماذا يساعد مستشار يفهم AI agents، الأدوات، حدود سير العمل، ومفاضلات التنفيذ في إنجاح هذا الخط.",
            "",
            "## 10. نطاق البناء إذا كان الـ POC مناسبًا",
            "مسار بناء عملي إذا أراد المستخدم أن يساعد عصام في بنائه أيضًا.",
            "",
            "## 11. أسئلة مفتوحة لعصام",
            "أسئلة ما زالت تحتاج حكم مستشار.",
        ].join("\n"),
    } as const;

    const promptVariants = {
        en: {
            chatgpt: {
                prompt: [
                    "Formatting re-enabled.",
                    "",
                    "# Role",
                    "You are a business workflow interviewer and agentic-pipeline strategist.",
                    "",
                    "# Mission",
                    `Interview me until you can produce a practical Markdown brief for Essam Gouda at ${contactEmail}. The brief should help Essam design a free agentic pipeline POC. If the design looks useful, Essam can help build it too.`,
                    "",
                    "# Operating Rules",
                    `- ${commonRules.en}`,
                    "",
                    "# Interview Map",
                    interviewMap.en,
                    "",
                    "# Final Output",
                    "When you have enough detail, stop interviewing and output exactly one Markdown document named agentic-pipeline-brief.md:",
                    "",
                    markdownOutput.en,
                    "",
                    `End by saying: Email this Markdown file to ${contactEmail} with the subject "Agentic pipeline brief". Or let your AI send the email if it has email access.`,
                ].join("\n"),
            },
            claude: {
                prompt: [
                    "<role>",
                    "You are a business workflow interviewer and agentic-pipeline strategist.",
                    "</role>",
                    "",
                    "<mission>",
                    `Interview me until you can produce a practical Markdown brief for Essam Gouda at ${contactEmail}. The brief should help Essam design a free agentic pipeline POC. If the design looks useful, Essam can help build it too.`,
                    "</mission>",
                    "",
                    "<operating_rules>",
                    `- ${commonRules.en}`,
                    "</operating_rules>",
                    "",
                    "<interview_map>",
                    interviewMap.en,
                    "</interview_map>",
                    "",
                    "<final_output>",
                    "When you have enough detail, stop interviewing and output exactly one Markdown document named agentic-pipeline-brief.md:",
                    "",
                    markdownOutput.en,
                    "",
                    `After the Markdown, say: Email this Markdown file to ${contactEmail} with the subject "Agentic pipeline brief". Or let your AI send the email if it has email access.`,
                    "</final_output>",
                ].join("\n"),
            },
            gemini: {
                prompt: [
                    "System instructions:",
                    "",
                    "Role: You are a business workflow interviewer and agentic-pipeline strategist.",
                    "",
                    `Objective: Interview me until you can produce a practical Markdown brief for Essam Gouda at ${contactEmail}. The brief should help Essam design a free agentic pipeline POC. If the design looks useful, Essam can help build it too.`,
                    "",
                    "Rules:",
                    `- ${commonRules.en}`,
                    "",
                    "Interview agenda:",
                    interviewMap.en,
                    "",
                    "Final response format:",
                    "When you have enough detail, stop interviewing and output exactly one Markdown document named agentic-pipeline-brief.md.",
                    "",
                    markdownOutput.en,
                    "",
                    `Final instruction to the user: Email this Markdown file to ${contactEmail} with the subject "Agentic pipeline brief". Or let your AI send the email if it has email access.`,
                ].join("\n"),
            },
            other: {
                prompt: [
                    "You are a business workflow interviewer and agentic-pipeline strategist.",
                    "",
                    "Interview the user one question at a time until you can produce a practical Markdown brief for Essam Gouda at me@egouda.xyz.",
                    "",
                    "Rules:",
                    `- ${commonRules.en}`,
                    "",
                    "Interview agenda:",
                    interviewMap.en,
                    "",
                    "When you have enough detail, output exactly one Markdown document named agentic-pipeline-brief.md:",
                    "",
                    markdownOutput.en,
                    "",
                    `End by telling the user to email the Markdown file to ${contactEmail} with the subject "Agentic pipeline brief", or to let their AI send the email if it has email access.`,
                ].join("\n"),
            },
        },
        ar: {
            chatgpt: {
                prompt: [
                    "Formatting re-enabled.",
                    "",
                    "# الدور",
                    "أنت محاور لسير العمل التجاري واستراتيجي لـ AI agentic pipelines.",
                    "",
                    "# المهمة",
                    `قابلني حتى تستطيع إنتاج ملف Markdown عملي لعصام جودة على ${contactEmail}. يجب أن يساعد الملف عصام على تصميم POC مجاني لـ AI pipeline. إذا بدا التصميم مفيدًا، يمكن لعصام أن يساعد في بنائه أيضًا.`,
                    "",
                    "# قواعد التشغيل",
                    `- ${commonRules.ar}`,
                    "",
                    "# خريطة المقابلة",
                    interviewMap.ar,
                    "",
                    "# المخرج النهائي",
                    "عندما تجمع تفاصيل كافية، توقف عن المقابلة وأخرج مستند Markdown واحدًا بالضبط باسم agentic-pipeline-brief.md:",
                    "",
                    markdownOutput.ar,
                    "",
                    `اختم بقول: أرسل ملف Markdown هذا إلى ${contactEmail} بعنوان "Agentic pipeline brief". أو اطلب من الـ AI إرسال الإيميل إذا كان لديه صلاحية الإرسال.`,
                ].join("\n"),
            },
            claude: {
                prompt: [
                    "<role>",
                    "أنت محاور لسير العمل التجاري واستراتيجي لـ AI agentic pipelines.",
                    "</role>",
                    "",
                    "<mission>",
                    `قابلني حتى تستطيع إنتاج ملف Markdown عملي لعصام جودة على ${contactEmail}. يجب أن يساعد الملف عصام على تصميم POC مجاني لـ AI pipeline. إذا بدا التصميم مفيدًا، يمكن لعصام أن يساعد في بنائه أيضًا.`,
                    "</mission>",
                    "",
                    "<operating_rules>",
                    `- ${commonRules.ar}`,
                    "</operating_rules>",
                    "",
                    "<interview_map>",
                    interviewMap.ar,
                    "</interview_map>",
                    "",
                    "<final_output>",
                    "عندما تجمع تفاصيل كافية، توقف عن المقابلة وأخرج مستند Markdown واحدًا بالضبط باسم agentic-pipeline-brief.md:",
                    "",
                    markdownOutput.ar,
                    "",
                    `بعد ملف Markdown، قل: أرسل ملف Markdown هذا إلى ${contactEmail} بعنوان "Agentic pipeline brief". أو اطلب من الـ AI إرسال الإيميل إذا كان لديه صلاحية الإرسال.`,
                    "</final_output>",
                ].join("\n"),
            },
            gemini: {
                prompt: [
                    "تعليمات النظام:",
                    "",
                    "الدور: أنت محاور لسير العمل التجاري واستراتيجي لـ AI agentic pipelines.",
                    "",
                    `الهدف: قابلني حتى تستطيع إنتاج ملف Markdown عملي لعصام جودة على ${contactEmail}. يجب أن يساعد الملف عصام على تصميم POC مجاني لـ AI pipeline. إذا بدا التصميم مفيدًا، يمكن لعصام أن يساعد في بنائه أيضًا.`,
                    "",
                    "القواعد:",
                    `- ${commonRules.ar}`,
                    "",
                    "أجندة المقابلة:",
                    interviewMap.ar,
                    "",
                    "تنسيق الرد النهائي:",
                    "عندما تجمع تفاصيل كافية، توقف عن المقابلة وأخرج مستند Markdown واحدًا بالضبط باسم agentic-pipeline-brief.md.",
                    "",
                    markdownOutput.ar,
                    "",
                    `التعليمات النهائية للمستخدم: أرسل ملف Markdown هذا إلى ${contactEmail} بعنوان "Agentic pipeline brief". أو اطلب من الـ AI إرسال الإيميل إذا كان لديه صلاحية الإرسال.`,
                ].join("\n"),
            },
            other: {
                prompt: [
                    "أنت محاور لسير العمل التجاري واستراتيجي لـ AI agentic pipelines.",
                    "",
                    `قابل المستخدم سؤالًا واحدًا في كل مرة حتى تستطيع إنتاج ملف Markdown عملي لعصام جودة على ${contactEmail}.`,
                    "",
                    "القواعد:",
                    `- ${commonRules.ar}`,
                    "",
                    "أجندة المقابلة:",
                    interviewMap.ar,
                    "",
                    "عندما تجمع تفاصيل كافية، أخرج مستند Markdown واحدًا بالضبط باسم agentic-pipeline-brief.md:",
                    "",
                    markdownOutput.ar,
                    "",
                    `اختم بإخبار المستخدم أن يرسل ملف Markdown إلى ${contactEmail} بعنوان "Agentic pipeline brief"، أو أن يطلب من الـ AI إرسال الإيميل إذا كان لديه صلاحية الإرسال.`,
                ].join("\n"),
            },
        },
    } as const;

    type ProviderKey = keyof (typeof promptVariants)["en"];

    const providerOptions: Array<{
        key: ProviderKey;
        label: Record<LanguageKey, string>;
        logo?: string;
    }> = [
        {
            key: "chatgpt",
            label: { en: "ChatGPT", ar: "ChatGPT" },
            logo: "/agent-logos/chatgpt.svg",
        },
        {
            key: "claude",
            label: { en: "Claude", ar: "Claude" },
            logo: "/agent-logos/claude.svg",
        },
        {
            key: "gemini",
            label: { en: "Gemini", ar: "Gemini" },
            logo: "/agent-logos/gemini.svg",
        },
        { key: "other", label: { en: "Other", ar: "أخرى" } },
    ];

    const workflowSteps = [
        {
            icon: Bot,
        },
        {
            icon: ClipboardCheck,
        },
        {
            icon: MessageSquareText,
        },
        {
            icon: FileText,
        },
    ];

    let selectedProvider = $state<ProviderKey>("chatgpt");
    let copied = $state(false);
    let emailCopied = $state(false);
    let copyTimer: ReturnType<typeof setTimeout> | undefined;
    let emailCopyTimer: ReturnType<typeof setTimeout> | undefined;

    const selectedLanguage = $derived(browser ? servicesLanguage.current : data.language);
    const selectedCopy = $derived(pageCopy[selectedLanguage]);
    const selectedPrompt = $derived(promptVariants[selectedLanguage][selectedProvider]);
    const contactHref = `mailto:${contactEmail}`;

    async function copyPrompt() {
        try {
            await navigator.clipboard.writeText(selectedPrompt.prompt);
            copied = true;
        } catch {
            window.prompt("Copy this prompt", selectedPrompt.prompt);
            copied = false;
        }

        if (copyTimer) {
            clearTimeout(copyTimer);
        }

        copyTimer = setTimeout(() => {
            copied = false;
        }, 2200);
    }

    async function copyEmail() {
        try {
            await navigator.clipboard.writeText(contactEmail);
            emailCopied = true;
        } catch {
            emailCopied = false;
        }

        if (emailCopyTimer) {
            clearTimeout(emailCopyTimer);
        }

        emailCopyTimer = setTimeout(() => {
            emailCopied = false;
        }, 2200);
    }
</script>

<svelte:head>
    <title>{selectedCopy.metaTitle}</title>
    <meta
        name="description"
        content={selectedCopy.metaDescription}
    />
    <link rel="canonical" href="https://egouda.xyz/services" />
    <link rel="alternate" type="text/plain" href="https://egouda.xyz/llm.txt" />

    <meta property="og:title" content={selectedCopy.metaTitle} />
    <meta
        property="og:description"
        content={selectedCopy.ogDescription}
    />
    <meta property="og:url" content="https://egouda.xyz/services" />
    <meta property="og:image" content="https://egouda.xyz/og-image.png" />

    <meta name="twitter:title" content={selectedCopy.metaTitle} />
    <meta
        name="twitter:description"
        content={selectedCopy.twitterDescription}
    />
    <meta name="twitter:image" content="https://egouda.xyz/og-image.png" />
</svelte:head>

<section
    class="mx-auto flex w-full max-w-5xl flex-col gap-7 py-6 md:py-10"
    lang={selectedCopy.lang}
    dir={selectedCopy.dir}
>
    <div class="space-y-6">
        <div class="flex flex-wrap gap-2">
            <Badge variant="secondary">{selectedCopy.badges[0]}</Badge>
            <Badge variant="outline">{selectedCopy.badges[1]}</Badge>
        </div>

        <div>
            <h1 class="max-w-3xl text-4xl font-bold leading-tight tracking-normal md:text-5xl">
                {selectedCopy.h1}
            </h1>
        </div>
    </div>

    <ol
        aria-label="Brief workflow"
        class="flex flex-col gap-3 border-y py-4 text-card-foreground md:flex-row md:items-stretch"
    >
        {#each workflowSteps as step, index}
            {@const StepIcon = step.icon}
            <li
                class="flex min-h-20 flex-1 flex-col items-center justify-center gap-2 rounded-2xl border bg-card/60 px-4 py-3 text-center"
            >
                <span class="flex min-w-0 items-baseline justify-center gap-2">
                    <span class="text-base font-semibold leading-none text-muted-foreground">
                        0{index + 1}
                    </span>
                    <span class="whitespace-nowrap text-base font-semibold leading-none">
                        {selectedCopy.workflow[index]}
                    </span>
                </span>
                <span class="grid size-8 shrink-0 place-items-center text-primary">
                    <StepIcon class="size-5" />
                </span>
            </li>

            {#if index < workflowSteps.length - 1}
                <li aria-hidden="true" class="grid place-items-center text-muted-foreground md:hidden">
                    <ArrowDown class="size-4" />
                </li>
                <li aria-hidden="true" class="hidden w-8 shrink-0 place-items-center text-muted-foreground md:grid">
                    {#if selectedLanguage === "ar"}
                        <ArrowLeft class="size-4" />
                    {:else}
                        <ArrowRight class="size-4" />
                    {/if}
                </li>
            {/if}
        {/each}
    </ol>

    <section aria-labelledby="copy-heading" class="min-w-0 text-card-foreground">
        <div class="grid gap-5">
            <div class="grid gap-2">
                <h2 id="copy-heading" class="text-sm font-medium">
                    {selectedCopy.aiHeading}
                </h2>

                <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" role="radiogroup" aria-labelledby="copy-heading">
                    {#each providerOptions as provider}
                        <button
                            type="button"
                            data-testid={`provider-${provider.key}`}
                            role="radio"
                            aria-checked={selectedProvider === provider.key}
                            class={`flex min-h-16 items-center gap-3 rounded-md border p-3 text-left transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none ${
                                selectedProvider === provider.key
                                    ? "border-primary bg-primary/5 text-foreground shadow-sm"
                                    : "bg-background text-muted-foreground hover:bg-accent hover:text-foreground"
                            }`}
                            onclick={() => {
                                selectedProvider = provider.key;
                                copied = false;
                            }}
                        >
                            {#if provider.logo}
                                <img
                                    src={provider.logo}
                                    alt=""
                                    class={`size-8 shrink-0 object-contain ${
                                        provider.key === "chatgpt" ? "dark:invert" : ""
                                    }`}
                                />
                            {:else}
                                <Bot class="size-8 shrink-0 text-primary" />
                            {/if}
                            <span class="block text-sm font-medium">
                                {provider.label[selectedLanguage]}
                            </span>
                        </button>
                    {/each}
                </div>
                <p class="text-sm text-muted-foreground">
                    {selectedCopy.providerNote}
                </p>
            </div>

            <div class="flex flex-col gap-3 sm:flex-row">
                <Button data-testid="copy-prompt" onclick={copyPrompt} class="w-full sm:w-auto">
                    {#if copied}
                        <Check class="size-4" />
                        {selectedCopy.copied}
                    {:else}
                        <Copy class="size-4" />
                        {selectedCopy.copyPrompt}
                    {/if}
                </Button>
                <Button
                    data-testid="email-brief"
                    variant="outline"
                    class="w-full sm:w-auto"
                    onclick={copyEmail}
                >
                    {#if emailCopied}
                        <Check class="size-4" />
                        {selectedCopy.emailCopied}
                    {:else}
                        <Copy class="size-4" />
                        {selectedCopy.copyEmail}
                    {/if}
                </Button>
                <Button href="/portfolio" variant="outline" class="w-full sm:w-auto">
                    {selectedCopy.portfolio}
                    {#if selectedLanguage === "ar"}
                        <ArrowLeft class="size-4" />
                    {:else}
                        <ArrowRight class="size-4" />
                    {/if}
                </Button>
            </div>
        </div>

        <details class="mt-6 min-w-0 rounded-md border bg-background">
            <summary class="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 text-sm font-medium">
                {selectedCopy.fullPrompt}
                <ChevronDown class="size-4 text-muted-foreground" />
            </summary>
            <pre class="max-h-[520px] min-w-0 overflow-auto whitespace-pre-wrap break-all border-t p-4 text-xs leading-6 text-muted-foreground"><code>{selectedPrompt.prompt}</code></pre>
        </details>
    </section>

    <p class="text-sm leading-6 text-muted-foreground">
        {selectedCopy.footerPrefix}
        <a
            class="font-medium text-primary underline-offset-4 hover:underline"
            href={contactHref}
        >
            {contactEmail}
        </a>,
        {selectedCopy.footerSuffix}
    </p>
</section>
