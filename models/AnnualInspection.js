import mongoose from "mongoose";
import {
    ANNUAL_INSPECTION_STATUSES,
    BUSINESS_ACTIVITIES,
    BUSINESS_TYPES,
    OCCUPANCY_DIVISIONS,
} from "../utils/constants.js";

// A time an application waited on something, e.g. "No building permit yet"
const holdSchema = new mongoose.Schema({
    reason: { type: String, required: true },
    heldAt: { type: Date, default: Date.now },
    heldBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    resumedAt: Date,
    resumedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

// An annual inspection fee (AIF) application: one business for one year, from the
// owner reporting to the office until payment. Paying it enters it in the AIF logbook.
// The year's inspections and fee assessment point to this record, the same way
// they point to a BuildingPermit or ElectricalPermit.
const annualInspectionSchema = new mongoose.Schema(
    {
        business: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Business",
            required: true,
        },
        year: { type: Number, required: true, min: 2000 },
        // AIF logbook serial, e.g. "2026-0001"; assigned when payment is recorded
        serialNumber: { type: String, unique: true, sparse: true },
        orNumber: String, // official receipt of the payment that logged it
        datePaid: Date,
        // Kept up to date by utils/annualInspectionCase.js
        status: {
            type: String,
            enum: Object.values(ANNUAL_INSPECTION_STATUSES),
            default: ANNUAL_INSPECTION_STATUSES.FOR_INSPECTION,
        },
        onHold: { type: Boolean, default: false },
        holds: [holdSchema],
        businessType: {
            type: String,
            enum: Object.values(BUSINESS_TYPES),
            default: BUSINESS_TYPES.RENEWAL,
        },
        // NBC occupancy division of the building, e.g. "E-2"; sets the annual inspection fee
        occupancyDivision: {
            type: String,
            enum: Object.values(OCCUPANCY_DIVISIONS),
        },
        businessActivity: {
            type: String,
            enum: Object.values(BUSINESS_ACTIVITIES),
        },
        lessorName: String,
        dateReceived: { type: Date, default: Date.now },
        receivedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },

        // Lease documents submitted this year. Image URLs of files saved locally
        // in /uploads, e.g. "/uploads/contractOfLease-...jpg"
        contractOfLease: String,
        businessPermitOfLessor: String,
        occupancyPermitOfLessor: String,

        remarks: String,
    },
    { timestamps: true },
);

// One application per business per year
annualInspectionSchema.index({ business: 1, year: 1 }, { unique: true });

export default mongoose.model("AnnualInspection", annualInspectionSchema);
