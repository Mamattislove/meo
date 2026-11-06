// User.role
export const USER_ROLES = {
    ADMIN: "admin",
    USER: "user",
};

// AnnualInspection.businessType
export const BUSINESS_TYPES = {
    NEW: "new",
    RENEWAL: "renewal",
};

// AnnualInspection.status: the steps of an AIF application
export const ANNUAL_INSPECTION_STATUSES = {
    FOR_INSPECTION: "for inspection",
    INSPECTED: "inspected",
    ASSESSED: "assessed",
    PAID: "paid",
};

// Inspection.status
export const INSPECTION_STATUSES = {
    PENDING: "pending",
    INSPECTED: "inspected",
    CANCELLED: "cancelled",
};

export const BUSINESS_ACTIVITIES = {
    // Medical and Health Services
    MEDICAL_CLINIC: "medical clinic",
    DENTAL_CLINIC: "dental clinic",
    DIAGNOSTIC_CLINIC: "diagnostic clinic",
    PHARMACY: "pharmacy / drugstore",
    OPTICAL_CLINIC: "optical clinic",
    VETERINARY_CLINIC: "veterinary clinic",

    // Residential and Property Rental
    APARTMENT: "apartment",
    BOARDING_HOUSE: "boarding house",
    DORMITORY: "dormitory",
    CONDOMINIUM_RENTAL: "condominium rental",
    COMMERCIAL_BUILDING_LESSOR: "commercial building lessor",
    WAREHOUSE_RENTAL: "warehouse rental",
    SUBDIVISION_DEVELOPER: "subdivision developer / operator",

    // Food and Beverage
    RESTAURANT: "restaurant",
    CARINDERIA: "carinderia / eatery",
    BAKERY: "bakery",
    COFFEE_SHOP: "coffee shop",
    MILK_TEA_SHOP: "milk tea shop",
    CATERING_SERVICES: "catering services",
    CANTEEN: "canteen",
    FAST_FOOD_ESTABLISHMENT: "fast-food establishment",

    // Retail and Commercial Establishments
    SARI_SARI_STORE: "sari-sari store",
    GROCERY_STORE: "grocery store",
    GENERAL_MERCHANDISE: "general merchandise",
    HARDWARE_STORE: "hardware store",
    MEDICAL_SUPPLY_STORE: "medical supply store",
    CLOTHING_STORE: "clothing store",
    APPLIANCE_STORE: "appliance store",
    FURNITURE_STORE: "furniture store",
    CONSTRUCTION_SUPPLY_STORE: "construction supply store",

    // Personal Care and Services
    BARBER_SHOP: "barber shop",
    BEAUTY_SALON: "beauty salon",
    NAIL_SALON: "nail salon",
    SPA: "spa / massage clinic",
    LAUNDRY_SHOP: "laundry shop",
    FUNERAL_PARLOR: "funeral parlor",

    // Automotive and Transportation
    AUTOMOTIVE_REPAIR_SHOP: "automotive repair shop",
    MOTORCYCLE_REPAIR_SHOP: "motorcycle repair shop",
    CAR_WASH: "car wash",
    GASOLINE_STATION: "gasoline station",
    TRUCKING_SERVICES: "trucking services",
    PARKING_LOT_OPERATOR: "parking lot operator",

    // Industrial and Manufacturing
    MANUFACTURING_PLANT: "manufacturing plant",
    METAL_FABRICATION_SHOP: "metal fabrication shop",
    FURNITURE_MANUFACTURING: "furniture manufacturing",
    GARMENT_MANUFACTURING: "garment manufacturing",
    CONCRETE_PRODUCTS_MANUFACTURING: "concrete products manufacturing",
    FOOD_MANUFACTURING: "food manufacturing",
    PRINTING_PRESS: "printing press",
    WAREHOUSE: "warehouse / storage facility",

    // Construction and Engineering Services
    GENERAL_ENGINEERING_CONTRACTOR: "general engineering contractor",
    GENERAL_BUILDING_CONTRACTOR: "general building contractor",
    ELECTRICAL_CONTRACTOR: "electrical contractor",
    PLUMBING_CONTRACTOR: "plumbing contractor",
    ARCHITECTURAL_SERVICES: "architectural services",
    ENGINEERING_CONSULTANCY: "engineering consultancy",
    SURVEYING_SERVICES: "surveying services",
    CONSTRUCTION_EQUIPMENT_RENTAL: "construction equipment rental",

    // Education and Recreation
    TUTORIAL_CENTER: "tutorial center",
    REVIEW_CENTER: "review center",
    COMPUTER_TRAINING_CENTER: "computer training center",
    COMPUTER_SHOP: "computer shop / internet cafe",
    GYM: "gym / fitness center",
    SPORTS_FACILITY: "sports facility",
    EVENT_VENUE: "event venue / function hall",

    // Professional and Office Services
    LAW_OFFICE: "law office",
    ACCOUNTING_OFFICE: "accounting office",
    REAL_ESTATE_BROKERAGE: "real estate brokerage",
    INSURANCE_AGENCY: "insurance agency",
    TRAVEL_AGENCY: "travel agency",
    RECRUITMENT_AGENCY: "recruitment agency",
    IT_SERVICES: "IT services / software development",
    ADVERTISING_AGENCY: "advertising agency",
    PHOTOGRAPHY_STUDIO: "photography studio",
    INTERNET_SERVICE_PROVIDER: "internet service provider",

    // Hospitality and Tourism
    HOTEL: "hotel",
    MOTEL: "motel",
    RESORT: "resort",
    TRANSIENT_HOUSE: "transient house",
    BED_AND_BREAKFAST: "bed and breakfast",

    // Other Commercial Establishments
    WATER_REFILLING_STATION: "water refilling station",
    JUNK_SHOP: "junk shop",
    PET_SHOP: "pet shop",
    AGRICULTURAL_SUPPLY_STORE: "agricultural supply store",
    LPG_DEALER: "LPG dealer",
    FUNERAL_SUPPLY_STORE: "funeral supply store",
    CAR_RENTAL: "car rental services",
    LENDING_COMPANY: "lending company",
    PAWNSHOP: "pawnshop",
    EVENT_ORGANIZER: "event organizer",
};

// The office's town, and its barangays. Both change for each LGU.
export const OFFICE_TOWN = "Balagtas";
export const BARANGAYS = {
    BOROL_1ST: "Borol 1st",
    BOROL_2ND: "Borol 2nd",
    DALIG: "Dalig",
    LONGOS: "Longos",
    PANGINAY: "Panginay",
    PULONG_GUBAT: "Pulong Gubat",
    SAN_JUAN: "San Juan",
    SANTOL: "Santol",
    WAWA: "Wawa",
};

// BuildingPermit.permitType
export const BUILDING_PERMIT_TYPES = {
    NEW: "new",
    RENEWAL: "renewal",
    AMENDATORY: "amendatory",
};

// BuildingPermit.scopeOfWork (National Building Code, PD 1096)
export const SCOPES_OF_WORK = {
    NEW_CONSTRUCTION: "new construction",
    ERECTION: "erection",
    ADDITION: "addition",
    ALTERATION: "alteration",
    RENOVATION: "renovation",
    CONVERSION: "conversion",
    REPAIR: "repair",
    MOVING: "moving",
    RAISING: "raising",
    DEMOLITION: "demolition",
    ACCESSORY_BUILDING: "accessory building / structure",
    OTHERS: "others",
};

// BuildingPermit.characterOfOccupancy (National Building Code, PD 1096)
export const CHARACTERS_OF_OCCUPANCY = {
    GROUP_A: "Group A - Residential (Dwellings)",
    GROUP_B: "Group B - Residential (Hotels, Apartments)",
    GROUP_C: "Group C - Education and Recreation",
    GROUP_D: "Group D - Institutional",
    GROUP_E: "Group E - Business and Mercantile",
    GROUP_F: "Group F - Industrial",
    GROUP_G: "Group G - Industrial (Storage and Hazardous)",
    GROUP_H: "Group H - Recreational (Assembly, less than 1,000)",
    GROUP_I: "Group I - Recreational (Assembly, 1,000 or more)",
    GROUP_J: "Group J - Agricultural and Accessory",
};

// BuildingPermit.lotOwnership
export const LOT_OWNERSHIPS = {
    OWNED: "owned",
    LEASED: "leased",
};

// ElectricalPermit.permitType
export const ELECTRICAL_PERMIT_TYPES = {
    NEW: "new",
    RENEWAL: "renewal",
    AMENDATORY: "amendatory",
};

// ElectricalPermit.scopeOfWork
export const ELECTRICAL_SCOPES_OF_WORK = {
    NEW_INSTALLATION: "new installation",
    ANNUAL_INSPECTION: "annual inspection",
    TEMPORARY_INSTALLATION: "temporary installation",
    RECONNECTION: "reconnection of service entrance",
    SEPARATION: "separation of service entrance",
    UPGRADING: "upgrading of service entrance",
    RELOCATION: "relocation of service entrance",
    OTHERS: "others",
};

// Inspection.inspectionType
export const INSPECTION_TYPES = {
    BUSINESS: "business",
    BUILDING: "building",
    CFEI: "cfei",
};

// Assessment.assessmentType
export const ASSESSMENT_TYPES = {
    BUSINESS: "business", // annual inspection fee, once per AIF logbook entry
    BUILDING: "building", // building permit fee, once per permit
    CFEI: "cfei", // electrical permit / CFEI fee, once per permit
};

// Assessment.fees[].category
export const FEE_CATEGORIES = {
    FILING: "filing fee",
    PROCESSING: "processing fee",
    BUILDING: "building / structural",
    ELECTRICAL: "electrical",
    MECHANICAL: "mechanical",
    PLUMBING: "plumbing / sanitary",
    ELECTRONICS: "electronics",
    LINE_AND_GRADE: "line and grade",
    FENCING: "fencing",
    EXCAVATION: "excavation",
    DEMOLITION: "demolition",
    INSPECTION: "inspection fee",
    CERTIFICATION: "certification fee",
    OTHERS: "others",
};

// Assessment.status
export const ASSESSMENT_STATUSES = {
    ASSESSED: "assessed",
    PAID: "paid",
    CANCELLED: "cancelled",
};

// Business/BuildingPermit.occupancyDivision (National Building Code, PD 1096).
// Fees in the NBC schedule of fees depend on the division, not just the group.
export const OCCUPANCY_DIVISIONS = {
    A_1: "A-1",
    A_2: "A-2",
    B_1: "B-1",
    C_1: "C-1",
    C_2: "C-2",
    D_1: "D-1",
    D_2: "D-2",
    D_3: "D-3",
    E_1: "E-1",
    E_2: "E-2",
    E_3: "E-3",
    F_1: "F-1",
    G_1: "G-1",
    G_2: "G-2",
    G_3: "G-3",
    G_4: "G-4",
    G_5: "G-5",
    H_1: "H-1",
    H_2: "H-2",
    H_3: "H-3",
    H_4: "H-4",
    I_1: "I-1",
    J_1: "J-1",
    J_2: "J-2",
    J_3: "J-3",
};

