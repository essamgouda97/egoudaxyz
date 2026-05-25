# Agents Consulting Services Grill

Use this with `$grill-with-docs` when another agent needs to revisit the services page direction.

## Rerun Prompt

```md
Use $grill-with-docs.

We are shaping the `/services` page for egouda.xyz. Essam is presenting himself as an Agents Consultant who sets up agentic pipelines for teams. Keep the page simple and practical: visitors choose ChatGPT, Claude, or Gemini, copy a provider-tuned system prompt, paste it into their own AI agent, answer the agent's interview, and email the generated Markdown brief to `me@egouda.xyz`.

Read the codebase first, especially `CLAUDE.md`, `CONTEXT.md`, `src/routes/services/+page.svelte`, and `src/routes/+layout.svelte`. If a question can be answered from the code or docs, answer it from the repo instead of asking.

Interview me one question at a time. For each question, provide your recommended answer. Update `CONTEXT.md` inline only when terminology is resolved. Offer ADRs only if the decision is hard to reverse, surprising without context, and the result of a real trade-off. Do not add a site-side OpenAI API flow unless Essam explicitly reverses the current direction.
```

## Settled Decisions

- Canonical service term: **Agentic Pipeline**.
- Role term: **Agents Consultant**.
- Public contact address: `me@egouda.xyz`.
- Forwarding target: `egouda.main@gmail.com`.
- Intake approach: static prompt handoff. The site does not call an AI API.
- Visitor flow: choose provider, copy prompt, run it in the visitor's preferred AI, generate `agentic-pipeline-brief.md`, and email it to `me@egouda.xyz`.
- Provider variants: ChatGPT uses clear Markdown sections, Claude uses XML-style prompt structure, and Gemini uses explicit system-instruction components.
- Offer framing: Essam designs a free agentic pipeline POC and can help build it too if the POC looks useful.
- Page style: simple, work-focused, consistent with the existing SvelteKit/shadcn-svelte site.

## Open Questions For A Future Grill

- What industries or company sizes should the services page explicitly target?
- Should Essam offer fixed packages, hourly consulting, or custom scoped engagements?
- Which proof points should be added once public case studies are available?
- Should the prompt variants eventually move into separate versioned Markdown files?
