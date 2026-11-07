// Fee computation based on NBCDO Memorandum Circular No. 03, Series of 2016
// (Annex "A"): the schedule of fees of the Revised IRR of the National Building
// Code (PD 1096). "Sec." references below point to sections of that annex.
//
// Each compute* function returns { fees, notes }:
//   fees  - proposed Assessment.fees items for the assessor to review
//   notes - things that could not be computed and must be assessed manually
// Where the schedule says "or fraction thereof", the quantity is rounded up.

import {
    ELECTRICAL_SCOPES_OF_WORK,
    FEE_CATEGORIES,
    SCOPES_OF_WORK,
} from "./constants.js";
import { acUnitsText, ANNUAL_MECHANICAL, ELECTRICAL, ELECTRONICS, itemAmount, machineSize, machineValue, SIGN_RENEWALS, totalFloorArea } from "./feeSchedule.js";

const round2 = (n) => Math.round(n * 100) / 100;

// [upTo, value] brackets: the value of the first bracket that contains x
const bracketValue = (brackets, x) => brackets.find(([upTo]) => x <= upTo)[1];

// [upTo, rate] brackets: each slice of x is charged at its own bracket's rate
const cumulative = (brackets, x) => {
    let fee = 0;
    let lower = 0;
    for (const [upTo, rate] of brackets) {
        if (x <= lower) break;
        fee += (Math.min(x, upTo) - lower) * rate;
        lower = upTo;
    }
    return fee;
};

// { over, base, rate } steps: base + rate for every unit above `over`
const stepped = (steps, x) => {
    const step = [...steps].reverse().find((s) => x > s.over) || steps[0];
    return step.base + step.rate * (x - step.over);
};

const fee = (category, reference, description, amount, extra = {}) => ({
    category,
    reference,
    description,
    amount: round2(amount),
    ...extra,
});

// ---------------------------------------------------------------------------
// Sec. 3: Building fees
// ---------------------------------------------------------------------------

// Sec. 3.a / 3.b: the whole floor area is charged at its bracket's rate
const BUILDING_FEE_A = {
    "A-1": {
        upTo20New: 2.0,
        upTo20Addition: 2.4,
        brackets: [[50, 3.4], [100, 4.8], [150, 6.0], [Infinity, 7.2]],
    },
    "A-2": {
        upTo20New: 3.0,
        upTo20Addition: 3.4,
        brackets: [[50, 5.2], [100, 8.0], [150, 8.0], [Infinity, 8.4]],
    },
};

// Sec. 3.c / 3.d: cumulative, each slice of the floor area at its own rate
const BUILDING_FEE_3C = [
    [5000, 23.0], [6000, 22.0], [7000, 20.5], [8000, 19.5], [9000, 18.0],
    [10000, 17.0], [15000, 16.0], [20000, 15.0], [30000, 14.0], [Infinity, 12.0],
];
const BUILDING_FEE_3D = [
    [5000, 12.0], [6000, 11.0], [7000, 10.2], [8000, 9.6], [9000, 9.0],
    [10000, 8.4], [15000, 7.2], [20000, 6.6], [30000, 6.0], [Infinity, 5.0],
];
const DIVISIONS_3C = [
    "B-1", "C-1", "E-1", "E-2", "E-3", "F-1", "G-1", "G-2", "G-3", "G-4", "G-5",
    "H-1", "H-2", "H-3", "H-4", "I-1", "J-1", "J-3",
];
const DIVISIONS_3D = ["C-2", "D-1", "D-2", "D-3"];

const ADDITION_SCOPES = [
    SCOPES_OF_WORK.ADDITION,
    SCOPES_OF_WORK.ALTERATION,
    SCOPES_OF_WORK.RENOVATION,
];

export const computeBuildingPermitFees = (permit) => {
    const fees = [];
    const notes = [
        "Only the building fee is computed. Add any line and grade, fencing, excavation, " +
            "electrical, mechanical, plumbing and electronics fees separately (Secs. 4-9).",
    ];
    const { occupancyDivision: division, totalFloorArea: area, scopeOfWork } = permit;
    const C = FEE_CATEGORIES.BUILDING;

    if (!area) {
        notes.push("Building permit has no total floor area; building fee not computed.");
        return { fees, notes };
    }

    // Sec. 9.k: demolition and moving are charged per sq. meter instead of Sec. 3
    if (scopeOfWork === SCOPES_OF_WORK.DEMOLITION || scopeOfWork === SCOPES_OF_WORK.MOVING) {
        const sqm = Math.ceil(area);
        const ref = scopeOfWork === SCOPES_OF_WORK.DEMOLITION ? "Sec. 9.k.i" : "Sec. 9.k.v";
        fees.push(fee(C, ref, `${scopeOfWork}, ${sqm} sq. m @ ₱3.00`, sqm * 3, { basis: sqm, rate: 3 }));
        return { fees, notes };
    }
    if (scopeOfWork === SCOPES_OF_WORK.REPAIR) {
        notes.push("Repairs costing over ₱5,000 are charged 1% of the itemized repair cost (Sec. 9.i.iii); assess manually.");
        return { fees, notes };
    }
    if (scopeOfWork === SCOPES_OF_WORK.RAISING) {
        notes.push("For raising, the floor area must be the new usable area generated (Sec. 9.j).");
    }

    if (!division) {
        notes.push("Building permit has no occupancy division; building fee not computed.");
    } else if (BUILDING_FEE_A[division]) {
        const table = BUILDING_FEE_A[division];
        const ref = division === "A-1" ? "Sec. 3.a" : "Sec. 3.b";
        const rate =
            area <= 20
                ? ADDITION_SCOPES.includes(scopeOfWork) ? table.upTo20Addition : table.upTo20New
                : bracketValue(table.brackets, area);
        fees.push(fee(C, ref, `Building fee, Division ${division}, ${area} sq. m @ ₱${rate.toFixed(2)}`, area * rate, { basis: area, rate }));
    } else if (DIVISIONS_3C.includes(division) || DIVISIONS_3D.includes(division)) {
        const is3C = DIVISIONS_3C.includes(division);
        const amount = cumulative(is3C ? BUILDING_FEE_3C : BUILDING_FEE_3D, area);
        fees.push(fee(C, is3C ? "Sec. 3.c" : "Sec. 3.d", `Building fee, Division ${division}, ${area} sq. m (cumulative)`, amount, { basis: area }));
    } else if (division === "J-2") {
        notes.push("Division J-2 is charged 50% of the rate of its principal building (Sec. 3.e); assess manually.");
    }
    return { fees, notes };
};

// ---------------------------------------------------------------------------
// Sec. 4: Electrical fees
// ---------------------------------------------------------------------------

// Sec. 4.a: total connected load (kVA). The office charges the rate on the whole
// load, e.g. 67.5 kVA = 1,100 + 67.5 x 10, so `over` only selects the bracket.
const CONNECTED_LOAD_STEPS = [
    { over: 0, base: 200, rate: 0 },
    { over: 5, base: 200, rate: 20 },
    { over: 50, base: 1100, rate: 10 },
    { over: 300, base: 3600, rate: 5 },
    { over: 1500, base: 9600, rate: 2.5 },
    { over: 6000, base: 20850, rate: 1.25 },
];
// Sec. 4.b: total transformer / UPS / generator capacity (kVA)
const TRANSFORMER_STEPS = [
    { over: 0, base: 40, rate: 0 },
    { over: 5, base: 40, rate: 4 },
    { over: 50, base: 220, rate: 2 },
    { over: 300, base: 720, rate: 1 },
    { over: 1500, base: 1920, rate: 0.5 },
    { over: 6000, base: 4170, rate: 0.25 },
];
// Sec. 4.d: miscellaneous fees by use or character of occupancy
const ELECTRICAL_MISC = {
    residential: { electricMeter: 15, wiringPermit: 15 },
    "commercial/industrial": { electricMeter: 60, wiringPermit: 36 },
    institutional: { electricMeter: 30, wiringPermit: 12 },
};
const METER_SCOPES = [
    ELECTRICAL_SCOPES_OF_WORK.RECONNECTION,
    ELECTRICAL_SCOPES_OF_WORK.SEPARATION,
    ELECTRICAL_SCOPES_OF_WORK.UPGRADING,
    ELECTRICAL_SCOPES_OF_WORK.RELOCATION,
];

// Sec. 4.a + 4.b, shared by electrical permits and annual inspections
const loadFees = ({ totalConnectedLoad, totalTransformerCapacity, totalGeneratorCapacity }) => {
    const fees = [];
    const E = FEE_CATEGORIES.ELECTRICAL;
    if (totalConnectedLoad > 0) {
        fees.push(fee(E, "Sec. 4.a", `Total connected load, ${totalConnectedLoad} kVA`,
            stepped(CONNECTED_LOAD_STEPS, totalConnectedLoad), { basis: totalConnectedLoad }));
    }
    const capacity = (totalTransformerCapacity || 0) + (totalGeneratorCapacity || 0);
    if (capacity > 0) {
        fees.push(fee(E, "Sec. 4.b", `Total transformer/UPS/generator capacity, ${capacity} kVA`,
            stepped(TRANSFORMER_STEPS, capacity), { basis: capacity }));
    }
    return fees;
};

// "Group A - Residential (Dwellings)" -> "residential", etc.
const electricalUseOf = (characterOfOccupancy = "") => {
    const group = characterOfOccupancy.match(/^Group ([A-J])/)?.[1];
    if (!group) return null;
    if (group === "A") return "residential";
    if (group === "C" || group === "D") return "institutional";
    return "commercial/industrial";
};

export const computeElectricalPermitFees = (permit) => {
    const notes = ["Pole location and guying attachment fees (Sec. 4.c) are not included; add them if any."];
    const fees = loadFees(permit);
    if (!fees.length) notes.push("Electrical permit has no connected load or transformer/generator capacity.");

    const use = electricalUseOf(permit.characterOfOccupancy);
    if (!use) {
        notes.push("Electrical permit has no character of occupancy; Sec. 4.d fees not computed.");
    } else {
        const misc = ELECTRICAL_MISC[use];
        if (METER_SCOPES.includes(permit.scopeOfWork)) {
            fees.push(fee(FEE_CATEGORIES.ELECTRICAL, "Sec. 4.d", `Electric meter (${use})`, misc.electricMeter));
        }
        fees.push(fee(FEE_CATEGORIES.ELECTRICAL, "Sec. 4.d", `Wiring permit issuance (${use})`, misc.wiringPermit));
    }

    // Sec. 11.e.i: one-time inspection fee of 10% of the electrical permit fees.
    // Annual inspections are charged the Sec. 4.e fees only (Sec. 11.e.ii).
    const permitTotal = fees.reduce((sum, f) => sum + f.amount, 0);
    if (permitTotal > 0 && permit.scopeOfWork !== ELECTRICAL_SCOPES_OF_WORK.ANNUAL_INSPECTION) {
        fees.push(fee(FEE_CATEGORIES.INSPECTION, "Sec. 11.e.i", "Electrical inspection fee, 10% of electrical permit fees",
            permitTotal * 0.1, { basis: round2(permitTotal), rate: 0.1 }));
    }
    return { fees, notes };
};

// ---------------------------------------------------------------------------
// Sec. 11: Annual inspection fees (businesses)
// ---------------------------------------------------------------------------

// Sec. 11.b: by floor area; above 1,000 sq. m add ₱1,200 per 1,000 sq. m or portion
const ANNUAL_AREA_BRACKETS = [
    [100, 120], [200, 240], [350, 480], [500, 720], [750, 960], [1000, 1200],
];
const ANNUAL_AREA_DIVISIONS = [
    "B-1", "D-1", "D-2", "D-3", "E-1", "E-2", "E-3", "F-1", "G-1", "G-2", "G-3",
    "G-4", "G-5", "H-1", "H-2", "H-3", "H-4", "I-1",
];

const annualAreaFee = (area) =>
    area <= 1000
        ? bracketValue(ANNUAL_AREA_BRACKETS, area)
        : 1200 + 1200 * Math.ceil((area - 1000) / 1000);

// Sec. 11.f: annual mechanical inspection fees, from the same items as the checklists
const mechanicalFees = (machineries = []) => {
    const fees = [];
    const notes = [];

    for (const machine of machineries) {
        const item = ANNUAL_MECHANICAL.find(({ id }) => id === machine.itemId);
        const name = machine.machineName ? ` (${machine.machineName})` : "";
        const value = machineValue(item, machine);
        if (!value) {
            notes.push(`${item.label}${name} has no ${item.unit} entered; assess its mechanical fee manually.`);
            continue;
        }
        const quantity = machine.quantity || 1;
        fees.push(fee(FEE_CATEGORIES.MECHANICAL, item.ref,
            `${item.label}${name}, ${machineSize(item, machine)}${machine.acUnits?.length ? ` (${acUnitsText(machine.acUnits)})` : ""}${item.perUnit ? ` × ${quantity}` : ""}`,
            itemAmount(item, value, quantity), {
                itemId: item.id,
                basis: value,
                ...(item.perUnit && { itemUnits: quantity }),
                ...(item.kind === "rate" && { rate: item.rate }),
            }));
    }
    return { fees, notes };
};

// Sec. 9.h.iii: each sign is charged on its own display surface, with its own minimum
const signFees = (signs = []) => {
    const fees = [];
    const notes = [];
    for (const { itemId, area } of signs) {
        const item = SIGN_RENEWALS.find(({ id }) => id === itemId);
        if (area > 0) {
            fees.push(fee(FEE_CATEGORIES.OTHERS, item.ref, `${item.label}, ${area} sq. m`, itemAmount(item, area),
                { itemId, basis: area, rate: item.rate }));
        } else {
            notes.push(`${item.label} has no display surface entered; assess its fee manually.`);
        }
    }
    return { fees, notes };
};

// Sec. 4.c: charged per pole and per attachment within the premises
const poleFees = ({ noOfPoles, noOfGuyingAttachments }) =>
    [["4c-i", noOfPoles], ["4c-ii", noOfGuyingAttachments]].flatMap(([id, count]) => {
        if (!(count > 0)) return [];
        const item = ELECTRICAL.find((candidate) => candidate.id === id);
        return [fee(FEE_CATEGORIES.ELECTRICAL, item.ref, `${item.label}, ${count} ${item.unit}`, itemAmount(item, count),
            { itemId: item.id, basis: count, rate: item.rate })];
    });

// Sec. 11.g, the same as Sec. 7
const electronicsFees = ({ electronics = [] }) => {
    const fees = [];
    const notes = [];
    for (const item of ELECTRONICS) {
        const row = electronics.find(({ itemId }) => itemId === item.id);
        const count = row?.quantity || 0;
        if (count > 0) {
            fees.push(fee(FEE_CATEGORIES.ELECTRONICS, item.ref, `${item.label}, ${count} ${item.unit}`, itemAmount(item, count),
                { itemId: item.id, basis: count, rate: item.rate }));
        } else if (row) {
            notes.push(`${item.label} has no ${item.unit} entered; assess its electronics fee manually.`);
        }
    }
    return { fees, notes };
};

export const computeBusinessAnnualFees = (application, inspection) => {
    const fees = [];
    const notes = [];
    const division = application.occupancyDivision;
    const { area, noOfCR } = inspection;

    // Building / structural (Sec. 11.a-c)
    if (!division) {
        notes.push("The application has no occupancy division; annual building inspection fee not computed.");
    } else if (division === "A-1" || division === "A-2") {
        notes.push("Divisions A-1/A-2: single detached dwellings and duplexes are exempt; otherwise " +
            "₱120 per inspection service the owner requests (Sec. 11.a). Assess manually.");
    } else if (division === "C-1" || division === "C-2") {
        notes.push("Divisions C-1/C-2 depend on the theater class or type of facility (Sec. 11.c); assess manually.");
    } else if (!ANNUAL_AREA_DIVISIONS.includes(division)) {
        notes.push(`Division ${division} has no annual inspection fee in Sec. 11; assess manually if applicable.`);
    } else if (!area) {
        notes.push("Inspection has no floor area; annual building inspection fee not computed.");
    } else {
        const total = totalFloorArea(inspection);
        const size = total === area ? `${area} sq. m` : `${area} sq. m × ${inspection.numOfStorey} storeys = ${total} sq. m`;
        fees.push(fee(FEE_CATEGORIES.BUILDING, "Sec. 11.b", `Annual inspection, Division ${division}, ${size}`,
            annualAreaFee(total), { basis: total }));
    }

    // Plumbing (Sec. 11.d): each toilet is counted as one plumbing unit (Sec. 6.a)
    if (noOfCR > 0) {
        fees.push(fee(FEE_CATEGORIES.PLUMBING, "Sec. 11.d", `Annual plumbing inspection, ${noOfCR} plumbing unit(s)`,
            noOfCR * 60, { basis: noOfCR, rate: 60 }));
    }

    // Electrical (Sec. 11.e.ii): same as the Sec. 4 electrical fees. A load given as
    // kW or a breaker size carries how it became kVA over to the assessment.
    const { connectedLoadConversion: conversion } = inspection;
    fees.push(...loadFees(inspection).map((line) =>
        line.reference === "Sec. 4.a" && conversion?.from ? { ...line, itemId: "4a", conversion } : line));
    fees.push(...poleFees(inspection));

    const electronics = electronicsFees(inspection);
    fees.push(...electronics.fees);
    notes.push(...electronics.notes);

    const signs = signFees(inspection.signs);
    fees.push(...signs.fees);
    notes.push(...signs.notes);

    // Mechanical (Sec. 11.f)
    const mechanical = mechanicalFees(inspection.machineries);
    fees.push(...mechanical.fees);
    notes.push(...mechanical.notes);

    return { fees, notes };
};
