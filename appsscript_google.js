// ============================================================
// ACE™ by AccessibilityChecker.org — Proposal Generator
// Google Apps Script
// ============================================================
// Setup:
//   1. Open your Google Sheet (must have the Proposal Generator tab already built)
//   2. Extensions > Apps Script > paste this entire file > Save
//   3. Reload the sheet — a "Proposal Generator" menu appears
//   4. Fill in the yellow cells on the Proposal Generator tab
//   5. Click Proposal Generator > Generate PDF & Email
// ============================================================

// ---- CONFIG ----
var NOTIFY_EMAIL = "yotam@accessibilitychecker.org";
var COMPANY_NAME = "AccessibilityChecker.org";
var COMPANY_URL  = "https://www.accessibilitychecker.org";
var SHEET_NAME   = "Proposal Generator";

// ---- BRAND COLORS ----
var BRAND_GREEN      = "#23825A";
var BRAND_GREEN_HOVER= "#189F66";
var BRAND_GREEN_DARK = "#196545";
var BRAND_GREEN_LIGHT= "#EBF8F2";
var BRAND_GREEN_30   = "#C0EAD8";
var BRAND_BLACK      = "#3A3A3A";
var BRAND_FOOTER     = "#202223";
var BRAND_GRAY_40    = "#E9ECEE";
var BRAND_GRAY_30    = "#F2F4F5";
var BRAND_GRAY_20    = "#F8F8F8";
var BRAND_GRAY_10    = "#F8FAFB";
var BRAND_WHITE      = "#FFFFFF";

// ---- PRICING DATA ----

var PLATFORM_SINGLE = [
  { plan: "Lite",      pages: 25,   monthly: 89,  annual: 71 },
  { plan: "Starter",   pages: 100,  monthly: 149, annual: 119 },
  { plan: "Growth",    pages: 500,  monthly: 299, annual: 239 },
  { plan: "Scale",     pages: 1000, monthly: 449, annual: 359 },
  { plan: "Pro 1500",  pages: 1500, monthly: 549, annual: 439 },
  { plan: "Pro 2000",  pages: 2000, monthly: 649, annual: 519 },
  { plan: "Pro 2500",  pages: 2500, monthly: 749, annual: 599 }
];

var PLATFORM_UNLIMITED = [
  { plan: "500 Pages",       pages: 500,     annual: 359 },
  { plan: "1,000 Pages",     pages: 1000,    annual: 479 },
  { plan: "2,500 Pages",     pages: 2500,    annual: 599 },
  { plan: "5,000 Pages",     pages: 5000,    annual: 799 },
  { plan: "10,000 Pages",    pages: 10000,   annual: 1099 },
  { plan: "20,000 Pages",    pages: 20000,   annual: 1499 },
  { plan: "50,000 Pages",    pages: 50000,   annual: 2149 },
  { plan: "100,000 Pages",   pages: 100000,  annual: 2799 },
  { plan: "200,000 Pages",   pages: 200000,  annual: 3999 },
  { plan: "300,000 Pages",   pages: 300000,  annual: 4799 },
  { plan: "500,000 Pages",   pages: 500000,  annual: 6399 },
  { plan: "1,000,000 Pages", pages: 1000000, annual: 9599 }
];

var MANAGED = [
  { plan: "Small Sites",      pages: 25,    monthly: 599,   auditFreq: "Semi-Annual", pdfPages: 10,   vpat: "1/year" },
  { plan: "Medium Sites",     pages: 100,   monthly: 949,   auditFreq: "Quarterly",   pdfPages: 25,   vpat: "1/year" },
  { plan: "Large Sites",      pages: 500,   monthly: 1249,  auditFreq: "Quarterly",   pdfPages: 50,   vpat: "1/year" },
  { plan: "Scale",            pages: 1000,  monthly: 1749,  auditFreq: "Quarterly",   pdfPages: 100,  vpat: "1/year" },
  { plan: "Enterprise S",     pages: 1500,  monthly: 2199,  auditFreq: "Monthly",     pdfPages: 150,  vpat: "2/year" },
  { plan: "Enterprise M",     pages: 2000,  monthly: 2599,  auditFreq: "Monthly",     pdfPages: 200,  vpat: "2/year" },
  { plan: "Enterprise L",     pages: 2500,  monthly: 2999,  auditFreq: "Monthly",     pdfPages: 250,  vpat: "2/year" },
  { plan: "Enterprise XL",    pages: 5000,  monthly: 4499,  auditFreq: "Monthly",     pdfPages: 500,  vpat: "2/year" },
  { plan: "Enterprise 2XL",   pages: 7500,  monthly: 5499,  auditFreq: "Monthly",     pdfPages: 750,  vpat: "2/year" },
  { plan: "Enterprise 3XL",   pages: 10000, monthly: 6499,  auditFreq: "Monthly",     pdfPages: 1000, vpat: "2/year" },
  { plan: "Enterprise 4XL",   pages: 15000, monthly: 7999,  auditFreq: "Monthly",     pdfPages: 1500, vpat: "2/year" },
  { plan: "Enterprise 5XL",   pages: 20000, monthly: 9499,  auditFreq: "Monthly",     pdfPages: 2000, vpat: "2/year" },
  { plan: "Enterprise 6XL",   pages: 30000, monthly: 11999, auditFreq: "Monthly",     pdfPages: 2500, vpat: "2/year" },
  { plan: "Enterprise 7XL",   pages: 50000, monthly: 15999, auditFreq: "Monthly",     pdfPages: 3500, vpat: "2/year" }
];

// ---- LIVE PRICING READER ----
// If this script lives in the same workbook as the Pricing Calculator,
// it reads tiers directly from the "Platform" and "Managed Accessibility" sheets.
// If those sheets don't exist, it falls back to the hardcoded defaults above.

function loadPricingFromCalculator() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // --- Platform sheet: Single Domain (rows 6-12, cols A-D) + Unlimited (rows 17-28, cols A-C) ---
  var platformSheet = ss.getSheetByName("Platform");
  if (platformSheet) {
    try {
      // Single Domain: row 6 onward until blank, columns: Plan, Pages, Monthly, Annual
      var singleData = platformSheet.getRange("A6:D12").getValues();
      var liveSingle = [];
      for (var i = 0; i < singleData.length; i++) {
        if (singleData[i][0] && singleData[i][1]) {
          liveSingle.push({
            plan: String(singleData[i][0]),
            pages: Number(singleData[i][1]),
            monthly: Number(singleData[i][2]),
            annual: Number(singleData[i][3])
          });
        }
      }
      if (liveSingle.length > 0) PLATFORM_SINGLE = liveSingle;

      // Unlimited: row 17 onward, columns: Plan, Pages, Price/mo
      var unlimData = platformSheet.getRange("A17:C28").getValues();
      var liveUnlim = [];
      for (var i = 0; i < unlimData.length; i++) {
        if (unlimData[i][0] && unlimData[i][1]) {
          liveUnlim.push({
            plan: String(unlimData[i][0]),
            pages: Number(unlimData[i][1]),
            annual: Number(unlimData[i][2])
          });
        }
      }
      if (liveUnlim.length > 0) PLATFORM_UNLIMITED = liveUnlim;
    } catch (e) {
      Logger.log("Could not read Platform sheet, using defaults: " + e.message);
    }
  }

  // --- Managed Accessibility sheet: rows 6-19, columns A-G ---
  var managedSheet = ss.getSheetByName("Managed Accessibility");
  if (managedSheet) {
    try {
      var mData = managedSheet.getRange("A6:G19").getValues();
      var liveManaged = [];
      for (var i = 0; i < mData.length; i++) {
        if (mData[i][0] && mData[i][1]) {
          liveManaged.push({
            plan: String(mData[i][0]),
            pages: Number(mData[i][1]),
            monthly: Number(mData[i][2]),
            auditFreq: String(mData[i][4] || "Quarterly"),
            pdfPages: Number(mData[i][5] || 0),
            vpat: String(mData[i][6] || "1/year")
          });
        }
      }
      if (liveManaged.length > 0) MANAGED = liveManaged;
    } catch (e) {
      Logger.log("Could not read Managed Accessibility sheet, using defaults: " + e.message);
    }
  }
}

// ---- MENU ----

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Proposal Generator")
    .addItem("Generate PDF & Email", "generateProposal")
    .addSeparator()
    .addItem("Import from ACE™ Weighted Pages Calculator", "importFromACECsv")
    .addToUi();
}

// ---- IMPORT FROM ACE™ TOOL ----
// Usage:
//   1. In the ACE™ web tool, fill in client info + quote builder, then click
//      "Export for Sheets" to download the CSV.
//   2. In Google Sheets, go to Proposal Generator > Import from ACE™ Weighted Pages Calculator.
//   3. Paste the CSV content into the dialog that appears.
//   4. Click OK — all matching fields in the Proposal Generator tab are auto-filled.
//   5. Review/edit any cells, then run Generate PDF & Email.

function importFromACECsv() {
  var ui = SpreadsheetApp.getUi();
  var response = ui.prompt(
    'Import from ACE™ Weighted Pages Calculator',
    'Paste the CSV content from the "Export for Sheets" download:\n(Field,Value format — first row is the header)',
    ui.ButtonSet.OK_CANCEL
  );
  if (response.getSelectedButton() !== ui.Button.OK) return;

  var csvText = response.getResponseText().trim();
  if (!csvText) {
    ui.alert('No data pasted. Import cancelled.');
    return;
  }

  var parsed = parseAceCsv(csvText);
  var fieldCount = Object.keys(parsed).length;
  if (fieldCount === 0) {
    ui.alert('Could not parse CSV. Make sure you pasted the full content of the downloaded file.');
    return;
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    ui.alert('Sheet "' + SHEET_NAME + '" not found. Please ensure the Proposal Generator tab exists.');
    return;
  }

  // Read label column (B = col 2) and update value column (C = col 3)
  var lastRow = sheet.getLastRow();
  var labelRange = sheet.getRange(1, 2, lastRow, 1).getValues();
  var updated = 0;
  for (var i = 0; i < labelRange.length; i++) {
    var label = String(labelRange[i][0]).trim();
    if (label && parsed[label] !== undefined) {
      sheet.getRange(i + 1, 3).setValue(parsed[label]);
      updated++;
    }
  }

  ui.alert(
    'Import Successful',
    updated + ' fields imported from ACE™ data.\n\n' +
    'Review the highlighted cells, then run:\nProposal Generator > Generate PDF & Email',
    ui.ButtonSet.OK
  );
}

function parseAceCsv(csvText) {
  var result = {};
  var lines = csvText.split('\n');
  // Skip header row if it starts with "Field"
  var startIdx = (lines.length > 0 && lines[0].toLowerCase().startsWith('field')) ? 1 : 0;
  for (var i = startIdx; i < lines.length; i++) {
    var line = lines[i].trim();
    if (!line) continue;
    // Handle quoted values (values may contain commas)
    var field, value;
    if (line.charAt(0) === '"') {
      // Field is quoted
      var endQuote = line.indexOf('"', 1);
      field = line.slice(1, endQuote);
      var rest = line.slice(endQuote + 2); // skip closing quote + comma
      value = rest.replace(/^"|"$/g, '').replace(/""/g, '"');
    } else {
      var commaIdx = line.indexOf(',');
      if (commaIdx < 0) continue;
      field = line.slice(0, commaIdx).trim();
      value = line.slice(commaIdx + 1).trim().replace(/^"|"$/g, '').replace(/""/g, '"');
    }
    if (field) result[field] = value;
  }
  return result;
}

// ---- READ INPUTS ----

function readInputs() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error("Sheet '" + SHEET_NAME + "' not found. Please ensure the Proposal Generator tab exists in the workbook.");

  var data = sheet.getRange(1, 2, sheet.getLastRow(), 3).getValues();
  var inputs = {};
  for (var i = 0; i < data.length; i++) {
    var label = String(data[i][0]).trim();
    var value = data[i][1];
    if (label) inputs[label] = value;
  }

  return {
    salesRepName:    inputs["Sales Rep Name"] || "",
    salesRepEmail:   inputs["Sales Rep Email"] || "",
    companyName:     inputs["Company Name"] || "",
    contactPerson:   inputs["Contact Person"] || "",
    contactEmail:    inputs["Contact Email"] || "",
    contactPhone:    inputs["Contact Phone"] || "",
    websiteUrl:      inputs["Website URL"] || "",
    planType:        inputs["Plan Type"] || "Platform \u2014 Single Domain",
    billingCycle:    inputs["Billing Cycle"] || "Annual",
    numPages:        Number(inputs["Number of Pages"]) || 500,
    numDomains:      Number(inputs["Number of Domains"]) || 1,
    dedicatedTeam:   inputs["Dedicated Team Upgrade"] === "Yes",
    extraPdfPages:   Number(inputs["Extra PDF Pages"]) || 0,
    additionalVpats: Number(inputs["Additional VPATs"]) || 0,
    startDate:       formatDateClean(inputs["Estimated Start Date"]),
    timeline:        inputs["Initial Remediation Timeline"] || "",
    contractDuration:inputs["Contract Duration"] || "12 months",
    validUntil:      formatDateClean(inputs["Quote Valid Until"]),
    customNotes:     inputs["Custom Notes"] || "",
    discount:        Number(inputs["Special Discount (%)"]) || 0
  };
}

// ---- PRICING LOOKUP ----

function calculatePricing(inp) {
  var result = {
    planName: "",
    baseMonthlyCost: 0,
    billingLabel: "",
    annualTotal: 0,
    addOns: [],
    addOnMonthly: 0,
    addOnOneTime: 0,
    monthlyTotal: 0,
    included: [],
    auditFreq: "",
    pdfPages: 0,
    vpatIncluded: "",
    isManaged: false
  };

  if (inp.planType === "Platform \u2014 Single Domain") {
    var tier = findTier(PLATFORM_SINGLE, inp.numPages);
    result.planName = "Platform \u2014 Single Domain: " + tier.plan;
    if (inp.billingCycle === "Annual") {
      result.baseMonthlyCost = tier.annual;
      result.billingLabel = "/mo (billed annually)";
      result.annualTotal = tier.annual * 12;
    } else {
      result.baseMonthlyCost = tier.monthly;
      result.billingLabel = "/mo (billed monthly)";
      result.annualTotal = tier.monthly * 12;
    }
    result.included = [
      "Full platform access with real-time dashboard and reporting",
      "Automated scanning across up to " + tier.pages.toLocaleString() + " pages",
      "AI-assisted remediation tools",
      "Manual testing procedures (step-by-step guides anyone on your team can follow)",
      "Compliance Vault (audit trail and documentation)",
      "WCAG 2.2 AA / ADA / Section 508 coverage"
    ];

  } else if (inp.planType === "Platform \u2014 Unlimited Domains") {
    var tier = findTier(PLATFORM_UNLIMITED, inp.numPages);
    result.planName = "Platform \u2014 Unlimited Domains: " + tier.plan;
    result.baseMonthlyCost = tier.annual;
    result.billingLabel = "/mo (annual billing only)";
    result.annualTotal = tier.annual * 12;
    result.included = [
      "Full platform access with real-time dashboard and reporting",
      "Unlimited domains up to " + tier.pages.toLocaleString() + " total pages",
      "Automated scanning across all domains",
      "AI-assisted remediation tools",
      "Manual testing procedures (step-by-step guides anyone on your team can follow)",
      "Compliance Vault (audit trail and documentation)",
      "WCAG 2.2 AA / ADA / Section 508 coverage"
    ];

  } else {
    // Managed Accessibility
    result.isManaged = true;
    var tier = findTierManaged(MANAGED, inp.numPages);
    result.planName = "Managed Accessibility: " + tier.plan;
    result.baseMonthlyCost = tier.monthly;
    result.billingLabel = "/mo (annual commitment)";
    result.annualTotal = tier.monthly * 12;
    result.auditFreq = tier.auditFreq;
    result.pdfPages = tier.pdfPages;
    result.vpatIncluded = tier.vpat;

    // Add-ons
    if (inp.numDomains > 1) {
      var extraDomainCost = Math.round(tier.monthly * 0.15) * (inp.numDomains - 1);
      result.addOns.push({ name: "Extra Domains (" + (inp.numDomains - 1) + " additional)", monthly: extraDomainCost, oneTime: 0 });
      result.addOnMonthly += extraDomainCost;
    }
    if (inp.dedicatedTeam) {
      result.addOns.push({ name: "Dedicated Team Upgrade", monthly: 1500, oneTime: 0 });
      result.addOnMonthly += 1500;
    }
    if (inp.extraPdfPages > 0) {
      var pdfCost = inp.extraPdfPages * 3;
      result.addOns.push({ name: "Extra PDF Remediation (" + inp.extraPdfPages + " pages)", monthly: 0, oneTime: pdfCost });
      result.addOnOneTime += pdfCost;
    }
    if (inp.additionalVpats > 0) {
      var vpatCost = inp.additionalVpats * 500;
      result.addOns.push({ name: "Additional VPATs (" + inp.additionalVpats + ")", monthly: 0, oneTime: vpatCost });
      result.addOnOneTime += vpatCost;
    }

    result.included = [
      "Full platform access (scanning, monitoring, AI-assisted fixes)",
      "Code-level remediation by our development team, covering both initial remediation and any new issues that arise over time. Typical turnaround: ~3 business days for content-related changes, up to 2 weeks for brand-new screens, and up to 2 months for complete website redesigns",
      tier.auditFreq + " manual expert accessibility audits",
      tier.vpat + " VPAT / WCAG conformance report",
      tier.pdfPages + " PDF pages remediated per year",
      "Dedicated Project Coordinator assigned within 48 hours of contract signing",
      "Ongoing support, reporting, and compliance guidance",
      "ADA / Section 508 / WCAG 2.2 AA coverage"
    ];
  }

  result.monthlyTotal = result.baseMonthlyCost + result.addOnMonthly;

  if (inp.discount > 0) {
    result.discountPct = inp.discount;
    result.discountAmount = Math.round(result.monthlyTotal * inp.discount / 100);
    result.monthlyAfterDiscount = result.monthlyTotal - result.discountAmount;
    result.annualTotal = result.monthlyAfterDiscount * 12;
  } else {
    result.monthlyAfterDiscount = result.monthlyTotal;
    result.annualTotal = result.monthlyTotal * 12;
  }

  result.yearOneTotal = result.annualTotal + result.addOnOneTime;

  return result;
}

function findTier(tiers, pages) {
  for (var i = tiers.length - 1; i >= 0; i--) {
    if (pages >= tiers[i].pages) return tiers[i];
  }
  return tiers[0];
}

function findTierManaged(tiers, pages) {
  for (var i = tiers.length - 1; i >= 0; i--) {
    if (pages >= tiers[i].pages) return tiers[i];
  }
  return tiers[0];
}

// ---- BUILD HTML FOR PDF ----

function buildProposalHtml(inp, pricing) {
  var today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "MMMM d, yyyy");
  var proposalNum = "ACE-" + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd") + "-" + Math.floor(Math.random() * 900 + 100);

  // --- Logo as base64-encoded original SVG ---
  var logoImg = '<img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjE2IiBoZWlnaHQ9IjMyIiB2aWV3Qm94PSIwIDAgMjE2IDMyIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cGF0aCBkPSJNMjUuODE0NiAyMi43NzkyTDMxLjY3OTcgMjguNTUzN0wyOC4xNzkgMzIuMDAwNEwyMi4zMTM5IDI2LjIyNThMMjUuODE0NiAyMi43NzkyWiIgZmlsbD0iIzFEQkU3QSIvPgo8cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTEzLjg4OCAyNS4wMDU3QzEzLjM3OTQgMjQuOTgxOCAxMi44NzEzIDI0LjkyMDMgMTIuMzY3OSAyNC44MjA2QzEwLjM5NzQgMjQuNDMwMyA4LjU4ODY2IDIzLjQ3MzQgNy4xNzA0OSAyMi4wNzFDNS43NTIyOCAyMC42Njg2IDQuNzg4MjggMTguODgzNyA0LjQwMDQ3IDE2Ljk0MTlDNC4wMTI2MSAxNS4wMDAxIDQuMjE4MzEgMTIuOTg4NyA0Ljk5MTUyIDExLjE2MkM1Ljc2NDc2IDkuMzM1MzMgNy4wNzA4MiA3Ljc3NTQgOC43NDQ0OSA2LjY3OTUyTDYuNDEzNDQgMy4yMjg1MkM0LjA0NjUxIDQuNzc4MzMgMi4xOTk1MiA2Ljk4NDM3IDEuMTA2MDEgOS41Njc2OEMwLjAxMjUwNjMgMTIuMTUxIC0wLjI3ODM5MSAxNC45OTU1IDAuMjcwMTA2IDE3Ljc0MTZDMC44MTg2MDUgMjAuNDg3NyAyLjE4MTg2IDIzLjAxMiA0LjE4NzUgMjQuOTk1M0M2LjE5MzEzIDI2Ljk3ODUgOC43NTEwMiAyOC4zMzE3IDExLjUzNzggMjguODgzNkMxNC4zMjQ1IDI5LjQzNTYgMTcuMjE0OSAyOS4xNjE1IDE5Ljg0MzQgMjguMDk2MUMyMi40NzIgMjcuMDMwOCAyNC43MjA2IDI1LjIyMTkgMjYuMzA1IDIyLjg5ODJDMjcuODg5NCAyMC41NzQ2IDI4LjczODMgMTcuODQwNiAyOC43NDQ1IDE1LjA0MTlDMjguNzQ3NCAxMy43MzUyIDI4LjU2NjQgMTIuNDQxNyAyOC4yMTI1IDExLjE5NjlMMjQuNTMzMiAxNC44MTk0QzI0LjUzNDYgMTQuODkwNSAyNC41MzUyIDE0Ljk2MTcgMjQuNTM1IDE1LjAzMjlDMjQuNTMwNyAxNy4wMTE5IDIzLjkzMDQgMTguOTQ1MSAyMi44MSAyMC41ODgyQzIxLjY4OTcgMjIuMjMxMyAyMC4wOTk2IDIzLjUxMDQgMTguMjQxIDI0LjI2MzdDMTYuOTQ3MSAyNC43ODgxIDE1LjU2MzYgMjUuMDQxNCAxNC4xNzc0IDI1LjAxNTNMMTQuMDM3NiAyNS4xNTI5TDEzLjg4OCAyNS4wMDU3WiIgZmlsbD0iIzFEQkU3QSIvPgo8cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTIxLjY1MjMgMi44MDlDMTkuMzA1MiAxLjQ1MTQ0IDE2LjU5NDUgMC43NjcwMDUgMTMuODMxNiAwLjg2OTQwMUMxMC4wMjI2IDEuMDEwNTcgNi40MjY0NyAyLjYzNTc0IDMuODM0NDYgNS4zODczOEMxLjI0MjQzIDguMTM5MDUgLTAuMTMzMiAxMS43OTE4IDAuMDEwMTgyNyAxNS41NDIxQzAuMTUzNTY2IDE5LjI5MjMgMS44MDQyMiAyMi44MzI5IDQuNTk5IDI1LjM4NDlMNy40NjE0NiAyMi4zNDYxQzUuNDg1MjUgMjAuNTQxNiA0LjMxODA1IDE4LjAzOCA0LjIxNjY2IDE1LjM4NjFDNC4xMTUyNiAxMi43MzQzIDUuMDg3OTkgMTAuMTUxNCA2LjkyMDgzIDguMjA1NjhDOC43NTM3IDYuMjU5OTUgMTEuMjk2NSA1LjExMDc3IDEzLjk5IDUuMDEwOTRDMTUuNTY2NyA0Ljk1MjUxIDE3LjExOTYgNS4yNTY0OSAxOC41MzI1IDUuODgwNjVMMjEuNjUyMyAyLjgwOVoiIGZpbGw9IiM1RUYxQjMiLz4KPHBhdGggZD0iTTguNDc4ODMgMTAuNDUwMUwxNy4xODYzIDE2Ljk4MzRMMTQuNTI3NSAyMC4zNzI3TDcuNTQwMjQgMTEuMzU5MUw4LjQ3ODgzIDEwLjQ1MDFaIiBmaWxsPSIjM0EzQTNBIi8+CjxwYXRoIGQ9Ik0yOS42MTA1IDAuOTIyMTQxTDExLjgwMzYgMTYuNjI1MUwxNC42MTg2IDIwLjM3MTRMMzAuNTQ5MSAxLjgzMTE2TDI5LjYxMDUgMC45MjIxNDFaIiBmaWxsPSIjM0EzQTNBIi8+CjxwYXRoIGQ9Ik0zNi4xNzA1IDIxTDQwLjE1NCA5LjQ1MjVINDIuODgyTDQ2Ljg2NTUgMjFINDQuNTcxNUw0My43NSAxOC41MkgzOS4yODZMMzguNDQ5IDIxSDM2LjE3MDVaTTM5Ljg5MDUgMTYuNjZINDMuMTQ1NUw0MS4yMjM1IDEwLjkwOTVINDEuODEyNUwzOS44OTA1IDE2LjY2Wk01MS4yNzM0IDIxLjE4NkM1MC40MzY0IDIxLjE4NiA0OS42ODIxIDIwLjk5NDggNDkuMDEwNCAyMC42MTI1QzQ4LjM0OTEgMjAuMjE5OCA0Ny44MjczIDE5LjY5MjggNDcuNDQ0OSAxOS4wMzE1QzQ3LjA2MjYgMTguMzU5OCA0Ni44NzE0IDE3LjYwNTUgNDYuODcxNCAxNi43Njg1QzQ2Ljg3MTQgMTUuOTMxNSA0Ny4wNjI2IDE1LjE4MjMgNDcuNDQ0OSAxNC41MjFDNDcuODI3MyAxMy44NTk3IDQ4LjM0OTEgMTMuMzM3OCA0OS4wMTA0IDEyLjk1NTVDNDkuNjgyMSAxMi41NzMyIDUwLjQzNjQgMTIuMzgyIDUxLjI3MzQgMTIuMzgyQzUxLjg3MjggMTIuMzgyIDUyLjQzMDggMTIuNDkwNSA1Mi45NDc0IDEyLjcwNzVDNTMuNDY0MSAxMi45MTQyIDUzLjkwODQgMTMuMjAzNSA1NC4yODA0IDEzLjU3NTVDNTQuNjYyOCAxMy45MzcyIDU0LjkzNjYgMTQuMzcxMiA1NS4xMDE5IDE0Ljg3NzVMNTMuMzE5NCAxNS42NTI1QzUzLjE2NDQgMTUuMjI4OCA1Mi45MDA5IDE0Ljg4NzggNTIuNTI4OSAxNC42Mjk1QzUyLjE2NzMgMTQuMzcxMiA1MS43NDg4IDE0LjI0MiA1MS4yNzM0IDE0LjI0MkM1MC44MjkxIDE0LjI0MiA1MC40MzEzIDE0LjM1MDUgNTAuMDc5OSAxNC41Njc1QzQ5LjczODkgMTQuNzg0NSA0OS40NzAzIDE1LjA4NDIgNDkuMjczOSAxNS40NjY1QzQ5LjA3NzYgMTUuODQ4OCA0OC45Nzk0IDE2LjI4OCA0OC45Nzk0IDE2Ljc4NEM0OC45Nzk0IDE3LjI4IDQ5LjA3NzYgMTcuNzE5MiA0OS4yNzM5IDE4LjEwMTVDNDkuNDcwMyAxOC40ODM4IDQ5LjczODkgMTguNzgzNSA1MC4wNzk5IDE5LjAwMDVDNTAuNDMxMyAxOS4yMTc1IDUwLjgyOTEgMTkuMzI2IDUxLjI3MzQgMTkuMzI2QzUxLjc1OTEgMTkuMzI2IDUyLjE4MjggMTkuMTk2OCA1Mi41NDQ0IDE4LjkzODVDNTIuOTA2MSAxOC42ODAyIDUzLjE2NDQgMTguMzM0IDUzLjMxOTQgMTcuOUw1NS4xMDE5IDE4LjcwNkM1NC45MzY2IDE5LjE4MTMgNTQuNjY3OSAxOS42MTAyIDU0LjI5NTkgMTkuOTkyNUM1My45MjM5IDIwLjM2NDUgNTMuNDc5NiAyMC42NTkgNTIuOTYyOSAyMC44NzZDNTIuNDQ2MyAyMS4wODI3IDUxLjg4MzEgMjEuMTg2IDUxLjI3MzQgMjEuMTg2Wk02MC4yMzg2IDIxLjE4NkM1OS40MDE2IDIxLjE4NiA1OC42NDczIDIwLjk5NDggNTcuOTc1NiAyMC42MTI1QzU3LjMxNDMgMjAuMjE5OCA1Ni43OTI0IDE5LjY5MjggNTYuNDEwMSAxOS4wMzE1QzU2LjAyNzggMTguMzU5OCA1NS44MzY2IDE3LjYwNTUgNTUuODM2NiAxNi43Njg1QzU1LjgzNjYgMTUuOTMxNSA1Ni4wMjc4IDE1LjE4MjMgNTYuNDEwMSAxNC41MjFDNTYuNzkyNCAxMy44NTk3IDU3LjMxNDMgMTMuMzM3OCA1Ny45NzU2IDEyLjk1NTVDNTguNjQ3MyAxMi41NzMyIDU5LjQwMTYgMTIuMzgyIDYwLjIzODYgMTIuMzgyQzYwLjgzNzkgMTIuMzgyIDYxLjM5NTkgMTIuNDkwNSA2MS45MTI2IDEyLjcwNzVDNjIuNDI5MyAxMi45MTQyIDYyLjg3MzYgMTMuMjAzNSA2My4yNDU2IDEzLjU3NTVDNjMuNjI3OSAxMy45MzcyIDYzLjkwMTggMTQuMzcxMiA2NC4wNjcxIDE0Ljg3NzVMNjIuMjg0NiAxNS42NTI1QzYyLjEyOTYgMTUuMjI4OCA2MS44NjYxIDE0Ljg4NzggNjEuNDk0MSAxNC42Mjk1QzYxLjEzMjQgMTQuMzcxMiA2MC43MTM5IDE0LjI0MiA2MC4yMzg2IDE0LjI0MkM1OS43OTQzIDE0LjI0MiA1OS4zOTY0IDE0LjM1MDUgNTkuMDQ1MSAxNC41Njc1QzU4LjcwNDEgMTQuNzg0NSA1OC40MzU0IDE1LjA4NDIgNTguMjM5MSAxNS40NjY1QzU4LjA0MjggMTUuODQ4OCA1Ny45NDQ2IDE2LjI4OCA1Ny45NDQ2IDE2Ljc4NEM1Ny45NDQ2IDE3LjI4IDU4LjA0MjggMTcuNzE5MiA1OC4yMzkxIDE4LjEwMTVDNTguNDM1NCAxOC40ODM4IDU4LjcwNDEgMTguNzgzNSA1OS4wNDUxIDE5LjAwMDVDNTkuMzk2NCAxOS4yMTc1IDU5Ljc5NDMgMTkuMzI2IDYwLjIzODYgMTkuMzI2QzYwLjcyNDMgMTkuMzI2IDYxLjE0NzkgMTkuMTk2OCA2MS41MDk2IDE4LjkzODVDNjEuODcxMyAxOC42ODAyIDYyLjEyOTYgMTguMzM0IDYyLjI4NDYgMTcuOUw2NC4wNjcxIDE4LjcwNkM2My45MDE4IDE5LjE4MTMgNjMuNjMzMSAxOS42MTAyIDYzLjI2MTEgMTkuOTkyNUM2Mi44ODkxIDIwLjM2NDUgNjIuNDQ0OCAyMC42NTkgNjEuOTI4MSAyMC44NzZDNjEuNDExNCAyMS4wODI3IDYwLjg0ODMgMjEuMTg2IDYwLjIzODYgMjEuMTg2Wk02OS4xNDE4IDIxLjE4NkM2OC4yNzM4IDIxLjE4NiA2Ny41MTQzIDIwLjk4OTcgNjYuODYzMyAyMC41OTdDNjYuMjEyMyAyMC4yMDQzIDY1LjcwNiAxOS42NzIyIDY1LjM0NDMgMTkuMDAwNUM2NC45ODI2IDE4LjMyODggNjQuODAxOCAxNy41ODQ4IDY0LjgwMTggMTYuNzY4NUM2NC44MDE4IDE1LjkyMTIgNjQuOTgyNiAxNS4xNzIgNjUuMzQ0MyAxNC41MjFDNjUuNzE2MyAxMy44NTk3IDY2LjIxNzUgMTMuMzM3OCA2Ni44NDc4IDEyLjk1NTVDNjcuNDg4NSAxMi41NzMyIDY4LjIwMTUgMTIuMzgyIDY4Ljk4NjggMTIuMzgyQzY5LjY0ODEgMTIuMzgyIDcwLjIyNjggMTIuNDkwNSA3MC43MjI4IDEyLjcwNzVDNzEuMjI5MSAxMi45MjQ1IDcxLjY1OCAxMy4yMjQyIDcyLjAwOTMgMTMuNjA2NUM3Mi4zNjA2IDEzLjk4ODggNzIuNjI5MyAxNC40MjggNzIuODE1MyAxNC45MjRDNzMuMDAxMyAxNS40MDk3IDczLjA5NDMgMTUuOTM2NyA3My4wOTQzIDE2LjUwNUM3My4wOTQzIDE2LjY0OTcgNzMuMDg0IDE2Ljc5OTUgNzMuMDYzMyAxNi45NTQ1QzczLjA1MyAxNy4xMDk1IDczLjAyNzEgMTcuMjQzOCA3Mi45ODU4IDE3LjM1NzVINjYuNDc1OFYxNS44MDc1SDcxLjgzODhMNzAuODc3OCAxNi41MzZDNzAuOTcwOCAxNi4wNjA3IDcwLjk0NSAxNS42MzcgNzAuODAwMyAxNS4yNjVDNzAuNjY2IDE0Ljg5MyA3MC40Mzg2IDE0LjU5ODUgNzAuMTE4MyAxNC4zODE1QzY5LjgwODMgMTQuMTY0NSA2OS40MzExIDE0LjA1NiA2OC45ODY4IDE0LjA1NkM2OC41NjMxIDE0LjA1NiA2OC4xODYgMTQuMTY0NSA2Ny44NTUzIDE0LjM4MTVDNjcuNTI0NiAxNC41ODgyIDY3LjI3MTUgMTQuODk4MiA2Ny4wOTU4IDE1LjMxMTVDNjYuOTMwNSAxNS43MTQ1IDY2Ljg2ODUgMTYuMjA1MyA2Ni45MDk4IDE2Ljc4NEM2Ni44Njg1IDE3LjMwMDcgNjYuOTM1NiAxNy43NjA1IDY3LjExMTMgMTguMTYzNUM2Ny4yOTczIDE4LjU1NjIgNjcuNTY2IDE4Ljg2MSA2Ny45MTczIDE5LjA3OEM2OC4yNzkgMTkuMjk1IDY4LjY5MjMgMTkuNDAzNSA2OS4xNTczIDE5LjQwMzVDNjkuNjIyMyAxOS40MDM1IDcwLjAxNSAxOS4zMDUzIDcwLjMzNTMgMTkuMTA5QzcwLjY2NiAxOC45MTI3IDcwLjkyNDMgMTguNjQ5MiA3MS4xMTAzIDE4LjMxODVMNzIuNzUzMyAxOS4xMjQ1QzcyLjU4OCAxOS41Mjc1IDcyLjMyOTYgMTkuODg0IDcxLjk3ODMgMjAuMTk0QzcxLjYyNyAyMC41MDQgNzEuMjA4NSAyMC43NDY4IDcwLjcyMjggMjAuOTIyNUM3MC4yNDc1IDIxLjA5ODIgNjkuNzIwNSAyMS4xODYgNjkuMTQxOCAyMS4xODZaTTc3LjM3NyAyMS4xODZDNzYuNDc4IDIxLjE4NiA3NS42OTI3IDIwLjk3NDIgNzUuMDIxIDIwLjU1MDVDNzQuMzU5NyAyMC4xMTY1IDczLjkwNSAxOS41MzI3IDczLjY1NyAxOC43OTlMNzUuMTc2IDE4LjA3MDVDNzUuMzkzIDE4LjU0NTggNzUuNjkyNyAxOC45MTc4IDc2LjA3NSAxOS4xODY1Qzc2LjQ2NzcgMTkuNDU1MiA3Ni45MDE3IDE5LjU4OTUgNzcuMzc3IDE5LjU4OTVDNzcuNzQ5IDE5LjU4OTUgNzguMDQzNSAxOS41MDY4IDc4LjI2MDUgMTkuMzQxNUM3OC40Nzc1IDE5LjE3NjIgNzguNTg2IDE4Ljk1OTIgNzguNTg2IDE4LjY5MDVDNzguNTg2IDE4LjUyNTIgNzguNTM5NSAxOC4zOTA4IDc4LjQ0NjUgMTguMjg3NUM3OC4zNjM4IDE4LjE3MzggNzguMjQ1IDE4LjA4MDggNzguMDkgMTguMDA4NUM3Ny45NDUzIDE3LjkyNTggNzcuNzg1MiAxNy44NTg3IDc3LjYwOTUgMTcuODA3TDc2LjIzIDE3LjQxOTVDNzUuNTE3IDE3LjIxMjggNzQuOTc0NSAxNi44OTc3IDc0LjYwMjUgMTYuNDc0Qzc0LjI0MDggMTYuMDUwMyA3NC4wNiAxNS41NDkyIDc0LjA2IDE0Ljk3MDVDNzQuMDYgMTQuNDUzOCA3NC4xODkyIDE0LjAwNDMgNzQuNDQ3NSAxMy42MjJDNzQuNzE2MiAxMy4yMjkzIDc1LjA4MyAxMi45MjQ1IDc1LjU0OCAxMi43MDc1Qzc2LjAyMzMgMTIuNDkwNSA3Ni41NjU4IDEyLjM4MiA3Ny4xNzU1IDEyLjM4MkM3Ny45NzEyIDEyLjM4MiA3OC42NzM4IDEyLjU3MzIgNzkuMjgzNSAxMi45NTU1Qzc5Ljg5MzIgMTMuMzM3OCA4MC4zMjcyIDEzLjg3NTIgODAuNTg1NSAxNC41Njc1TDc5LjAzNTUgMTUuMjk2Qzc4Ljg5MDggMTQuOTEzNyA3OC42NDggMTQuNjA4OCA3OC4zMDcgMTQuMzgxNUM3Ny45NjYgMTQuMTU0MiA3Ny41ODM3IDE0LjA0MDUgNzcuMTYgMTQuMDQwNUM3Ni44MTkgMTQuMDQwNSA3Ni41NTAzIDE0LjExOCA3Ni4zNTQgMTQuMjczQzc2LjE1NzcgMTQuNDI4IDc2LjA1OTUgMTQuNjI5NSA3Ni4wNTk1IDE0Ljg3NzVDNzYuMDU5NSAxNS4wMzI1IDc2LjEwMDggMTUuMTY2OCA3Ni4xODM1IDE1LjI4MDVDNzYuMjY2MiAxNS4zOTQyIDc2LjM3OTggMTUuNDg3MiA3Ni41MjQ1IDE1LjU1OTVDNzYuNjc5NSAxNS42MzE4IDc2Ljg1NTIgMTUuNjk5IDc3LjA1MTUgMTUuNzYxTDc4LjQgMTYuMTY0Qzc5LjA5MjMgMTYuMzcwNyA3OS42MjQ1IDE2LjY4MDcgNzkuOTk2NSAxNy4wOTRDODAuMzc4OCAxNy41MDczIDgwLjU3IDE4LjAxMzcgODAuNTcgMTguNjEzQzgwLjU3IDE5LjExOTMgODAuNDM1NyAxOS41Njg4IDgwLjE2NyAxOS45NjE1Qzc5Ljg5ODMgMjAuMzQzOCA3OS41MjYzIDIwLjY0MzUgNzkuMDUxIDIwLjg2MDVDNzguNTc1NyAyMS4wNzc1IDc4LjAxNzcgMjEuMTg2IDc3LjM3NyAyMS4xODZaTTg0Ljg3MzkgMjEuMTg2QzgzLjk3NDkgMjEuMTg2IDgzLjE4OTYgMjAuOTc0MiA4Mi41MTc5IDIwLjU1MDVDODEuODU2NiAyMC4xMTY1IDgxLjQwMTkgMTkuNTMyNyA4MS4xNTM5IDE4Ljc5OUw4Mi42NzI5IDE4LjA3MDVDODIuODg5OSAxOC41NDU4IDgzLjE4OTYgMTguOTE3OCA4My41NzE5IDE5LjE4NjVDODMuOTY0NiAxOS40NTUyIDg0LjM5ODYgMTkuNTg5NSA4NC44NzM5IDE5LjU4OTVDODUuMjQ1OSAxOS41ODk1IDg1LjU0MDQgMTkuNTA2OCA4NS43NTc0IDE5LjM0MTVDODUuOTc0NCAxOS4xNzYyIDg2LjA4MjkgMTguOTU5MiA4Ni4wODI5IDE4LjY5MDVDODYuMDgyOSAxOC41MjUyIDg2LjAzNjQgMTguMzkwOCA4NS45NDM0IDE4LjI4NzVDODUuODYwOCAxOC4xNzM4IDg1Ljc0MTkgMTguMDgwOCA4NS41ODY5IDE4LjAwODVDODUuNDQyMyAxNy45MjU4IDg1LjI4MjEgMTcuODU4NyA4NS4xMDY0IDE3LjgwN0w4My43MjY5IDE3LjQxOTVDODMuMDEzOSAxNy4yMTI4IDgyLjQ3MTQgMTYuODk3NyA4Mi4wOTk0IDE2LjQ3NEM4MS43Mzc4IDE2LjA1MDMgODEuNTU2OSAxNS41NDkyIDgxLjU1NjkgMTQuOTcwNUM4MS41NTY5IDE0LjQ1MzggODEuNjg2MSAxNC4wMDQzIDgxLjk0NDQgMTMuNjIyQzgyLjIxMzEgMTMuMjI5MyA4Mi41Nzk5IDEyLjkyNDUgODMuMDQ0OSAxMi43MDc1QzgzLjUyMDMgMTIuNDkwNSA4NC4wNjI4IDEyLjM4MiA4NC42NzI0IDEyLjM4MkM4NS40NjgxIDEyLjM4MiA4Ni4xNzA4IDEyLjU3MzIgODYuNzgwNCAxMi45NTU1Qzg3LjM5MDEgMTMuMzM3OCA4Ny44MjQxIDEzLjg3NTIgODguMDgyNCAxNC41Njc1TDg2LjUzMjQgMTUuMjk2Qzg2LjM4NzggMTQuOTEzNyA4Ni4xNDQ5IDE0LjYwODggODUuODAzOSAxNC4zODE1Qzg1LjQ2MjkgMTQuMTU0MiA4NS4wODA2IDE0LjA0MDUgODQuNjU2OSAxNC4wNDA1Qzg0LjMxNTkgMTQuMDQwNSA4NC4wNDczIDE0LjExOCA4My44NTA5IDE0LjI3M0M4My42NTQ2IDE0LjQyOCA4My41NTY0IDE0LjYyOTUgODMuNTU2NCAxNC44Nzc1QzgzLjU1NjQgMTUuMDMyNSA4My41OTc4IDE1LjE2NjggODMuNjgwNCAxNS4yODA1QzgzLjc2MzEgMTUuMzk0MiA4My44NzY4IDE1LjQ4NzIgODQuMDIxNCAxNS41NTk1Qzg0LjE3NjQgMTUuNjMxOCA4NC4zNTIxIDE1LjY5OSA4NC41NDg0IDE1Ljc2MUw4NS44OTY5IDE2LjE2NEM4Ni41ODkzIDE2LjM3MDcgODcuMTIxNCAxNi42ODA3IDg3LjQ5MzQgMTcuMDk0Qzg3Ljg3NTggMTcuNTA3MyA4OC4wNjY5IDE4LjAxMzcgODguMDY2OSAxOC42MTNDODguMDY2OSAxOS4xMTkzIDg3LjkzMjYgMTkuNTY4OCA4Ny42NjM5IDE5Ljk2MTVDODcuMzk1MyAyMC4zNDM4IDg3LjAyMzMgMjAuNjQzNSA4Ni41NDc5IDIwLjg2MDVDODYuMDcyNiAyMS4wNzc1IDg1LjUxNDYgMjEuMTg2IDg0Ljg3MzkgMjEuMTg2Wk04OS4xNjIzIDIxVjEyLjU2OEg5MS4xOTI4VjIxSDg5LjE2MjNaTTg5LjE2MjMgMTEuNjIyNVY5LjQ1MjVIOTEuMTkyOFYxMS42MjI1SDg5LjE2MjNaTTk3LjIwNjEgMjEuMTg2Qzk2LjU5NjQgMjEuMTg2IDk2LjAzMzMgMjEuMDY3MiA5NS41MTY2IDIwLjgyOTVDOTUuMDEwMyAyMC41ODE1IDk0LjYwNzMgMjAuMjMwMiA5NC4zMDc2IDE5Ljc3NTVMOTQuNTA5MSAxOS4zNzI1VjIxSDkyLjYwMjZWOS4yNjY1SDk0LjYzMzFWMTQuMjQyTDk0LjMyMzEgMTMuODIzNUM5NC42MTI0IDEzLjM2ODggOTUuMDA1MSAxMy4wMTc1IDk1LjUwMTEgMTIuNzY5NUM5NS45OTcxIDEyLjUxMTIgOTYuNTcwNiAxMi4zODIgOTcuMjIxNiAxMi4zODJDOTguMDE3MyAxMi4zODIgOTguNzM1NCAxMi41NzgzIDk5LjM3NjEgMTIuOTcxQzEwMC4wMTcgMTMuMzYzNyAxMDAuNTIzIDEzLjg5MDcgMTAwLjg5NSAxNC41NTJDMTAxLjI3NyAxNS4yMTMzIDEwMS40NjkgMTUuOTU3MyAxMDEuNDY5IDE2Ljc4NEMxMDEuNDY5IDE3LjYwMDMgMTAxLjI4MyAxOC4zNDQzIDEwMC45MTEgMTkuMDE2QzEwMC41MzkgMTkuNjg3NyAxMDAuMDMyIDIwLjIxOTggOTkuMzkxNiAyMC42MTI1Qzk4Ljc1MDkgMjAuOTk0OCA5OC4wMjI0IDIxLjE4NiA5Ny4yMDYxIDIxLjE4NlpNOTYuOTczNiAxOS4zMjZDOTcuNDM4NiAxOS4zMjYgOTcuODUxOSAxOS4yMTc1IDk4LjIxMzYgMTkuMDAwNUM5OC41NzUzIDE4Ljc4MzUgOTguODU0MyAxOC40ODM4IDk5LjA1MDYgMTguMTAxNUM5OS4yNTczIDE3LjcxOTIgOTkuMzYwNiAxNy4yOCA5OS4zNjA2IDE2Ljc4NEM5OS4zNjA2IDE2LjI4OCA5OS4yNTczIDE1Ljg1NCA5OS4wNTA2IDE1LjQ4MkM5OC44NTQzIDE1LjA5OTcgOTguNTc1MyAxNC44IDk4LjIxMzYgMTQuNTgzQzk3Ljg1MTkgMTQuMzU1NyA5Ny40Mzg2IDE0LjI0MiA5Ni45NzM2IDE0LjI0MkM5Ni41MjkzIDE0LjI0MiA5Ni4xMjYzIDE0LjM1MDUgOTUuNzY0NiAxNC41Njc1Qzk1LjQxMzMgMTQuNzg0NSA5NS4xMzQzIDE1LjA4OTMgOTQuOTI3NiAxNS40ODJDOTQuNzMxMyAxNS44NjQzIDk0LjYzMzEgMTYuMjk4MyA5NC42MzMxIDE2Ljc4NEM5NC42MzMxIDE3LjI4IDk0LjczMTMgMTcuNzE5MiA5NC45Mjc2IDE4LjEwMTVDOTUuMTM0MyAxOC40ODM4IDk1LjQxMzMgMTguNzgzNSA5NS43NjQ2IDE5LjAwMDVDOTYuMTI2MyAxOS4yMTc1IDk2LjUyOTMgMTkuMzI2IDk2Ljk3MzYgMTkuMzI2Wk0xMDIuNTUyIDIxVjEyLjU2OEgxMDQuNTgyVjIxSDEwMi41NTJaTTEwMi41NTIgMTEuNjIyNVY5LjQ1MjVIMTA0LjU4MlYxMS42MjI1SDEwMi41NTJaTTEwNS45OTIgMjFWOS4yNjY1SDEwOC4wMjJWMjFIMTA1Ljk5MlpNMTA5LjQzMiAyMVYxMi41NjhIMTExLjQ2M1YyMUgxMDkuNDMyWk0xMDkuNDMyIDExLjYyMjVWOS40NTI1SDExMS40NjNWMTEuNjIyNUgxMDkuNDMyWk0xMTYuNzE2IDIxLjA5M0MxMTUuNzY2IDIxLjA5MyAxMTUuMDI3IDIwLjgzNDcgMTE0LjUgMjAuMzE4QzExMy45ODMgMTkuNzkxIDExMy43MjUgMTkuMDUyMiAxMTMuNzI1IDE4LjEwMTVWMTQuMzgxNUgxMTIuMjY4VjEyLjU2OEgxMTIuNDIzQzExMi44MzYgMTIuNTY4IDExMy4xNTcgMTIuNDU5NSAxMTMuMzg0IDEyLjI0MjVDMTEzLjYxMSAxMi4wMjU1IDExMy43MjUgMTEuNzEwMyAxMTMuNzI1IDExLjI5N1YxMC42NDZIMTE1Ljc1NVYxMi41NjhIMTE3LjY5M1YxNC4zODE1SDExNS43NTVWMTcuOTkzQzExNS43NTUgMTguMjcyIDExNS44MDIgMTguNTA5NyAxMTUuODk1IDE4LjcwNkMxMTUuOTk4IDE4LjkwMjMgMTE2LjE1MyAxOS4wNTIyIDExNi4zNiAxOS4xNTU1QzExNi41NzcgMTkuMjU4OCAxMTYuODUxIDE5LjMxMDUgMTE3LjE4MSAxOS4zMTA1QzExNy4yNTQgMTkuMzEwNSAxMTcuMzM2IDE5LjMwNTMgMTE3LjQyOSAxOS4yOTVDMTE3LjUzMyAxOS4yODQ3IDExNy42MzEgMTkuMjc0MyAxMTcuNzI0IDE5LjI2NFYyMUMxMTcuNTc5IDIxLjAyMDcgMTE3LjQxNCAyMS4wNDEzIDExNy4yMjggMjEuMDYyQzExNy4wNDIgMjEuMDgyNyAxMTYuODcxIDIxLjA5MyAxMTYuNzE2IDIxLjA5M1pNMTE5LjgzMyAyNC40MUMxMTkuNjA2IDI0LjQxIDExOS4zODQgMjQuMzg5MyAxMTkuMTY3IDI0LjM0OEMxMTguOTUgMjQuMzE3IDExOC43NTMgMjQuMjU1IDExOC41NzggMjQuMTYyVjIyLjQ3MjVDMTE4LjcxMiAyMi41MDM1IDExOC44NzIgMjIuNTM0NSAxMTkuMDU4IDIyLjU2NTVDMTE5LjI1NSAyMi41OTY1IDExOS40MzUgMjIuNjEyIDExOS42MDEgMjIuNjEyQzEyMC4wNjYgMjIuNjEyIDEyMC40MDIgMjIuNTAzNSAxMjAuNjA4IDIyLjI4NjVDMTIwLjgyNSAyMi4wNzk4IDEyMS4wMTYgMjEuODAwOCAxMjEuMTgyIDIxLjQ0OTVMMTIxLjc0IDIwLjE0NzVMMTIxLjcwOSAyMS44NTI1TDExOC4wMzUgMTIuNTY4SDEyMC4yMjFMMTIyLjc5NCAxOS40MTlIMTIyLjAxOUwxMjQuNTc2IDEyLjU2OEgxMjYuNzc3TDEyMy4xMDQgMjEuODUyNUMxMjIuODg3IDIyLjM4OTggMTIyLjYyMyAyMi44NDk3IDEyMi4zMTMgMjMuMjMyQzEyMi4wMDMgMjMuNjE0MyAxMjEuNjQyIDIzLjkwMzcgMTIxLjIyOCAyNC4xQzEyMC44MjUgMjQuMzA2NyAxMjAuMzYgMjQuNDEgMTE5LjgzMyAyNC40MVpNMTMzLjA1NCAyMS4xODZDMTMyLjIzOCAyMS4xODYgMTMxLjQ3OCAyMS4wMzYyIDEzMC43NzUgMjAuNzM2NUMxMzAuMDgzIDIwLjQzNjggMTI5LjQ3OSAyMC4wMjM1IDEyOC45NjIgMTkuNDk2NUMxMjguNDU2IDE4Ljk1OTIgMTI4LjA1OCAxOC4zMjg4IDEyNy43NjggMTcuNjA1NUMxMjcuNDc5IDE2Ljg4MjIgMTI3LjMzNCAxNi4wODY1IDEyNy4zMzQgMTUuMjE4NUMxMjcuMzM0IDE0LjM2MDggMTI3LjQ3NCAxMy41NzAzIDEyNy43NTMgMTIuODQ3QzEyOC4wNDIgMTIuMTEzMyAxMjguNDQ1IDExLjQ4MyAxMjguOTYyIDEwLjk1NkMxMjkuNDc5IDEwLjQxODcgMTMwLjA4MyAxMC4wMDUzIDEzMC43NzUgOS43MTZDMTMxLjQ2OCA5LjQxNjMzIDEzMi4yMjcgOS4yNjY1IDEzMy4wNTQgOS4yNjY1QzEzMy44NyA5LjI2NjUgMTM0LjU5OSA5LjQwNiAxMzUuMjM5IDkuNjg1QzEzNS44OSA5Ljk2NCAxMzYuNDM4IDEwLjMzMDggMTM2Ljg4MiAxMC43ODU1QzEzNy4zMjcgMTEuMjI5OCAxMzcuNjQ3IDExLjcxNTUgMTM3Ljg0MyAxMi4yNDI1TDEzNi4yIDEzLjAxNzVDMTM1Ljk1MiAxMi4zOTc1IDEzNS41NTUgMTEuODk2MyAxMzUuMDA3IDExLjUxNEMxMzQuNDcgMTEuMTIxMyAxMzMuODE5IDEwLjkyNSAxMzMuMDU0IDEwLjkyNUMxMzIuMjg5IDEwLjkyNSAxMzEuNjEyIDExLjEwNTggMTMxLjAyMyAxMS40Njc1QzEzMC40MzQgMTEuODI5MiAxMjkuOTc1IDEyLjMzMDMgMTI5LjY0NCAxMi45NzFDMTI5LjMyNCAxMy42MTE3IDEyOS4xNjMgMTQuMzYwOCAxMjkuMTYzIDE1LjIxODVDMTI5LjE2MyAxNi4wNzYyIDEyOS4zMjQgMTYuODMwNSAxMjkuNjQ0IDE3LjQ4MTVDMTI5Ljk3NSAxOC4xMjIyIDEzMC40MzQgMTguNjIzMyAxMzEuMDIzIDE4Ljk4NUMxMzEuNjEyIDE5LjMzNjMgMTMyLjI4OSAxOS41MTIgMTMzLjA1NCAxOS41MTJDMTMzLjgxOSAxOS41MTIgMTM0LjQ3IDE5LjMyMDggMTM1LjAwNyAxOC45Mzg1QzEzNS41NTUgMTguNTU2MiAxMzUuOTUyIDE4LjA1NSAxMzYuMiAxNy40MzVMMTM3Ljg0MyAxOC4yMUMxMzcuNjQ3IDE4LjcyNjcgMTM3LjMyNyAxOS4yMTIzIDEzNi44ODIgMTkuNjY3QzEzNi40MzggMjAuMTIxNyAxMzUuODkgMjAuNDg4NSAxMzUuMjM5IDIwLjc2NzVDMTM0LjU5OSAyMS4wNDY1IDEzMy44NyAyMS4xODYgMTMzLjA1NCAyMS4xODZaTTEzOS4wODkgMjFWOS4yNjY1SDE0MC44NFYxNC4yNTc1TDE0MC41NjEgMTQuMDQwNUMxNDAuNzY4IDEzLjUxMzUgMTQxLjA5OSAxMy4xMTU3IDE0MS41NTMgMTIuODQ3QzE0Mi4wMDggMTIuNTY4IDE0Mi41MzUgMTIuNDI4NSAxNDMuMTM0IDEyLjQyODVDMTQzLjc1NCAxMi40Mjg1IDE0NC4zMDIgMTIuNTYyOCAxNDQuNzc3IDEyLjgzMTVDMTQ1LjI1MyAxMy4xMDAyIDE0NS42MjUgMTMuNDcyMiAxNDUuODkzIDEzLjk0NzVDMTQ2LjE2MiAxNC40MjI4IDE0Ni4yOTYgMTQuOTY1MyAxNDYuMjk2IDE1LjU3NVYyMUgxNDQuNTZWMTYuMDU1NUMxNDQuNTYgMTUuNjMxOCAxNDQuNDc4IDE1LjI3NTMgMTQ0LjMxMiAxNC45ODZDMTQ0LjE1NyAxNC42ODYzIDE0My45NCAxNC40NTkgMTQzLjY2MSAxNC4zMDRDMTQzLjM4MiAxNC4xMzg3IDE0My4wNjIgMTQuMDU2IDE0Mi43IDE0LjA1NkMxNDIuMzQ5IDE0LjA1NiAxNDIuMDI5IDE0LjEzODcgMTQxLjczOSAxNC4zMDRDMTQxLjQ2IDE0LjQ1OSAxNDEuMjM4IDE0LjY4NjMgMTQxLjA3MyAxNC45ODZDMTQwLjkxOCAxNS4yODU3IDE0MC44NCAxNS42NDIyIDE0MC44NCAxNi4wNTU1VjIxSDEzOS4wODlaTTE1MS42NDMgMjEuMTg2QzE1MC44MDYgMjEuMTg2IDE1MC4wNjIgMjAuOTk0OCAxNDkuNDExIDIwLjYxMjVDMTQ4Ljc3IDIwLjIxOTggMTQ4LjI2OSAxOS42OTI4IDE0Ny45MDcgMTkuMDMxNUMxNDcuNTQ2IDE4LjM1OTggMTQ3LjM2NSAxNy42MTA3IDE0Ny4zNjUgMTYuNzg0QzE0Ny4zNjUgMTUuOTM2NyAxNDcuNTQ2IDE1LjE4NzUgMTQ3LjkwNyAxNC41MzY1QzE0OC4yNzkgMTMuODg1NSAxNDguNzc1IDEzLjM3NCAxNDkuMzk1IDEzLjAwMkMxNTAuMDE1IDEyLjYxOTcgMTUwLjcxOCAxMi40Mjg1IDE1MS41MDMgMTIuNDI4NUMxNTIuMTM0IDEyLjQyODUgMTUyLjY5NyAxMi41MzcgMTUzLjE5MyAxMi43NTRDMTUzLjY4OSAxMi45NzEgMTU0LjEwNyAxMy4yNzA3IDE1NC40NDggMTMuNjUzQzE1NC43ODkgMTQuMDI1IDE1NS4wNDggMTQuNDUzOCAxNTUuMjIzIDE0LjkzOTVDMTU1LjQwOSAxNS40MjUyIDE1NS41MDIgMTUuOTQxOCAxNTUuNTAyIDE2LjQ4OTVDMTU1LjUwMiAxNi42MjM4IDE1NS40OTcgMTYuNzYzMyAxNTUuNDg3IDE2LjkwOEMxNTUuNDc2IDE3LjA1MjcgMTU1LjQ1NiAxNy4xODcgMTU1LjQyNSAxNy4zMTFIMTQ4Ljc0NFYxNS45MTZIMTU0LjQzM0wxNTMuNTk2IDE2LjU1MTVDMTUzLjY5OSAxNi4wNDUyIDE1My42NjMgMTUuNTk1NyAxNTMuNDg3IDE1LjIwM0MxNTMuMzIyIDE0LjggMTUzLjA2NCAxNC40ODQ4IDE1Mi43MTIgMTQuMjU3NUMxNTIuMzcxIDE0LjAxOTggMTUxLjk2OCAxMy45MDEgMTUxLjUwMyAxMy45MDFDMTUxLjAzOCAxMy45MDEgMTUwLjYyNSAxNC4wMTk4IDE1MC4yNjMgMTQuMjU3NUMxNDkuOTAyIDE0LjQ4NDggMTQ5LjYyMyAxNC44MTU1IDE0OS40MjYgMTUuMjQ5NUMxNDkuMjMgMTUuNjczMiAxNDkuMTUyIDE2LjE4OTggMTQ5LjE5NCAxNi43OTk1QzE0OS4xNDIgMTcuMzY3OCAxNDkuMjIgMTcuODYzOCAxNDkuNDI2IDE4LjI4NzVDMTQ5LjY0MyAxOC43MTEyIDE0OS45NDMgMTkuMDQxOCAxNTAuMzI1IDE5LjI3OTVDMTUwLjcxOCAxOS41MTcyIDE1MS4xNjIgMTkuNjM2IDE1MS42NTggMTkuNjM2QzE1Mi4xNjUgMTkuNjM2IDE1Mi41OTMgMTkuNTIyMyAxNTIuOTQ1IDE5LjI5NUMxNTMuMzA2IDE5LjA2NzcgMTUzLjU5MSAxOC43NzMyIDE1My43OTcgMTguNDExNUwxNTUuMjIzIDE5LjEwOUMxNTUuMDU4IDE5LjUwMTcgMTU0LjggMTkuODU4MiAxNTQuNDQ4IDIwLjE3ODVDMTU0LjEwNyAyMC40ODg1IDE1My42OTQgMjAuNzM2NSAxNTMuMjA4IDIwLjkyMjVDMTUyLjczMyAyMS4wOTgyIDE1Mi4yMTEgMjEuMTg2IDE1MS42NDMgMjEuMTg2Wk0xNjAuNzMgMjEuMTg2QzE1OS44OTMgMjEuMTg2IDE1OS4xNDkgMjAuOTk0OCAxNTguNDk4IDIwLjYxMjVDMTU3Ljg1NyAyMC4yMTk4IDE1Ny4zNDYgMTkuNjkyOCAxNTYuOTY0IDE5LjAzMTVDMTU2LjU5MiAxOC4zNzAyIDE1Ni40MDYgMTcuNjIxIDE1Ni40MDYgMTYuNzg0QzE1Ni40MDYgMTUuOTU3MyAxNTYuNTkyIDE1LjIxMzMgMTU2Ljk2NCAxNC41NTJDMTU3LjMzNiAxMy44OTA3IDE1Ny44NDcgMTMuMzc0IDE1OC40OTggMTMuMDAyQzE1OS4xNDkgMTIuNjE5NyAxNTkuODkzIDEyLjQyODUgMTYwLjczIDEyLjQyODVDMTYxLjI5OCAxMi40Mjg1IDE2MS44MzEgMTIuNTMxOCAxNjIuMzI3IDEyLjczODVDMTYyLjgyMyAxMi45MzQ4IDE2My4yNTEgMTMuMjA4NyAxNjMuNjEzIDEzLjU2QzE2My45ODUgMTMuOTExMyAxNjQuMjU5IDE0LjMxOTUgMTY0LjQzNSAxNC43ODQ1TDE2Mi45IDE1LjQ5NzVDMTYyLjcyNCAxNS4wNjM1IDE2Mi40NCAxNC43MTczIDE2Mi4wNDggMTQuNDU5QzE2MS42NjUgMTQuMTkwMyAxNjEuMjI2IDE0LjA1NiAxNjAuNzMgMTQuMDU2QzE2MC4yNTUgMTQuMDU2IDE1OS44MjYgMTQuMTc0OCAxNTkuNDQ0IDE0LjQxMjVDMTU5LjA3MiAxNC42Mzk4IDE1OC43NzcgMTQuOTY1MyAxNTguNTYgMTUuMzg5QzE1OC4zNDMgMTUuODAyMyAxNTguMjM1IDE2LjI3MjUgMTU4LjIzNSAxNi43OTk1QzE1OC4yMzUgMTcuMzI2NSAxNTguMzQzIDE3LjgwMTggMTU4LjU2IDE4LjIyNTVDMTU4Ljc3NyAxOC42Mzg4IDE1OS4wNzIgMTguOTY0MyAxNTkuNDQ0IDE5LjIwMkMxNTkuODI2IDE5LjQzOTcgMTYwLjI1NSAxOS41NTg1IDE2MC43MyAxOS41NTg1QzE2MS4yMzYgMTkuNTU4NSAxNjEuNjc2IDE5LjQyOTMgMTYyLjA0OCAxOS4xNzFDMTYyLjQzIDE4LjkwMjMgMTYyLjcxNCAxOC41NDU4IDE2Mi45IDE4LjEwMTVMMTY0LjQzNSAxOC44M0MxNjQuMjY5IDE5LjI3NDMgMTY0LjAwMSAxOS42NzczIDE2My42MjkgMjAuMDM5QzE2My4yNjcgMjAuMzkwMyAxNjIuODM4IDIwLjY2OTMgMTYyLjM0MiAyMC44NzZDMTYxLjg0NiAyMS4wODI3IDE2MS4zMDkgMjEuMTg2IDE2MC43MyAyMS4xODZaTTE2NS42ODEgMjFWOS4yNjY1SDE2Ny40MzNWMTcuMTI1TDE2Ni43NTEgMTYuOTU0NUwxNzAuOTUxIDEyLjYxNDVIMTczLjEzN0wxNjkuOTc1IDE1Ljk3OEwxNzMuMjc2IDIxSDE3MS4yNjFMMTY4LjMxNiAxNi41NTE1TDE2OS4zNTUgMTYuNDEyTDE2Ni44NzUgMTkuMDQ3TDE2Ny40MzMgMTcuODg0NVYyMUgxNjUuNjgxWk0xNzcuNzk3IDIxLjE4NkMxNzYuOTYgMjEuMTg2IDE3Ni4yMTYgMjAuOTk0OCAxNzUuNTY1IDIwLjYxMjVDMTc0LjkyNCAyMC4yMTk4IDE3NC40MjMgMTkuNjkyOCAxNzQuMDYxIDE5LjAzMTVDMTczLjY5OSAxOC4zNTk4IDE3My41MTkgMTcuNjEwNyAxNzMuNTE5IDE2Ljc4NEMxNzMuNTE5IDE1LjkzNjcgMTczLjY5OSAxNS4xODc1IDE3NC4wNjEgMTQuNTM2NUMxNzQuNDMzIDEzLjg4NTUgMTc0LjkyOSAxMy4zNzQgMTc1LjU0OSAxMy4wMDJDMTc2LjE2OSAxMi42MTk3IDE3Ni44NzIgMTIuNDI4NSAxNzcuNjU3IDEyLjQyODVDMTc4LjI4NyAxMi40Mjg1IDE3OC44NTEgMTIuNTM3IDE3OS4zNDcgMTIuNzU0QzE3OS44NDMgMTIuOTcxIDE4MC4yNjEgMTMuMjcwNyAxODAuNjAyIDEzLjY1M0MxODAuOTQzIDE0LjAyNSAxODEuMjAxIDE0LjQ1MzggMTgxLjM3NyAxNC45Mzk1QzE4MS41NjMgMTUuNDI1MiAxODEuNjU2IDE1Ljk0MTggMTgxLjY1NiAxNi40ODk1QzE4MS42NTYgMTYuNjIzOCAxODEuNjUxIDE2Ljc2MzMgMTgxLjY0MSAxNi45MDhDMTgxLjYzIDE3LjA1MjcgMTgxLjYxIDE3LjE4NyAxODEuNTc5IDE3LjMxMUgxNzQuODk4VjE1LjkxNkgxODAuNTg3TDE3OS43NSAxNi41NTE1QzE3OS44NTMgMTYuMDQ1MiAxNzkuODE3IDE1LjU5NTcgMTc5LjY0MSAxNS4yMDNDMTc5LjQ3NiAxNC44IDE3OS4yMTcgMTQuNDg0OCAxNzguODY2IDE0LjI1NzVDMTc4LjUyNSAxNC4wMTk4IDE3OC4xMjIgMTMuOTAxIDE3Ny42NTcgMTMuOTAxQzE3Ny4xOTIgMTMuOTAxIDE3Ni43NzkgMTQuMDE5OCAxNzYuNDE3IDE0LjI1NzVDMTc2LjA1NSAxNC40ODQ4IDE3NS43NzYgMTQuODE1NSAxNzUuNTggMTUuMjQ5NUMxNzUuMzg0IDE1LjY3MzIgMTc1LjMwNiAxNi4xODk4IDE3NS4zNDggMTYuNzk5NUMxNzUuMjk2IDE3LjM2NzggMTc1LjM3MyAxNy44NjM4IDE3NS41OCAxOC4yODc1QzE3NS43OTcgMTguNzExMiAxNzYuMDk3IDE5LjA0MTggMTc2LjQ3OSAxOS4yNzk1QzE3Ni44NzIgMTkuNTE3MiAxNzcuMzE2IDE5LjYzNiAxNzcuODEyIDE5LjYzNkMxNzguMzE4IDE5LjYzNiAxNzguNzQ3IDE5LjUyMjMgMTc5LjA5OSAxOS4yOTVDMTc5LjQ2IDE5LjA2NzcgMTc5Ljc0NCAxOC43NzMyIDE3OS45NTEgMTguNDExNUwxODEuMzc3IDE5LjEwOUMxODEuMjEyIDE5LjUwMTcgMTgwLjk1MyAxOS44NTgyIDE4MC42MDIgMjAuMTc4NUMxODAuMjYxIDIwLjQ4ODUgMTc5Ljg0OCAyMC43MzY1IDE3OS4zNjIgMjAuOTIyNUMxNzguODg3IDIxLjA5ODIgMTc4LjM2NSAyMS4xODYgMTc3Ljc5NyAyMS4xODZaTTE4Mi45IDIxVjEyLjYxNDVIMTg0LjU3NFYxNC4zMDRMMTg0LjQxOSAxNC4wNTZDMTg0LjYwNSAxMy41MDgzIDE4NC45MDUgMTMuMTE1NyAxODUuMzE4IDEyLjg3OEMxODUuNzMyIDEyLjYzIDE4Ni4yMjggMTIuNTA2IDE4Ni44MDYgMTIuNTA2SDE4Ny4zMThWMTQuMTAyNUgxODYuNTg5QzE4Ni4wMTEgMTQuMTAyNSAxODUuNTQxIDE0LjI4MzMgMTg1LjE3OSAxNC42NDVDMTg0LjgyOCAxNC45OTYzIDE4NC42NTIgMTUuNTAyNyAxODQuNjUyIDE2LjE2NFYyMUgxODIuOVoiIGZpbGw9IiMzQTNBM0EiLz4KPHBhdGggZD0iTTE4OC41MDUgMjFWMTguOTg1SDE5MC4yODhWMjFIMTg4LjUwNVoiIGZpbGw9IiMzQTNBM0EiLz4KPHBhdGggZD0iTTE5Ni41NTMgMjEuMTg2QzE5NS43NDcgMjEuMTg2IDE5NS4wMDggMjAuOTk0OCAxOTQuMzM2IDIwLjYxMjVDMTkzLjY3NSAyMC4yMzAyIDE5My4xNDggMTkuNzA4MyAxOTIuNzU1IDE5LjA0N0MxOTIuMzYzIDE4LjM4NTcgMTkyLjE2NiAxNy42MzY1IDE5Mi4xNjYgMTYuNzk5NUMxOTIuMTY2IDE1Ljk1MjIgMTkyLjM2MyAxNS4yMDMgMTkyLjc1NSAxNC41NTJDMTkzLjE0OCAxMy44OTA3IDE5My42NzUgMTMuMzc0IDE5NC4zMzYgMTMuMDAyQzE5NC45OTggMTIuNjE5NyAxOTUuNzM3IDEyLjQyODUgMTk2LjU1MyAxMi40Mjg1QzE5Ny4zOCAxMi40Mjg1IDE5OC4xMTggMTIuNjE5NyAxOTguNzY5IDEzLjAwMkMxOTkuNDMxIDEzLjM3NCAxOTkuOTUzIDEzLjg5MDcgMjAwLjMzNSAxNC41NTJDMjAwLjcyOCAxNS4yMDMgMjAwLjkyNCAxNS45NTIyIDIwMC45MjQgMTYuNzk5NUMyMDAuOTI0IDE3LjY0NjggMjAwLjcyOCAxOC40MDEyIDIwMC4zMzUgMTkuMDYyNUMxOTkuOTQyIDE5LjcyMzggMTk5LjQxNSAyMC4yNDU3IDE5OC43NTQgMjAuNjI4QzE5OC4wOTMgMjEgMTk3LjM1OSAyMS4xODYgMTk2LjU1MyAyMS4xODZaTTE5Ni41NTMgMTkuNTU4NUMxOTcuMDQ5IDE5LjU1ODUgMTk3LjQ4OCAxOS40Mzk3IDE5Ny44NyAxOS4yMDJDMTk4LjI1MyAxOC45NjQzIDE5OC41NTIgMTguNjM4OCAxOTguNzY5IDE4LjIyNTVDMTk4Ljk5NyAxNy44MDE4IDE5OS4xMSAxNy4zMjY1IDE5OS4xMSAxNi43OTk1QzE5OS4xMSAxNi4yNzI1IDE5OC45OTcgMTUuODAyMyAxOTguNzY5IDE1LjM4OUMxOTguNTUyIDE0Ljk3NTcgMTk4LjI1MyAxNC42NTAyIDE5Ny44NyAxNC40MTI1QzE5Ny40ODggMTQuMTc0OCAxOTcuMDQ5IDE0LjA1NiAxOTYuNTUzIDE0LjA1NkMxOTYuMDY3IDE0LjA1NiAxOTUuNjI4IDE0LjE3NDggMTk1LjIzNSAxNC40MTI1QzE5NC44NTMgMTQuNjUwMiAxOTQuNTQ4IDE0Ljk3NTcgMTk0LjMyMSAxNS4zODlDMTk0LjEwNCAxNS44MDIzIDE5My45OTUgMTYuMjcyNSAxOTMuOTk1IDE2Ljc5OTVDMTkzLjk5NSAxNy4zMjY1IDE5NC4xMDQgMTcuODAxOCAxOTQuMzIxIDE4LjIyNTVDMTk0LjU0OCAxOC42Mzg4IDE5NC44NTMgMTguOTY0MyAxOTUuMjM1IDE5LjIwMkMxOTUuNjI4IDE5LjQzOTcgMTk2LjA2NyAxOS41NTg1IDE5Ni41NTMgMTkuNTU4NVpNMjAyLjE2OSAyMVYxMi42MTQ1SDIwMy44NDNWMTQuMzA0TDIwMy42ODggMTQuMDU2QzIwMy44NzQgMTMuNTA4MyAyMDQuMTc0IDEzLjExNTcgMjA0LjU4NyAxMi44NzhDMjA1IDEyLjYzIDIwNS40OTYgMTIuNTA2IDIwNi4wNzUgMTIuNTA2SDIwNi41ODZWMTQuMTAyNUgyMDUuODU4QzIwNS4yNzkgMTQuMTAyNSAyMDQuODA5IDE0LjI4MzMgMjA0LjQ0NyAxNC42NDVDMjA0LjA5NiAxNC45OTYzIDIwMy45MiAxNS41MDI3IDIwMy45MiAxNi4xNjRWMjFIMjAyLjE2OVpNMjExLjM2NSAyNC40MUMyMTAuNzU1IDI0LjQxIDIxMC4xOTIgMjQuMzExOCAyMDkuNjc2IDI0LjExNTVDMjA5LjE1OSAyMy45MTkyIDIwOC43MTUgMjMuNjQ1MyAyMDguMzQzIDIzLjI5NEMyMDcuOTcxIDIyLjk1MyAyMDcuNjkyIDIyLjU1IDIwNy41MDYgMjIuMDg1TDIwOS4xMTggMjEuNDE4NUMyMDkuMjYyIDIxLjgxMTIgMjA5LjUyNiAyMi4xMzY3IDIwOS45MDggMjIuMzk1QzIxMC4zMDEgMjIuNjUzMyAyMTAuNzgxIDIyLjc4MjUgMjExLjM1IDIyLjc4MjVDMjExLjc5NCAyMi43ODI1IDIxMi4xOTIgMjIuNjk0NyAyMTIuNTQzIDIyLjUxOUMyMTIuODk0IDIyLjM1MzcgMjEzLjE3MyAyMi4xMDU3IDIxMy4zOCAyMS43NzVDMjEzLjU4NyAyMS40NTQ3IDIxMy42OSAyMS4wNjcyIDIxMy42OSAyMC42MTI1VjE4LjcyMTVMMjE0IDE5LjA3OEMyMTMuNzExIDE5LjYxNTMgMjEzLjMwOCAyMC4wMjM1IDIxMi43OTEgMjAuMzAyNUMyMTIuMjg1IDIwLjU4MTUgMjExLjcxMSAyMC43MjEgMjExLjA3MSAyMC43MjFDMjEwLjI5NiAyMC43MjEgMjA5LjU5OCAyMC41NDAyIDIwOC45NzggMjAuMTc4NUMyMDguMzU4IDE5LjgxNjggMjA3Ljg2NyAxOS4zMjA4IDIwNy41MDYgMTguNjkwNUMyMDcuMTU0IDE4LjA2MDIgMjA2Ljk3OSAxNy4zNTIzIDIwNi45NzkgMTYuNTY3QzIwNi45NzkgMTUuNzcxMyAyMDcuMTU0IDE1LjA2MzUgMjA3LjUwNiAxNC40NDM1QzIwNy44NjcgMTMuODIzNSAyMDguMzUzIDEzLjMzMjcgMjA4Ljk2MyAxMi45NzFDMjA5LjU3MiAxMi42MDkzIDIxMC4yNyAxMi40Mjg1IDIxMS4wNTUgMTIuNDI4NUMyMTEuNjk2IDEyLjQyODUgMjEyLjI2NCAxMi41NjggMjEyLjc2IDEyLjg0N0MyMTMuMjY2IDEzLjExNTcgMjEzLjY4IDEzLjUwODMgMjE0IDE0LjAyNUwyMTMuNzY4IDE0LjQ1OVYxMi42MTQ1SDIxNS40MjZWMjAuNjEyNUMyMTUuNDI2IDIxLjMzNTggMjE1LjI1IDIxLjk4MTcgMjE0Ljg5OSAyMi41NUMyMTQuNTU4IDIzLjEyODcgMjE0LjA4MyAyMy41ODMzIDIxMy40NzMgMjMuOTE0QzIxMi44NjMgMjQuMjQ0NyAyMTIuMTYxIDI0LjQxIDIxMS4zNjUgMjQuNDFaTTIxMS4yNzIgMTkuMDkzNUMyMTEuNzM3IDE5LjA5MzUgMjEyLjE1IDE4Ljk4NSAyMTIuNTEyIDE4Ljc2OEMyMTIuODc0IDE4LjU0MDcgMjEzLjE1OCAxOC4yNDEgMjEzLjM2NSAxNy44NjlDMjEzLjU4MiAxNy40ODY3IDIxMy42OSAxNy4wNTc4IDIxMy42OSAxNi41ODI1QzIxMy42OSAxNi4xMDcyIDIxMy41ODIgMTUuNjc4MyAyMTMuMzY1IDE1LjI5NkMyMTMuMTQ4IDE0LjkxMzcgMjEyLjg1OCAxNC42MTQgMjEyLjQ5NyAxNC4zOTdDMjEyLjEzNSAxNC4xNjk3IDIxMS43MjcgMTQuMDU2IDIxMS4yNzIgMTQuMDU2QzIxMC43OTcgMTQuMDU2IDIxMC4zNzMgMTQuMTY5NyAyMTAuMDAxIDE0LjM5N0MyMDkuNjI5IDE0LjYxNCAyMDkuMzM1IDE0LjkxMzcgMjA5LjExOCAxNS4yOTZDMjA4LjkxMSAxNS42NjggMjA4LjgwOCAxNi4wOTY4IDIwOC44MDggMTYuNTgyNUMyMDguODA4IDE3LjA0NzUgMjA4LjkxMSAxNy40NzEyIDIwOS4xMTggMTcuODUzNUMyMDkuMzM1IDE4LjIzNTggMjA5LjYyOSAxOC41NDA3IDIxMC4wMDEgMTguNzY4QzIxMC4zNzMgMTguOTg1IDIxMC43OTcgMTkuMDkzNSAyMTEuMjcyIDE5LjA5MzVaIiBmaWxsPSIjM0EzQTNBIi8+Cjwvc3ZnPgo=" width="200" height="30" alt="AccessibilityChecker.org" />';

  var html = '<!DOCTYPE html><html><head><meta charset="utf-8">';
  html += '<style>';
  html += '@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap");';
  html += '@page { margin: 0; size: letter; } body { font-family: Inter, Arial, sans-serif; color: ' + BRAND_BLACK + '; margin: 0; padding: 0; font-size: 11px; line-height: 1.6; }';
  html += '.page { padding: 40px 50px; min-height: 0; }';

  // Cover page styles
  html += '.cover { position: relative; height: 100vh; padding: 40px 50px; box-sizing: border-box; overflow: hidden; }';
  html += '.cover-logo { margin-bottom: 60px; }';
  html += '.cover-stripes { position: absolute; top: 0; right: 0; width: 200px; height: 100%; }';
  html += '.cover-title-block { background: ' + BRAND_GREEN + '; padding: 28px 40px; display: inline-block; margin-top: 160px; }';
  html += '.cover-title { color: ' + BRAND_WHITE + '; font-size: 30px; font-weight: 700; line-height: 1.3; margin: 0; letter-spacing: -0.5px; }';
  html += '.cover-subtitle { color: ' + BRAND_BLACK + '; font-size: 14px; margin-top: 14px; line-height: 1.5; }';

  // Content styles
  html += 'h2 { font-size: 16px; color: ' + BRAND_GREEN + '; font-weight: 700; margin-top: 22px; margin-bottom: 8px; page-break-after: avoid; }';
  html += '.section-card { background: ' + BRAND_GRAY_10 + '; border-radius: 8px; padding: 16px 20px; margin: 8px 0; page-break-inside: avoid; }';
  html += '.plan-highlight { background: ' + BRAND_GREEN_LIGHT + '; border-left: 4px solid ' + BRAND_GREEN + '; padding: 14px 20px; margin: 10px 0; border-radius: 0 6px 6px 0; page-break-inside: avoid; }';
  html += 'table { width: 100%; border-collapse: collapse; margin: 8px 0; page-break-inside: avoid; }';
  html += 'th { background: ' + BRAND_GREEN + '; color: ' + BRAND_WHITE + '; text-align: left; padding: 10px 14px; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }';
  html += 'td { padding: 9px 14px; border-bottom: 1px solid ' + BRAND_GRAY_40 + '; font-size: 11px; }';
  html += 'tr:nth-child(even) td { background: ' + BRAND_GRAY_20 + '; }';
  html += '.total-row td { font-weight: 700; border-top: 2px solid ' + BRAND_GREEN + '; background: ' + BRAND_GREEN_LIGHT + '; font-size: 12px; }';
  html += '.discount-row td { color: ' + BRAND_GREEN_DARK + '; }';
  html += '.check-item { padding: 4px 0 4px 24px; position: relative; line-height: 1.5; }';
  html += '.check-item:before { content: "\\2713"; position: absolute; left: 0; color: ' + BRAND_GREEN + '; font-weight: 700; font-size: 14px; }';
  html += '.header-bar { display: flex; justify-content: flex-end; padding: 12px 50px; border-bottom: 1px solid ' + BRAND_GRAY_40 + '; }';
  html += '.footer-bar { background: linear-gradient(to right, ' + BRAND_GREEN_30 + ', ' + BRAND_GREEN + '); height: 4px; margin-top: 30px; }';
  html += '.footer-text { text-align: center; padding: 12px; color: #999; font-size: 9px; }';
  html += '.meta { color: #999; font-size: 10px; }';
  html += '.contact-table { margin: 8px 0; page-break-inside: avoid; } .contact-table th { font-size: 13px; padding: 10px 14px; font-weight: 700; letter-spacing: 0; text-transform: none; } .contact-table .ct-label { font-weight: 600; width: 90px; font-size: 10px; color: #666; padding: 5px 10px; border-bottom: 1px solid #E9ECEE; background: none; } .contact-table .ct-value { padding: 5px 14px 5px 0; border-bottom: 1px solid #E9ECEE; background: none; font-size: 11px; } .contact-table tr:nth-child(even) td { background: none; } ul { padding-left: 0; list-style: none; margin: 8px 0; }';
  html += '.section-wrap { page-break-inside: avoid; } .timeline-note { background: ' + BRAND_GRAY_30 + '; padding: 12px 16px; border-radius: 6px; margin: 8px 0; font-size: 10px; color: #555; }';
  html += '</style></head><body>';

  // ---- COVER PAGE ----
  html += '<div class="cover">';
  html += '<div class="cover-logo">' + logoImg + '</div>';

  // Decorative stripes (matching the brand template)
  html += '<svg class="cover-stripes" viewBox="0 0 200 800" preserveAspectRatio="none">';
  html += '<polygon points="120,0 200,0 200,800 80,800" fill="' + BRAND_GREEN_30 + '" opacity="0.3"/>';
  html += '<polygon points="150,0 200,0 200,800 110,800" fill="' + BRAND_GREEN + '" opacity="0.15"/>';
  html += '<polygon points="170,0 200,0 200,800 140,800" fill="' + BRAND_GREEN + '" opacity="0.1"/>';
  html += '</svg>';

  html += '<div class="cover-title-block">';
  html += '<p class="cover-title">ACE\u2122 Price Proposal</p>';
  html += '</div>';
  html += '<div class="cover-subtitle">';
  html += '<strong>Prepared for ' + esc(inp.companyName || "___") + '</strong><br>';
  html += today + '  |  Ref: ' + proposalNum;
  html += '</div>';
  html += '</div>';

  // ---- PAGE 2+: CONTENT ----
  html += '<div class="page">';

  // Client + Sales Rep info in a proper table
  html += '<table class="contact-table">';
  html += '<tr><th colspan="2">Prepared For</th><th colspan="2">Prepared By</th></tr>';

  // Build rows: pair left (client) with right (sales rep) fields
  var leftRows = [];
  if (inp.companyName) leftRows.push(["Company", esc(inp.companyName)]);
  if (inp.contactPerson) leftRows.push(["Contact", esc(inp.contactPerson)]);
  if (inp.contactEmail) leftRows.push(["Email", esc(inp.contactEmail)]);
  if (inp.contactPhone) leftRows.push(["Phone", esc(inp.contactPhone)]);
  if (inp.websiteUrl) leftRows.push(["Website", esc(inp.websiteUrl)]);

  var rightRows = [];
  if (inp.salesRepName) rightRows.push(["Sales Rep", esc(inp.salesRepName)]);
  if (inp.salesRepEmail) rightRows.push(["Email", esc(inp.salesRepEmail)]);
  rightRows.push(["Company", esc(COMPANY_NAME)]);

  var maxRows = Math.max(leftRows.length, rightRows.length);
  for (var r = 0; r < maxRows; r++) {
    html += '<tr>';
    if (r < leftRows.length) {
      html += '<td class="ct-label">' + leftRows[r][0] + '</td><td class="ct-value">' + leftRows[r][1] + '</td>';
    } else {
      html += '<td class="ct-label"></td><td class="ct-value"></td>';
    }
    if (r < rightRows.length) {
      html += '<td class="ct-label">' + rightRows[r][0] + '</td><td class="ct-value">' + rightRows[r][1] + '</td>';
    } else {
      html += '<td class="ct-label"></td><td class="ct-value"></td>';
    }
    html += '</tr>';
  }
  html += '</table>';

  // Plan summary
  html += '<h2>Plan Summary</h2>';
  html += '<div class="plan-highlight">';
  html += '<strong style="font-size:13px">' + esc(pricing.planName) + '</strong><br>';
  html += 'Pages: ' + inp.numPages.toLocaleString();
  if (inp.numDomains > 1) html += '  &middot;  Domains: ' + inp.numDomains;
  html += '  &middot;  Billing: ' + esc(inp.billingCycle);
  html += '</div>';

  // What's included
  html += '<h2>What\'s Included</h2>';
  html += '<div class="section-card"><ul>';
  for (var i = 0; i < pricing.included.length; i++) {
    html += '<li class="check-item">' + pricing.included[i] + '</li>';
  }
  html += '</ul></div>';


  // Pricing table
  html += '<div class="section-wrap">';
  html += '<h2>Pricing</h2>';
  html += '<table>';
  html += '<tr><th>Item</th><th style="text-align:right;width:130px">Monthly</th><th style="text-align:right;width:130px">Annual</th></tr>';
  html += '<tr><td>Base Plan</td><td style="text-align:right">$' + fmt(pricing.baseMonthlyCost) + '/mo</td><td style="text-align:right">$' + fmt(pricing.baseMonthlyCost * 12) + '</td></tr>';

  for (var i = 0; i < pricing.addOns.length; i++) {
    var ao = pricing.addOns[i];
    if (ao.monthly > 0) {
      html += '<tr><td>' + esc(ao.name) + '</td><td style="text-align:right">$' + fmt(ao.monthly) + '/mo</td><td style="text-align:right">$' + fmt(ao.monthly * 12) + '</td></tr>';
    } else {
      html += '<tr><td>' + esc(ao.name) + '</td><td style="text-align:right">one-time</td><td style="text-align:right">$' + fmt(ao.oneTime) + '</td></tr>';
    }
  }

  if (pricing.discountPct > 0) {
    html += '<tr class="discount-row"><td>Discount (' + pricing.discountPct + '%)</td><td style="text-align:right">-$' + fmt(pricing.discountAmount) + '/mo</td><td style="text-align:right">-$' + fmt(pricing.discountAmount * 12) + '</td></tr>';
  }

  html += '<tr class="total-row"><td>Monthly Total</td><td style="text-align:right">$' + fmt(pricing.monthlyAfterDiscount) + '/mo</td><td style="text-align:right">$' + fmt(pricing.annualTotal) + '/yr</td></tr>';

  if (pricing.addOnOneTime > 0) {
    html += '<tr class="total-row"><td>One-Time Charges</td><td style="text-align:right"></td><td style="text-align:right">$' + fmt(pricing.addOnOneTime) + '</td></tr>';
    html += '<tr class="total-row"><td>Year 1 Total</td><td style="text-align:right"></td><td style="text-align:right">$' + fmt(pricing.yearOneTotal) + '</td></tr>';
  }
  html += '</table>';
  html += '</div>'; // .section-wrap

  // Scope & Timeline (Managed Accessibility only)
  if (pricing.isManaged && (inp.timeline || inp.startDate || inp.contractDuration)) {
    html += '<div class="section-wrap">';
    html += '<h2>Scope &amp; Timeline</h2>';
    html += '<div class="section-card">';
    html += '<table style="margin:0">';
    if (inp.startDate) html += '<tr><td style="width:180px;border:none;padding:4px 0"><strong>Estimated Start</strong></td><td style="border:none;padding:4px 0">' + esc(String(inp.startDate)) + '</td></tr>';
    if (inp.timeline) html += '<tr><td style="border:none;padding:4px 0"><strong>Initial Remediation</strong></td><td style="border:none;padding:4px 0">' + esc(inp.timeline) + '</td></tr>';
    if (inp.contractDuration) html += '<tr><td style="border:none;padding:4px 0"><strong>Contract Duration</strong></td><td style="border:none;padding:4px 0">' + esc(inp.contractDuration) + '</td></tr>';
    html += '</table></div>';
    html += '</div>'; // .section-wrap
  }

  // Custom notes
  if (inp.customNotes) {
    html += '<h2>Additional Notes</h2>';
    html += '<p>' + esc(inp.customNotes) + '</p>';
  }

  // Validity
  if (inp.validUntil) {
    html += '<div class="plan-highlight">';
    html += 'This proposal is valid until <strong>' + esc(String(inp.validUntil)) + '</strong>.';
    html += '</div>';
  }

  // Standard Terms (different for Managed vs Platform)
  html += '<div class="section-wrap">';
  html += '<h2>Standard Terms</h2>';
  html += '<div class="section-card"><ul>';

  if (pricing.isManaged) {
    html += '<li class="check-item">Managed plans require an annual commitment. Monthly prices shown for reference.</li>';
    html += '<li class="check-item">Prices are in USD. Payment via invoice or credit card.</li>';
    html += '<li class="check-item">Setup and onboarding included at no additional cost.</li>';
    html += '<li class="check-item">Includes priority onboarding. Project Coordinator will be assigned within 48 hours of contract signing.</li>';
    html += '<li class="check-item">Service can be upgraded mid-term; downgrades apply at renewal.</li>';
  } else {
    html += '<li class="check-item">Platform access will be activated upon receipt of payment.</li>';
    html += '<li class="check-item">Subscription can be cancelled at any time \u2014 no long-term commitment required.</li>';
    html += '<li class="check-item">Upgrades can be made at any time. Remaining time on the current plan will be applied as credit toward the new plan.</li>';
    html += '<li class="check-item">A formal contract is available upon request.</li>';
    html += '<li class="check-item">Payment is processed by credit card by default. Wire transfer is available upon request.</li>';
    html += '<li class="check-item">Prices are in USD.</li>';
  }

  html += '</ul></div>';
  html += '</div>'; // .section-wrap

  // Footer
  html += '<div class="footer-bar"></div>';
  html += '<div class="footer-text">';
  var footerEmail = inp.salesRepEmail || NOTIFY_EMAIL;
  html += 'ACE\u2122 by ' + COMPANY_NAME + '  &middot;  ' + COMPANY_URL + '  &middot;  ' + esc(footerEmail);
  html += '</div>';

  html += '</div>'; // .page
  html += '</body></html>';
  return html;
}

function formatDateClean(val) {
  if (!val) return "";
  // If it's already a string that looks like "May 1, 2026", return as-is
  var s = String(val);
  if (s.match(/^[A-Z][a-z]+ \d{1,2}, \d{4}$/)) return s;
  // Try to parse as a Date
  var d;
  if (val instanceof Date) {
    d = val;
  } else {
    d = new Date(val);
  }
  if (isNaN(d.getTime())) return s; // unparseable, return original string
  var months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  return months[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear();
}

function esc(s) {
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

function fmt(n) {
  return Number(n).toLocaleString("en-US");
}

// ---- GENERATE PDF & EMAIL ----

function generateProposal() {
  var ui = SpreadsheetApp.getUi();

  try {
    // Load live pricing from calculator sheets (if available in this workbook)
    loadPricingFromCalculator();

    var inp = readInputs();

    if (!inp.companyName) {
      ui.alert("Missing info", "Please fill in at least the Company Name.", ui.ButtonSet.OK);
      return;
    }

    if (!inp.salesRepEmail) {
      ui.alert("Missing info", "Please fill in the Sales Rep Email so the proposal can be sent.", ui.ButtonSet.OK);
      return;
    }

    var pricing = calculatePricing(inp);
    var html = buildProposalHtml(inp, pricing);

    // Convert HTML directly to PDF
    var htmlBlob = Utilities.newBlob(html, "text/html", "proposal.html");
    var pdfBlob = htmlBlob.getAs("application/pdf");
    var fileName = "ACE_Proposal_" + inp.companyName.replace(/[^a-zA-Z0-9]/g, "_") + ".pdf";
    pdfBlob.setName(fileName);

    // Email the PDF: primary = sales rep, CC = management
    var subject = "ACE\u2122 Price Proposal for " + inp.companyName;
    var repName = inp.salesRepName || "Sales Rep";
    var emailBody = "Hi " + repName.split(" ")[0] + ",\n\n";
    emailBody += "A new price proposal has been generated for " + inp.companyName + ".\n\n";
    emailBody += "Plan: " + pricing.planName + "\n";
    emailBody += "Monthly: $" + fmt(pricing.monthlyAfterDiscount) + "/mo\n";
    emailBody += "Annual: $" + fmt(pricing.annualTotal) + "/yr\n";
    if (pricing.addOnOneTime > 0) emailBody += "One-time charges: $" + fmt(pricing.addOnOneTime) + "\n";
    if (pricing.discountPct > 0) emailBody += "Discount applied: " + pricing.discountPct + "%\n";
    emailBody += "\nThe PDF proposal is attached. Review it before sending to the client.\n";

    MailApp.sendEmail({
      to: inp.salesRepEmail,
      cc: NOTIFY_EMAIL,
      subject: subject,
      body: emailBody,
      attachments: [pdfBlob]
    });

    // Save a copy to Drive
    var folder = DriveApp.getRootFolder();
    var file = folder.createFile(pdfBlob);

    ui.alert(
      "Proposal Sent!",
      "ACE\u2122 proposal for " + inp.companyName + " has been:\n\n" +
      "1. Emailed to " + inp.salesRepEmail + "\n" +
      "2. CC'd to " + NOTIFY_EMAIL + "\n" +
      "3. Saved to Google Drive\n\n" +
      "Plan: " + pricing.planName + "\n" +
      "Monthly: $" + fmt(pricing.monthlyAfterDiscount) + "/mo\n" +
      "Annual: $" + fmt(pricing.annualTotal) + "/yr",
      ui.ButtonSet.OK
    );

  } catch (e) {
    ui.alert("Error", "Something went wrong:\n" + e.message, ui.ButtonSet.OK);
    Logger.log(e);
  }
}