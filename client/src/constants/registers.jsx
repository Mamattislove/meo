// What each register shows: its list columns, filters, and form boxes. The same
// boxes drive both the entry form and the record page, so the two always match.
import {
    ANNUAL_INSPECTION_STATUSES,
    ASSESSMENT_STATUSES,
    ASSESSMENT_TYPES,
    BARANGAYS,
    BUILDING_PERMIT_TYPES,
    BUSINESS_ACTIVITIES,
    BUSINESS_TYPES,
    CHARACTERS_OF_OCCUPANCY,
    ELECTRICAL_PERMIT_TYPES,
    ELECTRICAL_SCOPES_OF_WORK,
    INSPECTION_STATUSES,
    INSPECTION_TYPES,
    LOT_OWNERSHIPS,
    OCCUPANCY_DIVISIONS,
    SCOPES_OF_WORK,
} from "../../../utils/constants.js";
import { BusinessFields } from "../components";
import { DIVISION_HINT_DEFAULT, DIVISION_HINTS } from "./occupancyDivisions";
import { Status } from "../components";
import { formatDate, formatPeso, formatTime, inspectionName, recordName, sentence } from "../../utils/format";

const text = (name, label, span = 2, extra) => ({ name, label, span, type: "text", ...extra });
const number = (name, label, span = 2, extra) => ({ name, label, span, type: "number", ...extra });
const date = (name, label, span = 2, extra) => ({ name, label, span, type: "date", ...extra });
const choice = (name, label, constants, span = 2, extra) => ({
    name,
    label,
    span,
    type: "select",
    options: Object.values(constants),
    ...extra,
});

const filter = (name, label, constants, extra) => ({ name, label, options: Object.values(constants), ...extra });

const serialColumn = {
    label: "Serial",
    render: (record) => <span className="serial">{record.serialNumber}</span>,
};

const inspectionColumns = [
    {
        label: "When",
        nowrap: true,
        render: (row) =>
            (row.status === "inspected" && formatDate(row.dateOfInspection)) ||
            [formatDate(row.preferredDate), formatTime(row.preferredTime)].filter(Boolean).join(", ") ||
            "No preferred date",
    },
    {
        label: "Record",
        render: (row) => (
            <>
                <span className="serial mr-2 text-ink-2">{row.record?.serialNumber}</span>
                {inspectionName(row)}
            </>
        ),
    },
    { label: "Requested by", render: (row) => row.requestedBy, hideOnPhone: true },
    {
        label: "Type",
        render: (row) => (row.inspectionType === "cfei" ? "CFEI" : sentence(row.inspectionType)),
        hideOnPhone: true,
    },
    { label: "Status", render: (row) => <Status value={row.status} /> },
    { label: "Inspector", render: (row) => row.inspectedBy?.username, hideOnPhone: true },
];

const assessmentColumns = [
    { label: "Assessed", nowrap: true, render: (row) => formatDate(row.dateAssessed) },
    {
        label: "Record",
        render: (row) => (
            <>
                <span className="serial mr-2 text-ink-2">{row.record?.serialNumber}</span>
                {recordName(row.record)}
            </>
        ),
    },
    { label: "O.R. no.", render: (row) => <span className="serial">{row.orNumber}</span>, hideOnPhone: true },
    { label: "Status", render: (row) => <Status value={row.status} /> },
    { label: "Total", numeric: true, render: (row) => formatPeso(row.totalAmount) },
];

// Which screens an inspection or assessment links to, by its type
export const RECORD_TYPES = {
    business: { label: "Annual inspection (AIF)", api: "/annual-inspections", plural: "annualInspections", path: "aif-applications" },
    building: { label: "Building permit", api: "/building-permits", plural: "buildingPermits", path: "building-permits" },
    cfei: { label: "Electrical permit / CFEI", api: "/electrical-permits", plural: "electricalPermits", path: "electrical-permits" },
};

const inspectionsOf = (type, id) => ({
    title: "Inspections",
    api: "/inspections",
    plural: "inspections",
    path: "inspections",
    params: { record: id },
    columns: inspectionColumns.filter(({ label }) => !["Type", "Record", "Requested by"].includes(label)),
    newLabel: "Request inspection",
    newLink: `/dashboard/inspections/new?type=${type}&record=${id}`,
    // A record waits on one inspection at a time
    canAdd: (rows) => !rows.some(({ status }) => status === "pending"),
});

const assessmentsOf = (type, id) => ({
    title: "Fee assessment",
    api: "/assessments",
    plural: "assessments",
    path: "assessments",
    params: { record: id },
    columns: assessmentColumns.filter(({ label }) => label !== "Record"),
    newLabel: "Assess fees",
    // One active assessment per record; a cancelled one can be redone. An AIF
    // application on hold can't be assessed until it's resumed.
    canAdd: (rows, record) => !record.onHold && rows.every(({ status }) => status === "cancelled"),
    newLink: `/dashboard/assessments/new?type=${type}&record=${id}`,
});

const applicationStatus = (row) => <Status value={row.onHold ? "on hold" : row.status} />;

const coordinate = (name) => ({ name, label: "Location", span: 6, type: "coordinate" });

export const businesses = {
    title: "Businesses",
    singular: "business",
    plural: "businesses",
    api: "/businesses",
    path: "businesses",
    searchHint: "Business or owner",
    heading: (record) => record.businessName,
    columns: [
        { label: "Business", render: (row) => row.businessName },
        { label: "Owner", render: (row) => row.businessOwner, hideOnPhone: true },
        { label: "Contact no.", render: (row) => row.ownerContact, hideOnPhone: true },
        { label: "Barangay", render: (row) => row.barangay },
    ],
    filters: [filter("barangay", "Barangay", BARANGAYS)],
    boxes: [
        {
            title: "Business",
            fields: [
                text("businessName", "Business name", 4, { required: true }),
                choice("barangay", "Barangay", BARANGAYS, 2),
                coordinate("businessCoordinate"),
            ],
        },
        {
            title: "Owner",
            fields: [
                text("businessOwner", "Owner's name", 2),
                text("ownerAddress", "Address", 2),
                text("ownerContact", "Contact no.", 2),
            ],
        },
    ],
    related: (id) => [
        {
            title: "AIF applications",
            api: "/annual-inspections",
            plural: "annualInspections",
            path: "aif-applications",
            params: { business: id },
            columns: [
                { label: "Year", render: (row) => row.year },
                { label: "Status", render: applicationStatus },
                serialColumn,
                { label: "Received", render: (row) => formatDate(row.dateReceived) },
            ],
            newLabel: "New application",
            newLink: `/dashboard/aif-applications/new?business=${id}`,
        },
    ],
};

// The business part of an AIF application: its form and its page show these together
const AIF_BUSINESS_FIELDS = [
    text("businessOwner", "Owner's name", 2),
    text("ownerContact", "Contact no.", 2),
    choice("barangay", "Barangay", BARANGAYS, 2),
    choice("occupancyDivision", "Occupancy division", OCCUPANCY_DIVISIONS, 2, { hints: DIVISION_HINTS, defaultHint: DIVISION_HINT_DEFAULT }),
    choice("businessActivity", "Line of business", BUSINESS_ACTIVITIES, 2),
    text("lessorName", "Lessor", 2),
    coordinate("businessCoordinate"),
];

const AIF_APPLICATION_BOX = {
    title: "Application",
    fields: [
        number("year", "Year", 2, {
            required: true,
            lockedOnEdit: true,
            defaultValue: new Date().getFullYear(),
        }),
        choice("businessType", "Type", BUSINESS_TYPES, 2, { defaultValue: BUSINESS_TYPES.RENEWAL }),
        date("dateReceived", "Date reported", 2, { defaultValue: new Date().toISOString() }),
        {
            name: "receivedByName",
            label: "Received by",
            span: 2,
            type: "display",
            show: (record) => record.receivedBy?.username,
        },
        text("remarks", "Remarks", 6),
    ],
};

export const annualInspections = {
    title: "AIF applications",
    singular: "application",
    plural: "annualInspections",
    api: "/annual-inspections",
    listApi: "/annual-inspections/applications",
    path: "aif-applications",
    showsCaseStatus: true,
    searchHint: "Business name",
    heading: (record) => record.business?.businessName,
    columns: [
        { label: "Business", render: (row) => row.business?.businessName },
        { label: "Year", render: (row) => row.year },
        { label: "Status", render: applicationStatus },
        { label: "Div.", render: (row) => row.occupancyDivision, hideOnPhone: true },
        { label: "Received", nowrap: true, render: (row) => formatDate(row.dateReceived), hideOnPhone: true },
    ],
    filters: [
        {
            name: "status",
            label: "Status",
            options: Object.values(ANNUAL_INSPECTION_STATUSES).filter((status) => status !== ANNUAL_INSPECTION_STATUSES.PAID),
        },
        { name: "onHold", label: "On hold", options: ["true", "false"], optionLabels: { true: "On hold", false: "Not on hold" } },
        filter("businessType", "Type", BUSINESS_TYPES),
        filter("occupancyDivision", "Division", OCCUPANCY_DIVISIONS, { hints: DIVISION_HINTS }),
    ],
    formTop: BusinessFields,
    formTopFields: AIF_BUSINESS_FIELDS,
    formBoxes: [AIF_APPLICATION_BOX],
    boxes: [
        { title: "Business", fields: [text("businessName", "Business name", 6), ...AIF_BUSINESS_FIELDS] },
        AIF_APPLICATION_BOX,
    ],
    shownRecord: (record) => ({ ...record.business, ...record, business: record.business }),
    documents: [
        { name: "contractOfLease", label: "Contract of lease" },
        { name: "businessPermitOfLessor", label: "Business permit of lessor" },
        { name: "occupancyPermitOfLessor", label: "Occupancy permit of lessor" },
    ],
    related: (id) => [inspectionsOf("business", id), assessmentsOf("business", id)],
};

// The logbook lists paid applications; each row opens its application
export const aifLogbook = {
    title: "AIF logbook",
    singular: "entry",
    plural: "annualInspections",
    api: "/annual-inspections",
    listApi: "/annual-inspections/logbook",
    path: "annual-inspections",
    rowPath: "/dashboard/aif-applications",
    noNew: true,
    emptyText: "The logbook is empty. An application is entered here once it's paid.",
    searchHint: "Business name or serial",
    columns: [
        serialColumn,
        { label: "Year", render: (row) => row.year },
        { label: "Business", render: (row) => row.business?.businessName },
        { label: "O.R. no.", render: (row) => <span className="serial">{row.orNumber}</span> },
        { label: "Date paid", nowrap: true, render: (row) => formatDate(row.datePaid), hideOnPhone: true },
        {
            label: "Payment",
            render: (row) => <Status value={row.status === ANNUAL_INSPECTION_STATUSES.PAID ? "paid" : "payment cancelled"} />,
        },
    ],
    filters: [filter("businessType", "Type", BUSINESS_TYPES)],
};

export const buildingPermits = {
    title: "Building permits",
    singular: "building permit",
    plural: "buildingPermits",
    api: "/building-permits",
    path: "building-permits",
    searchHint: "Serial, project or owner",
    heading: (record) => record.projectTitle || record.ownerName,
    columns: [
        serialColumn,
        { label: "Filed", render: (row) => formatDate(row.dateFiled), hideOnPhone: true },
        { label: "Project / owner", render: (row) => recordName(row) },
        { label: "Scope", render: (row) => sentence(row.scopeOfWork), hideOnPhone: true },
        { label: "Barangay", render: (row) => row.barangay, hideOnPhone: true },
        { label: "Est. cost", numeric: true, hideOnPhone: true, render: (row) => (row.estimatedCost != null ? formatPeso(row.estimatedCost) : "") },
    ],
    filters: [
        filter("permitType", "Application", BUILDING_PERMIT_TYPES),
        filter("scopeOfWork", "Scope of work", SCOPES_OF_WORK),
        filter("barangay", "Barangay", BARANGAYS),
    ],
    boxes: [
        {
            title: "Application",
            fields: [
                choice("permitType", "Application", BUILDING_PERMIT_TYPES, 2, { defaultValue: BUILDING_PERMIT_TYPES.NEW }),
                date("dateFiled", "Date filed", 2, { defaultValue: new Date().toISOString() }),
                choice("scopeOfWork", "Scope of work", SCOPES_OF_WORK),
                text("projectTitle", "Project title", 6),
            ],
        },
        {
            title: "Owner / applicant",
            fields: [
                text("ownerName", "Name", 2, { required: true }),
                text("ownerAddress", "Address", 2),
                text("ownerContact", "Contact no.", 2),
            ],
        },
        {
            title: "Location of construction",
            fields: [
                text("projectAddress", "Street address", 4),
                choice("barangay", "Barangay", BARANGAYS),
                text("lotNumber", "Lot no.", 1),
                text("blockNumber", "Block no.", 1),
                text("tctNumber", "TCT no.", 1),
                text("taxDeclarationNumber", "Tax dec. no.", 1),
                choice("lotOwnership", "Lot ownership", LOT_OWNERSHIPS, 2),
                coordinate("projectCoordinate"),
            ],
        },
        {
            title: "Building",
            fields: [
                choice("characterOfOccupancy", "Character of occupancy", CHARACTERS_OF_OCCUPANCY, 4),
                choice("occupancyDivision", "Occupancy division", OCCUPANCY_DIVISIONS, 2, { hints: DIVISION_HINTS, defaultHint: DIVISION_HINT_DEFAULT }),
                number("numberOfStoreys", "Storeys", 1),
                number("totalFloorArea", "Floor area (sq. m)", 2, { step: "any" }),
                number("lotArea", "Lot area (sq. m)", 1, { step: "any" }),
                number("estimatedCost", "Estimated cost (₱)", 2, { step: "any", money: true }),
            ],
        },
        {
            title: "Professional in charge",
            fields: [
                text("engineerName", "Name", 4),
                text("engineerPrcNumber", "PRC no.", 2),
            ],
        },
    ],
    documents: [
        { name: "transferCertificateOfTitle", label: "Transfer certificate of title" },
        { name: "taxDeclaration", label: "Tax declaration" },
        { name: "realPropertyTaxReceipt", label: "Real property tax receipt" },
        { name: "barangayClearance", label: "Barangay clearance" },
        { name: "contractOfLease", label: "Contract of lease" },
        { name: "buildingPlans", label: "Building plans" },
    ],
    related: (id) => [
        inspectionsOf("building", id),
        assessmentsOf("building", id),
        {
            title: "Electrical permits",
            api: "/electrical-permits",
            plural: "electricalPermits",
            path: "electrical-permits",
            params: { buildingPermit: id },
            columns: [
                serialColumn,
                { label: "Filed", render: (row) => formatDate(row.dateFiled) },
                { label: "Scope", render: (row) => sentence(row.scopeOfWork) },
            ],
            newLabel: "New electrical permit",
            newLink: `/dashboard/electrical-permits/new?buildingPermit=${id}`,
        },
    ],
};

export const electricalPermits = {
    title: "Electrical / CFEI",
    singular: "electrical permit",
    plural: "electricalPermits",
    api: "/electrical-permits",
    path: "electrical-permits",
    searchHint: "Serial, project or owner",
    heading: (record) => record.projectTitle || record.ownerName,
    columns: [
        serialColumn,
        { label: "Filed", render: (row) => formatDate(row.dateFiled), hideOnPhone: true },
        { label: "Project / owner", render: (row) => recordName(row) },
        { label: "Scope", render: (row) => sentence(row.scopeOfWork), hideOnPhone: true },
        { label: "CFEI issued", render: (row) => formatDate(row.cfeiDateIssued) },
    ],
    filters: [
        filter("permitType", "Application", ELECTRICAL_PERMIT_TYPES),
        filter("scopeOfWork", "Scope of work", ELECTRICAL_SCOPES_OF_WORK),
        filter("barangay", "Barangay", BARANGAYS),
    ],
    boxes: [
        {
            title: "Application",
            fields: [
                choice("permitType", "Application", ELECTRICAL_PERMIT_TYPES, 2, { defaultValue: ELECTRICAL_PERMIT_TYPES.NEW }),
                date("dateFiled", "Date filed", 2, { defaultValue: new Date().toISOString() }),
                choice("scopeOfWork", "Scope of work", ELECTRICAL_SCOPES_OF_WORK),
                text("projectTitle", "Project title", 3),
                {
                    name: "buildingPermit",
                    label: "Building permit (if any)",
                    span: 3,
                    type: "reference",
                    api: "/building-permits",
                    resultsKey: "buildingPermits",
                    show: (record) =>
                        record.buildingPermit &&
                        `${record.buildingPermit.serialNumber} ${recordName(record.buildingPermit)}`,
                },
            ],
        },
        {
            title: "Owner / applicant",
            fields: [
                text("ownerName", "Name", 2, { required: true }),
                text("ownerAddress", "Address", 2),
                text("ownerContact", "Contact no.", 2),
            ],
        },
        {
            title: "Location of installation",
            fields: [
                text("projectAddress", "Street address", 4),
                choice("barangay", "Barangay", BARANGAYS),
                choice("characterOfOccupancy", "Character of occupancy", CHARACTERS_OF_OCCUPANCY, 6),
                coordinate("projectCoordinate"),
            ],
        },
        {
            title: "Load summary",
            fields: [
                number("totalConnectedLoad", "Connected load (kVA)", 2, { step: "any" }),
                number("totalTransformerCapacity", "Transformer (kVA)", 2, { step: "any" }),
                number("totalGeneratorCapacity", "Generator (kVA)", 2, { step: "any" }),
            ],
        },
        {
            title: "Professional electrical engineer",
            fields: [
                text("electricalEngineerName", "Name", 2),
                text("electricalEngineerPrcNumber", "PRC no.", 2),
                text("electricalEngineerPtrNumber", "PTR no.", 2),
            ],
        },
        {
            title: "Certificate of final electrical inspection",
            fields: [
                date("finalInspectionDate", "Final inspection", 3),
                date("cfeiDateIssued", "CFEI issued", 3),
            ],
        },
    ],
    documents: [
        { name: "electricalPlans", label: "Electrical plans" },
        { name: "billOfMaterials", label: "Bill of materials" },
        { name: "buildingPermitCopy", label: "Building permit copy" },
        { name: "transferCertificateOfTitle", label: "Transfer certificate of title" },
        { name: "electricalEngineerPrcId", label: "Engineer's PRC ID" },
        { name: "certificateOfCompletion", label: "Certificate of completion" },
    ],
    related: (id) => [inspectionsOf("cfei", id), assessmentsOf("cfei", id)],
};

export const inspections = {
    title: "Inspections",
    singular: "inspection",
    newLabel: "Request an inspection",
    plural: "inspections",
    api: "/inspections",
    path: "inspections",
    searchHint: "Business, requested by or contact no.",
    columns: inspectionColumns,
    filters: [
        {
            name: "view",
            label: "Show",
            options: ["today", "upcoming", "overdue", "undated"],
            optionLabels: { today: "Preferred today", upcoming: "Preferred later", overdue: "Past preferred date", undated: "No preferred date" },
        },
        filter("status", "Status", INSPECTION_STATUSES),
        { name: "inspectionType", label: "Type", options: Object.values(INSPECTION_TYPES), optionLabels: { cfei: "CFEI" } },
    ],
};

export const assessments = {
    title: "Assessments",
    singular: "assessment",
    plural: "assessments",
    api: "/assessments",
    path: "assessments",
    searchHint: "O.R. number",
    columns: assessmentColumns,
    filters: [
        filter("status", "Status", ASSESSMENT_STATUSES),
        { name: "assessmentType", label: "Type", options: Object.values(ASSESSMENT_TYPES) },
    ],
};
