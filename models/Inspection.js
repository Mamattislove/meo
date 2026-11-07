import mongoose from "mongoose";
import {
    INSPECTION_STATUSES,
    INSPECTION_TYPES,
} from "../utils/constants.js";
import { ANNUAL_MECHANICAL, ELECTRONICS, SIGN_RENEWALS } from "../utils/feeSchedule.js";

// Which model `record` points to for each inspection type
const RECORD_MODELS = {
    [INSPECTION_TYPES.BUSINESS]: "AnnualInspection",
    [INSPECTION_TYPES.BUILDING]: "BuildingPermit",
    [INSPECTION_TYPES.CFEI]: "ElectricalPermit",
};

const machinerySchema = new mongoose.Schema(
    {
        // The Sec. 11.f item this machine is charged under
        itemId: {
            type: String,
            enum: ANNUAL_MECHANICAL.map(({ id }) => id),
            required: true,
        },
        machineName: String, // an optional description
        imageUrl: String,
        capacity: { type: Number, min: 0 }, // the size the fee is charged on, in the item's unit
        // Air conditioning entered in HP; capacity is then the tons worked out from these
        acUnits: [
            new mongoose.Schema(
                { hp: { type: Number, min: 0 }, quantity: { type: Number, min: 1 } },
                { _id: false },
            ),
        ],
        quantity: { type: Number, min: 1 },
    },
    { _id: false },
);

// One inspection, from the owner requesting it to the inspector
// recording what they found. An AIF inspection can start with no application: just who
// asked and where. A record can be inspected more than once (e.g. a re-inspection after
// failing), but only one inspection at a time can be open.
const inspectionSchema = new mongoose.Schema(
    {
        inspectionType: {
            type: String,
            enum: Object.values(INSPECTION_TYPES),
            required: true,
        },
        // The AIF logbook entry, building permit, or electrical permit being inspected
        record: {
            type: mongoose.Schema.Types.ObjectId,
            ref: function () {
                return RECORD_MODELS[this.inspectionType];
            },
            required: function () {
                return this.inspectionType !== INSPECTION_TYPES.BUSINESS;
            },
        },
        status: {
            type: String,
            enum: Object.values(INSPECTION_STATUSES),
            default: INSPECTION_STATUSES.PENDING,
        },
        cancelReason: String,

        // The request
        businessName: String, // for an AIF inspection with no application yet
        // GeoJSON Point: coordinates are [longitude, latitude]
        location: {
            type: {
                type: String,
                enum: ["Point"],
            },
            coordinates: {
                type: [Number],
                default: undefined,
            },
        },
        requestedBy: String, // the owner or representative who asked
        requestContact: String,
        dateRequested: { type: Date, default: Date.now },
        preferredDate: Date,
        preferredTime: String, // optional, "HH:mm"
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

        // What the inspector found
        inspectedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        dateOfInspection: Date,

        // Plumbing units for Sec. 11.d, counted as one for each toilet
        noOfCR: { type: Number, min: 0 },
        area: { type: Number, min: 0 }, // square meters, of one storey
        numOfStorey: { type: Number, min: 0 },

        // Electrical load found during inspection, in kVA (for the annual electrical fee)
        totalConnectedLoad: { type: Number, min: 0 },
        // How a connected load given as kW or breaker size became the kVA above
        connectedLoadConversion: {
            type: new mongoose.Schema(
                {
                    from: { type: String, enum: ["kW", "AT"] },
                    value: { type: Number, min: 0 },
                    powerFactor: { type: Number, min: 0, max: 1 },
                    volts: { type: Number, min: 0 },
                    phase: { type: Number, enum: [1, 3] },
                },
                { _id: false },
            ),
        },
        transformers: [{ type: Number, min: 0 }], // kVA of each; totalTransformerCapacity adds them up
        generators: [{ type: Number, min: 0 }], // kVA of each; totalGeneratorCapacity adds them up
        noOfPoles: { type: Number, min: 0 }, // Sec. 4.c, within the premises
        noOfGuyingAttachments: { type: Number, min: 0 },
        // Does the business show its name on a sign, even a tarpaulin? A check, not a fee.
        hasNameSignage: Boolean,
        // Sec. 9.h.iii: each sign's type and display surface in sq. m
        signs: [
            new mongoose.Schema(
                {
                    itemId: { type: String, enum: SIGN_RENEWALS.map(({ id }) => id), required: true },
                    area: { type: Number, min: 0 },
                },
                { _id: false },
            ),
        ],
        // Sec. 11.g items found, including CCTV under Sec. 7.e
        electronics: [
            new mongoose.Schema(
                {
                    itemId: { type: String, enum: ELECTRONICS.map(({ id }) => id), required: true },
                    quantity: { type: Number, min: 1 },
                },
                { _id: false },
            ),
        ],
        totalTransformerCapacity: { type: Number, min: 0 }, // includes UPS
        totalGeneratorCapacity: { type: Number, min: 0 },

        // URLs of files saved locally in /uploads
        images: [String],
        videos: [String],
        machineries: [machinerySchema],

        findings: String, // violations or items to comply with
        remarks: String,
    },
    { timestamps: true },
);

inspectionSchema.pre("validate", function () {
    if (this.status === INSPECTION_STATUSES.INSPECTED && !this.record) {
        this.invalidate("status", "create the AIF application before inspecting");
    }
    if (!this.preferredDate) this.preferredTime = undefined;
    for (const [list, total] of [["generators", "totalGeneratorCapacity"], ["transformers", "totalTransformerCapacity"]]) {
        if (this.isModified(list)) {
            const sum = this[list].reduce((added, kva) => added + kva, 0);
            this[total] = sum > 0 ? sum : undefined;
        }
    }
});

// A record waits on one inspection at a time; done or cancelled ones don't count,
// and neither do AIF inspections with no record yet
inspectionSchema.index(
    { record: 1 },
    {
        unique: true,
        partialFilterExpression: {
            record: { $exists: true },
            status: INSPECTION_STATUSES.PENDING,
        },
    },
);

inspectionSchema.index({ location: "2dsphere" });

export default mongoose.model("Inspection", inspectionSchema);
