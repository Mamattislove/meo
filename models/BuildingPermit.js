import mongoose from "mongoose";
import { nextSerial } from "./Counter.js";
import {
    BARANGAYS,
    BUILDING_PERMIT_TYPES,
    CHARACTERS_OF_OCCUPANCY,
    LOT_OWNERSHIPS,
    OCCUPANCY_DIVISIONS,
    SCOPES_OF_WORK,
} from "../utils/constants.js";

const buildingPermitSchema = new mongoose.Schema({
    permitType: {
        type: String,
        enum: Object.values(BUILDING_PERMIT_TYPES),
        default: BUILDING_PERMIT_TYPES.NEW,
    },
    // Building permit serial, e.g. "2026-0001"; assigned automatically on first save
    serialNumber: { type: String, unique: true, sparse: true },
    dateFiled: Date,
    projectTitle: String,

    scopeOfWork: {
        type: String,
        enum: Object.values(SCOPES_OF_WORK),
    },
    characterOfOccupancy: {
        type: String,
        enum: Object.values(CHARACTERS_OF_OCCUPANCY),
    },
    // NBC occupancy division, e.g. "A-1"; sets the building fee
    occupancyDivision: {
        type: String,
        enum: Object.values(OCCUPANCY_DIVISIONS),
    },
    barangay: {
        type: String,
        enum: Object.values(BARANGAYS),
    },
    projectAddress: String,
    // GeoJSON Point: coordinates are [longitude, latitude]
    projectCoordinate: {
        type: {
            type: String,
            enum: ["Point"],
        },
        coordinates: {
            type: [Number],
            default: undefined,
            validate: {
                validator: (value) =>
                    value.length === 2 &&
                    value[0] >= -180 &&
                    value[0] <= 180 &&
                    value[1] >= -90 &&
                    value[1] <= 90,
                message:
                    "Coordinates must be [longitude, latitude] within valid ranges",
            },
        },
    },

    // Lot details
    lotNumber: String,
    blockNumber: String,
    tctNumber: String,
    taxDeclarationNumber: String,
    lotOwnership: {
        type: String,
        enum: Object.values(LOT_OWNERSHIPS),
    },

    // Building details
    numberOfStoreys: { type: Number, min: 0 },
    totalFloorArea: { type: Number, min: 0 }, // square meters
    lotArea: { type: Number, min: 0 }, // square meters
    estimatedCost: { type: Number, min: 0 }, // pesos

    // Owner / applicant
    ownerName: String,
    ownerAddress: String,
    ownerContact: String,

    // Professional in charge of construction
    engineerName: String,
    engineerPrcNumber: String,

    // Image URLs of files saved locally in /uploads, e.g. "/uploads/transferCertificateOfTitle-...jpg"
    transferCertificateOfTitle: String,
    taxDeclaration: String,
    realPropertyTaxReceipt: String,
    barangayClearance: String,
    contractOfLease: String,
    buildingPlans: String,
});

buildingPermitSchema.index({ projectCoordinate: "2dsphere" });

buildingPermitSchema.pre("save", async function () {
    if (this.isNew && !this.serialNumber) {
        const year = (this.dateFiled || new Date()).getFullYear();
        this.serialNumber = await nextSerial("buildingvs", year);
    }
});

export default mongoose.model("BuildingPermit", buildingPermitSchema);
