const RATE_FLOOR = 1e-12;

export function stockGrowth({
  principal,
  annualRate,
  years,
  periodsPerYear,
  contribution,
  contributionPerYear,
  inflation = 0,
  interestType,
}) {
  const simple = interestType === "simple";
  if (!Number.isFinite(annualRate)) throw new Error("Enter an interest rate.");
  if (!Number.isFinite(principal)) throw new Error("Enter a starting value.");
  if (!Number.isFinite(contribution)) throw new Error("Enter a contribution.");
  if (!Number.isFinite(inflation)) throw new Error("Enter an inflation rate.");
  if (inflation <= -1) throw new Error("Inflation must be above -100%.");

  const contributionCount = countPeriods(years, contributionPerYear, "contribution", {
    allowEmpty: contribution <= 0,
    max: 12000,
  });
  const compoundCount = simple ? 0 : countPeriods(years, periodsPerYear, "time period", { max: 12000 });
  if (!simple) periodicRate(annualRate, periodsPerYear);

  const yearsHeld = simple
    ? contributionCount > 0
      ? contributionCount / contributionPerYear
      : years
    : compoundCount / periodsPerYear;
  const series = buildGrowthSeries({
    principal,
    annualRate,
    yearsHeld,
    periodsPerYear,
    contribution,
    contributionPerYear,
    contributionCount,
    compoundCount,
    inflation,
    simple,
  });
  const last = series[series.length - 1];
  const deposits = depositsBy(yearsHeld, {
    contribution,
    contributionPerYear,
    contributionCount,
  });

  return {
    periods: compoundCount,
    contributionCount: deposits,
    contributionPerYear,
    yearsHeld,
    interestType: simple ? "simple" : "compound",
    futureValue: last.value,
    realValue: last.real,
    inflation,
    contributed: last.contributed,
    growth: last.value - last.contributed,
    series,
  };
}

export function carComparison({
  cheapPrice,
  expensivePrice,
  downPayment,
  loanRate,
  loanYears,
  periodsPerYear,
  depreciation,
  includeCarValue = true,
  returnRate,
  compoundPerYear,
  years,
}) {
  const countCars = includeCarValue !== false;
  if (!Number.isFinite(cheapPrice) || cheapPrice < 0) throw new Error("Enter a cheaper car price of zero or more.");
  if (!Number.isFinite(expensivePrice) || expensivePrice < 0) throw new Error("Enter a more expensive car price of zero or more.");
  if (!Number.isFinite(downPayment) || downPayment < 0) throw new Error("Enter a down payment of zero or more.");
  if (downPayment - expensivePrice > 0.001) throw new Error("The down payment can't be more than the expensive car's price.");
  if (!Number.isFinite(depreciation) || depreciation < 0 || depreciation > 1) {
    throw new Error("Depreciation must be from 0% to 100%.");
  }
  periodicRate(returnRate, compoundPerYear);

  const principal = Math.max(0, expensivePrice - downPayment);
  const horizon = countPeriods(years, periodsPerYear, "comparison", { max: 12000 });
  let loanPeriods = 0;
  let rows = [];
  let roundedPayment = 0;
  if (principal > 0.004) {
    loanPeriods = countPeriods(loanYears, periodsPerYear, "loan", { max: 12000 });
    const rate = periodicRate(loanRate, periodsPerYear);
    const rawPayment = levelPayment(principal, rate, loanPeriods);
    const schedule = buildSchedule(principal, rate, loanPeriods, rawPayment);
    rows = schedule.rows;
    roundedPayment = schedule.roundedPayment;
  }

  const lumpCheap = Math.max(0, downPayment - cheapPrice);
  const lumpExpensive = Math.max(0, cheapPrice - downPayment);
  const growth = compoundFactor(returnRate / compoundPerYear, compoundPerYear / periodsPerYear);
  const series = [];
  let cheapInvest = lumpCheap;
  let expensiveInvest = lumpExpensive;
  let interestPaid = 0;
  let investedPayments = 0;

  const point = (elapsed, balance) => {
    const year = elapsed / periodsPerYear;
    const kept = (1 - depreciation) ** year;
    return {
      year,
      cheap: cheapPrice * kept + cheapInvest,
      expensive: expensivePrice * (countCars ? kept : 0) + expensiveInvest - balance,
      investment: cheapInvest,
      loanBalance: balance,
    };
  };

  series.push(point(0, principal));
  for (let elapsed = 1; elapsed <= horizon; elapsed += 1) {
    cheapInvest *= growth;
    expensiveInvest *= growth;
    let balance = 0;
    if (elapsed <= loanPeriods) {
      const row = rows[elapsed - 1];
      cheapInvest += row.payment;
      investedPayments += row.payment;
      interestPaid += row.interest;
      balance = row.balance;
    }
    series.push(point(elapsed, balance));
  }

  const last = series[series.length - 1];
  const ahead = last.cheap - last.expensive;
  return {
    payment: roundedPayment,
    loanPeriods,
    horizon,
    yearsHeld: last.year,
    cheapNet: last.cheap,
    expensiveNet: last.expensive,
    ahead,
    investment: last.investment,
    loanBalance: last.loanBalance,
    interestPaid,
    lumpCheap,
    lumpExpensive,
    investedPayments,
    includeCarValue: countCars,
    series: thinSeries(series),
  };
}

export function bondPrice({ face, couponRate, yieldRate, years, periodsPerYear }) {
  const periods = countPeriods(years, periodsPerYear);
  const yieldPerPeriod = periodicRate(yieldRate, periodsPerYear);
  const coupon = (face * couponRate) / periodsPerYear;
  const annualCoupon = face * couponRate;

  let price;
  if (Math.abs(yieldPerPeriod) < RATE_FLOOR) {
    price = coupon * periods + face;
  } else {
    const pvCoupons = coupon * (1 - (1 + yieldPerPeriod) ** -periods) / yieldPerPeriod;
    const pvFace = face / (1 + yieldPerPeriod) ** periods;
    price = pvCoupons + pvFace;
  }

  return {
    periods,
    price,
    annualCoupon,
    currentYield: price > 0 ? annualCoupon / price : null,
    versusFace: price - face,
  };
}

export function annuityValues(input) {
  if (input.kind === "deferred") return deferredAnnuity(input);
  return immediateAnnuity(input);
}

function immediateAnnuity({ initialInvestment, annualRate, years, periodsPerYear, due }) {
  const periods = countPeriods(years, periodsPerYear, "payout");
  const rate = periodicRate(annualRate, periodsPerYear);
  const rawPayment = annuityPayment(initialInvestment, rate, periods, due);
  const schedule = buildSchedule(initialInvestment, rate, periods, rawPayment, due);

  return {
    kind: "immediate",
    due: Boolean(due),
    periods,
    payment: schedule.roundedPayment,
    totalPaid: schedule.totalPaid,
    interest: schedule.totalPaid - initialInvestment,
    endingBalance: schedule.endingBalance,
    rows: schedule.rows,
  };
}

function deferredAnnuity({ contribution, annualRate, years, deferralYears, due, payoutFrequency }) {
  if (!Number.isFinite(contribution) || contribution < 0) {
    throw new Error("Enter a monthly contribution of zero or more.");
  }
  const selected = ["12", "4", "1"].includes(String(payoutFrequency)) ? String(payoutFrequency) : "12";
  const payouts = PAYOUT_CHOICES.map((choice) => {
    try {
      const scenario = withdrawalAnnuity(contribution, annualRate, years, deferralYears, due, Number(choice.value));
      return { ...choice, amount: scenario.payment, scenario };
    } catch (error) {
      return { ...choice, amount: null, error: error.message, scenario: null };
    }
  });
  const current = payouts.find((choice) => choice.value === selected) || payouts[0];
  if (!current.scenario) throw new Error(current.error);
  const scenario = current.scenario;
  return {
    kind: "deferred",
    due: Boolean(due),
    periodsPerYear: Number(current.value),
    payment: scenario.payment,
    contribution,
    contributed: scenario.contributed,
    deferralYears,
    deferralPeriods: scenario.deferralPeriods,
    periods: scenario.periods,
    valueAtStart: scenario.valueAtStart,
    totalPaid: scenario.totalPaid,
    interest: scenario.totalPaid - scenario.contributed,
    endingBalance: scenario.endingBalance,
    rows: scenario.rows,
    payouts: payouts.map(({ value, label, amount }) => ({ value, label, amount })),
  };
}

const PAYOUT_CHOICES = [
  { value: "12", label: "Monthly" },
  { value: "4", label: "Quarterly" },
  { value: "1", label: "Annually" },
];

function withdrawalAnnuity(contribution, annualRate, years, deferralYears, due, periodsPerYear) {
  const periods = countPeriods(years, periodsPerYear, "payout");
  const deferralPeriods = countPeriods(deferralYears, 12, "deferral");
  const growthRate = periodicRate(annualRate, 12);
  const contributed = contribution * deferralPeriods;
  const valueAtStart = futureValueOfPayments(contribution, growthRate, deferralPeriods, false);
  const rate = periodicRate(annualRate, periodsPerYear);
  const rawPayment = annuityPayment(valueAtStart, rate, periods, due);
  const schedule = buildSchedule(valueAtStart, rate, periods, rawPayment, due);
  return {
    periods,
    deferralPeriods,
    contributed,
    valueAtStart,
    payment: schedule.roundedPayment,
    totalPaid: schedule.totalPaid,
    endingBalance: schedule.endingBalance,
    rows: schedule.rows,
  };
}

export function loanSummary({
  principal,
  annualRate,
  years,
  periodsPerYear,
  extraPerPeriod = 0,
  oneTimeAmount = 0,
  oneTimeDate = "",
  firstPaymentDate = "",
}) {
  const periods = countPeriods(years, periodsPerYear);
  const rate = periodicRate(annualRate, periodsPerYear);
  const rawPayment = levelPayment(principal, rate, periods);
  const baseline = buildSchedule(principal, rate, periods, rawPayment);
  const oneTimePeriod =
    oneTimeAmount > 0 ? periodOnOrAfter(firstPaymentDate, oneTimeDate, periodsPerYear, periods) : null;
  const schedule = buildSchedule(principal, rate, periods, rawPayment, false, {
    extraPerPeriod,
    oneTimeAmount,
    oneTimePeriod,
  });
  const first = parseISODate(firstPaymentDate);
  const rows = schedule.rows.map((row) => ({
    ...row,
    date: first ? toISODate(addPeriods(first, row.period - 1, periodsPerYear)) : "",
  }));
  const oneTimeRow = rows.find((row) => row.oneTime > 0);

  return {
    periods,
    payment: rawPayment,
    roundedPayment: schedule.roundedPayment,
    extraPerPeriod,
    oneTimeAmount,
    totalPaid: schedule.totalPaid,
    totalInterest: schedule.totalInterest,
    endingBalance: schedule.endingBalance,
    rows,
    payoffDate: rows.at(-1)?.date || "",
    paymentsSaved: baseline.rows.length - rows.length,
    interestSaved: baseline.totalInterest - schedule.totalInterest,
    oneTimeApplied: Boolean(oneTimeRow),
    oneTimeAppliedDate: oneTimeRow?.date || "",
    series: loanBalanceSeries(
      principal,
      periodsPerYear,
      baseline.rows,
      schedule.rows,
      extraPerPeriod > 0 || oneTimeAmount > 0
    ),
  };
}

const CARD_MONTHS = 600;

export function creditCardSummary({
  balance,
  annualRate,
  minimumMethod = "percent",
  floor = 25,
  extraPerPeriod = 0,
  oneTimeAmount = 0,
  oneTimeDate = "",
  firstPaymentDate = "",
}) {
  if (!Number.isFinite(balance) || balance < 0) throw new Error("Enter a balance of zero or more.");
  if (!Number.isFinite(floor) || floor < 0) throw new Error("Enter a payment floor of zero or more.");
  if (!Number.isFinite(extraPerPeriod) || extraPerPeriod < 0) throw new Error("Enter an extra payment of zero or more.");
  if (!Number.isFinite(oneTimeAmount) || oneTimeAmount < 0) throw new Error("Enter a one-time extra payment of zero or more.");
  const method = minimumMethod === "flat" ? "flat" : "percent";
  periodicRate(annualRate, 12);

  const oneTimePeriod = oneTimeAmount > 0 ? periodOnOrAfter(firstPaymentDate, oneTimeDate, 12, CARD_MONTHS) : null;
  const baseline = cardSchedule(balance, annualRate, method, floor, 0, 0, null);
  const schedule = cardSchedule(balance, annualRate, method, floor, extraPerPeriod, oneTimeAmount, oneTimePeriod);
  const first = parseISODate(firstPaymentDate);
  const rows = schedule.rows.map((row) => ({
    ...row,
    date: first ? toISODate(addPeriods(first, row.period - 1, 12)) : "",
  }));
  const baselinePaidOff = baseline.endingBalance <= 0.004;
  const paidOff = schedule.endingBalance <= 0.004;
  const grows = !paidOff && schedule.endingBalance > balance + 0.004;
  const shown = grows ? rows.slice(0, 12) : rows;
  const oneTimeRow = shown.find((row) => row.oneTime > 0);
  const hasExtra = extraPerPeriod > 0 || oneTimeAmount > 0;
  const totalPaid = grows ? shown.reduce((sum, row) => sum + row.payment, 0) : schedule.totalPaid;
  const totalInterest = grows ? shown.reduce((sum, row) => sum + row.interest, 0) : schedule.totalInterest;

  return {
    balance,
    minimumMethod: method,
    floor,
    firstMinimum: schedule.rows[0]?.minimum ?? 0,
    extraPerPeriod,
    oneTimeAmount,
    rows: shown,
    payoffDate: paidOff ? rows.at(-1)?.date || "" : "",
    totalPaid,
    totalInterest,
    endingBalance: shown.at(-1)?.balance ?? balance,
    baselinePaidOff,
    grows,
    paymentsSaved: baselinePaidOff && paidOff ? baseline.rows.length - rows.length : 0,
    interestSaved: baselinePaidOff && paidOff ? baseline.totalInterest - schedule.totalInterest : 0,
    oneTimeApplied: Boolean(oneTimeRow),
    oneTimeAppliedDate: oneTimeRow?.date || "",
    series: loanBalanceSeries(balance, 12, baseline.rows.slice(0, Math.max(shown.length, 1)), shown, hasExtra),
  };
}

function cardSchedule(balance, annualRate, method, floor, extraPerPeriod, oneTimeAmount, oneTimePeriod) {
  const rate = annualRate / 12;
  let balanceCents = Math.round(balance * 100);
  const floorCents = Math.round(floor * 100);
  const extraCents = Math.round(extraPerPeriod * 100);
  const oneTimeCents = Math.round(oneTimeAmount * 100);
  const rows = [];
  let totalPaid = 0;
  let totalInterest = 0;

  for (let period = 1; period <= CARD_MONTHS && balanceCents > 0; period += 1) {
    const interestCents = Math.round(balanceCents * rate);
    const minimumCents = minimumDue(balanceCents, interestCents, method, floorCents);
    const oneTime = oneTimeCents > 0 && period === oneTimePeriod ? oneTimeCents : 0;
    const owed = balanceCents + interestCents;
    const payCents = Math.min(owed, minimumCents + extraCents + oneTime);
    const principalCents = payCents - interestCents;
    balanceCents = Math.max(0, balanceCents - principalCents);
    const extraPaid = Math.max(0, payCents - minimumCents);
    totalPaid += payCents;
    totalInterest += interestCents;
    rows.push({
      period,
      payment: payCents / 100,
      extra: extraPaid / 100,
      oneTime: Math.min(oneTime, extraPaid) / 100,
      interest: interestCents / 100,
      principal: principalCents / 100,
      balance: balanceCents / 100,
      minimum: minimumCents / 100,
    });
  }

  return { rows, totalPaid: totalPaid / 100, totalInterest: totalInterest / 100, endingBalance: balanceCents / 100 };
}

function minimumDue(balanceCents, interestCents, method, floorCents) {
  const owed = balanceCents + interestCents;
  if (owed <= 0) return 0;
  const raw = method === "flat" ? Math.round(owed * 0.02) : Math.round(balanceCents * 0.01) + interestCents;
  return Math.min(owed, Math.max(raw, floorCents));
}

function loanBalanceSeries(principal, periodsPerYear, baselineRows, actualRows, showExtra) {
  const count = Math.max(baselineRows.length, actualRows.length);
  const points = [];
  let owed = principal;
  let accelerated = principal;
  let interestCents = 0;

  for (let period = 0; period <= count; period += 1) {
    if (period > 0) {
      const regular = baselineRows[period - 1];
      const faster = actualRows[period - 1];
      if (regular) owed = regular.balance;
      if (faster) {
        accelerated = faster.balance;
        interestCents += Math.round(faster.interest * 100);
      } else {
        accelerated = 0;
      }
    }
    const point = { year: period / periodsPerYear, balance: owed, interest: interestCents / 100 };
    if (showExtra) point.extraBalance = period === 0 ? principal : accelerated;
    points.push(point);
  }

  return points;
}

function countPeriods(years, periodsPerYear, label = "time period", { allowEmpty = false, max = 1200 } = {}) {
  if (!Number.isFinite(years) || years <= 0) {
    throw new Error(`Enter a ${label} greater than zero.`);
  }
  if (!Number.isFinite(periodsPerYear) || periodsPerYear <= 0) {
    throw new Error(label === "contribution" ? "Choose how often you contribute." : "Choose how often interest is applied.");
  }
  const periods = Math.round(years * periodsPerYear);
  if (periods < 1) {
    if (allowEmpty) return 0;
    const periodName =
      label === "contribution"
        ? "contribution period"
        : label === "loan" || label === "comparison"
          ? "payment period"
          : "compounding period";
    throw new Error(`That ${label} is shorter than one ${periodName}.`);
  }
  if (periods > max) {
    throw new Error(`Keep the term to ${max.toLocaleString("en-US")} periods or fewer.`);
  }
  return periods;
}

function periodicRate(annualRate, periodsPerYear) {
  if (!Number.isFinite(annualRate)) {
    throw new Error("Enter an interest rate.");
  }
  const rate = annualRate / periodsPerYear;
  if (rate <= -1) {
    throw new Error("That rate is too low to compound at the chosen frequency.");
  }
  return rate;
}

function buildGrowthSeries(input) {
  const steps = Math.max(input.compoundCount, input.contributionCount, 1);
  const stride = Math.max(1, Math.ceil(steps / 480));
  const series = [];

  for (let index = 0; index <= steps; index += stride) {
    series.push(growthPoint((index / steps) * input.yearsHeld, input));
  }

  const end = growthPoint(input.yearsHeld, input);
  if (Math.abs(series[series.length - 1].year - input.yearsHeld) > 1e-9) series.push(end);
  else series[series.length - 1] = end;
  return series;
}

function growthPoint(yearsHeld, input) {
  const deposits = depositsBy(yearsHeld, input);
  const contributed = input.principal + input.contribution * deposits;
  const value = input.simple
    ? simpleBalance(yearsHeld, deposits, contributed, input)
    : compoundBalance(yearsHeld, deposits, input);
  return { year: yearsHeld, value, real: buyingPower(value, yearsHeld, input.inflation), contributed };
}

function thinSeries(series) {
  const maxPoints = 480;
  if (series.length <= maxPoints) return series;
  const sampled = [];
  for (let index = 0; index < maxPoints - 1; index += 1) {
    sampled.push(series[Math.round((index * (series.length - 1)) / (maxPoints - 1))]);
  }
  sampled.push(series[series.length - 1]);
  return sampled;
}

function buyingPower(value, yearsHeld, inflation) {
  if (Math.abs(inflation) < RATE_FLOOR) return value;
  return value / (1 + inflation) ** yearsHeld;
}

function depositsBy(yearsHeld, input) {
  if (input.contribution <= 0 || input.contributionCount <= 0) return 0;
  const count = Math.floor(yearsHeld * input.contributionPerYear + 1e-8);
  return Math.min(input.contributionCount, Math.max(0, count));
}

function simpleBalance(yearsHeld, deposits, contributed, input) {
  const principalInterest = input.principal * input.annualRate * yearsHeld;
  const held = deposits * yearsHeld - (deposits * (deposits + 1)) / (2 * input.contributionPerYear);
  const contributionInterest = input.contribution * input.annualRate * held;
  return contributed + principalInterest + contributionInterest;
}

function compoundBalance(yearsHeld, deposits, input) {
  const rate = input.annualRate / input.periodsPerYear;
  const principalValue = input.principal * compoundFactor(rate, input.periodsPerYear * yearsHeld);
  return principalValue + depositValue(input.contribution, rate, input.periodsPerYear, input.contributionPerYear, deposits, yearsHeld);
}

function compoundFactor(rate, periods) {
  if (Math.abs(rate) < RATE_FLOOR || periods === 0) return 1;
  return (1 + rate) ** periods;
}

function depositValue(contribution, rate, periodsPerYear, contributionPerYear, deposits, yearsHeld) {
  if (deposits <= 0 || contribution === 0) return 0;
  if (Math.abs(rate) < RATE_FLOOR) return contribution * deposits;
  const growth = compoundFactor(rate, periodsPerYear * yearsHeld);
  const step = compoundFactor(rate, -periodsPerYear / contributionPerYear);
  const sum = Math.abs(1 - step) < RATE_FLOOR ? deposits : (step * (1 - step ** deposits)) / (1 - step);
  return contribution * growth * sum;
}

function compound(amount, rate, periods) {
  if (Math.abs(rate) < RATE_FLOOR) return amount;
  return amount * (1 + rate) ** periods;
}

function futureValueOfPayments(payment, rate, periods, due) {
  let value;
  if (Math.abs(rate) < RATE_FLOOR) value = payment * periods;
  else value = (payment * ((1 + rate) ** periods - 1)) / rate;
  return due ? value * (1 + rate) : value;
}

function presentValueOfPayments(payment, rate, periods, due) {
  let value;
  if (Math.abs(rate) < RATE_FLOOR) value = payment * periods;
  else value = (payment * (1 - (1 + rate) ** -periods)) / rate;
  return due ? value * (1 + rate) : value;
}

function levelPayment(principal, rate, periods) {
  if (Math.abs(rate) < RATE_FLOOR) return principal / periods;
  return (principal * rate * (1 + rate) ** periods) / ((1 + rate) ** periods - 1);
}

function annuityPayment(presentValue, rate, periods, due) {
  const ordinary = levelPayment(presentValue, rate, periods);
  if (!due || Math.abs(rate) < RATE_FLOOR) return ordinary;
  return ordinary / (1 + rate);
}

function buildSchedule(principal, rate, periods, rawPayment, due = false, extras = {}) {
  const principalCents = toCents(principal);
  const paymentCents = toCents(rawPayment);
  const extraPerPeriodCents = Math.max(0, toCents(extras.extraPerPeriod || 0));
  const oneTimeCents = Math.max(0, toCents(extras.oneTimeAmount || 0));
  const oneTimePeriod = extras.oneTimePeriod;
  let balance = principalCents;
  let totalPaid = 0;
  let totalInterest = 0;
  const rows = [];

  for (let period = 1; period <= periods && balance > 0; period += 1) {
    const interest = due && period === 1 ? 0 : Math.round(balance * rate);
    const oneTime = oneTimeCents > 0 && period === oneTimePeriod ? oneTimeCents : 0;
    const offeredExtra = extraPerPeriodCents + oneTime;
    const offered = paymentCents + offeredExtra;
    let principalPart = offered - interest;
    let paid = offered;
    const isLast = period === periods;
    const clearsBalance = principalPart >= balance || (isLast && principalPart > 0);

    if (clearsBalance && principalPart > 0) {
      principalPart = balance;
      paid = balance + interest;
    }

    const extraPaid = Math.max(0, Math.min(offeredExtra, paid - paymentCents));
    const recurringPaid = Math.min(extraPerPeriodCents, extraPaid);
    const oneTimePaid = extraPaid - recurringPaid;

    balance -= principalPart;
    if (balance < 0) balance = 0;

    totalPaid += paid;
    totalInterest += interest;
    rows.push({
      period,
      payment: paid / 100,
      extra: extraPaid / 100,
      oneTime: oneTimePaid / 100,
      interest: interest / 100,
      principal: principalPart / 100,
      balance: balance / 100,
    });

    if (clearsBalance) break;
  }

  return {
    roundedPayment: paymentCents / 100,
    totalPaid: totalPaid / 100,
    totalInterest: totalInterest / 100,
    endingBalance: balance / 100,
    rows,
  };
}

function toCents(amount) {
  return Math.round(amount * 100);
}

function periodOnOrAfter(firstPaymentDate, extraDate, periodsPerYear, periods) {
  const first = parseISODate(firstPaymentDate);
  const extra = parseISODate(extraDate);
  if (!first) throw new Error("Choose a first payment date.");
  if (!extra) throw new Error("Choose a date for the one-time extra payment.");

  for (let period = 1; period <= periods; period += 1) {
    const due = addPeriods(first, period - 1, periodsPerYear);
    if (due >= extra) return period;
  }

  throw new Error("That one-time payment date is after the last scheduled payment.");
}

function parseISODate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
}

function toISODate(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function addPeriods(date, count, periodsPerYear) {
  const months = (12 / periodsPerYear) * count;
  if (Number.isInteger(months)) return addMonths(date, months);
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  next.setDate(next.getDate() + count);
  return next;
}

function addMonths(date, months) {
  const day = date.getDate();
  const next = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
  next.setDate(Math.min(day, lastDay));
  return next;
}
