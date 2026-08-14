<script lang="ts">
    import { Plus, Trash2, WalletCards } from "@lucide/svelte";

    type Category = "home" | "food" | "life" | "saving";
    type ItemKey = "rent" | "groceries" | "phone";
    type Expense = {
        id: number;
        name: string;
        nameKey?: ItemKey;
        amount: number;
        category: Category;
    };

    let { language = "en" }: { language?: "en" | "ar" } = $props();
    let income = $state(5200);
    let nextId = 4;
    let expenses = $state<Expense[]>([
        { id: 1, name: "", nameKey: "rent", amount: 1820, category: "home" },
        { id: 2, name: "", nameKey: "groceries", amount: 610, category: "food" },
        { id: 3, name: "", nameKey: "phone", amount: 85, category: "life" },
    ]);

    const copyByLanguage = {
        en: {
            title: "Monthly budget",
            income: "Income",
            spent: "Spent",
            left: "Left",
            item: "Item",
            amount: "Amount",
            category: "Category",
            add: "Add",
            remove: "Remove",
            newItem: "New item",
            categories: { home: "Home", food: "Food", life: "Personal", saving: "Saving" },
            items: { rent: "Rent", groceries: "Groceries", phone: "Phone" },
        },
        ar: {
            title: "ميزانية الشهر",
            income: "الدخل",
            spent: "المصروف",
            left: "الباقي",
            item: "البند",
            amount: "المبلغ",
            category: "الفئة",
            add: "ضيف",
            remove: "مسح",
            newItem: "بند جديد",
            categories: { home: "البيت", food: "الأكل", life: "شخصي", saving: "توفير" },
            items: { rent: "إيجار", groceries: "طلبات البيت", phone: "موبايل" },
        },
    } as const;

    const categoryKeys = ["home", "food", "life", "saving"] as const;
    const categoryColors: Record<Category, string> = {
        home: "#ff6b35",
        food: "#f4bf3a",
        life: "#59a96a",
        saving: "#62a8ea",
    };
    const copy = $derived(copyByLanguage[language]);
    const spent = $derived(
        expenses.reduce((total, expense) => total + Math.max(0, Number(expense.amount) || 0), 0),
    );
    const left = $derived((Number(income) || 0) - spent);
    const totals = $derived.by(() =>
        Object.fromEntries(
            categoryKeys.map((category) => [
                category,
                expenses
                    .filter((expense) => expense.category === category)
                    .reduce((total, expense) => total + Math.max(0, Number(expense.amount) || 0), 0),
            ]),
        ) as Record<Category, number>,
    );
    const chartBackground = $derived.by(() => {
        if (spent <= 0) return "#2b2d35";

        let cursor = 0;
        const stops = categoryKeys.map((category) => {
            const start = cursor;
            cursor += (totals[category] / spent) * 100;
            return `${categoryColors[category]} ${start}% ${cursor}%`;
        });

        return `conic-gradient(${stops.join(", ")})`;
    });

    function formatMoney(value: number) {
        return `$${Math.abs(Math.round(value)).toLocaleString("en-CA")}`;
    }

    function expenseName(expense: Expense) {
        return expense.nameKey ? copy.items[expense.nameKey] : expense.name;
    }

    function updateName(expense: Expense, event: Event) {
        expense.nameKey = undefined;
        expense.name = (event.currentTarget as HTMLInputElement).value;
    }

    function addExpense() {
        expenses.push({ id: nextId++, name: copy.newItem, amount: 0, category: "life" });
    }

    function removeExpense(id: number) {
        expenses = expenses.filter((expense) => expense.id !== id);
    }
</script>

<section
    class="budget-app"
    data-app="budget"
    lang={language}
    dir={language === "ar" ? "rtl" : "ltr"}
    aria-label={copy.title}
>
    <header>
        <div class="app-title">
            <WalletCards size={18} />
            <h3>{copy.title}</h3>
        </div>
        <button class="add-button" type="button" onclick={addExpense}>
            <Plus size={16} /> {copy.add}
        </button>
    </header>

    <div class="budget-overview">
        <label class="income-field">
            <span>{copy.income}</span>
            <span class="money-input" dir="ltr">
                <i>$</i>
                <input data-testid="budget-income" type="number" min="0" step="100" bind:value={income} />
            </span>
        </label>

        <div class="chart-wrap" aria-label={`${copy.spent}: ${formatMoney(spent)}`}>
            <div class="spend-chart" style:background={chartBackground}>
                <div>
                    <span>{copy.spent}</span>
                    <strong dir="ltr">{formatMoney(spent)}</strong>
                </div>
            </div>
        </div>

        <div class:negative={left < 0} class="left-block">
            <span>{copy.left}</span>
            <strong dir="ltr">{left < 0 ? "−" : ""}{formatMoney(left)}</strong>
            <div class="legend" aria-hidden="true">
                {#each categoryKeys as category}
                    <i style={`--legend-color: ${categoryColors[category]}`}></i>
                {/each}
            </div>
        </div>
    </div>

    <div class="expense-list">
        <div class="list-head" aria-hidden="true">
            <span>{copy.item}</span>
            <span>{copy.category}</span>
            <span>{copy.amount}</span>
            <span></span>
        </div>
        {#each expenses as expense (expense.id)}
            <div class="expense-row" data-testid="budget-row">
                <input
                    aria-label={copy.item}
                    value={expenseName(expense)}
                    oninput={(event) => updateName(expense, event)}
                />
                <select aria-label={copy.category} bind:value={expense.category}>
                    {#each categoryKeys as category}
                        <option value={category}>{copy.categories[category]}</option>
                    {/each}
                </select>
                <span class="amount-field" dir="ltr">
                    <i>$</i>
                    <input aria-label={copy.amount} type="number" min="0" step="5" bind:value={expense.amount} />
                </span>
                <button
                    class="remove-button"
                    type="button"
                    title={copy.remove}
                    aria-label={`${copy.remove} ${expenseName(expense)}`}
                    onclick={() => removeExpense(expense.id)}
                >
                    <Trash2 size={15} />
                </button>
            </div>
        {/each}
    </div>
</section>

<style>
    .budget-app {
        min-height: 430px;
        overflow: hidden;
        border-radius: 8px;
        background: #111217;
        color: #f7f7f3;
        box-shadow: 0 6px 0 color-mix(in oklab, #111217 30%, transparent);
    }

    header {
        display: flex;
        min-height: 62px;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        padding: 0.75rem 1rem;
        border-bottom: 1px solid #34363f;
    }

    .app-title,
    .add-button,
    .remove-button {
        display: inline-flex;
        align-items: center;
    }

    .app-title {
        gap: 0.55rem;
    }

    h3 {
        margin: 0;
        font-size: 0.95rem;
    }

    button,
    input,
    select {
        font: inherit;
    }

    button {
        cursor: pointer;
    }

    .add-button {
        min-height: 40px;
        gap: 0.4rem;
        border: 0;
        border-radius: 6px;
        background: #ff6b35;
        padding: 0.55rem 0.72rem;
        color: #111217;
        font-size: 0.76rem;
        font-weight: 700;
    }

    .add-button:hover,
    .add-button:focus-visible {
        background: #ff8257;
    }

    button:focus-visible,
    input:focus-visible,
    select:focus-visible {
        outline: 2px solid #ff8257;
        outline-offset: 2px;
    }

    .budget-overview {
        display: grid;
        grid-template-columns: minmax(150px, 0.8fr) minmax(150px, 1fr) minmax(150px, 0.8fr);
        align-items: center;
        gap: 1rem;
        padding: clamp(1rem, 3vw, 1.6rem);
        border-bottom: 1px solid #34363f;
    }

    .income-field,
    .left-block {
        display: flex;
        min-width: 0;
        flex-direction: column;
    }

    .income-field > span:first-child,
    .left-block > span,
    .spend-chart span {
        color: #a9acb7;
        font-size: 0.68rem;
    }

    .money-input {
        display: flex;
        align-items: baseline;
        margin-top: 0.25rem;
    }

    .money-input i,
    .amount-field i {
        color: #a9acb7;
        font-style: normal;
    }

    .money-input i {
        font-size: 1.7rem;
        font-weight: 700;
    }

    .money-input input {
        width: 100%;
        min-width: 0;
        border: 0;
        background: transparent;
        color: #f7f7f3;
        font-size: clamp(1.8rem, 5vw, 3rem);
        font-weight: 700;
        line-height: 1;
    }

    .chart-wrap {
        display: grid;
        place-items: center;
    }

    .spend-chart {
        display: grid;
        width: 132px;
        aspect-ratio: 1;
        place-items: center;
        border-radius: 50%;
    }

    .spend-chart > div {
        display: grid;
        width: 84px;
        aspect-ratio: 1;
        place-content: center;
        border-radius: 50%;
        background: #111217;
        text-align: center;
    }

    .spend-chart strong {
        margin-top: 0.15rem;
        font-size: 1rem;
    }

    .left-block {
        align-items: flex-end;
        text-align: end;
    }

    .left-block strong {
        margin-top: 0.25rem;
        color: #83d494;
        font-size: clamp(1.8rem, 5vw, 3rem);
        line-height: 1;
    }

    .left-block.negative strong {
        color: #ff8257;
    }

    .legend {
        display: flex;
        gap: 0.3rem;
        margin-top: 0.8rem;
    }

    .legend i {
        width: 16px;
        height: 4px;
        border-radius: 1px;
        background: var(--legend-color);
    }

    .expense-list {
        padding: 0.55rem 1rem 1rem;
    }

    .list-head,
    .expense-row {
        display: grid;
        grid-template-columns: minmax(130px, 1.3fr) minmax(100px, 0.8fr) minmax(100px, 0.65fr) 36px;
        align-items: center;
        gap: 0.55rem;
    }

    .list-head {
        padding: 0.3rem 0.55rem;
        color: #8f929e;
        font-size: 0.6rem;
    }

    .expense-row {
        min-height: 48px;
        border-top: 1px solid #2c2e36;
    }

    .expense-row > input,
    .expense-row select,
    .amount-field {
        width: 100%;
        min-width: 0;
        box-sizing: border-box;
        border: 1px solid transparent;
        border-radius: 4px;
        background: transparent;
        color: #e2e3e8;
        font-size: 0.75rem;
    }

    .expense-row > input,
    .expense-row select {
        min-height: 36px;
        padding: 0.35rem 0.45rem;
    }

    .expense-row input:hover,
    .expense-row select:hover {
        border-color: #484b57;
    }

    .expense-row select {
        background: #111217;
    }

    .amount-field {
        display: flex;
        align-items: center;
        padding-inline-start: 0.45rem;
    }

    .amount-field input {
        width: 100%;
        min-width: 0;
        border: 0;
        background: transparent;
        padding: 0.45rem 0.25rem;
        color: #e2e3e8;
        text-align: end;
    }

    .remove-button {
        width: 34px;
        height: 34px;
        justify-content: center;
        border: 0;
        border-radius: 4px;
        background: transparent;
        color: #8f929e;
    }

    .remove-button:hover,
    .remove-button:focus-visible {
        background: #2b2d35;
        color: #ff8257;
    }

    input[type="number"]::-webkit-inner-spin-button,
    input[type="number"]::-webkit-outer-spin-button {
        margin: 0;
        appearance: none;
    }

    @media (max-width: 620px) {
        .budget-overview {
            grid-template-columns: 1fr 1fr;
        }

        .chart-wrap {
            grid-column: 1 / -1;
            grid-row: 1;
        }

        .income-field,
        .left-block {
            align-items: center;
            text-align: center;
        }

        .money-input input,
        .left-block strong {
            font-size: 1.8rem;
        }

        .list-head {
            display: none;
        }

        .expense-row {
            grid-template-columns: minmax(0, 1fr) minmax(90px, 0.7fr) 34px;
            padding-block: 0.4rem;
        }

        .expense-row > select {
            grid-column: 1;
            grid-row: 2;
        }

        .amount-field {
            grid-column: 2;
            grid-row: 1 / 3;
        }

        .remove-button {
            grid-column: 3;
            grid-row: 1 / 3;
        }
    }
</style>
