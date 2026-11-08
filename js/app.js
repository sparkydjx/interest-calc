import { annuityValues, bondPrice, carComparison, creditCardSummary, loanSummary, stockGrowth } from "./calc.js";

const STORAGE_KEY = "interest-calc-v1";

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const percent = new Intl.NumberFormat("en-US", {
  style: "percent",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const HELP = {
  stocks: {
    principal: "The money already invested on the day you start.",
    annualRate: "How much you expect the investment to grow each year. Enter 8 for 8% a year.",
    inflation: "How much prices rise each year. Enter 3 for 3%. The chart uses this to show the balance in today's buying power.",
    years: "How long the money stays invested.",
    interestType: "Compound adds each period's growth to the balance, so later growth is larger. Simple pays interest only on the money you put in.",
    periodsPerYear: "How often growth is added to the balance. Once it is added, it can grow too.",
    contributionFrequency: "How often you add that contribution: every week, every two weeks, monthly, quarterly, or once a year.",
    contribution: "Money added at the end of each contribution period. It grows only for the time after you add it.",
    "Future value": "What the investment is worth at the end, in future dollars, after growth and contributions.",
    "In today's dollars": "That same ending value measured in today's buying power, after inflation.",
    "You put in": "The starting value plus every contribution. Growth is not included.",
    Growth: "How much the ending value is above the money you put in.",
  },
  bonds: {
    face: "The amount the bond pays back on its maturity date.",
    couponRate: "The yearly interest rate printed on the bond. A 5% coupon on a $1,000 bond pays $50 a year.",
    yieldRate: "The yearly return used to set today's price, assuming you hold the bond until it matures.",
    years: "How many years until the bond pays back its face value.",
    periodsPerYear: "How often the bond pays its interest.",
    Price: "What the bond is worth today, from its future interest payments and its face value.",
    Premium: "The price is higher than face value because the coupon pays more than the yield.",
    Discount: "The price is lower than face value because the coupon pays less than the yield.",
    "At par": "The price equals face value because the coupon and the yield match.",
    "Annual coupon": "The cash interest the bond pays over one year.",
    "Current yield": "One year of coupon payments divided by today's price.",
  },
  annuities: {
    kind: "Immediate turns a lump sum into income that starts now. Deferred adds a monthly contribution while it grows, then pays out like an immediate annuity.",
    initialInvestment: "The lump sum paid today to buy the income.",
    contribution: "The amount added at the end of each month until withdrawals start. It then earns interest.",
    annualRate: "The yearly rate the money earns while it is invested.",
    years: "How many years the income payments last.",
    deferralYears: "How many years you add the monthly contribution. Withdrawals start when these contributions end.",
    periodsPerYear: "How many payments are made each year.",
    due: "Turn this on when each withdrawal is paid at the start of the period. For an immediate annuity, the first payment is today. Monthly contributions are still added at the end of each month.",
    Payment: "The steady income each period that uses up the initial investment.",
    "Total income": "All of the payments added together.",
    "Interest earned": "Total income minus the initial investment.",
    "Interest earned deferred": "Total income minus every monthly contribution.",
    "You contributed": "Every monthly contribution added together. Interest earned during the saving years is not included.",
    "Value when payments begin": "The contributions plus interest on the day withdrawals start. From here the payout is calculated like an immediate annuity.",
    payoutFrequency: "How often you receive a payout once withdrawals start: every month, every quarter, or once a year.",
    "Each payout": "The level payment this balance can support at the frequency you select. Each payment is part earnings and part a drawdown of the balance.",
    "column:Period": "The payment number, counting from the first payment.",
    "column:Payment": "The income paid in that period.",
    "column:Interest": "The part of the payment that came from earnings.",
    "column:Principal": "The part of the payment that reduces the remaining investment.",
    "column:Balance": "What is left of the investment after this payment.",
  },
  loans: {
    principal: "The amount you borrow at the start.",
    annualRate: "The yearly interest rate charged on the unpaid balance. Enter 6.5 for 6.5% a year.",
    years: "How many years you have to pay the loan off.",
    periodsPerYear: "How many payments you make each year.",
    extraPerPeriod: "An amount added to every scheduled payment. It reduces the balance and can pay the loan off sooner.",
    oneTimeAmount: "A single extra amount paid once, in addition to the regular payment.",
    oneTimeDate: "The date of that one-time payment. It is included with the first scheduled payment on or after this date.",
    firstPaymentDate: "The date the first regular payment is due. Later payments follow the schedule from here.",
    Payment: "The steady amount due each period until the loan is paid off.",
    "Payment with extra": "The regular payment plus the extra amount you add every period.",
    "Total paid": "Every payment added together, including interest and extra payments.",
    "Total interest": "The interest charged across the payments. Extra payments lower this by paying the balance down sooner.",
    "Interest saved": "How much less interest you pay than by making only the regular payments.",
    "column:Period": "The payment number, counting from the first payment.",
    "column:Date": "The date that payment is due.",
    "column:Payment": "The amount paid in that period, including any extra.",
    "column:Extra": "The extra amount included in that payment, beyond the regular payment.",
    "column:Interest": "The part of the payment that is interest.",
    "column:Principal": "The part of the payment that reduces what you owe.",
    "column:Balance": "What is still owed after this payment.",
  },
  creditcards: {
    balance: "What you owe on the card today.",
    annualRate: "The card's yearly interest rate. Enter 19.99 for 19.99%. Interest is charged once a month on the unpaid balance.",
    minimumMethod: "1% of the balance plus that month's interest is the formula most large issuers use. 2% of the balance, including interest, is the other common formula. Fees are left out.",
    floor: "The smallest payment the issuer accepts, often $25 or $35. If you owe less than this, the payment is the full amount owed.",
    firstPaymentDate: "The date the first payment is due. Later payments are one month apart.",
    extraPerPeriod: "An amount added to every monthly payment. It reduces the balance and can pay the card off sooner.",
    oneTimeAmount: "A single extra amount paid once, in addition to that month's payment.",
    oneTimeDate: "The date of that one-time payment. It is included with the first monthly payment on or after this date.",
    "Paid off": "The date of the last payment.",
    "Still owed": "The balance left after the payments shown.",
    Payments: "How many monthly payments are shown.",
    "Total paid": "Every payment added together, including interest and extra payments.",
    "Total interest": "The interest charged across the payments. Extra payments lower this by paying the balance down sooner.",
    "Interest saved": "How much less interest you pay than by making only the calculated minimum.",
    "First minimum": "The minimum due on the first payment. Later minimums shrink as the balance shrinks.",
    "column:Period": "The payment number, counting from the first payment.",
    "column:Date": "The date that payment is due.",
    "column:Payment": "The amount paid that month, including any extra.",
    "column:Extra": "The extra amount included in that payment, beyond the monthly payment.",
    "column:Interest": "The interest charged on the balance that month.",
    "column:Principal": "The part of the payment that reduces the balance.",
    "column:Balance": "What is still owed after this payment.",
  },
  cars: {
    cheapPrice: "The price you pay in cash for the cheaper car.",
    expensivePrice: "The price of the car you would finance instead.",
    downPayment: "Cash paid at the start of the expensive car's loan. The rest is borrowed.",
    loanRate: "The yearly interest rate on the expensive car's loan. Enter 6.5 for 6.5%.",
    loanYears: "How many years you have to pay off the expensive car.",
    periodsPerYear: "How many loan payments are made each year. Skipped payments are invested on this same schedule.",
    includeCarValue:
      "Adds what the expensive car is still worth after yearly depreciation. Turn this off to leave that car out. The cheap car's remaining value is always included.",
    depreciation: "How much of each car's price it loses each year. Enter 15 for 15%. The same rate is used for both cars.",
    returnRate: "How much you expect the invested money to grow each year. Enter 8 for 8%.",
    compoundPerYear: "How often growth is added to the investment. Once it is added, it can grow too.",
    years: "How long to run the comparison. It can be longer or shorter than the loan.",
    "Ahead with the cheap car": "How much more the cheap-car path is worth than the financed-car path.",
    "Ahead with the expensive car": "How much more the financed-car path is worth than the cheap-car path.",
    "Cheap car net value plus investment": "The cheap car's remaining value plus the investment account.",
    "Expensive car net value": "The expensive car's remaining value, plus any cash that path invested, minus the loan still owed.",
    "Expensive car path cash": "Cash invested on this path, minus the loan still owed. The expensive car's remaining value is left out.",
    "Loan payment": "The payment due each period on the expensive car.",
    "Investment account": "Money invested because you bought the cheaper car. The car itself is not included.",
    "Interest paid": "Interest charged on the loan payments that fall inside the comparison.",
    "Still owed": "The loan balance left when the comparison ends.",
  },
};

const FREQUENCIES = [
  { value: "1", label: "Annual" },
  { value: "2", label: "Semiannual" },
  { value: "4", label: "Quarterly" },
  { value: "12", label: "Monthly" },
  { value: "365", label: "Daily" },
];

const CONTRIBUTION_FREQUENCIES = [
  { value: "52", label: "Every week" },
  { value: "26", label: "Every 2 weeks" },
  { value: "12", label: "Monthly" },
  { value: "4", label: "Quarterly" },
  { value: "1", label: "Annually" },
];

const MODES = {
  stocks: {
    label: "Stocks",
    blurb: "Growth on a starting balance, plus contributions every week, every 2 weeks, month, quarter, or year. Choose compound or simple interest.",
    fields: [
      {
        name: "interestType",
        label: "Interest",
        type: "radio",
        value: "compound",
        options: [
          { value: "compound", label: "Compound" },
          { value: "simple", label: "Simple" },
        ],
      },
      { name: "principal", label: "Starting value", row: "growth", prefix: "$", value: "10000", min: "0", step: "0.01" },
      {
        name: "periodsPerYear",
        label: "Compounding",
        row: "growth",
        type: "select",
        value: "12",
        options: FREQUENCIES.filter((option) => option.value !== "2"),
        when: (values) => values.interestType !== "simple",
      },
      { name: "contribution", label: "Contribution each period", row: "growth", prefix: "$", value: "200", min: "0", step: "0.01" },
      { name: "annualRate", label: "Expected annual return", row: "contributions", suffix: "%", value: "8", step: "0.01" },
      { name: "years", label: "Years", row: "contributions", value: "10", min: "0.1", step: "0.5" },
      {
        name: "contributionFrequency",
        label: "Contribution frequency",
        row: "contributions",
        type: "select",
        value: "12",
        options: CONTRIBUTION_FREQUENCIES,
      },
      { name: "inflation", label: "Inflation", row: "prices", suffix: "%", value: "3", step: "0.01" },
    ],
    calculate: (input) => stockGrowth({ ...input, contributionPerYear: input.contributionFrequency }),
    render: renderStock,
  },
  bonds: {
    label: "Bonds",
    blurb: "Price of a fixed coupon bond from its yield, plus how that price compares with face value.",
    fields: [
      { name: "face", label: "Face value", prefix: "$", value: "1000", min: "0", step: "0.01" },
      { name: "couponRate", label: "Annual coupon rate", suffix: "%", value: "5", step: "0.01" },
      { name: "yieldRate", label: "Yield to maturity", suffix: "%", value: "6", step: "0.01" },
      { name: "years", label: "Years to maturity", value: "10", min: "0.1", step: "0.5" },
      {
        name: "periodsPerYear",
        label: "Coupon frequency",
        type: "select",
        value: "2",
        options: FREQUENCIES.filter((option) => ["1", "2", "4", "12"].includes(option.value)),
      },
    ],
    calculate: bondPrice,
    render: renderBond,
  },
  annuities: {
    label: "Annuities",
    blurb:
      "Immediate annuities turn a lump sum into income that starts now. Deferred annuities add a monthly contribution until withdrawals start, then pay out the same way.",
    fields: [
      {
        name: "kind",
        label: "Annuity type",
        type: "radio",
        value: "immediate",
        options: [
          { value: "immediate", label: "Immediate" },
          { value: "deferred", label: "Deferred" },
        ],
      },
      {
        name: "initialInvestment",
        label: "Initial investment",
        prefix: "$",
        value: "100000",
        min: "0",
        step: "0.01",
        when: (values) => annuityKind(values) === "immediate",
      },
      {
        name: "contribution",
        label: "Monthly contribution",
        prefix: "$",
        value: "500",
        min: "0",
        step: "0.01",
        when: (values) => annuityKind(values) === "deferred",
      },
      { name: "annualRate", label: "Annual interest rate", suffix: "%", value: "5", step: "0.01" },
      { name: "years", label: "Years of payments", value: "20", min: "0.1", step: "0.5" },
      {
        name: "deferralYears",
        label: "Years of contributions",
        value: "10",
        min: "0.1",
        step: "0.5",
        when: (values) => annuityKind(values) === "deferred",
      },
      {
        name: "periodsPerYear",
        label: "Payments per year",
        type: "select",
        value: "12",
        options: FREQUENCIES.filter((option) => option.value !== "365"),
        when: (values) => annuityKind(values) !== "deferred",
      },
      { name: "due", label: "Payments at the beginning of each period", type: "checkbox", value: false },
    ],
    calculate: annuityValues,
    render: renderAnnuity,
  },
  loans: {
    label: "Loans",
    blurb: "Level payment that pays down a balance. Add an extra amount every period, or a one-time extra payment on a chosen date.",
    fields: [
      { name: "principal", label: "Amount borrowed", group: "loan", prefix: "$", value: "25000", min: "0", step: "0.01" },
      { name: "annualRate", label: "Annual interest rate", group: "loan", suffix: "%", value: "6.5", step: "0.01" },
      { name: "years", label: "Years", group: "loan", value: "5", min: "0.1", step: "0.5" },
      {
        name: "periodsPerYear",
        label: "Payments per year",
        group: "loan",
        type: "select",
        value: "12",
        options: FREQUENCIES.filter((option) => option.value !== "365"),
      },
      { name: "firstPaymentDate", label: "First payment date", group: "extra", type: "date", value: "today" },
      { name: "extraPerPeriod", label: "Extra payment each period", group: "extra", prefix: "$", value: "0", min: "0", step: "0.01" },
      { name: "oneTimeDate", label: "One-time payment date", group: "extra", type: "date", value: "" },
      { name: "oneTimeAmount", label: "One-time extra payment", group: "extra", prefix: "$", value: "0", min: "0", step: "0.01" },
    ],
    calculate: loanSummary,
    render: renderLoan,
  },
  creditcards: {
    label: "Credit card",
    blurb: "Pay down a card with a minimum payment. Choose 1% of the balance plus interest, or 2% of the balance. Add an extra amount every month, or a one-time extra payment on a chosen date.",
    fields: [
      { name: "balance", label: "Balance", group: "card", prefix: "$", value: "5000", min: "0", step: "0.01" },
      { name: "annualRate", label: "Annual interest rate", group: "card", suffix: "%", value: "19.99", step: "0.01" },
      {
        name: "minimumMethod",
        label: "Minimum payment",
        group: "card",
        type: "select",
        value: "percent",
        options: [
          { value: "percent", label: "1% of balance plus interest" },
          { value: "flat", label: "2% of balance" },
        ],
      },
      { name: "floor", label: "Payment floor", group: "card", prefix: "$", value: "25", min: "0", step: "0.01" },
      { name: "firstPaymentDate", label: "First payment date", group: "cardpay", type: "date", value: "today" },
      { name: "extraPerPeriod", label: "Extra payment each month", group: "cardpay", prefix: "$", value: "0", min: "0", step: "0.01" },
      { name: "oneTimeDate", label: "One-time payment date", group: "cardpay", type: "date", value: "" },
      { name: "oneTimeAmount", label: "One-time extra payment", group: "cardpay", prefix: "$", value: "0", min: "0", step: "0.01" },
    ],
    calculate: creditCardSummary,
    render: renderCreditCard,
  },
  cars: {
    label: "Cars",
    blurb:
      "Pay cash for a cheaper car and invest the payments you skip, or finance a more expensive car. Both cars lose value at the same rate.",
    fields: [
      { name: "cheapPrice", label: "Price", group: "cheap", prefix: "$", value: "8000", min: "0", step: "0.01" },
      { name: "returnRate", label: "Expected annual return", group: "cheap", suffix: "%", value: "8", step: "0.01" },
      {
        name: "compoundPerYear",
        label: "Compounding",
        group: "cheap",
        type: "select",
        value: "12",
        options: FREQUENCIES.filter((option) => option.value !== "2"),
      },
      { name: "expensivePrice", label: "Price", group: "expensive", prefix: "$", value: "28000", min: "0", step: "0.01" },
      { name: "downPayment", label: "Down payment", group: "expensive", prefix: "$", value: "3000", min: "0", step: "0.01" },
      { name: "loanRate", label: "Loan interest rate", group: "expensive", suffix: "%", value: "6.5", step: "0.01" },
      { name: "loanYears", label: "Years of payments", group: "expensive", value: "5", min: "0.1", step: "0.5" },
      {
        name: "periodsPerYear",
        label: "Payments per year",
        group: "expensive",
        type: "select",
        value: "12",
        options: FREQUENCIES.filter((option) => option.value !== "365"),
      },
      {
        name: "includeCarValue",
        label: "Include the expensive car's remaining value",
        group: "cheap",
        divide: true,
        type: "checkbox",
        value: true,
      },
      {
        name: "depreciation",
        label: "Yearly depreciation",
        group: "cheap",
        suffix: "%",
        value: "15",
        min: "0",
        step: "0.1",
      },
      { name: "years", label: "Years to compare", group: "cheap", value: "10", min: "0.1", step: "0.5" },
    ],
    calculate: carComparison,
    render: renderCar,
  },
};

const form = document.querySelector("#calc-form");
const blurb = document.querySelector("#blurb");
const results = document.querySelector("#results");
const error = document.querySelector("#error");
const panel = document.querySelector("#panel");
const tabs = [...document.querySelectorAll(".tab")];
const installButton = document.querySelector("#install");

const state = loadState();

tabs.forEach((tab) => {
  tab.addEventListener("click", () => selectMode(tab.dataset.mode));
  tab.addEventListener("keydown", onTabKeydown);
});

form.addEventListener("input", (event) => {
  if (event.target instanceof HTMLInputElement && event.target.dataset.group === "true") {
    groupInput(event.target);
  }
  state.values[state.mode] = { ...(state.values[state.mode] || {}), ...readForm() };
  saveState();
  if (event.target.name === "kind" || event.target.name === "interestType" || event.target.name === "includeCarValue") {
    const name = event.target.name;
    renderForm(MODES[state.mode]);
    (form.querySelector(`[name="${name}"]:checked`) || form.querySelector(`[name="${name}"]`))?.focus();
  }
  calculate();
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  calculate();
});

results.addEventListener("change", (event) => {
  if (!(event.target instanceof HTMLSelectElement) || event.target.name !== "payoutFrequency") return;
  state.values.annuities = { ...(state.values.annuities || {}), payoutFrequency: event.target.value };
  saveState();
  calculate();
  results.querySelector("[name='payoutFrequency']")?.focus();
});

let installPrompt = null;
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  installPrompt = event;
  installButton.hidden = false;
});

installButton.addEventListener("click", async () => {
  if (!installPrompt) return;
  installPrompt.prompt();
  await installPrompt.userChoice;
  installPrompt = null;
  installButton.hidden = true;
});

window.addEventListener("appinstalled", () => {
  installButton.hidden = true;
});

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").catch(() => {
    /* Offline support is optional if registration is blocked. */
  });
}

const FIELD_GROUPS = {
  cheap: "Cheaper car",
  expensive: "More expensive car",
  card: "Card",
  cardpay: "Extra payments",
};

setupHelp();
selectMode(state.mode, { keepStored: true });

function selectMode(mode, { keepStored = false } = {}) {
  if (!MODES[mode]) mode = "stocks";
  state.mode = mode;
  if (!keepStored) saveState();

  const config = MODES[mode];
  tabs.forEach((tab) => {
    const selected = tab.dataset.mode === mode;
    tab.setAttribute("aria-selected", selected ? "true" : "false");
    tab.tabIndex = selected ? 0 : -1;
  });

  const activeTab = document.querySelector(`#tab-${mode}`);
  panel.setAttribute("aria-labelledby", activeTab.id);
  blurb.textContent = config.blurb;
  document.querySelector(".app")?.classList.toggle("wide", mode === "cars" || mode === "loans" || mode === "creditcards" || mode === "stocks");
  renderForm(config);
  calculate();
}

function renderForm(config) {
  const values = state.values[state.mode] || {};
  if (state.mode === "stocks") ensureContributionFrequency(values);
  const visible = config.fields.filter((field) => !field.when || field.when(values));
  const actions = `<div class="actions"><button type="submit" class="ghost">Recalculate</button></div>`;
  if (visible.some((field) => field.row)) {
    const chunks = [];
    let index = 0;
    while (index < visible.length) {
      if (!visible[index].row) {
        const loose = [];
        while (index < visible.length && !visible[index].row) {
          loose.push(renderField(visible[index], values));
          index += 1;
        }
        chunks.push(`<div class="fields">${loose.join("")}</div>`);
        continue;
      }
      const row = visible[index].row;
      const cells = [];
      while (index < visible.length && visible[index].row === row) {
        cells.push(renderField(visible[index], values));
        index += 1;
      }
      chunks.push(`<div class="fields row">${cells.join("")}</div>`);
    }
    form.innerHTML = `${chunks.join("")}${actions}`;
    return;
  }
  if (!visible.some((field) => field.group)) {
    form.innerHTML = `<div class="fields">${visible.map((field) => renderField(field, values)).join("")}</div>${actions}`;
    return;
  }

  const groups = [...new Set(visible.map((field) => field.group).filter(Boolean))];
  const columns = groups
    .map((group) => {
      const body = visible
        .filter((field) => field.group === group)
        .map((field) => renderField(field, values))
        .join("");
      const legend = FIELD_GROUPS[group] ? `<legend>${FIELD_GROUPS[group]}</legend>` : "";
      return `<fieldset class="column">${legend}${body}</fieldset>`;
    })
    .join("");
  const sharedFields = visible.filter((field) => !field.group);
  const shared = sharedFields.length
    ? `<div class="fields shared">${sharedFields.map((field) => renderField(field, values)).join("")}</div>`
    : "";
  form.innerHTML = `<div class="split">${columns}</div>${shared}${actions}`;
}

function renderField(field, values) {
  const rawValue = values[field.name] ?? (field.value === "today" ? todayISO() : field.value);
  const value = field.prefix === "$" ? formatGrouped(rawValue) : rawValue;
  const label = fieldLabel(field, values);
  const mark = helpButton(fieldHelpKey(field, values));
  const id = `field-${field.name}`;
  if (field.type === "checkbox") {
    const checked = value === true || value === "true" ? "checked" : "";
    const section = field.divide ? " section-break" : "";
    return `<div class="check-row${section}"><label class="check"><input type="checkbox" name="${field.name}" ${checked} /><span>${label}</span></label>${mark}</div>`;
  }
  if (field.type === "radio") {
    const radios = field.options
      .map((option) => {
        const checked = String(value) === option.value ? "checked" : "";
        return `<label><input type="radio" name="${field.name}" value="${option.value}" ${checked} /><span>${option.label}</span></label>`;
      })
      .join("");
    return `<fieldset class="choices"><legend>${label}${mark}</legend><div class="choice-row">${radios}</div></fieldset>`;
  }
  if (field.type === "date") {
    return `<div class="field"><div class="label-line"><label for="${id}">${label}</label>${mark}</div><div class="control"><input id="${id}" name="${field.name}" type="date" value="${escapeAttr(value)}" /></div></div>`;
  }
  if (field.type === "select") {
    const options = field.options
      .map((option) => {
        const selected = String(value) === option.value ? "selected" : "";
        return `<option value="${option.value}" ${selected}>${option.label}</option>`;
      })
      .join("");
    return `<div class="field"><div class="label-line"><label for="${id}">${label}</label>${mark}</div><div class="control"><select id="${id}" name="${field.name}">${options}</select></div></div>`;
  }
  const prefix = field.prefix ? `<span class="affix">${field.prefix}</span>` : "";
  const suffix = field.suffix ? `<span class="affix">${field.suffix}</span>` : "";
  const min = field.min != null ? `min="${field.min}"` : "";
  const step = field.step ? `step="${field.step}"` : "step=\"any\"";
  const grouped = field.prefix === "$";
  const type = grouped ? "text" : "number";
  const group = grouped ? `data-group="true"` : "";
  return `<div class="field"><div class="label-line"><label for="${id}">${label}</label>${mark}</div><div class="control">${prefix}<input id="${id}" name="${field.name}" type="${type}" inputmode="decimal" value="${escapeAttr(value)}" ${min} ${step} ${group} required />${suffix}</div></div>`;
}

function calculate() {
  const config = MODES[state.mode];
  const raw = readForm();
  try {
    const input = normalize(config, raw);
    if (state.mode === "annuities") {
      const frequency = state.values.annuities?.payoutFrequency;
      input.payoutFrequency = frequency === "4" || frequency === "1" || frequency === "12" ? frequency : "12";
    }
    const output = config.calculate(input);
    error.hidden = true;
    error.textContent = "";
    results.innerHTML = config.render(output);
    if (output.series) bindSeriesChart(output.series, seriesReadout(output.series));
    if (state.mode === "loans" || state.mode === "creditcards") bindLoanLines();
  } catch (err) {
    results.innerHTML = "";
    error.hidden = false;
    error.textContent = err.message || "Check the numbers and try again.";
  }
}

function normalize(config, raw) {
  const input = {};
  for (const field of config.fields) {
    if (field.when && !field.when(raw)) continue;
    if (!(field.name in raw)) continue;
    if (field.type === "checkbox") {
      input[field.name] = raw[field.name] === true;
      continue;
    }
    if (field.type === "date") {
      const dateValue = String(raw[field.name] ?? "");
      const oneTime = parseNumber(raw.oneTimeAmount);
      if (field.name === "firstPaymentDate" && !isISODate(dateValue)) {
        throw new Error("Choose a first payment date.");
      }
      if (field.name === "oneTimeDate" && oneTime > 0 && !isISODate(dateValue)) {
        throw new Error("Choose a date for the one-time extra payment.");
      }
      input[field.name] = dateValue;
      continue;
    }
    if (field.type === "radio" || (field.type === "select" && !isNumericOptions(field))) {
      const choice = String(raw[field.name]);
      const allowed = field.options?.some((option) => option.value === choice);
      if (!allowed) throw new Error(`Choose a ${field.label.toLowerCase()}.`);
      input[field.name] = choice;
      continue;
    }
    const number = parseNumber(raw[field.name]);
    if (!Number.isFinite(number)) {
      throw new Error(`Enter a number for ${field.label.toLowerCase()}.`);
    }
    if (field.min != null && number < Number(field.min)) {
      throw new Error(`${field.label} must be at least ${field.min}.`);
    }
    input[field.name] = field.suffix === "%" ? number / 100 : number;
  }
  return input;
}

function readForm() {
  const data = new FormData(form);
  const values = {};
  for (const field of MODES[state.mode].fields) {
    if (!form.elements[field.name]) continue;
    if (field.type === "checkbox") {
      values[field.name] = data.get(field.name) === "on";
    } else {
      values[field.name] = data.get(field.name) ?? "";
    }
  }
  return values;
}

function renderStock(output) {
  const timing =
    output.interestType === "simple"
      ? `Simple interest for ${formatYears(output.yearsHeld)}.`
      : `${output.periods.toLocaleString("en-US")} compounding periods.`;
  const deposits =
    output.contributionCount > 0
      ? ` ${output.contributionCount.toLocaleString("en-US")} contributions, ${contributionPace(output.contributionPerYear)}.`
      : "";
  const summary = [
    stat("Future value", money.format(output.futureValue), true),
    stat("In today's dollars", money.format(output.realValue)),
    stat("You put in", money.format(output.contributed)),
    stat("Growth", money.format(output.growth), false, output.growth >= 0),
  ];
  return [
    `<div class="stat-row pairs">${summary.join("")}</div>`,
    growthChart(output.series),
    note(timing + deposits),
  ].join("");
}

function contributionPace(perYear) {
  return (
    {
      52: "every week",
      26: "every 2 weeks",
      12: "every month",
      4: "every quarter",
      1: "every year",
    }[perYear] || "on your schedule"
  );
}

function ensureContributionFrequency(values) {
  const allowed = new Set(CONTRIBUTION_FREQUENCIES.map((option) => option.value));
  if (allowed.has(String(values.contributionFrequency ?? ""))) return;
  const previous = String(values.periodsPerYear ?? "");
  values.contributionFrequency = allowed.has(previous) ? previous : previous === "365" ? "52" : "12";
}

function growthChart(series) {
  const width = 640;
  const height = 280;
  const left = 58;
  const right = 16;
  const top = 16;
  const bottom = 36;
  const plotW = width - left - right;
  const plotH = height - top - bottom;
  const amounts = series.flatMap((point) => [point.value, point.real, point.contributed]);
  let min = Math.min(0, ...amounts);
  let max = Math.max(0, ...amounts);
  if (min === max) max = min + 1;
  max += (max - min) * 0.08;
  const span = max - min;
  const yFor = (amount) => top + plotH - ((amount - min) / span) * plotH;
  const xFor = (index) => left + (series.length === 1 ? plotW / 2 : (index / (series.length - 1)) * plotW);
  const balance = series.map((point, index) => `${xFor(index).toFixed(1)},${yFor(point.value).toFixed(1)}`).join(" ");
  const real = series.map((point, index) => `${xFor(index).toFixed(1)},${yFor(point.real).toFixed(1)}`).join(" ");
  const contributed = series.map((point, index) => `${xFor(index).toFixed(1)},${yFor(point.contributed).toFixed(1)}`).join(" ");
  const zeroY = yFor(0);
  const area = `M ${xFor(0).toFixed(1)} ${zeroY.toFixed(1)} ${series
    .map((point, index) => `L ${xFor(index).toFixed(1)} ${yFor(point.value).toFixed(1)}`)
    .join(" ")} L ${xFor(series.length - 1).toFixed(1)} ${zeroY.toFixed(1)} Z`;
  const grid = [0, 0.5, 1]
    .map((step) => {
      const amount = min + span * step;
      const y = yFor(amount);
      return `<line class="chart-grid" x1="${left}" y1="${y.toFixed(1)}" x2="${left + plotW}" y2="${y.toFixed(1)}" /><text class="chart-label" x="${left - 8}" y="${(y + 4).toFixed(1)}" text-anchor="end">${compactMoney(amount)}</text>`;
    })
    .join("");
  const yearMarks = [0, 0.5, 1]
    .map((step, mark) => {
      const index = Math.round(step * (series.length - 1));
      const point = series[index];
      const anchor = ["start", "middle", "end"][mark];
      return `<text class="chart-label" x="${xFor(index).toFixed(1)}" y="${height - 10}" text-anchor="${anchor}">Yr ${formatYear(point.year)}</text>`;
    })
    .join("");
  const start = series[0];
  const end = series[series.length - 1];
  const label = `Total value from ${money.format(start.value)} at the start to ${money.format(end.value)} after ${formatYear(end.year)} years, worth ${money.format(end.real)} in today's buying power.`;

  return `<figure class="chart"><figcaption>Growth over time</figcaption><svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeAttr(label)}">${grid}${yearMarks}<path class="chart-area" d="${area}" /><polyline class="chart-contributed" points="${contributed}" /><polyline class="chart-real" points="${real}" /><polyline class="chart-balance" points="${balance}" /><line class="chart-cursor" data-cursor x1="${left}" y1="${top}" x2="${left}" y2="${top + plotH}" visibility="hidden" /><rect class="chart-plot" data-plot data-x="${left}" data-w="${plotW}" x="${left}" y="${top}" width="${plotW}" height="${plotH}" /></svg><div class="legend"><span><i class="swatch balance"></i>Total value</span><span><i class="swatch real"></i>Today's buying power</span><span><i class="swatch contributed"></i>Money put in</span></div><p class="chart-readout" data-readout>${chartReadout(end, true)}</p></figure>`;
}

function bindSeriesChart(series, readoutFor) {
  const plot = results.querySelector("[data-plot]");
  const cursor = results.querySelector("[data-cursor]");
  const readout = results.querySelector("[data-readout]");
  const svg = plot?.ownerSVGElement;
  if (!plot || !cursor || !svg) return;

  const show = (clientX) => {
    const point = svg.createSVGPoint();
    point.x = clientX;
    const local = point.matrixTransform(svg.getScreenCTM().inverse());
    const plotX = Number(plot.dataset.x);
    const plotW = Number(plot.dataset.w);
    const t = Math.min(1, Math.max(0, (local.x - plotX) / plotW));
    const index = Math.round(t * (series.length - 1));
    const x = plotX + t * plotW;
    cursor.setAttribute("x1", x);
    cursor.setAttribute("x2", x);
    cursor.setAttribute("visibility", "visible");
    readout.textContent = readoutFor(series[index]);
  };

  plot.addEventListener("pointermove", (event) => show(event.clientX));
  plot.addEventListener("pointerdown", (event) => show(event.clientX));
  plot.addEventListener("pointerleave", () => {
    cursor.setAttribute("visibility", "hidden");
    readout.textContent = readoutFor(series[series.length - 1], true);
  });
}

function seriesReadout(series) {
  const first = series[0] || {};
  if (first.cheap != null) return comparisonReadout;
  if (first.balance != null) return loanReadout;
  return chartReadout;
}

function loanLineState() {
  const saved = state.values[state.mode]?.chartLines;
  return {
    balance: saved?.balance !== false,
    extra: saved?.extra !== false,
    interest: saved?.interest !== false,
  };
}

function setLoanLine(name, shown) {
  state.values[state.mode] = {
    ...(state.values[state.mode] || {}),
    chartLines: { ...loanLineState(), [name]: shown },
  };
  saveState();
}

function bindLoanLines() {
  results.querySelectorAll("[data-loan-line]").forEach((input) => {
    input.addEventListener("change", () => {
      const name = input.dataset.loanLine;
      setLoanLine(name, input.checked);
      calculate();
      results.querySelector(`[data-loan-line="${name}"]`)?.focus();
    });
  });
}

function loanReadout(point, isEnd = false) {
  const amount = formatYear(point.year);
  const when = isEnd ? `After ${amount} ${point.year === 1 ? "year" : "years"}` : `Year ${amount}`;
  const lines = loanLineState();
  const parts = [];
  if (lines.balance) parts.push(`Amount owed ${money.format(point.balance)}`);
  if (lines.extra && point.extraBalance != null) parts.push(`Payoff with extra payments ${money.format(point.extraBalance)}`);
  if (lines.interest) parts.push(`Interest paid ${money.format(point.interest)}`);
  return parts.length ? `${when} · ${parts.join(" · ")}` : `${when} · No lines shown`;
}

function chartReadout(point, isEnd = false) {
  const when = isEnd ? `After ${formatYear(point.year)} years` : `Year ${formatYear(point.year)}`;
  return `${when} · Total value ${money.format(point.value)} · Today's buying power ${money.format(point.real)} · Put in ${money.format(point.contributed)}`;
}

function compactMoney(amount) {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "−" : "";
  if (abs < 0.5) return "$0";
  if (abs >= 1000000) return `${sign}$${(abs / 1000000).toFixed(abs >= 10000000 ? 0 : 1)}M`;
  if (abs >= 10000) return `${sign}$${Math.round(abs / 1000)}k`;
  if (abs >= 1000) return `${sign}$${(abs / 1000).toFixed(1)}k`;
  return money.format(amount);
}

function formatYear(year) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(year);
}

function fieldLabel(field) {
  return field.label;
}

function fieldHelpKey(field) {
  return field.name;
}

function formatGrouped(value) {
  const text = String(value ?? "").replace(/,/g, "").trim();
  if (text === "" || text === "-" || text === "." || text === "-.") return text;
  const negative = text.startsWith("-");
  const body = negative ? text.slice(1) : text;
  const match = body.match(/^(\d*)(\.\d*)?$/);
  if (!match) return String(value);
  if (match[1] === "") return `${negative ? "-" : ""}${match[2] ?? ""}`;
  const grouped = Number(match[1]).toLocaleString("en-US");
  return `${negative ? "-" : ""}${grouped}${match[2] ?? ""}`;
}

function groupInput(input) {
  const caret = input.selectionStart ?? input.value.length;
  const digitsBefore = input.value.slice(0, caret).replace(/[^\d]/g, "").length;
  const formatted = formatGrouped(input.value);
  if (formatted === input.value) return;
  input.value = formatted;
  const next = caretAfterDigits(formatted, digitsBefore);
  input.setSelectionRange(next, next);
}

function caretAfterDigits(value, digitsBefore) {
  if (digitsBefore <= 0) return 0;
  let seen = 0;
  for (let index = 0; index < value.length; index += 1) {
    if (/\d/.test(value[index])) seen += 1;
    if (seen >= digitsBefore) return index + 1;
  }
  return value.length;
}

function parseNumber(value) {
  if (typeof value === "number") return value;
  return Number(String(value ?? "").replace(/,/g, "").trim());
}

function todayISO() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function isISODate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

function formatDisplayDate(iso) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(
    new Date(year, month - 1, day)
  );
}

function formatYears(years) {
  const text = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(years);
  return `${text} ${years === 1 ? "year" : "years"}`;
}

function renderCar(output) {
  const cheapWins = output.ahead >= -0.005;
  const aheadLabel = cheapWins ? "Ahead with the cheap car" : "Ahead with the expensive car";
  const cheapLabel = "Cheap car net value plus investment";
  const expensiveLabel = "Expensive car net value";
  const expensiveKey = output.includeCarValue ? expensiveLabel : "Expensive car path cash";
  const cheapColumn = [
    stat(cheapLabel, money.format(output.cheapNet)),
    stat("Investment account", money.format(output.investment)),
  ];
  const expensiveColumn = [
    stat(expensiveLabel, money.format(output.expensiveNet), false, null, expensiveKey),
  ];
  if (output.payment > 0) expensiveColumn.push(stat("Loan payment", money.format(output.payment)));
  if (output.interestPaid > 0.004) expensiveColumn.push(stat("Interest paid", money.format(output.interestPaid)));
  if (output.loanBalance > 0.004) expensiveColumn.push(stat("Still owed", money.format(output.loanBalance)));
  return [
    stat(aheadLabel, money.format(Math.abs(output.ahead)), true, cheapWins),
    `<div class="split result-paths"><div class="column">${cheapColumn.join("")}</div><div class="column">${expensiveColumn.join("")}</div></div>`,
    comparisonChart(output.series, output.includeCarValue),
    note(carNote(output)),
  ].join("");
}

function carNote(output) {
  const windowText =
    output.loanPeriods > 0 && output.horizon > output.loanPeriods
      ? " After the loan would end, nothing new is invested and the account keeps growing."
      : output.loanBalance > 0.004
        ? " The loan still has a balance because the comparison ends first."
        : "";
  const cars = output.includeCarValue
    ? "Both cars lose the same share of their price each year. Each line is the car, plus investments, minus any loan still owed."
    : "The cheap car's total is its remaining value plus the investment account. The expensive car's remaining value is left out, so that line is invested cash minus the loan still owed.";
  return `The cheaper car is paid in cash. Cash left over, compared with the down payment, is invested up front, and each loan payment you don't make is invested at the end of that period. ${cars}${windowText}`;
}

function comparisonChart(series, includeCarValue) {
  const width = 640;
  const height = 280;
  const left = 58;
  const right = 16;
  const top = 16;
  const bottom = 36;
  const plotW = width - left - right;
  const plotH = height - top - bottom;
  const amounts = series.flatMap((point) => [point.cheap, point.expensive]);
  let min = Math.min(0, ...amounts);
  let max = Math.max(0, ...amounts);
  if (min === max) max = min + 1;
  max += (max - min) * 0.08;
  const span = max - min;
  const yFor = (amount) => top + plotH - ((amount - min) / span) * plotH;
  const xFor = (index) => left + (series.length === 1 ? plotW / 2 : (index / (series.length - 1)) * plotW);
  const cheap = series.map((point, index) => `${xFor(index).toFixed(1)},${yFor(point.cheap).toFixed(1)}`).join(" ");
  const expensive = series.map((point, index) => `${xFor(index).toFixed(1)},${yFor(point.expensive).toFixed(1)}`).join(" ");
  const zeroY = yFor(0);
  const area = `M ${xFor(0).toFixed(1)} ${zeroY.toFixed(1)} ${series
    .map((point, index) => `L ${xFor(index).toFixed(1)} ${yFor(point.cheap).toFixed(1)}`)
    .join(" ")} L ${xFor(series.length - 1).toFixed(1)} ${zeroY.toFixed(1)} Z`;
  const grid = [0, 0.5, 1]
    .map((step) => {
      const amount = min + span * step;
      const y = yFor(amount);
      return `<line class="chart-grid" x1="${left}" y1="${y.toFixed(1)}" x2="${left + plotW}" y2="${y.toFixed(1)}" /><text class="chart-label" x="${left - 8}" y="${(y + 4).toFixed(1)}" text-anchor="end">${compactMoney(amount)}</text>`;
    })
    .join("");
  const yearMarks = [0, 0.5, 1]
    .map((step, mark) => {
      const index = Math.round(step * (series.length - 1));
      const point = series[index];
      const anchor = ["start", "middle", "end"][mark];
      return `<text class="chart-label" x="${xFor(index).toFixed(1)}" y="${height - 10}" text-anchor="${anchor}">Yr ${formatYear(point.year)}</text>`;
    })
    .join("");
  const end = series[series.length - 1];
  const caption = includeCarValue ? "Net worth over time" : "Cheap car and cash over time";
  const cheapLegend = "Cheap car and investment";
  const expensiveLegend = includeCarValue ? "Expensive car and payments" : "Cash minus the loan";
  const label = `After ${formatYear(end.year)} years the cheap car net value plus investment is ${money.format(end.cheap)} and the expensive car net value is ${money.format(end.expensive)}.`;
  return `<figure class="chart"><figcaption>${caption}</figcaption><svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeAttr(label)}">${grid}${yearMarks}<path class="chart-area" d="${area}" /><polyline class="chart-real" points="${expensive}" /><polyline class="chart-balance" points="${cheap}" /><line class="chart-cursor" data-cursor x1="${left}" y1="${top}" x2="${left}" y2="${top + plotH}" visibility="hidden" /><rect class="chart-plot" data-plot data-x="${left}" data-w="${plotW}" x="${left}" y="${top}" width="${plotW}" height="${plotH}" /></svg><div class="legend"><span><i class="swatch balance"></i>${cheapLegend}</span><span><i class="swatch real"></i>${expensiveLegend}</span></div><p class="chart-readout" data-readout>${comparisonReadout(end, true)}</p></figure>`;
}

function comparisonReadout(point, isEnd = false) {
  const when = isEnd ? `After ${formatYear(point.year)} years` : `Year ${formatYear(point.year)}`;
  return `${when} · Cheap car ${money.format(point.cheap)} · Expensive car ${money.format(point.expensive)}`;
}

function renderBond(output) {
  const relation =
    Math.abs(output.versusFace) < 0.005
      ? "At par"
      : output.versusFace > 0
        ? "Premium"
        : "Discount";
  return [
    stat("Price", money.format(output.price), true),
    stat(relation, money.format(output.versusFace), false, output.versusFace >= 0),
    stat("Annual coupon", money.format(output.annualCoupon)),
    stat("Current yield", output.currentYield == null ? "—" : percent.format(output.currentYield)),
    note(`${output.periods.toLocaleString("en-US")} coupon periods.`),
  ].join("");
}

function renderAnnuity(output) {
  if (output.kind === "deferred") {
    const timing = output.due
      ? "The first payment is paid when the waiting period ends."
      : "The first payment is one period after the waiting period ends.";
    const balanceNote =
      output.endingBalance > 0.004
        ? ` About ${money.format(output.endingBalance)} would remain after the payouts.`
        : " Totals use the payout rounded to the cent.";
    return [
      renderPayouts(output),
      stat("Value when payments begin", money.format(output.valueAtStart)),
      stat("You contributed", money.format(output.contributed)),
      stat("Total income", money.format(output.totalPaid)),
      stat("Interest earned", money.format(output.interest), false, output.interest >= 0, "Interest earned deferred"),
      note(
        `${money.format(output.contribution)} is added at the end of each month for ${formatYears(output.deferralYears)}. Withdrawals then follow an immediate annuity. ${timing}${balanceNote}`
      ),
      scheduleTable(output.rows),
    ].join("");
  }

  const balanceNote =
    output.endingBalance > 0.004
      ? `About ${money.format(output.endingBalance)} would remain after ${output.rows.length.toLocaleString("en-US")} payments.`
      : output.due
        ? "The first payment is paid today. Totals use the payment rounded to the cent."
        : "The first payment is at the end of the first period. Totals use the payment rounded to the cent.";

  return [
    stat("Payment", money.format(output.payment), true),
    stat("Total income", money.format(output.totalPaid)),
    stat("Interest earned", money.format(output.interest), false, output.interest >= 0),
    note(balanceNote),
    scheduleTable(output.rows),
  ].join("");
}

function renderPayouts(output) {
  const saved = state.values.annuities?.payoutFrequency;
  const selected = output.payouts.some((choice) => choice.value === saved) ? saved : "12";
  const choice = output.payouts.find((item) => item.value === selected) || output.payouts[0];
  const options = output.payouts
    .map((item) => `<option value="${item.value}" ${item.value === choice.value ? "selected" : ""}>${item.label}</option>`)
    .join("");
  const amount = choice.amount == null ? "—" : money.format(choice.amount);
  const explanation = choice.amount == null ? note("The years of payments are shorter than one payout at that frequency.") : "";
  return `<section class="payouts"><h2>Payouts</h2><div class="field"><div class="label-line"><label for="payout-frequency">Payout frequency</label>${helpButton("payoutFrequency")}</div><div class="control"><select id="payout-frequency" name="payoutFrequency">${options}</select></div></div>${stat("Each payout", amount, true)}${explanation}</section>`;
}

function annuityKind(values) {
  return values?.kind === "deferred" ? "deferred" : "immediate";
}

function isNumericOptions(field) {
  return field.options?.every((option) => Number.isFinite(Number(option.value)));
}

function renderLoan(output) {
  const lines = [stat("Payment", money.format(output.roundedPayment), true)];
  const totals = [
    stat("Total paid", money.format(output.totalPaid)),
    stat("Total interest", money.format(output.totalInterest)),
  ];
  if (output.interestSaved > 0.004) {
    totals.push(stat("Interest saved", money.format(output.interestSaved), false, true));
  }
  if (output.extraPerPeriod > 0) {
    totals.unshift(stat("Payment with extra", money.format(output.roundedPayment + output.extraPerPeriod)));
  }
  lines.push(`<div class="stat-row">${totals.join("")}</div>`);
  lines.push(note(loanNote(output)), scheduleTable(output.rows), loanChart(output.series));
  return lines.join("");
}

function renderCreditCard(output) {
  const headline =
    output.rows.length === 0
      ? stat("Paid off", "Already paid", true)
      : output.endingBalance > 0.004
        ? stat("Still owed", money.format(output.endingBalance), true)
        : stat("Paid off", output.payoffDate ? formatDisplayDate(output.payoffDate) : "Now", true);
  const totals = [
    stat("First minimum", money.format(output.firstMinimum)),
    stat("Payments", output.rows.length.toLocaleString("en-US")),
    stat("Total paid", money.format(output.totalPaid)),
    stat("Total interest", money.format(output.totalInterest)),
  ];
  if (output.interestSaved > 0.004) totals.push(stat("Interest saved", money.format(output.interestSaved), false, true));
  return [
    headline,
    `<div class="stat-row">${totals.join("")}</div>`,
    note(creditCardNote(output)),
    scheduleTable(output.rows),
    output.rows.length ? loanChart(output.series, "Balance over time") : "",
  ].join("");
}

function creditCardNote(output) {
  if (!output.rows.length) return "The balance is already paid off.";
  const formula = output.minimumMethod === "flat" ? "2% of the balance, including interest" : "1% of the balance plus interest";
  if (output.grows) {
    return `A minimum of ${formula} does not cover the monthly interest, so the balance grows. After ${output.rows.length.toLocaleString("en-US")} payments, about ${money.format(output.endingBalance)} would still be owed.`;
  }
  if (output.endingBalance > 0.004) {
    return `About ${money.format(output.endingBalance)} would still be owed after ${output.rows.length.toLocaleString("en-US")} payments. Each payment is ${formula}, and at least ${money.format(output.floor)}.`;
  }
  const payoff = output.payoffDate ? ` on ${formatDisplayDate(output.payoffDate)}` : "";
  const sooner = output.baselinePaidOff && output.paymentsSaved > 0
    ? ` That is ${output.paymentsSaved.toLocaleString("en-US")} payments sooner than paying only the minimum.`
    : !output.baselinePaidOff && (output.extraPerPeriod > 0 || output.oneTimeAmount > 0)
      ? " The minimum alone does not pay the balance off within 50 years. The extra payments do."
      : "";
  let extra = "";
  if (output.oneTimeAmount > 0 && output.oneTimeApplied) {
    extra = ` The one-time extra payment is included on ${formatDisplayDate(output.oneTimeAppliedDate)}.`;
  } else if (output.oneTimeAmount > 0) {
    extra = " The balance is paid off before the one-time extra payment, so that payment is not included.";
  }
  return `${output.rows.length.toLocaleString("en-US")} payments pay the balance off${payoff}.${sooner}${extra} Each payment is ${formula}, and at least ${money.format(output.floor)}, until the balance is smaller than that. Totals use each payment rounded to the cent.`;
}

function loanChart(series, caption = "Loan over time") {
  const width = 640;
  const height = 280;
  const left = 58;
  const right = 16;
  const top = 16;
  const bottom = 36;
  const plotW = width - left - right;
  const plotH = height - top - bottom;
  const lines = loanLineState();
  const showExtra = series.some((point) => point.extraBalance != null);
  const amounts = [];
  if (lines.balance) amounts.push(...series.map((point) => point.balance));
  if (showExtra && lines.extra) amounts.push(...series.map((point) => point.extraBalance));
  if (lines.interest) amounts.push(...series.map((point) => point.interest));
  if (!amounts.length) amounts.push(0, 1);
  let min = Math.min(0, ...amounts);
  let max = Math.max(0, ...amounts);
  if (min === max) max = min + 1;
  max += (max - min) * 0.08;
  const span = max - min;
  const maxYear = series[series.length - 1].year;
  const yFor = (amount) => top + plotH - ((amount - min) / span) * plotH;
  const xFor = (year) => left + (maxYear === 0 ? plotW / 2 : (year / maxYear) * plotW);
  const pointsFor = (pick, rows = series) =>
    rows.map((point) => `${xFor(point.year).toFixed(1)},${yFor(pick(point)).toFixed(1)}`).join(" ");
  const extraRows = [];
  if (showExtra) {
    for (const point of series) {
      extraRows.push(point);
      if (point.year > 0 && point.extraBalance <= 0.004) break;
    }
  }
  const zeroY = yFor(0);
  const area = lines.balance
    ? `M ${xFor(0).toFixed(1)} ${zeroY.toFixed(1)} ${series
        .map((point) => `L ${xFor(point.year).toFixed(1)} ${yFor(point.balance).toFixed(1)}`)
        .join(" ")} L ${xFor(maxYear).toFixed(1)} ${zeroY.toFixed(1)} Z`
    : "";
  const grid = [0, 0.5, 1]
    .map((step) => {
      const amount = min + span * step;
      const y = yFor(amount);
      return `<line class="chart-grid" x1="${left}" y1="${y.toFixed(1)}" x2="${left + plotW}" y2="${y.toFixed(1)}" /><text class="chart-label" x="${left - 8}" y="${(y + 4).toFixed(1)}" text-anchor="end">${compactMoney(amount)}</text>`;
    })
    .join("");
  const yearMarks = [0, 0.5, 1]
    .map((step, mark) => {
      const index = Math.round(step * (series.length - 1));
      const point = series[index];
      const anchor = ["start", "middle", "end"][mark];
      return `<text class="chart-label" x="${xFor(point.year).toFixed(1)}" y="${height - 10}" text-anchor="${anchor}">Yr ${formatYear(point.year)}</text>`;
    })
    .join("");
  const end = series[series.length - 1];
  const shown = [
    lines.balance ? `Amount owed ends at ${money.format(end.balance)}` : "",
    showExtra && lines.extra ? `Payoff with extra payments ends at ${money.format(extraRows[extraRows.length - 1].extraBalance)}` : "",
    lines.interest ? `Interest paid ends at ${money.format(end.interest)}` : "",
  ].filter(Boolean);
  const label = shown.length
    ? `After ${formatYear(end.year)} years, ${shown.join(". ")}.`
    : "No lines are shown.";
  const balanceLine = lines.balance ? `<polyline class="chart-balance" points="${pointsFor((point) => point.balance)}" />` : "";
  const interestLine = lines.interest ? `<polyline class="chart-contributed" points="${pointsFor((point) => point.interest)}" />` : "";
  const extraLine = showExtra && lines.extra ? `<polyline class="chart-real" points="${pointsFor((point) => point.extraBalance, extraRows)}" />` : "";
  const areaPath = area ? `<path class="chart-area" d="${area}" />` : "";
  const toggles = [
    lineToggle("balance", "Amount owed", "balance", lines.balance),
    showExtra ? lineToggle("extra", "Payoff with extra payments", "real", lines.extra) : "",
    lineToggle("interest", "Interest paid", "contributed", lines.interest),
  ].join("");
  return `<figure class="chart"><figcaption>${caption}</figcaption><svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeAttr(label)}">${grid}${yearMarks}${areaPath}${interestLine}${balanceLine}${extraLine}<line class="chart-cursor" data-cursor x1="${left}" y1="${top}" x2="${left}" y2="${top + plotH}" visibility="hidden" /><rect class="chart-plot" data-plot data-x="${left}" data-w="${plotW}" x="${left}" y="${top}" width="${plotW}" height="${plotH}" /></svg><div class="legend">${toggles}</div><p class="chart-readout" data-readout>${loanReadout(end, true)}</p></figure>`;
}

function lineToggle(name, label, swatch, checked) {
  return `<label class="check"><input type="checkbox" data-loan-line="${name}" ${checked ? "checked" : ""} /><i class="swatch ${swatch}"></i><span>${label}</span></label>`;
}

function loanNote(output) {
  if (output.endingBalance > 0.004) {
    return `About ${money.format(output.endingBalance)} would still be owed after ${output.rows.length.toLocaleString("en-US")} payments, because the payment does not cover the interest.`;
  }

  const payoff = output.payoffDate ? ` on ${formatDisplayDate(output.payoffDate)}` : "";
  const sooner =
    output.paymentsSaved > 0
      ? ` That is ${output.paymentsSaved.toLocaleString("en-US")} payments sooner than the original schedule.`
      : "";
  let extra = "";
  if (output.oneTimeAmount > 0 && output.oneTimeApplied) {
    extra = ` The one-time extra payment is included on ${formatDisplayDate(output.oneTimeAppliedDate)}.`;
  } else if (output.oneTimeAmount > 0) {
    extra = " The loan is paid off before the one-time extra payment, so that payment is not included.";
  }
  return `${output.rows.length.toLocaleString("en-US")} payments pay the balance off${payoff}.${sooner}${extra} Totals use each payment rounded to the cent.`;
}

function scheduleTable(rows) {
  if (!rows.length) return "";
  const showDate = rows.some((row) => row.date);
  const showExtra = rows.some((row) => row.extra > 0);
  const columns = ["Period", showDate ? "Date" : "", "Payment", showExtra ? "Extra" : "", "Interest", "Principal", "Balance"].filter(Boolean);
  const headers = columns
    .map((name) => `<th><span class="col-label">${name}${helpButton(`column:${name}`)}</span></th>`)
    .join("");
  const body = rows
    .map((row) => {
      const cells = [
        row.period,
        showDate ? formatDisplayDate(row.date) : null,
        money.format(row.payment),
        showExtra ? money.format(row.extra || 0) : null,
        money.format(row.interest),
        money.format(row.principal),
        money.format(row.balance),
      ].filter((cell) => cell != null);
      return `<tr>${cells.map((cell) => `<td>${cell}</td>`).join("")}</tr>`;
    })
    .join("");
  return `<details class="schedule"><summary>Payment schedule</summary><div class="table-wrap"><table><thead><tr>${headers}</tr></thead><tbody>${body}</tbody></table></div></details>`;
}

function stat(label, value, primary = false, positive = null, helpKey = label) {
  const tone = positive == null ? "" : positive ? " positive" : " negative";
  return `<article class="stat${primary ? "" : " compact"}"><p>${label}${helpButton(helpKey)}</p><strong class="${tone.trim()}">${value}</strong></article>`;
}

function helpButton(key) {
  const text = HELP[state.mode]?.[key];
  if (!text) return "";
  return `<button type="button" class="help" data-help="${escapeAttr(text)}" aria-label="${escapeAttr(text)}"><sup>?</sup></button>`;
}

function setupHelp() {
  const tip = document.createElement("div");
  tip.id = "help-tip";
  tip.className = "tip";
  tip.setAttribute("role", "tooltip");
  tip.hidden = true;
  document.body.appendChild(tip);

  let anchor = null;

  function showTip(button) {
    anchor = button;
    tip.textContent = button.dataset.help || "";
    tip.hidden = false;
    placeTip();
  }

  function hideTip() {
    anchor = null;
    tip.hidden = true;
  }

  function placeTip() {
    if (!anchor || !anchor.isConnected) {
      hideTip();
      return;
    }
    const rect = anchor.getBoundingClientRect();
    const margin = 8;
    const width = tip.offsetWidth;
    const height = tip.offsetHeight;
    let left = rect.left + rect.width / 2 - width / 2;
    left = Math.max(margin, Math.min(left, window.innerWidth - width - margin));
    let top = rect.top - height - margin;
    if (top < margin) top = rect.bottom + margin;
    tip.style.left = `${left}px`;
    tip.style.top = `${top}px`;
  }

  document.addEventListener("pointerover", (event) => {
    const button = event.target.closest?.(".help");
    if (button) showTip(button);
  });

  document.addEventListener("pointerout", (event) => {
    const button = event.target.closest?.(".help");
    if (!button || anchor !== button) return;
    const next = event.relatedTarget;
    if (next instanceof Node && button.contains(next)) return;
    hideTip();
  });

  document.addEventListener("focusin", (event) => {
    if (event.target.classList?.contains("help")) showTip(event.target);
  });

  document.addEventListener("focusout", (event) => {
    if (event.target.classList?.contains("help")) hideTip();
  });

  document.addEventListener("pointerdown", (event) => {
    if (event.target.closest?.(".help")) event.stopPropagation();
  });

  window.addEventListener("scroll", placeTip, true);
  window.addEventListener("resize", placeTip);
}

function note(text) {
  return `<p class="note">${text}</p>`;
}

function onTabKeydown(event) {
  const current = tabs.indexOf(event.currentTarget);
  if (current < 0) return;
  let next = null;
  if (event.key === "ArrowRight") next = tabs[(current + 1) % tabs.length];
  if (event.key === "ArrowLeft") next = tabs[(current - 1 + tabs.length) % tabs.length];
  if (event.key === "Home") next = tabs[0];
  if (event.key === "End") next = tabs[tabs.length - 1];
  if (!next) return;
  event.preventDefault();
  next.focus();
  selectMode(next.dataset.mode);
}

function loadState() {
  const empty = { mode: "stocks", values: {} };
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (!saved || typeof saved !== "object") return empty;
    return {
      mode: MODES[saved.mode] ? saved.mode : "stocks",
      values: saved.values && typeof saved.values === "object" ? saved.values : {},
    };
  } catch {
    return empty;
  }
}

function saveState() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ mode: state.mode, values: state.values })
  );
}

function escapeAttr(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("\"", "&quot;")
    .replaceAll("<", "&lt;");
}
