import { body, query } from "express-validator";
import { isValidMongoId, withValidationErrors } from "../validationMiddleware.js";
import { NotFoundError } from "../../errors/customErrors.js";
import Business from "../../models/Business.js";
import Inspection from "../../models/Inspection.js";
import {
    INSPECTION_STATUSES,
    INSPECTION_TYPES,
} from "../../utils/constants.js";
import { ELECTRONICS, INSPECTION_MECHANICAL, SIGN_RENEWALS, toKva } from "../../utils/feeSchedule.js";
import {
    BLANK_OK,
    coordinateField,
    dateField,
    enumFilter,
    idFilter,
    numberField,
    parseJson,
    recordReference,
    referenceTo,
    textField,
    validateListQuery,
} from "./fieldValidators.js";

// An AIF inspection may have no record yet, so these identify it
const requiredForAif = (name, message) =>
    body(name)
        .custom((value, { req }) => {
            const type = req.body.inspectionType || req.inspection?.inspectionType;
            // Once linked, the application identifies it
            if (type !== INSPECTION_TYPES.BUSINESS || req.inspection?.record) return true;
            // An edit that leaves this field out leaves it as it is
            if (req.inspection && !(name in req.body)) return true;
            return typeof value === "string" ? value.trim() !== "" : Boolean(value);
        })
        .withMessage(message);

// uploadInspectionFiles builds these lists from their repeated form fields
const amountList = (name, message) => [
    body(name).optional().isArray().withMessage(`${name} must be a list`),
    body(`${name}.*`).isFloat({ gt: 0 }).withMessage(message).toFloat(),
];

const inspectionFields = () => [
    // The request
    textField("businessName"),
    coordinateField("location"),
    requiredForAif("location", "location is required"),
    textField("requestedBy"),
    requiredForAif("requestedBy", "requested by is required"),
    textField("requestContact"),
    requiredForAif("requestContact", "contact number is required"),
    dateField("dateRequested"),
    dateField("preferredDate"),
    body("preferredTime")
        .optional(BLANK_OK)
        .matches(/^([01]\d|2[0-3]):[0-5]\d$/)
        .withMessage("invalid time"),
    // A preferred time means nothing without its date
    body("preferredTime")
        .custom((time, { req }) => {
            if (!time) return true;
            return "preferredDate" in req.body ? Boolean(req.body.preferredDate) : Boolean(req.inspection?.preferredDate);
        })
        .withMessage("enter the preferred date for the preferred time"),

    // What the inspector found
    numberField("noOfCR"),
    numberField("area"),
    numberField("numOfStorey"),
    numberField("totalConnectedLoad"),
    body("connectedLoadConversion")
        .optional(BLANK_OK)
        .customSanitizer(parseJson)
        .custom((conversion) => toKva(conversion) > 0)
        .withMessage("enter a valid kW or breaker size for the connected load"),
    ...amountList("transformers", "each transformer or UPS's kVA must be more than 0"),
    numberField("noOfPoles"),
    numberField("noOfGuyingAttachments"),
    body("hasNameSignage").optional(BLANK_OK).isBoolean().withMessage("invalid answer for the name signage").toBoolean(),
    body("signs").optional(BLANK_OK).isArray().withMessage("signs must be a list"),
    body("signs.*.itemId").isIn(SIGN_RENEWALS.map(({ id }) => id)).withMessage("invalid type of sign"),
    numberField("signs.*.area"),
    body("electronics").optional(BLANK_OK).isArray().withMessage("electronics must be a list"),
    body("electronics.*.itemId").isIn(ELECTRONICS.map(({ id }) => id)).withMessage("invalid electronics item"),
    body("electronics.*.quantity").optional(BLANK_OK).isInt({ min: 1 }).withMessage("electronics quantity must be 1 or more").toInt(),
    ...amountList("generators", "each generator's kVA must be more than 0"),
    // Sent by the Inspect form's button: this visit is finished
    body("markInspected").optional().isBoolean().withMessage("invalid markInspected").toBoolean(),
    textField("findings"),
    textField("remarks"),

    // uploadInspectionFiles builds `machineries` from the machine* form fields.
    body("machineries")
        .optional(BLANK_OK)
        .isArray()
        .withMessage("machineries must be a list"),
    textField("machineries.*.machineName"),
    body("machineries.*.itemId")
        .isIn(INSPECTION_MECHANICAL.map(({ id }) => id))
        .withMessage("invalid mechanical item"),
    body("machineries.*.oldIndex").optional(BLANK_OK).isInt({ min: 0 }).withMessage("invalid machinery row").toInt(),
    numberField("machineries.*.capacity"),
    body("machineries.*.quantity")
        .optional(BLANK_OK)
        .isInt({ min: 1 })
        .withMessage("machinery quantity must be 1 or more")
        .toInt(),
    // Only a file from this upload, so a client can't attach one by typing its URL
    body("machineries.*.imageUrl")
        .optional(BLANK_OK)
        .custom((url, { req }) =>
            (req.files?.machineryImages || []).some(
                (file) => `/uploads/${file.filename}` === url,
            ),
        )
        .withMessage("invalid machinery image"),
    // An image with no machine to belong to would never be reachable
    body("machineryImages")
        .custom(
            (value, { req }) =>
                (req.files?.machineryImages || []).length <=
                (req.body.machineries?.length || 0),
        )
        .withMessage("each machinery image needs a ticked item"),
];

export const validateInspectionInput = withValidationErrors([
    body("inspectionType")
        .isIn(Object.values(INSPECTION_TYPES))
        .withMessage("invalid inspectionType"),
    // An AIF inspection can be requested before its application exists
    recordReference(
        body("record").if((value, { req }) => value || req.body.inspectionType !== INSPECTION_TYPES.BUSINESS),
        "inspectionType",
    )
        .bail()
        .custom(async (record) => {
            if (!isValidMongoId(record)) return;
            const open = await Inspection.exists({
                record,
                status: INSPECTION_STATUSES.PENDING,
            });
            if (open) throw new Error("this record already has an open inspection");
        }),
    ...inspectionFields(),
]);

export const validateInspectionUpdateInput = withValidationErrors([
    ...inspectionFields(),
    // URLs of existing images or videos to delete
    body("removeFiles").optional().toArray(),
    body("removeFiles.*").isString().withMessage("invalid file in removeFiles"),
]);

export const validateLinkInput = withValidationErrors([
    referenceTo(body("business").optional(BLANK_OK), Business, "business"),
    textField("businessName"),
    body("business")
        .custom((business, { req }) => business || req.body.businessName?.trim())
        .withMessage("choose a business or enter a new business name"),
    body("year").isInt({ min: 2000 }).withMessage("year must be 2000 or later").toInt(),
]);

export const validateCancelInspectionInput = withValidationErrors([textField("reason")]);

export const validateInspectionListQuery = validateListQuery([
    enumFilter("inspectionType", INSPECTION_TYPES),
    idFilter("record"),
    enumFilter("status", INSPECTION_STATUSES),
    query("view")
        .optional()
        .isIn(["today", "overdue", "undated", "upcoming"])
        .withMessage("invalid view"),
]);

// Loads the inspection once so the handlers after it can read req.inspection.
export const loadInspection = async (req, res, next) => {
    const inspection = await Inspection.findById(req.params.inspectionId);
    if (!inspection) {
        throw new NotFoundError(`No inspection with id ${req.params.inspectionId}`);
    }
    req.inspection = inspection;
    next();
};
