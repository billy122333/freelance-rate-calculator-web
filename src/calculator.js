export const PRESETS = {
  designer: {
    monthlyIncomeTarget: 80000,
    monthlyBusinessCosts: 12000,
    taxReservePercent: 15,
    billableHoursPerMonth: 80,
    riskBufferPercent: 15,
    projectHours: 20,
    currencyLabel: "NT$",
  },
  developer: {
    monthlyIncomeTarget: 120000,
    monthlyBusinessCosts: 15000,
    taxReservePercent: 18,
    billableHoursPerMonth: 90,
    riskBufferPercent: 20,
    projectHours: 30,
    currencyLabel: "NT$",
  },
  photographer: {
    monthlyIncomeTarget: 90000,
    monthlyBusinessCosts: 18000,
    taxReservePercent: 15,
    billableHoursPerMonth: 60,
    riskBufferPercent: 25,
    projectHours: 12,
    currencyLabel: "NT$",
  },
  coach: {
    monthlyIncomeTarget: 100000,
    monthlyBusinessCosts: 10000,
    taxReservePercent: 12,
    billableHoursPerMonth: 70,
    riskBufferPercent: 15,
    projectHours: 10,
    currencyLabel: "NT$",
  },
};

function normalizeNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
}

export function validateInputs(inputs) {
  const normalized = {
    currencyLabel: String(inputs.currencyLabel || "NT$").trim() || "NT$",
    monthlyIncomeTarget: normalizeNumber(inputs.monthlyIncomeTarget),
    monthlyBusinessCosts: normalizeNumber(inputs.monthlyBusinessCosts),
    taxReservePercent: normalizeNumber(inputs.taxReservePercent),
    billableHoursPerMonth: normalizeNumber(inputs.billableHoursPerMonth),
    riskBufferPercent: normalizeNumber(inputs.riskBufferPercent),
    projectHours: normalizeNumber(inputs.projectHours),
  };

  if (normalized.monthlyIncomeTarget < 0 || Number.isNaN(normalized.monthlyIncomeTarget)) {
    throw new Error("Monthly take-home target must be a valid non-negative number.");
  }

  if (normalized.monthlyBusinessCosts < 0 || Number.isNaN(normalized.monthlyBusinessCosts)) {
    throw new Error("Monthly business costs must be a valid non-negative number.");
  }

  if (
    normalized.taxReservePercent < 0 ||
    normalized.taxReservePercent > 80 ||
    Number.isNaN(normalized.taxReservePercent)
  ) {
    throw new Error("Tax reserve must be between 0% and 80%.");
  }

  if (normalized.billableHoursPerMonth <= 0 || Number.isNaN(normalized.billableHoursPerMonth)) {
    throw new Error("Billable hours per month must be greater than zero.");
  }

  if (
    normalized.riskBufferPercent < 0 ||
    normalized.riskBufferPercent > 100 ||
    Number.isNaN(normalized.riskBufferPercent)
  ) {
    throw new Error("Revision / risk buffer must be between 0% and 100%.");
  }

  if (normalized.projectHours <= 0 || Number.isNaN(normalized.projectHours)) {
    throw new Error("Estimated project hours must be greater than zero.");
  }

  return normalized;
}

export function calculatePricing(inputs) {
  const safe = validateInputs(inputs);
  const taxMultiplier = 1 - safe.taxReservePercent / 100;

  if (taxMultiplier <= 0) {
    throw new Error("Tax reserve leaves no revenue. Lower the reserve percentage.");
  }

  const requiredMonthlyRevenue = (safe.monthlyIncomeTarget + safe.monthlyBusinessCosts) / taxMultiplier;
  const breakEvenHourlyRate = requiredMonthlyRevenue / safe.billableHoursPerMonth;
  const hourlyRate = breakEvenHourlyRate * (1 + safe.riskBufferPercent / 100);
  const projectQuote = hourlyRate * safe.projectHours;
  const afterTaxRevenue = projectQuote * taxMultiplier;
  const projectProfitBeforeTax = projectQuote - (breakEvenHourlyRate * safe.projectHours);

  return {
    ...safe,
    requiredMonthlyRevenue,
    breakEvenHourlyRate,
    hourlyRate,
    projectQuote,
    afterTaxRevenue,
    projectProfitBeforeTax,
  };
}

export function formatMoney(value, currencyLabel = "NT$") {
  return `${currencyLabel}${Math.round(value).toLocaleString("en-US")}`;
}

export function buildSummary(result) {
  return [
    `Suggested quote: ${formatMoney(result.projectQuote, result.currencyLabel)}`,
    `Sustainable hourly rate: ${formatMoney(result.hourlyRate, result.currencyLabel)}/hr`,
    `Break-even hourly rate: ${formatMoney(result.breakEvenHourlyRate, result.currencyLabel)}/hr`,
    `Estimated after-tax reserve: ${formatMoney(result.afterTaxRevenue, result.currencyLabel)}`,
    `Assumptions: ${result.projectHours} project hours, ${result.riskBufferPercent}% risk buffer, ${result.taxReservePercent}% tax reserve.`,
  ].join(" ");
}
