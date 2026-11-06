import mongoose from "mongoose";
import { nextSerial } from "./Counter.js";
import {
    BARANGAYS,
    CHARACTERS_OF_OCCUPANCY,
    ELECTRICAL_PERMIT_TYPES,
    ELECTRICAL_SCOPES_OF_WORK,
} from "../utils/constants.js";

const electricalPermitSchema = new mongoose.Schema({
    permitType: {
        type: String,
        enum: Object.values(ELECTRICAL_PERMIT_TYPES),
        default: ELECTRICAL_PERMIT_TYPES.NEW,
    },
    // CFEI serial, e.g. "2026-0001"; assigned automatically on first save
    serialNumber: { type: String, unique: true, sparse: true },
    dateFiled: Date,
    projectTitle: String,
    // Optional link to the building permit this electrical work belongs to
    buildingPermit: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "BuildingPermit",
    },

    scopeOfWork: {
        type: String,
        enum: Object.values(ELECTRICAL_SCOPES_OF_WORK),
    },
    characterOfOccupancy: {
        type: String,
        enum: Object.values(CHARACTERS_OF_OCCUPANCY),
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

    // Electrical load summary, in kVA
    totalConnectedLoad: { type: Number, min: 0 },
    totalTransformerCapacity: { type: Number, min: 0 },
    totalGeneratorCapacity: { type: Number, min: 0 },

    // Owner / applicant
    ownerName: String,
    ownerAddress: String,
    ownerContact: String,

    // Professional Electrical Engineer in charge
    electricalEngineerName: String,
    electricalEngineerPrcNumber: String,
    electricalEngineerPtrNumber: String,

    // CFEI (Certificate of Final Electrical Inspection), filled in after the final inspection
    finalInspectionDate: Date,
    cfeiDateIssued: Date,

    // Image URLs of files saved locally in /uploads, e.g. "/uploads/electricalPlans-...jpg"
    electricalPlans: String,
    billOfMaterials: String,
    buildingPermitCopy: String,
    transferCertificateOfTitle: String,
    electricalEngineerPrcId: String,
    certificateOfCompletion: String,
});

electricalPermitSchema.index({ projectCoordinate: "2dsphere" });

electricalPermitSchema.pre("save", async function () {
    if (this.isNew && !this.serialNumber) {
        const year = (this.dateFiled || new Date()).getFullYear();
        this.serialNumber = await nextSerial("cfei", year);
    }
});

export default mongoose.model("ElectricalPermit", electricalPermitSchema);
