import { PRESETS, calculatePricing, buildSummary, formatMoney } from "./calculator.js";

const form = document.querySelector("#calculator-form");
const errorMessage = document.querySelector("#errorMessage");
const copySummaryButton = document.querySelector("#copySummaryButton");
const resetButton = document.querySelector("#resetButton");
const copyStatus = document.querySelector("#copyStatus");
const summaryText = document.querySelector("#summaryText");
const presetButtons = document.querySelectorAll("[data-preset]");

const outputEls = {
  breakEvenRate: document.querySelector("#breakEvenRate"),
  hourlyRate: document.querySelector("#hourlyRate"),
  projectQuote: document.querySelector("#projectQuote"),
  afterTaxRevenue: document.querySelector("#afterTaxRevenue"),
  quoteHeroValue: document.querySelector("#quoteHeroValue"),
};

const anatomyEls = {
  segmentBase: document.querySelector("#segmentBase"),
  segmentTax: document.querySelector("#segmentTax"),
  segmentBuffer: document.querySelector("#segmentBuffer"),
  segmentBaseLabel: document.querySelector("#segmentBaseLabel"),
  segmentTaxLabel: document.querySelector("#segmentTaxLabel"),
  segmentBufferLabel: document.querySelector("#segmentBufferLabel"),
};

const constellationEls = {
  board: document.querySelector("#constellationBoard"),
  quote: document.querySelector("#nodeQuoteValue"),
  income: document.querySelector("#nodeIncomeValue"),
  hours: document.querySelector("#nodeHoursValue"),
  costs: document.querySelector("#nodeCostsValue"),
  project: document.querySelector("#nodeProjectValue"),
  tax: document.querySelector("#nodeTaxValue"),
  buffer: document.querySelector("#nodeBufferValue"),
};

const fields = {
  currencyLabel: document.querySelector("#currencyLabel"),
  monthlyIncomeTarget: document.querySelector("#monthlyIncomeTarget"),
  monthlyBusinessCosts: document.querySelector("#monthlyBusinessCosts"),
  taxReservePercent: document.querySelector("#taxReservePercent"),
  billableHoursPerMonth: document.querySelector("#billableHoursPerMonth"),
  riskBufferPercent: document.querySelector("#riskBufferPercent"),
  projectHours: document.querySelector("#projectHours"),
};

let latestSummary = "";

function applyPreset(name) {
  const preset = PRESETS[name];
  if (!preset) {
    return;
  }

  Object.entries(preset).forEach(([key, value]) => {
    fields[key].value = value;
  });

  presetButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.preset === name);
  });

  runCalculation();
}

function getFormValues() {
  return {
    currencyLabel: fields.currencyLabel.value,
    monthlyIncomeTarget: fields.monthlyIncomeTarget.value,
    monthlyBusinessCosts: fields.monthlyBusinessCosts.value,
    taxReservePercent: fields.taxReservePercent.value,
    billableHoursPerMonth: fields.billableHoursPerMonth.value,
    riskBufferPercent: fields.riskBufferPercent.value,
    projectHours: fields.projectHours.value,
  };
}

function renderResult(result) {
  outputEls.breakEvenRate.textContent = `${formatMoney(result.breakEvenHourlyRate, result.currencyLabel)}/hr`;
  outputEls.hourlyRate.textContent = `${formatMoney(result.hourlyRate, result.currencyLabel)}/hr`;
  outputEls.projectQuote.textContent = formatMoney(result.projectQuote, result.currencyLabel);
  outputEls.afterTaxRevenue.textContent = formatMoney(result.afterTaxRevenue, result.currencyLabel);
  outputEls.quoteHeroValue.textContent = formatMoney(result.projectQuote, result.currencyLabel);

  const baseValue = result.breakEvenHourlyRate * result.projectHours;
  const taxSlice = result.projectQuote - result.afterTaxRevenue;
  const bufferLift = result.projectQuote - baseValue;
  const total = Math.max(result.projectQuote, 1);

  anatomyEls.segmentBase.style.width = `${Math.max((baseValue / total) * 100, 8)}%`;
  anatomyEls.segmentTax.style.width = `${Math.max((taxSlice / total) * 100, 4)}%`;
  anatomyEls.segmentBuffer.style.width = `${Math.max((bufferLift / total) * 100, 4)}%`;

  anatomyEls.segmentBaseLabel.textContent = formatMoney(baseValue, result.currencyLabel);
  anatomyEls.segmentTaxLabel.textContent = formatMoney(taxSlice, result.currencyLabel);
  anatomyEls.segmentBufferLabel.textContent = formatMoney(bufferLift, result.currencyLabel);

  constellationEls.quote.textContent = formatMoney(result.projectQuote, result.currencyLabel);
  constellationEls.income.textContent = formatMoney(result.monthlyIncomeTarget, result.currencyLabel);
  constellationEls.hours.textContent = `${Math.round(result.billableHoursPerMonth)} hrs`;
  constellationEls.costs.textContent = formatMoney(result.monthlyBusinessCosts, result.currencyLabel);
  constellationEls.project.textContent = `${result.projectHours} hrs`;
  constellationEls.tax.textContent = `${result.taxReservePercent}%`;
  constellationEls.buffer.textContent = `${result.riskBufferPercent}%`;

  const quoteIntensity = Math.min(Math.max(result.projectQuote / 120000, 0.2), 1.2);
  const incomeIntensity = Math.min(Math.max(result.monthlyIncomeTarget / 140000, 0.24), 1.25);
  const hourIntensity = Math.min(Math.max(result.billableHoursPerMonth / 120, 0.24), 1.1);
  const projectIntensity = Math.min(Math.max(result.projectHours / 40, 0.24), 1.15);
  const taxIntensity = Math.min(Math.max(result.taxReservePercent / 30, 0.25), 1);
  const bufferIntensity = Math.min(Math.max(result.riskBufferPercent / 35, 0.25), 1);
  const costIntensity = Math.min(Math.max(result.monthlyBusinessCosts / 30000, 0.2), 1.1);

  constellationEls.board.style.setProperty("--quote-intensity", quoteIntensity.toFixed(3));
  constellationEls.board.style.setProperty("--income-intensity", incomeIntensity.toFixed(3));
  constellationEls.board.style.setProperty("--hours-intensity", hourIntensity.toFixed(3));
  constellationEls.board.style.setProperty("--project-intensity", projectIntensity.toFixed(3));
  constellationEls.board.style.setProperty("--tax-intensity", taxIntensity.toFixed(3));
  constellationEls.board.style.setProperty("--buffer-intensity", bufferIntensity.toFixed(3));
  constellationEls.board.style.setProperty("--costs-intensity", costIntensity.toFixed(3));

  latestSummary = buildSummary(result);
  summaryText.textContent = latestSummary;
  errorMessage.textContent = "";
}

function runCalculation() {
  try {
    const result = calculatePricing(getFormValues());
    renderResult(result);
  } catch (error) {
    errorMessage.textContent = error.message;
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  runCalculation();
});

copySummaryButton.addEventListener("click", async () => {
  if (!latestSummary) {
    copyStatus.textContent = "Calculate a quote before copying the summary.";
    return;
  }

  try {
    await navigator.clipboard.writeText(latestSummary);
    copyStatus.textContent = "Summary copied.";
  } catch {
    copyStatus.textContent = "Copy failed. You can still select the summary text manually.";
  }
});

resetButton.addEventListener("click", () => {
  applyPreset("designer");
  copyStatus.textContent = "";
});

presetButtons.forEach((button) => {
  button.addEventListener("click", () => applyPreset(button.dataset.preset));
});

applyPreset("designer");
