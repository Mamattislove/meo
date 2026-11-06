import { body, query } from "express-validator";
import { isValidMongoId, withValidationErrors } from "../validationMiddleware.js";
import { NotFoundError } from "../../errors/customErrors.js";
import Assessment from "../../models/Assessment.js";
import Inspection from "../../models/Inspection.js";
import {
    ASSESSMENT_STATUSES,
    ASSESSMENT_TYPES,
    FEE_CATEGORIES,
} from "../../utils/constants.js";
import {
    BLANK_OK,
    dateField,
    enumFilter,
    idFilter,
    numberField,
    recordReference,
    requiredTextField,
    textField,
    validateListQuery,
} from "./fieldValidators.js";

const hasValue = (value) => value !== undefined && value !== null && value !== "";

// totalAmount is left out on purpose: the model always computes it from the fees.
const feesList = () =>
    body("fees")
        .isArray({ min: 1 })
        .withMessage("add at least one fee")
        .bail()
        .custom((fees) =>
            fees.every(
                (fee) =>
                    hasValue(fee?.amount) || (hasValue(fee?.basis) && hasValue(fee?.rate)),
            ),
        )
        .withMessage("each fee needs an amount, or a basis and a rate");

const feeItemFields = () => [
    body("fees.*.category")
        .isIn(Object.values(FEE_CATEGORIES))
        .withMessage("invalid fee category"),
    textField("fees.*.description"),
    textField("fees.*.reference"),
    textField("fees.*.itemId"),
    numberField("fees.*.itemUnits"),
    body("fees.*.conversion.from")
        .optional(BLANK_OK)
        .isIn(["kW", "AT"])
        .withMessage("invalid connected load unit"),
    numberField("fees.*.conversion.value"),
    numberField("fees.*.conversion.powerFactor"),
    numberField("fees.*.conversion.volts"),
    numberField("fees.*.conversion.phase"),
    numberField("fees.*.basis"),
    numberField("fees.*.rate"),
    numberField("fees.*.amount"),
];

// The linked inspection must be an inspection of the record being assessed.
const inspectionOfRecord = (getRecord) =>
    body("inspection")
        .optional(BLANK_OK)
        .custom(async (inspection, { req }) => {
            const record = getRecord(req);
            const found =
                isValidMongoId(inspection) &&
                isValidMongoId(record) &&
                (await Inspection.exists({ _id: inspection, record }));
            if (!found) throw new Error("that inspection is not of this record");
        });

export const validateAssessmentInput = withValidationErrors([
    body("assessmentType")
        .isIn(Object.values(ASSESSMENT_TYPES))
        .withMessage("invalid assessmentType"),
    recordReference(body("record"), "assessmentType")
        .bail()
        .custom(async (record) => {
            if (!isValidMongoId(record)) return;
            const active = await Assessment.exists({
                record,
                status: { $ne: ASSESSMENT_STATUSES.CANCELLED },
            });
            if (active) throw new Error("this record already has an active assessment");
        }),
    inspectionOfRecord((req) => req.body.record),
    dateField("dateAssessed"),
    textField("remarks"),
    feesList(),
    ...feeItemFields(),
]);

// assessmentType and record can't change: cancel the assessment and create another.
export const validateAssessmentUpdateInput = withValidationErrors([
    inspectionOfRecord((req) => req.assessment.record),
    dateField("dateAssessed"),
    textField("remarks"),
    feesList().optional(),
    ...feeItemFields(),
]);

export const validateAssessmentPaymentInput = withValidationErrors([
    requiredTextField("orNumber"),
    dateField("datePaid"),
]);

export const validateAssessmentCancelInput = withValidationErrors([textField("remarks")]);

export const validateAssessmentListQuery = validateListQuery([
    enumFilter("assessmentType", ASSESSMENT_TYPES),
    idFilter("record"),
    enumFilter("status", ASSESSMENT_STATUSES),
]);

export const validateComputeFeesQuery = withValidationErrors([
    query("assessmentType")
        .isIn(Object.values(ASSESSMENT_TYPES))
        .withMessage("invalid assessmentType"),
    recordReference(query("record"), "assessmentType"),
    idFilter("inspection"),
]);

// Loads the assessment once so the handlers after it can read req.assessment.
export const loadAssessment = async (req, res, next) => {
    const assessment = await Assessment.findById(req.params.assessmentId);
    if (!assessment) {
        throw new NotFoundError(`No assessment with id ${req.params.assessmentId}`);
    }
    req.assessment = assessment;
    next();
};
