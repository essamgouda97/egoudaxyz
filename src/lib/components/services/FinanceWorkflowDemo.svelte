<script lang="ts">
    import { browser } from "$app/environment";
    import { Badge } from "$lib/components/ui/badge";
    import { Button } from "$lib/components/ui/button";
    import {
        Download,
        Plus,
        Search,
        Trash2,
        WalletCards,
        X,
    } from "@lucide/svelte";

    type Category = "income" | "housing" | "food" | "utilities" | "other";
    type Transaction = {
        id: number;
        date: string;
        description: string;
        category: Category;
        amount: number;
    };
    type DraftTransaction = {
        date: string;
        description: string;
        category: Category;
        amount: number;
        kind: "expense" | "income";
    };

    const STORAGE_KEY = "egouda-tools-budget-v1";

    let { language = "en" }: { language?: "en" | "ar" } = $props();
    let month = $state(currentDate().slice(0, 7));
    let search = $state("");
    let categoryFilter = $state<"all" | Category>("all");
    let composerOpen = $state(false);
    let nextId = 1;
    let storageReady = $state(false);
    let transactions = $state<Transaction[]>([]);
    let draft = $state<DraftTransaction>(newDraft());

    const copyByLanguage = {
        en: {
            title: "Budget",
            balance: "Balance",
            income: "Income",
            spent: "Spent",
            search: "Search transactions",
            all: "All categories",
            add: "Add transaction",
            export: "Export CSV",
            newTransaction: "New transaction",
            date: "Date",
            description: "Description",
            category: "Category",
            amount: "Amount",
            type: "Type",
            expense: "Expense",
            save: "Add",
            cancel: "Cancel",
            remove: "Delete",
            empty: "No transactions this month",
            categories: {
                income: "Income",
                housing: "Housing",
                food: "Food",
                utilities: "Utilities",
                other: "Other",
            },
        },
        ar: {
            title: "الميزانية",
            balance: "الرصيد",
            income: "الدخل",
            spent: "المصروف",
            search: "بحث في العمليات",
            all: "كل الفئات",
            add: "ضيف عملية",
            export: "نزّل CSV",
            newTransaction: "عملية جديدة",
            date: "التاريخ",
            description: "البيان",
            category: "الفئة",
            amount: "المبلغ",
            type: "النوع",
            expense: "مصروف",
            save: "إضافة",
            cancel: "إلغاء",
            remove: "امسح",
            empty: "مفيش عمليات الشهر ده",
            categories: {
                income: "دخل",
                housing: "البيت",
                food: "الأكل",
                utilities: "فواتير",
                other: "أخرى",
            },
        },
    } as const;

    const categories = [
        "income",
        "housing",
        "food",
        "utilities",
        "other",
    ] as const;
    const copy = $derived(copyByLanguage[language]);
    const monthlyTransactions = $derived(
        transactions.filter((transaction) => transaction.date.startsWith(month)),
    );
    const income = $derived(
        monthlyTransactions.reduce(
            (total, transaction) =>
                total + (transaction.amount > 0 ? transaction.amount : 0),
            0,
        ),
    );
    const spent = $derived(
        monthlyTransactions.reduce(
            (total, transaction) =>
                total + (transaction.amount < 0 ? Math.abs(transaction.amount) : 0),
            0,
        ),
    );
    const balance = $derived(income - spent);
    const filteredTransactions = $derived.by(() => {
        const needle = search.trim().toLocaleLowerCase();

        return monthlyTransactions.filter(
            (transaction) =>
                (categoryFilter === "all" ||
                    transaction.category === categoryFilter) &&
                (!needle ||
                    transaction.description
                        .toLocaleLowerCase()
                        .includes(needle)),
        );
    });

    $effect(() => {
        if (!browser || storageReady) return;

        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
            if (Array.isArray(saved)) {
                transactions = saved.filter(isTransaction);
                nextId =
                    transactions.reduce(
                        (highest, transaction) =>
                            Math.max(highest, transaction.id),
                        0,
                    ) + 1;
            }
        } catch {
            transactions = [];
        }

        storageReady = true;
    });

    $effect(() => {
        const snapshot = JSON.stringify(transactions);
        if (!browser || !storageReady) return;
        localStorage.setItem(STORAGE_KEY, snapshot);
    });

    function isTransaction(value: unknown): value is Transaction {
        if (!value || typeof value !== "object") return false;
        const transaction = value as Partial<Transaction>;

        return (
            typeof transaction.id === "number" &&
            typeof transaction.date === "string" &&
            typeof transaction.description === "string" &&
            categories.includes(transaction.category as Category) &&
            typeof transaction.amount === "number" &&
            Number.isFinite(transaction.amount)
        );
    }

    function currentDate() {
        return new Date().toISOString().slice(0, 10);
    }

    function newDraft(): DraftTransaction {
        return {
            date: currentDate(),
            description: "",
            category: "other",
            amount: 0,
            kind: "expense",
        };
    }

    function formatMoney(value: number, preserveSign = false) {
        return new Intl.NumberFormat("en-CA", {
            style: "currency",
            currency: "CAD",
            maximumFractionDigits: 2,
        }).format(preserveSign ? value : Math.abs(value));
    }

    function formatDate(value: string) {
        return new Intl.DateTimeFormat(language === "ar" ? "ar-EG" : "en-CA", {
            month: "short",
            day: "numeric",
            timeZone: "UTC",
        }).format(new Date(value + "T12:00:00Z"));
    }

    function addTransaction(event: SubmitEvent) {
        event.preventDefault();
        const description = draft.description.trim();
        const amount = Math.abs(Number(draft.amount) || 0);
        if (!description || amount <= 0) return;

        transactions = [
            {
                id: nextId++,
                date: draft.date,
                description,
                category: draft.kind === "income" ? "income" : draft.category,
                amount: draft.kind === "income" ? amount : -amount,
            },
            ...transactions,
        ];
        draft = newDraft();
        composerOpen = false;
    }

    function removeTransaction(id: number) {
        transactions = transactions.filter(
            (transaction) => transaction.id !== id,
        );
    }

    function exportCsv() {
        const rows = [
            ["Date", "Description", "Category", "Amount"],
            ...filteredTransactions.map((transaction) => [
                transaction.date,
                transaction.description,
                copy.categories[transaction.category],
                transaction.amount.toFixed(2),
            ]),
        ];
        const csv = rows
            .map((row) =>
                row
                    .map(
                        (cell) =>
                            '"' + String(cell).replaceAll('"', '""') + '"',
                    )
                    .join(","),
            )
            .join("\n");
        const url = URL.createObjectURL(
            new Blob([csv], { type: "text/csv;charset=utf-8" }),
        );
        const link = document.createElement("a");
        link.href = url;
        link.download = "budget-" + month + ".csv";
        document.body.append(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 0);
    }
</script>

<section
    class="app-frame"
    data-app="budget"
    lang={language}
    dir={language === "ar" ? "rtl" : "ltr"}
    aria-label={copy.title}
>
    <header class="app-header">
        <div class="app-identity">
            <WalletCards size={18} />
            <h3>{copy.title}</h3>
        </div>
        <div class="header-actions">
            <input
                class="month-input"
                aria-label={copy.date}
                type="month"
                bind:value={month}
            />
            <Button
                variant="outline"
                size="icon-sm"
                title={copy.export}
                aria-label={copy.export}
                disabled={filteredTransactions.length === 0}
                onclick={exportCsv}
            >
                <Download size={15} />
            </Button>
            <Button
                size="sm"
                class="primary-action"
                data-testid="budget-add"
                onclick={() => (composerOpen = !composerOpen)}
            >
                {#if composerOpen}<X size={15} />{:else}<Plus size={15} />{/if}
                <span>{composerOpen ? copy.cancel : copy.add}</span>
            </Button>
        </div>
    </header>

    <dl class="summary">
        <div>
            <dt>{copy.balance}</dt>
            <dd class:negative={balance < 0} dir="ltr">
                {formatMoney(balance, true)}
            </dd>
        </div>
        <div>
            <dt>{copy.income}</dt>
            <dd class="positive" dir="ltr">+{formatMoney(income)}</dd>
        </div>
        <div>
            <dt>{copy.spent}</dt>
            <dd dir="ltr">{formatMoney(spent)}</dd>
        </div>
    </dl>

    {#if composerOpen}
        <form class="composer" onsubmit={addTransaction}>
            <div class="composer-heading">{copy.newTransaction}</div>
            <label>
                <span>{copy.description}</span>
                <input
                    data-testid="budget-description"
                    bind:value={draft.description}
                    required
                />
            </label>
            <label>
                <span>{copy.date}</span>
                <input type="date" bind:value={draft.date} required />
            </label>
            <label>
                <span>{copy.type}</span>
                <select bind:value={draft.kind}>
                    <option value="expense">{copy.expense}</option>
                    <option value="income">{copy.income}</option>
                </select>
            </label>
            <label>
                <span>{copy.category}</span>
                <select bind:value={draft.category} disabled={draft.kind === "income"}>
                    {#each categories.filter((category) => category !== "income") as category}
                        <option value={category}>{copy.categories[category]}</option>
                    {/each}
                </select>
            </label>
            <label>
                <span>{copy.amount}</span>
                <input
                    data-testid="budget-amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    bind:value={draft.amount}
                    required
                    dir="ltr"
                />
            </label>
            <Button
                type="submit"
                size="sm"
                class="primary-action composer-submit"
                disabled={!draft.description.trim() || Number(draft.amount) <= 0}
            >
                <Plus size={15} /> {copy.save}
            </Button>
        </form>
    {/if}

    <div class="table-toolbar">
        <label class="search-field">
            <span class="sr-only">{copy.search}</span>
            <Search size={15} />
            <input
                data-testid="budget-search"
                type="search"
                bind:value={search}
                placeholder={copy.search}
            />
        </label>
        <select
            class="filter-select"
            aria-label={copy.category}
            bind:value={categoryFilter}
        >
            <option value="all">{copy.all}</option>
            {#each categories as category}
                <option value={category}>{copy.categories[category]}</option>
            {/each}
        </select>
    </div>

    <div class="table-scroll">
        <table>
            <thead>
                <tr>
                    <th class="date-column">{copy.date}</th>
                    <th>{copy.description}</th>
                    <th class="category-column">{copy.category}</th>
                    <th class="amount-column">{copy.amount}</th>
                    <th class="action-column"><span class="sr-only">{copy.remove}</span></th>
                </tr>
            </thead>
            <tbody>
                {#each filteredTransactions as transaction (transaction.id)}
                    <tr data-testid="budget-row">
                        <td class="date-column">{formatDate(transaction.date)}</td>
                        <td class="description-cell">
                            {transaction.description}
                        </td>
                        <td class="category-column">
                            <Badge
                                variant={transaction.category === "income"
                                    ? "default"
                                    : "secondary"}
                            >
                                {copy.categories[transaction.category]}
                            </Badge>
                        </td>
                        <td
                            class:positive={transaction.amount > 0}
                            class="amount-column transaction-amount"
                            dir="ltr"
                        >
                            {transaction.amount > 0 ? "+" : "−"}{formatMoney(
                                transaction.amount,
                            )}
                        </td>
                        <td class="action-column">
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                title={copy.remove}
                                aria-label={copy.remove + " " + transaction.description}
                                onclick={() => removeTransaction(transaction.id)}
                            >
                                <Trash2 size={15} />
                            </Button>
                        </td>
                    </tr>
                {:else}
                    <tr>
                        <td class="empty-state" colspan="5">{copy.empty}</td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
</section>

<style>
    .app-frame {
        min-height: 500px;
        overflow: hidden;
        border: 1px solid var(--border);
        border-radius: 8px;
        background: var(--card);
        color: var(--card-foreground);
        font-family: ui-sans-serif, system-ui, sans-serif;
    }

    .app-frame[dir="rtl"] {
        font-family: "Cairo", ui-sans-serif, system-ui, sans-serif;
    }

    .app-header {
        display: flex;
        min-height: 54px;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        border-bottom: 1px solid var(--border);
        padding: 0.55rem 0.75rem 0.55rem 1rem;
    }

    .app-identity,
    .header-actions {
        display: flex;
        align-items: center;
    }

    .app-identity {
        gap: 0.55rem;
    }

    .app-identity h3 {
        margin: 0;
        font-size: 0.9rem;
        font-weight: 650;
        letter-spacing: 0;
    }

    .header-actions {
        gap: 0.45rem;
    }

    .app-frame :global(.primary-action) {
        background: #ff6b35;
        color: #17181d;
    }

    .app-frame :global(.primary-action:hover) {
        background: #ff8257;
    }

    input,
    select {
        box-sizing: border-box;
        border: 1px solid var(--input);
        border-radius: 6px;
        background: var(--background);
        color: var(--foreground);
        font: inherit;
        font-size: 0.78rem;
        outline: none;
    }

    input:focus-visible,
    select:focus-visible {
        border-color: var(--ring);
        box-shadow: 0 0 0 3px color-mix(in oklab, var(--ring) 24%, transparent);
    }

    input:disabled,
    select:disabled {
        cursor: not-allowed;
        opacity: 0.5;
    }

    .month-input {
        width: 142px;
        height: 32px;
        padding: 0 0.55rem;
        direction: ltr;
    }

    .summary {
        display: grid;
        grid-template-columns: 1.4fr 1fr 1fr;
        margin: 0;
        border-bottom: 1px solid var(--border);
    }

    .summary > div {
        padding: 1.15rem 1rem;
        border-inline-end: 1px solid var(--border);
    }

    .summary > div:last-child {
        border-inline-end: 0;
    }

    .summary dt {
        color: var(--muted-foreground);
        font-size: 0.68rem;
        font-weight: 550;
    }

    .summary dd {
        margin: 0.3rem 0 0;
        font-size: 1.4rem;
        font-weight: 650;
        letter-spacing: 0;
    }

    .positive {
        color: oklch(0.58 0.15 150);
    }

    .negative {
        color: var(--destructive);
    }

    .composer {
        display: grid;
        grid-template-columns: minmax(150px, 1.4fr) repeat(4, minmax(110px, 0.8fr)) auto;
        align-items: end;
        gap: 0.6rem;
        border-bottom: 1px solid var(--border);
        background: var(--muted);
        padding: 0.8rem 1rem;
    }

    .composer-heading {
        grid-column: 1 / -1;
        font-size: 0.78rem;
        font-weight: 650;
    }

    .composer label {
        display: grid;
        gap: 0.3rem;
        min-width: 0;
    }

    .composer label > span {
        color: var(--muted-foreground);
        font-size: 0.62rem;
        font-weight: 550;
    }

    .composer input,
    .composer select {
        width: 100%;
        min-width: 0;
        height: 34px;
        padding: 0 0.55rem;
    }

    .composer :global(.composer-submit) {
        margin-bottom: 1px;
    }

    .table-toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        padding: 0.75rem 1rem;
    }

    .search-field {
        display: flex;
        width: min(320px, 58%);
        height: 34px;
        align-items: center;
        gap: 0.45rem;
        border: 1px solid var(--input);
        border-radius: 6px;
        background: var(--background);
        padding: 0 0.6rem;
        color: var(--muted-foreground);
    }

    .search-field:focus-within {
        border-color: var(--ring);
        box-shadow: 0 0 0 3px color-mix(in oklab, var(--ring) 24%, transparent);
    }

    .search-field input {
        width: 100%;
        min-width: 0;
        height: 100%;
        border: 0;
        background: transparent;
        padding: 0;
        box-shadow: none;
    }

    .search-field input:focus-visible {
        box-shadow: none;
    }

    .filter-select {
        width: 150px;
        height: 34px;
        padding: 0 0.55rem;
    }

    .table-scroll {
        overflow-x: auto;
        border-top: 1px solid var(--border);
    }

    table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.76rem;
    }

    th,
    td {
        height: 46px;
        box-sizing: border-box;
        border-bottom: 1px solid var(--border);
        padding: 0.55rem 0.75rem;
        text-align: start;
    }

    th {
        height: 38px;
        background: color-mix(in oklab, var(--muted) 55%, transparent);
        color: var(--muted-foreground);
        font-size: 0.64rem;
        font-weight: 600;
    }

    tbody tr:hover {
        background: color-mix(in oklab, var(--muted) 52%, transparent);
    }

    tbody tr:last-child td {
        border-bottom: 0;
    }

    .date-column {
        width: 120px;
        color: var(--muted-foreground);
        white-space: nowrap;
    }

    .description-cell {
        font-weight: 550;
    }

    .category-column {
        width: 130px;
    }

    .amount-column {
        width: 130px;
        text-align: end;
        white-space: nowrap;
    }

    .transaction-amount {
        font-variant-numeric: tabular-nums;
        font-weight: 600;
    }

    .action-column {
        width: 48px;
        padding-inline: 0.4rem;
        text-align: center;
    }

    .empty-state {
        height: 140px;
        color: var(--muted-foreground);
        text-align: center;
    }

    .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        clip-path: inset(50%);
    }

    @media (max-width: 860px) {
        .composer {
            grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .composer-heading,
        .composer label:first-of-type {
            grid-column: 1 / -1;
        }

        .composer :global(.composer-submit) {
            width: 100%;
        }
    }

    @media (max-width: 560px) {
        .app-header {
            align-items: flex-start;
            flex-direction: column;
            padding: 0.75rem;
        }

        .header-actions {
            width: 100%;
        }

        .month-input {
            min-width: 0;
            flex: 1;
        }

        .header-actions :global(.primary-action span) {
            display: none;
        }

        .summary {
            grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .summary > div {
            padding: 0.9rem 0.7rem;
        }

        .summary dd {
            font-size: 1rem;
        }

        .table-toolbar {
            align-items: stretch;
            flex-direction: column;
        }

        .search-field,
        .filter-select {
            width: 100%;
        }

        .date-column,
        .category-column {
            display: none;
        }

        .composer {
            grid-template-columns: 1fr;
        }

        .composer-heading,
        .composer label:first-of-type {
            grid-column: auto;
        }
    }
</style>
