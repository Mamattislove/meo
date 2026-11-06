// The schedule of fees as a checklist: NBCDO Memorandum Circular No. 03, Series of
// 2016 (Annex "A"). Each item is one line of the annex. Used by the client's
// assessment form, so it must stay free of server-only imports.
import { FEE_CATEGORIES as C } from "./constants.js";

const round2 = (n) => Math.round(n * 100) / 100;

// Item builders. `fraction: true` means "or fraction thereof": the quantity rounds up.
const rate = (id, ref, label, amount, unit, extra) => ({ id, ref, label, unit, kind: "rate", rate: amount, ...extra });
const flat = (id, ref, label, amount, extra) => ({ id, ref, label, kind: "flat", amount, ...extra });
// `base` covers up to `upTo` units, then `extra` for every unit above that
const excess = (id, ref, label, unit, base, upTo, over, extra) => ({ id, ref, label, unit, kind: "excess", base, upTo, over, fraction: true, ...extra });
// The whole quantity is charged at the rate of its bracket: [upTo, rate]
const bracketRate = (id, ref, label, unit, brackets, extra) => ({ id, ref, label, unit, kind: "bracketRate", brackets, ...extra });
// Each slice of the quantity is charged at its own bracket's rate: [upTo, rate]
const cumulative = (id, ref, label, unit, brackets, extra) => ({ id, ref, label, unit, kind: "cumulative", brackets, ...extra });
// A fixed fee by bracket: [upTo, fee]. `over` is { per, amount } above the last bracket.
const bracketFee = (id, ref, label, unit, brackets, over, extra) => ({ id, ref, label, unit, kind: "bracketFee", brackets, over, ...extra });
// base + rate for every unit above `over`
const stepped = (id, ref, label, unit, steps, extra) => ({ id, ref, label, unit, kind: "stepped", steps, ...extra });
// The schedule gives a rule, not a figure (e.g. 50% of the principal building's rate)
const manual = (id, ref, label, extra) => ({ id, ref, label, unit: "pesos", kind: "manual", ...extra });
const FRACTION = { fraction: true };
const PER_UNIT = { perUnit: true };

// Sec. 3.a / 3.b floor area brackets
const dwelling = (id, ref, division, upTo20, addition, brackets) => [
    bracketRate(id, ref, `Division ${division}, original construction`, "sq. m", [[20, upTo20], ...brackets]),
    rate(`${id}-add`, `${ref}.ii`, `Division ${division}, addition / renovation / alteration up to 20 sq. m`, addition, "sq. m"),
];

const BUILDING_FEES = [
    ...dwelling("3a", "Sec. 3.a", "A-1", 2, 2.4, [[50, 3.4], [100, 4.8], [150, 6], [Infinity, 7.2]]),
    ...dwelling("3b", "Sec. 3.b", "A-2", 3, 3.4, [[50, 5.2], [100, 8], [150, 8], [Infinity, 8.4]]),
    cumulative("3c", "Sec. 3.c", "Divisions B-1, C-1, E, F-1, G, H, I-1, J (cumulative)", "sq. m", [
        [5000, 23], [6000, 22], [7000, 20.5], [8000, 19.5], [9000, 18],
        [10000, 17], [15000, 16], [20000, 15], [30000, 14], [Infinity, 12],
    ]),
    cumulative("3d", "Sec. 3.d", "Divisions C-2, D-1, D-2, D-3 (cumulative)", "sq. m", [
        [5000, 12], [6000, 11], [7000, 10.2], [8000, 9.6], [9000, 9],
        [10000, 8.4], [15000, 7.2], [20000, 6.6], [30000, 6], [Infinity, 5],
    ]),
    manual("3e", "Sec. 3.e", "Division J-2 structures: 50% of the principal building's rate"),
];

export const ELECTRICAL = [
    stepped("4a", "Sec. 4.a", "Total connected load", "kVA", [
        { over: 0, base: 200, rate: 0 }, { over: 5, base: 200, rate: 20 }, { over: 50, base: 1100, rate: 10 },
        { over: 300, base: 3600, rate: 5 }, { over: 1500, base: 9600, rate: 2.5 }, { over: 6000, base: 20850, rate: 1.25 },
    // The rate applies to the part above the bracket, e.g. 67.5 kVA = 1,100 + 17.5 x 10.
    // Only then does each bracket's base equal the top of the bracket before it.
    ], { convertsToKva: true }),
    stepped("4b", "Sec. 4.b", "Total transformer / UPS / generator capacity", "kVA", [
        { over: 0, base: 40, rate: 0 }, { over: 5, base: 40, rate: 4 }, { over: 50, base: 220, rate: 2 },
        { over: 300, base: 720, rate: 1 }, { over: 1500, base: 1920, rate: 0.5 }, { over: 6000, base: 4170, rate: 0.25 },
    ]),
    rate("4c-i", "Sec. 4.c.i", "Power supply pole location", 30, "poles"),
    rate("4c-ii", "Sec. 4.c.ii", "Guying attachment", 30, "attachments"),
    flat("4d-meter-res", "Sec. 4.d", "Electric meter, residential", 15),
    flat("4d-meter-com", "Sec. 4.d", "Electric meter, commercial / industrial", 60),
    flat("4d-meter-ins", "Sec. 4.d", "Electric meter, institutional", 30),
    flat("4d-wiring-res", "Sec. 4.d", "Wiring permit issuance, residential", 15),
    flat("4d-wiring-com", "Sec. 4.d", "Wiring permit issuance, commercial / industrial", 36),
    flat("4d-wiring-ins", "Sec. 4.d", "Wiring permit issuance, institutional", 12),
];

const MECHANICAL = [
    rate("5a-i", "Sec. 5.a.i", "Refrigeration (cold storage)", 40, "tons", FRACTION),
    rate("5a-ii", "Sec. 5.a.ii", "Ice plants", 60, "tons", FRACTION),
    cumulative("5a-iii", "Sec. 5.a.iii-iv", "Packaged / centralized air conditioning", "tons", [[100, 90], [Infinity, 40]], FRACTION),
    rate("5a-v", "Sec. 5.a.v", "Window type air conditioners", 60, "units"),
    rate("5a-vi", "Sec. 5.a.vi", "Mechanical ventilation, blower or fan", 40, "kW", FRACTION),
    rate("5b-i", "Sec. 5.b.i", "Escalator and moving walk, per lineal meter", 10, "m", FRACTION),
    excess("5b-ii", "Sec. 5.b.ii-iii", "Escalator and moving walks, up to 20 m", "m", 20, 20, 10),
    rate("5b-iv", "Sec. 5.b.iv", "Funicular", 200, "m", FRACTION),
    rate("5b-iva", "Sec. 5.b.iv.a", "Funicular, per lineal meter travel", 20, "m"),
    rate("5b-v", "Sec. 5.b.v", "Cable car", 40, "m", FRACTION),
    rate("5b-va", "Sec. 5.b.v.a", "Cable car, per lineal meter travel", 5, "m"),
    rate("5c-i", "Sec. 5.c.i", "Motor driven dumbwaiters", 600, "units"),
    rate("5c-ii", "Sec. 5.c.ii", "Construction elevators for material", 2000, "units"),
    rate("5c-iii", "Sec. 5.c.iii", "Passenger elevators", 5000, "units"),
    rate("5c-iv", "Sec. 5.c.iv", "Freight elevators", 5000, "units"),
    rate("5c-v", "Sec. 5.c.v", "Car elevators", 5000, "units"),
    bracketFee("5d", "Sec. 5.d", "Boilers", "kW", [[7.5, 500], [22, 700], [37, 900], [52, 1200], [67, 1400], [74, 1600]], { per: 1, amount: 5 }),
    rate("5e", "Sec. 5.e", "Pressurized water heaters", 200, "units"),
    rate("5f", "Sec. 5.f", "Water, sump and sewage pumps", 60, "kW", FRACTION),
    rate("5g", "Sec. 5.g", "Automatic fire sprinkler heads", 4, "heads"),
    cumulative("5h", "Sec. 5.h", "Generating units (diesel, gas, hydro, solar and the like)", "kW", [[50, 25], [100, 20], [Infinity, 3]]),
    rate("5i", "Sec. 5.i", "Compressed air, vacuum and gases", 20, "outlets"),
    rate("5j", "Sec. 5.j", "Gas meters", 100, "units"),
    rate("5k", "Sec. 5.k", "Power piping, per lineal or cu. meter, whichever is higher", 4, "m", FRACTION),
    cumulative("5l", "Sec. 5.l", "Other engines (cranes, forklifts, loaders, mixers) not LTO-registered", "kW", [[50, 10], [100, 12], [Infinity, 3]], FRACTION),
    rate("5m", "Sec. 5.m", "Pressure vessels", 60, "cu. m", FRACTION),
    rate("5n", "Sec. 5.n", "Other machinery / equipment", 60, "kW", FRACTION),
    rate("5o", "Sec. 5.o", "Pneumatic tubes, conveyors, monorails, duct additions", 10, "m", FRACTION),
    rate("5p", "Sec. 5.p", "Weighing scale structure", 50, "tons", FRACTION),
];

const PLUMBING = [
    rate("6a", "Sec. 6.a", "Installation, per unit (a partial unit is charged whole)", 24, "units", FRACTION),
    rate("6b-i", "Sec. 6.b.i", "Excess water closets", 7, "pcs"),
    rate("6b-ii", "Sec. 6.b.ii", "Excess floor drains", 3, "pcs"),
    rate("6b-iii", "Sec. 6.b.iii", "Excess sinks", 3, "pcs"),
    rate("6b-iv", "Sec. 6.b.iv", "Excess lavatories", 7, "pcs"),
    rate("6b-v", "Sec. 6.b.v", "Excess faucets", 2, "pcs"),
    rate("6b-vi", "Sec. 6.b.vi", "Excess shower heads", 2, "pcs"),
    ...[
        ["i", "Slop sinks", 7], ["ii", "Urinals", 4], ["iii", "Bath tubs", 7], ["iv", "Grease traps", 7],
        ["v", "Garage traps", 7], ["vi", "Bidets", 4], ["vii", "Dental cuspidors", 4], ["viii", "Gas-fired water heaters", 4],
        ["ix", "Drinking fountains", 2], ["x", "Bar or soda fountain sinks", 4], ["xi", "Laundry sinks", 4],
        ["xii", "Laboratory sinks", 4], ["xiii", "Fixed-type sterilizers", 2],
    ].map(([n, label, amount]) => rate(`6c-${n}`, `Sec. 6.c.${n}`, label, amount, "pcs")),
    rate("6d", "Sec. 6.d", "Water meters", 2, "pcs"),
    rate("6d-i", "Sec. 6.d.i", "Water meters, 12 to 25 mm", 8, "pcs"),
    rate("6d-ii", "Sec. 6.d.ii", "Water meters, above 25 mm", 10, "pcs"),
    excess("6e", "Sec. 6.e", "Septic tank, up to 5 cu. m of digestion chamber", "cu. m", 24, 5, 7),
];

export const ELECTRONICS = [
    rate("7a", "Sec. 7.a", "Switching / PABX / communication systems", 2.4, "ports"),
    rate("7b", "Sec. 7.b", "Broadcast, cell sites, call and control centers", 1000, "locations"),
    rate("7c", "Sec. 7.c", "ATMs, vending, copiers, x-ray, scanners and similar", 10, "units"),
    rate("7d", "Sec. 7.d", "Voice, data, computer and audio/video outlets", 2.4, "outlets"),
    rate("7e", "Sec. 7.e", "Security, alarms, fire alarm, CCTV, sound and building automation", 2.4, "terminations"),
    rate("7f", "Sec. 7.f", "Studios, auditoriums and theaters for broadcast or recording", 1000, "locations"),
    rate("7g", "Sec. 7.g", "Antenna towers / masts", 1000, "structures"),
    rate("7h", "Sec. 7.h", "Electronic signage and display systems", 50, "units"),
    rate("7i-i", "Sec. 7.i.i", "Poles (paid by pole owner)", 20, "poles"),
    rate("7i-ii", "Sec. 7.i.ii", "Pole attachments (paid by the entity attaching)", 20, "attachments"),
    rate("7j", "Sec. 7.j", "Other electronic devices", 50, "units"),
];

const ACCESSORIES = [
    manual("8a", "Sec. 8.a", "Parts open on two or more sides (balconies, terraces, lanais): 50% of the principal rate"),
    rate("8b", "Sec. 8.b", "Height above 8.00 m", 0.25, "cu. m above 8 m"),
    excess("8c", "Sec. 8.c", "Bank and records vaults, up to 20 cu. m", "cu. m", 20, 20, 8),
    rate("8d-i", "Sec. 8.d.i", "Swimming pool, Group A", 3, "cu. m", FRACTION),
    rate("8d-ii", "Sec. 8.d.ii", "Swimming pool, Groups B, E, F, G", 36, "cu. m", FRACTION),
    rate("8d-iii", "Sec. 8.d.iii", "Swimming pool, Groups C, D, H, I", 24, "cu. m", FRACTION),
    manual("8d-iv", "Sec. 8.d.iv", "Swimming pool of indigenous materials: 50% of the above rates"),
    rate("8d-va", "Sec. 8.d.v.a", "Pool shower / locker rooms, Group A", 6, "units", FRACTION),
    rate("8d-vb", "Sec. 8.d.v.b", "Pool shower / locker rooms, Groups B, E, F, G", 18, "units", FRACTION),
    rate("8d-vc", "Sec. 8.d.v.c", "Pool shower / locker rooms, Groups C, D, H", 12, "units", FRACTION),
    rate("8e", "Sec. 8.e", "Firewalls separate from the building (minimum ₱48)", 3, "sq. m", { fraction: true, minimum: 48 }),
    flat("8f-i-self", "Sec. 8.f.i", "Tower, single detached dwelling, self-supporting", 500),
    flat("8f-i-guyed", "Sec. 8.f.i", "Tower, single detached dwelling, trilon (guyed)", 150),
    excess("8f-ii-self", "Sec. 8.f.ii", "Tower, Groups B, E, F, G, self-supporting, up to 10 m", "m", 2400, 10, 120),
    excess("8f-ii-guyed", "Sec. 8.f.ii", "Tower, Groups B, E, F, G, trilon (guyed), up to 10 m", "m", 240, 10, 12),
    excess("8f-iii-self", "Sec. 8.f.iii", "Tower, Groups C, D, H, I, self-supporting, up to 10 m", "m", 1800, 10, 120),
    excess("8f-iii-guyed", "Sec. 8.f.iii", "Tower, Groups C, D, H, I, trilon (guyed), up to 10 m", "m", 120, 10, 12),
    excess("8g", "Sec. 8.g", "Storage silos, up to 10 m", "m", 2400, 10, 150),
    excess("8h-i", "Sec. 8.h.i", "Smokestacks, up to 10 m", "m", 240, 10, 12),
    excess("8h-ii", "Sec. 8.h.ii", "Chimneys, up to 10 m", "m", 48, 10, 2),
    rate("8i", "Sec. 8.i", "Commercial / industrial fixed ovens", 48, "sq. m", FRACTION),
    rate("8j", "Sec. 8.j", "Industrial kiln / furnace", 12, "cu. m", FRACTION),
    excess("8k", "Sec. 8.k", "Tanks, Groups A and B, up to 2 cu. m", "cu. m", 12, 2, 12),
    excess("8k-ii", "Sec. 8.k.ii", "Tanks, other Groups, up to 10 cu. m", "cu. m", 480, 10, 24),
    rate("8l", "Sec. 8.l", "Water and waste water treatment tanks", 7, "cu. m"),
    excess("8m-i", "Sec. 8.m.i", "Commercial / industrial tanks, above ground, up to 10 cu. m", "cu. m", 480, 10, 24),
    excess("8m-ii", "Sec. 8.m.ii", "Commercial / industrial tanks, underground, up to 20 cu. m", "cu. m", 540, 20, 24),
    rate("8n-i", "Sec. 8.n.i", "Steel tank pull-out, underground, per cu. m of excavation", 3, "cu. m", FRACTION),
    rate("8n-ii", "Sec. 8.n.ii", "Steel tank reinstallation, saddle or trestle mounted", 3, "cu. m", FRACTION),
    rate("8o-i", "Sec. 8.o.i", "Booths, kiosks, platforms, stages, permanent", 10, "sq. m", FRACTION),
    rate("8o-ii", "Sec. 8.o.ii", "Booths, kiosks, platforms, stages, temporary", 5, "sq. m", FRACTION),
    rate("8o-iii", "Sec. 8.o.iii", "Inspection of knock-down temporary type", 24, "units"),
    rate("8p-i", "Sec. 8.p.i", "Tombs", 5, "sq. m"),
    rate("8p-ii", "Sec. 8.p.ii", "Semi-enclosed mausoleums", 5, "sq. m"),
    rate("8p-iii", "Sec. 8.p.iii", "Totally enclosed mausoleums", 12, "sq. m"),
    rate("8p-iv", "Sec. 8.p.iv", "Multi-level interment niches, per sq. m per level", 5, "sq. m"),
    rate("8p-v", "Sec. 8.p.v", "Columbarium", 18, "sq. m"),
];

const signRenewal = (id, label, amount, minimum) =>
    rate(id, "Sec. 9.h.iii", `Sign annual renewal, ${label}`, amount, "sq. m", { fraction: true, minimum });

export const ACCESSORY_FEES = [
    excess("9a", "Sec. 9.a", "Line and grade, first 10 m", "m", 24, 10, 2.4, { category: C.LINE_AND_GRADE }),
    flat("9b-a", "Sec. 9.b.i.a", "Excavation: inspection and verification", 200, { category: C.EXCAVATION }),
    rate("9b-b", "Sec. 9.b.i.b", "Excavation, per cu. m", 3, "cu. m", { category: C.EXCAVATION }),
    flat("9b-c", "Sec. 9.b.i.c", "Issuance of ground preparation and excavation permit", 50, { category: C.EXCAVATION }),
    rate("9b-d", "Sec. 9.b.i.d", "Excavation for foundation with basement", 4, "cu. m", { category: C.EXCAVATION }),
    rate("9b-e", "Sec. 9.b.i.e", "Excavation other than foundation or basement", 3, "cu. m", { category: C.EXCAVATION }),
    rate("9b-f", "Sec. 9.b.i.f", "Footing encroachment on public areas", 250, "sq. m", { fraction: true, category: C.EXCAVATION }),
    rate("9c-i", "Sec. 9.c.i", "Fence of masonry, metal or concrete, up to 1.80 m high", 3, "m", { fraction: true, category: C.FENCING }),
    rate("9c-ii", "Sec. 9.c.ii", "Fence in excess of 1.80 m high", 4, "m", { fraction: true, category: C.FENCING }),
    rate("9c-iii", "Sec. 9.c.iii", "Fence of indigenous materials or wire", 2.4, "m", { category: C.FENCING }),
    excess("9d", "Sec. 9.d-e", "Pavements, up to 20 sq. m", "sq. m", 24, 20, 3),
    excess("9f", "Sec. 9.f", "Use of streets and sidewalks, up to 20 sq. m, per month", "sq. m", 240, 20, 12, { perUnit: true, unitsLabel: "months" }),
    excess("9g", "Sec. 9.g", "Scaffoldings on public areas, up to 10 m, per month", "m", 150, 10, 12, { perUnit: true, unitsLabel: "months" }),
    excess("9h-i", "Sec. 9.h.i", "Sign erection and anchorage, up to 4 sq. m", "sq. m", 120, 4, 24),
    rate("9h-ii-nb", "Sec. 9.h.ii", "Sign installation, neon, business", 36, "sq. m", FRACTION),
    rate("9h-ii-na", "Sec. 9.h.ii", "Sign installation, neon, advertising", 52, "sq. m", FRACTION),
    rate("9h-ii-ib", "Sec. 9.h.ii", "Sign installation, illuminated, business", 24, "sq. m", FRACTION),
    rate("9h-ii-ia", "Sec. 9.h.ii", "Sign installation, illuminated, advertising", 36, "sq. m", FRACTION),
    rate("9h-ii-ob", "Sec. 9.h.ii", "Sign installation, others, business", 15, "sq. m", FRACTION),
    rate("9h-ii-oa", "Sec. 9.h.ii", "Sign installation, others, advertising", 24, "sq. m", FRACTION),
    rate("9h-ii-pb", "Sec. 9.h.ii", "Sign installation, painted-on, business", 9.6, "sq. m", FRACTION),
    rate("9h-ii-pa", "Sec. 9.h.ii", "Sign installation, painted-on, advertising", 18, "sq. m", FRACTION),
    signRenewal("9h-iii-nb", "neon, business", 36, 124),
    signRenewal("9h-iii-na", "neon, advertising", 46, 200),
    signRenewal("9h-iii-ib", "illuminated, business", 18, 72),
    signRenewal("9h-iii-ia", "illuminated, advertising", 38, 150),
    signRenewal("9h-iii-ob", "others, business", 12, 40),
    signRenewal("9h-iii-oa", "others, advertising", 20, 110),
    signRenewal("9h-iii-pb", "painted-on, business", 8, 30),
    signRenewal("9h-iii-pa", "painted-on, advertising", 12, 100),
    rate("9i-i", "Sec. 9.i.i", "Alteration / renovation, vertical dimensions (facades, walls)", 5, "sq. m"),
    rate("9i-ii", "Sec. 9.i.ii", "Alteration / renovation, horizontal dimensions (floors, ceilings, roofing)", 5, "sq. m"),
    rate("9i-iii", "Sec. 9.i.iii", "Repairs costing over ₱5,000: 1% of the itemized cost", 0.01, "pesos"),
    rate("9k-i", "Sec. 9.k.i", "Demolition of buildings", 3, "sq. m", { fraction: true, category: C.DEMOLITION }),
    rate("9k-ii", "Sec. 9.k.ii", "Demolition of building systems / frames, including fences", 4, "m", { category: C.DEMOLITION }),
    excess("9k-iii", "Sec. 9.k.iii", "Demolition of structures, up to 10 m high", "m", 800, 10, 50, { category: C.DEMOLITION }),
    excess("9k-iv", "Sec. 9.k.iv", "Demolition of appendages, up to 3 cu. m", "cu. m", 50, 3, 50, { category: C.DEMOLITION }),
    rate("9k-v", "Sec. 9.k.v", "Moving a building / structure", 3, "sq. m", { fraction: true, category: C.DEMOLITION }),
];

// Sec. 10: by cost; every million or portion above ₱1,200,000 adds the last fee again
const occupancyByCost = (id, ref, label, fees) =>
    bracketFee(id, ref, label, "pesos", [[150000, fees[0]], [400000, fees[1]], [850000, fees[2]], [1200000, fees[3]]], { per: 1000000, amount: fees[3] });

const JI_BRACKETS = [[20, 50], [500, 240], [1000, 360], [5000, 480], [10000, 1200], [Infinity, 2400]];

const OCCUPANCY = [
    occupancyByCost("10a", "Sec. 10.a", "Divisions A-1 and A-2, by cost", [100, 200, 400, 800]),
    occupancyByCost("10b", "Sec. 10.b", "Divisions B-1, E, F-1, G, H, I-1, by cost", [200, 400, 800, 1000]),
    occupancyByCost("10c", "Sec. 10.c", "Divisions C-1, C-2, D, by cost", [150, 250, 600, 900]),
    bracketFee("10d", "Sec. 10.d", "Division J-1, by floor area", "sq. m", JI_BRACKETS),
    manual("10e-i", "Sec. 10.e.i", "Garages, carports, balconies, terraces, lanais: 50% of the principal rate"),
    bracketFee("10e-ii", "Sec. 10.e.ii", "Aviaries, aquariums, zoo structures, by floor area", "sq. m", JI_BRACKETS),
    excess("10e-iii", "Sec. 10.e.iii", "Towers (radio, TV, cell site, sign, water tank), first 10 m", "m", 800, 10, 50),
    rate("10f", "Sec. 10.f", "Change in use / occupancy", 5, "sq. m", FRACTION),
];

const CERTIFICATIONS = [
    ["a", "Certified true copy of building permit"],
    ["b", "Certified true copy of Certificate of Use/Occupancy"],
    ["c", "Issuance of Certificate of Damage"],
    ["d", "Certified true copy of Certificate of Damage"],
    ["e", "Certified true copy of Electrical Certificate"],
    ["f", "Issuance of Certificate of Gas Meter Installation"],
    ["g", "Certified true copy of Certificate of Operation"],
    ["h", "Other certifications"],
].map(([n, label]) => flat(`12${n}`, `Sec. 12.${n}`, label, 50));

// A building is charged under one class only, so these are radio buttons. An
// appendage is charged on top of the floor area fee, so it stays a checkbox.
const ONE_CLASS = { group: "annual-building-class" };

const ANNUAL_BUILDING = [
    rate("11a", "Sec. 11.a.ii", "Divisions A-1, A-2, if the owner requests inspection, per service", 120, "services", ONE_CLASS),
    bracketFee("11b", "Sec. 11.b", "Divisions B-1, D, E, F-1, G, H, I-1, by floor area", "sq. m",
        [[100, 120], [200, 240], [350, 480], [500, 720], [750, 960], [1000, 1200]], { per: 1000, amount: 1200 }, ONE_CLASS),
    flat("11c-i", "Sec. 11.c.i", "First class cinematographs or theaters", 1200, ONE_CLASS),
    flat("11c-ii", "Sec. 11.c.ii", "Second class cinematographs or theaters", 720, ONE_CLASS),
    flat("11c-iii", "Sec. 11.c.iii", "Third class cinematographs or theaters", 520, ONE_CLASS),
    flat("11c-iv", "Sec. 11.c.iv", "Grandstands / bleachers, gymnasia and the like", 720, ONE_CLASS),
    excess("11b-app", "Sec. 11.b.i-ii", "Appendage, up to 3 sq. m per unit (added to the class above)", "sq. m", 150, 3, 50),
];

const TONS = [[100, 25], [150, 20], [300, 15], [500, 10], [Infinity, 5]];

export const ANNUAL_MECHANICAL = [
    cumulative("11f-i", "Sec. 11.f.i", "Refrigeration and ice plant", "tons", TONS, FRACTION),
    rate("11f-ii", "Sec. 11.f.ii", "Window type air conditioners", 40, "units"),
    cumulative("11f-iii", "Sec. 11.f.iii", "Packaged or centralized air conditioning", "tons", TONS, FRACTION),
    {
        ...stepped("11f-iv", "Sec. 11.f.iv", "Mechanical ventilation, kW per unit", "kW", [{ over: 0, base: 10, rate: 0 }, { over: 1, base: 50, rate: 0 }, { over: 7.5, base: 50, rate: 20 }], { ...PER_UNIT, fraction: true }),
    },
    rate("11f-va", "Sec. 11.f.v.a", "Escalators and moving walks", 120, "units"),
    rate("11f-vb", "Sec. 11.f.v.b", "Funiculars", 50, "kW", FRACTION),
    rate("11f-vc", "Sec. 11.f.v.c", "Funiculars, per lineal meter of travel", 10, "m", FRACTION),
    rate("11f-vd", "Sec. 11.f.v.d", "Cable car", 25, "kW", FRACTION),
    rate("11f-ve", "Sec. 11.f.v.e", "Cable car, per lineal meter of travel", 2, "m"),
    rate("11f-via", "Sec. 11.f.vi.a", "Passenger elevators", 500, "units"),
    rate("11f-vib", "Sec. 11.f.vi.b", "Freight elevators", 400, "units"),
    rate("11f-vic", "Sec. 11.f.vi.c", "Motor driven dumbwaiters", 50, "units"),
    rate("11f-vid", "Sec. 11.f.vi.d", "Construction elevators for materials", 400, "units"),
    rate("11f-vie", "Sec. 11.f.vi.e", "Car elevators", 500, "units"),
    rate("11f-vif", "Sec. 11.f.vi.f", "Every landing above the first five", 50, "landings"),
    bracketFee("11f-vii", "Sec. 11.f.vii", "Boilers, kW per unit", "kW", [[7.5, 400], [22, 550], [37, 600], [52, 650], [67, 800], [74, 900]], { per: 1, amount: 4 }, PER_UNIT),
    rate("11f-viii", "Sec. 11.f.viii", "Pressurized water heaters", 120, "units"),
    rate("11f-ix", "Sec. 11.f.ix", "Automatic fire extinguishers, per sprinkler head", 2, "heads"),
    bracketFee("11f-x", "Sec. 11.f.x", "Water, sump and sewage pumps, kW per unit", "kW", [[5, 55], [10, 90]], { per: 1, amount: 2 }, PER_UNIT),
    cumulative("11f-xi", "Sec. 11.f.xi", "Generating units", "kW", [[50, 15], [100, 10], [Infinity, 2.4]], FRACTION),
    rate("11f-xii", "Sec. 11.f.xii", "Compressed air, vacuum and gases", 10, "outlets"),
    rate("11f-xiii", "Sec. 11.f.xiii", "Power piping, per lineal or cu. meter, whichever is higher", 2, "m", FRACTION),
    excess("11f-xiv", "Sec. 11.f.xiv", "Cranes, forklifts, loaders, mixers, compressors, kW per unit, up to 10 kW", "kW", 100, 10, 3, PER_UNIT),
    bracketFee("11f-xv", "Sec. 11.f.xv", "Other machinery / equipment, kW per unit", "kW", [[0.5, 8], [1, 23], [3, 39], [5, 55], [10, 80]], { per: 1, amount: 4 }, PER_UNIT),
    rate("11f-xvi", "Sec. 11.f.xvi", "Pressure vessels", 40, "cu. m", FRACTION),
    rate("11f-xvii", "Sec. 11.f.xvii", "Pneumatic tubes, conveyors, monorails", 2.4, "m", FRACTION),
    rate("11f-xviii", "Sec. 11.f.xviii", "Weighing scale structure", 30, "tons", FRACTION),
    rate("11f-xix", "Sec. 11.f.xix", "Testing / calibration of pressure gauge", 24, "units"),
    rate("11f-xixa", "Sec. 11.f.xix.a", "Gas meters, tested, proved and sealed", 30, "units"),
    rate("11f-xx", "Sec. 11.f.xx", "Mechanical rides in amusement centers or fairs", 30, "units"),
];

const ELECTRICAL_INSPECTION = {
    id: "11e-i",
    ref: "Sec. 11.e.i",
    label: "One-time electrical inspection fee: 10% of the electrical fees above",
    kind: "percentOf",
    percentOf: "electrical",
    percent: 0.1,
    category: C.INSPECTION,
};

const section = (id, title, category, items, open = false) => ({ id, title, category, items, open });

// Which sections apply to each assessment type
export const CHECKLISTS = {
    business: [
        { ...section("annual-building", "Building (Sec. 11.a-c)", C.BUILDING, ANNUAL_BUILDING, true), note: "Choose one class. Click it again to clear." },
        section("annual-plumbing", "Plumbing (Sec. 11.d)", C.PLUMBING, [
            rate("11d", "Sec. 11.d", "Annual plumbing inspection", 60, "plumbing units"),
        ], true),
        section("electrical", "Electrical (Sec. 11.e.ii, same as Sec. 4)", C.ELECTRICAL, ELECTRICAL, true),
        section("annual-mechanical", "Mechanical (Sec. 11.f)", C.MECHANICAL, ANNUAL_MECHANICAL),
        section("electronics", "Electronics (Sec. 11.g, same as Sec. 7)", C.ELECTRONICS, ELECTRONICS),
        section("signs", "Signs, annual renewal (Sec. 9.h.iii)", C.OTHERS, ACCESSORY_FEES.filter(({ ref }) => ref === "Sec. 9.h.iii")),
        section("certifications", "Certifications (Sec. 12)", C.CERTIFICATION, CERTIFICATIONS),
    ],
    building: [
        section("building", "Building fees (Sec. 3)", C.BUILDING, BUILDING_FEES, true),
        section("accessories", "Accessories of the building / structure (Sec. 8)", C.OTHERS, ACCESSORIES),
        section("accessory-fees", "Accessory fees: line and grade, excavation, fencing, signs, repairs, demolition (Sec. 9)", C.OTHERS, ACCESSORY_FEES),
        section("electrical", "Electrical (Sec. 4)", C.ELECTRICAL, [...ELECTRICAL, ELECTRICAL_INSPECTION]),
        section("mechanical", "Mechanical (Sec. 5)", C.MECHANICAL, MECHANICAL),
        section("plumbing", "Plumbing (Sec. 6)", C.PLUMBING, PLUMBING),
        section("electronics", "Electronics (Sec. 7)", C.ELECTRONICS, ELECTRONICS),
        section("occupancy", "Certificate of use / occupancy (Sec. 10)", C.CERTIFICATION, OCCUPANCY),
        section("certifications", "Certifications (Sec. 12)", C.CERTIFICATION, CERTIFICATIONS),
    ],
    cfei: [
        section("electrical", "Electrical (Sec. 4)", C.ELECTRICAL, [...ELECTRICAL, ELECTRICAL_INSPECTION], true),
        section("certifications", "Certifications (Sec. 12)", C.CERTIFICATION, CERTIFICATIONS),
    ],
};

// Starting values when a connected load is given as kW or breaker size. Breaker sizes
// convert at a fixed voltage, saved with each line so a later change can't alter it.
export const LOAD_DEFAULTS = {
    kW: { powerFactor: 0.8 },
    AT: { phase: 1, volts: 230 },
};

// Connected load entered as kW or breaker size. Returns "" until every value it needs
// is filled in, so nothing is charged on a guess.
export const toKva = ({ from, value, powerFactor, volts, phase }) => {
    const amount = Number(value);
    if (!(amount > 0)) return "";
    if (from === "kW") {
        const factor = Number(powerFactor);
        return factor > 0 && factor <= 1 ? round2(amount / factor) : "";
    }
    if (from === "AT") {
        const voltage = Number(volts);
        if (!(voltage > 0) || !["1", "3"].includes(String(phase))) return "";
        return round2(((String(phase) === "3" ? 1.732 : 1) * voltage * amount) / 1000);
    }
    return "";
};

export const conversionText = ({ from, value, powerFactor, volts, phase }, kva) =>
    from === "kW"
        ? `${value} kW ÷ ${powerFactor} power factor = ${kva} kVA`
        : `${value} AT breaker, ${Number(phase) === 3 ? "3 phase" : "single phase"}, ${volts} V = ${kva} kVA`;

// Inspection.machineries: these items are charged on a plain count, kept in quantity.
// The rest are charged on a size, kept in capacity; for per-unit items, quantity says
// how many units have that size.
// The inspector enters one storey's floor area; the office multiplies it by the storeys.
export const totalFloorArea = ({ area, numOfStorey }) =>
    round2((Number(area) || 0) * Math.max(Number(numOfStorey) || 1, 1));

// A generator is charged by its kVA under Sec. 4.b, so the Inspect form records it with
// the electrical load and doesn't offer Sec. 11.f.xi as well.
export const SIGN_RENEWALS = ACCESSORY_FEES.filter(({ ref }) => ref === "Sec. 9.h.iii");
export const INSPECTION_MECHANICAL = ANNUAL_MECHANICAL.filter(({ id }) => id !== "11f-xi");
const COUNT_UNITS = ["units", "landings", "heads", "outlets"];
export const isCounted = (item) => COUNT_UNITS.includes(item.unit);
export const machineValue = (item, { capacity, quantity }) => (isCounted(item) ? quantity : capacity);
export const machineSize = (item, machine) => {
    const value = machineValue(item, machine);
    return value ? `${value} ${item.unit}` : "";
};

export const needsQuantity = (item) => item.kind !== "flat" && item.kind !== "percentOf";

const roundUp = (item, quantity) => (item.fraction ? Math.ceil(quantity) : quantity);

const sliced = (brackets, quantity) => {
    let fee = 0;
    let lower = 0;
    for (const [upTo, sliceRate] of brackets) {
        if (quantity <= lower) break;
        fee += (Math.min(quantity, upTo) - lower) * sliceRate;
        lower = upTo;
    }
    return fee;
};

// The fee for one item. Quantities at or below 0 cost nothing, except flat items.
export const itemAmount = (item, rawQuantity, units = 1) => {
    if (item.kind === "flat") return item.amount;
    const quantity = Number(rawQuantity);
    if (!(quantity > 0)) return 0;
    const unitCount = item.perUnit ? Number(units) || 0 : 1;
    // A stepped item picks its bracket from the exact quantity; only the part above
    // the bracket rounds up
    const q = item.kind === "stepped" ? quantity : roundUp(item, quantity);
    let fee;
    switch (item.kind) {
        case "rate":
            fee = q * item.rate;
            if (item.minimum) fee = Math.max(fee, item.minimum);
            break;
        case "excess":
            fee = item.base + Math.max(0, q - item.upTo) * item.over;
            break;
        case "bracketRate":
            fee = q * item.brackets.find(([upTo]) => q <= upTo)[1];
            break;
        case "cumulative":
            fee = sliced(item.brackets, q);
            break;
        case "bracketFee": {
            const bracket = item.brackets.find(([upTo]) => q <= upTo);
            if (bracket) {
                fee = bracket[1];
            } else {
                const [lastUpTo, lastFee] = item.brackets[item.brackets.length - 1];
                fee = lastFee + Math.ceil((q - lastUpTo) / item.over.per) * item.over.amount;
            }
            break;
        }
        case "stepped": {
            const step = [...item.steps].reverse().find((s) => q > s.over) || item.steps[0];
            fee = step.base + step.rate * roundUp(item, q - step.over);
            break;
        }
        case "manual":
            fee = q;
            break;
        default:
            fee = 0;
    }
    return round2(fee * unitCount);
};

const describe = (item, pick) => {
    if (!needsQuantity(item) || item.kind === "manual") return item.label;
    if (pick.conversion) return `${item.label}, ${conversionText(pick.conversion, pick.quantity)}`;
    const units = item.perUnit ? ` × ${pick.units || 1} ${item.unitsLabel || "units"}` : "";
    return `${item.label}, ${pick.quantity} ${item.unit}${units}`;
};

// Turns ticked items into Assessment.fees lines. picks is { itemId: { quantity, units } }.
export const checklistFees = (sections, picks) => {
    const fees = [];
    for (const { id: sectionId, category, items } of sections) {
        const sectionFees = [];
        for (const item of items) {
            const pick = picks[item.id];
            if (!pick || item.kind === "percentOf") continue;
            const amount = itemAmount(item, pick.quantity, pick.units || 1);
            if (needsQuantity(item) && amount <= 0) continue;
            sectionFees.push({
                itemId: item.id,
                category: item.category || category,
                reference: item.ref,
                description: describe(item, pick),
                basis: needsQuantity(item) ? Number(pick.quantity) : 1,
                ...(item.perUnit && { itemUnits: Number(pick.units) || 1 }),
                ...(pick.conversion && { conversion: pick.conversion }),
                ...(item.kind === "rate" && { rate: item.rate }),
                amount,
            });
        }
        fees.push(...sectionFees);
        for (const item of items) {
            if (item.kind !== "percentOf" || !picks[item.id] || sectionId !== item.percentOf) continue;
            const base = sectionFees.reduce((sum, fee) => sum + fee.amount, 0);
            if (base > 0) {
                fees.push({
                    itemId: item.id,
                    category: item.category || category,
                    reference: item.ref,
                    description: item.label,
                    basis: round2(base),
                    rate: item.percent,
                    amount: round2(base * item.percent),
                });
            }
        }
    }
    return fees;
};
