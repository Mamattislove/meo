import mongoose from "mongoose";
import {
    ASSESSMENT_STATUSES,
    ASSESSMENT_TYPES,
    FEE_CATEGORIES,
} from "../utils/constants.js";

// Which model `record` points to for each assessment type
const RECORD_MODELS = {
    [ASSESSMENT_TYPES.BUSINESS]: "AnnualInspection",
    [ASSESSMENT_TYPES.BUILDING]: "BuildingPermit",
    [ASSESSMENT_TYPES.CFEI]: "ElectricalPermit",
};

const ACTIVE_STATUSES = [ASSESSMENT_STATUSES.ASSESSED, ASSESSMENT_STATUSES.PAID];

// One fee item. rate and amount are stored as charged, so later changes to the
// fee schedule don't alter past assessments.
const feeSchema = new mongoose.Schema(
    {
        category: {
            type: String,
            enum: Object.values(FEE_CATEGORIES),
            required: true,
        },
        description: String, // e.g. "Annual plumbing inspection, 2 plumbing unit(s)"
        reference: String, // section of the schedule of fees, e.g. "Sec. 11.b"
        // The checklist item this line came from (utils/feeSchedule.js), so the
        // assessment can be reopened with the same boxes ticked
        itemId: String,
        itemUnits: { type: Number, min: 1 }, // for items charged per unit
        // How a connected load given as kW or breaker size became the kVA in basis
        conversion: {
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
        basis: { type: Number, min: 0 }, // e.g. 4 units, or 120 (m²)
        rate: { type: Number, min: 0 }, // pesos per unit of basis
        amount: { type: Number, min: 0 }, // pesos; computed from basis × rate if left empty
    },
    { _id: false },
);

// Fee assessment for an AIF logbook entry (annual inspection fee), a building
// permit, or an electrical permit / CFEI. One active assessment per record.
const assessmentSchema = new mongoose.Schema(
    {
        assessmentType: {
            type: String,
            enum: Object.values(ASSESSMENT_TYPES),
            required: true,
        },
        // The AIF logbook entry, building permit, or electrical permit being assessed
        record: {
            type: mongoose.Schema.Types.ObjectId,
            ref: function () {
                return RECORD_MODELS[this.assessmentType];
            },
            required: true,
        },
        inspection: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Inspection",
        },

        assessedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        dateAssessed: { type: Date, default: Date.now },

        fees: [feeSchema],
        totalAmount: { type: Number, min: 0, default: 0 }, // pesos; always the sum of fees

        status: {
            type: String,
            enum: Object.values(ASSESSMENT_STATUSES),
            default: ASSESSMENT_STATUSES.ASSESSED,
        },
        orNumber: String, // official receipt number
        datePaid: Date,
        remarks: String,
    },
    { timestamps: true },
);

// Fill in missing amounts and keep the total in sync with the fee items.
assessmentSchema.pre("validate", function () {
    for (const fee of this.fees) {
        if (fee.amount == null && fee.basis != null && fee.rate != null) {
            fee.amount = Math.round(fee.basis * fee.rate * 100) / 100;
        }
    }
    const total = this.fees.reduce((sum, fee) => sum + (fee.amount || 0), 0);
    this.totalAmount = Math.round(total * 100) / 100;
});

// Only one active assessment per AIF logbook entry, building permit, or
// electrical permit. Cancelled ones don't count, so a mistake can be cancelled and redone.
assessmentSchema.index(
    { record: 1 },
    {
        unique: true,
        partialFilterExpression: { status: { $in: ACTIVE_STATUSES } },
    },
);

export default mongoose.model("Assessment", assessmentSchema);
