// What each occupancy division covers, summarized from the Revised IRR of the
// National Building Code (PD 1096), Rule VII: Section 701 and Table VII.1.
// `short` labels the dropdown; `full` is the hint under it.
export const DIVISION_HINTS = {
    "A-1": {
        short: "Single-family dwellings",
        full: "Exclusive use of single-family occupants: single-detached and indigenous family dwellings, staff housing, churches and rectories, community facilities, parks, and non-profit membership clubhouses.",
    },
    "A-2": {
        short: "Non-leasing residential, up to 10 persons",
        full: "Non-leasing occupants, up to 10 persons: privately owned single-attached, duplex or townhouses; on-campus dormitories, convents, barracks; schools up to 16 classrooms; clinics and laboratories; branch libraries and museums.",
    },
    "B-1": {
        short: "Hotels, apartments, boarding houses",
        full: "Multiple dwelling units for more than 10 persons: boarding or lodging houses, hotels, apartment buildings, row houses, convents and monasteries.",
    },
    "C-1": {
        short: "Schools, civic centers, churches",
        full: "Schools, colleges and training centers; libraries, museums and exhibition halls; civic and community centers, clubhouses; churches and other places of worship; government buildings.",
    },
    "C-2": {
        short: "Amusement, sports, health studios",
        full: "Amusement halls and parlors; massage and sauna parlors; health studios; billiard halls, bowling alleys, golf clubhouses; dancing schools; gymnasia, pelota courts and sports complexes.",
    },
    "D-1": {
        short: "Jails, mental hospitals",
        full: "Mental hospitals and sanitaria, jails, prisons, reformatories, and buildings where inmates' personal liberties are similarly restrained.",
    },
    "D-2": {
        short: "Hospitals, nursing homes (non-ambulatory)",
        full: "Each for more than 5 persons: hospitals, sanitaria, nursing homes with non-ambulatory patients, and full-time nurseries for children under kindergarten age.",
    },
    "D-3": {
        short: "Nursing homes (ambulatory), children's homes",
        full: "Each for more than 5 persons: nursing homes for ambulatory patients, and homes for children of kindergarten age or over. Not buildings used only as private or family dwellings.",
    },
    "E-1": {
        short: "Gas stations, storage garages",
        full: "Gasoline filling and service stations, storage garages and boat storage, where work is limited to exchanging parts and maintenance with no open flame, welding or highly flammable liquids.",
    },
    "E-2": {
        short: "Stores, offices, dining under 100",
        full: "Wholesale and retail stores, offices, drinking and dining places with under 100 occupants, printing plants, police and fire stations, workshops without highly flammable materials, paint stores without bulk handling.",
    },
    "E-3": {
        short: "Hangars, open parking garages",
        full: "Aircraft hangars and open parking garages, where work is limited to exchanging parts and maintenance with no open flame, welding or highly flammable liquids.",
    },
    "F-1": {
        short: "Plants, factories, non-combustible storage",
        full: "Ice plants, power and pumping plants, cold storage, creameries; factories, workshops, storage and sales rooms using incombustible and non-explosive materials.",
    },
    "G-1": {
        short: "Hazardous material storage",
        full: "Storage and handling of hazardous and highly flammable materials.",
    },
    "G-2": {
        short: "Flammable storage, dry cleaning, paint shops",
        full: "Storage and handling of flammable materials; dry cleaning plants using flammable liquids; paint stores with bulk handling, paint shops and spray painting rooms.",
    },
    "G-3": {
        short: "Woodworking, combustible warehouses",
        full: "Woodworking establishments, planing mills, box factories; factories generating loose combustible fibers or dust; warehouses storing highly combustible materials.",
    },
    "G-4": {
        short: "Repair garages",
        full: "Repair garages.",
    },
    "G-5": {
        short: "Aircraft repair hangars",
        full: "Aircraft repair hangars.",
    },
    "H-1": {
        short: "Assembly with stage, under 1,000",
        full: "Assembly building with a stage and an occupant load of less than 1,000, such as theaters and auditoriums.",
    },
    "H-2": {
        short: "Assembly, no stage, 300 or more",
        full: "Assembly building without a stage and an occupant load of 300 or more, such as dance halls, cabarets and ballrooms.",
    },
    "H-3": {
        short: "Assembly, no stage, under 300",
        full: "Assembly building without a stage and an occupant load of less than 300.",
    },
    "H-4": {
        short: "Stadia, reviewing stands, amusement parks",
        full: "Stadia, reviewing stands and amusement park structures not included in Group I or Divisions H-1 to H-3.",
    },
    "I-1": {
        short: "Assembly with stage, 1,000 or more",
        full: "Assembly building with a stage and an occupant load of 1,000 or more, such as convention centers.",
    },
    "J-1": {
        short: "Agricultural structures",
        full: "Agricultural structures.",
    },
    "J-2": {
        short: "Garages, carports, fences, tanks, pools",
        full: "Private garages, carports, fences over 1.80 meters high, tanks, swimming pools and towers.",
    },
    "J-3": {
        short: "Stages, courts, tombs, vaults",
        full: "Stages, platforms; pelota, tennis, badminton or basketball courts; tombs, mausoleums, niches; aviaries, aquariums, zoo structures; banks and record vaults.",
    },
};

export const DIVISION_HINT_DEFAULT =
    "Pick the division matching the building's use. If none fits, use the one it most nearly resembles in life and fire hazard (NBC Sec. 701).";
