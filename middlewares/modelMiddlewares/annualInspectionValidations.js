import { body, query } from "express-validator";
import { isValidMongoId, withValidationErrors } from "../validationMiddleware.js";
import { NotFoundError } from "../../errors/customErrors.js";
import AnnualInspection from "../../models/AnnualInspection.js";
import Business from "../../models/Business.js";
import {
    ANNUAL_INSPECTION_STATUSES,
    BARANGAYS,
    BUSINESS_ACTIVITIES,
    BUSINESS_TYPES,
    OCCUPANCY_DIVISIONS,
} from "../../utils/constants.js";
import {
    BLANK_OK,
    coordinateField,
    dateField,
    enumField,
    enumFilter,
    idFilter,
    referenceTo,
    requiredTextField,
    textField,
    validateListQuery,
} from "./fieldValidators.js";

// The business's details, saved on the Business from the application's form
const businessDetails = () => [
    textField("businessOwner"),
    textField("ownerContact"),
    enumField("barangay", BARANGAYS),
    coordinateField("businessCoordinate"),
];

const annualInspectionFields = () => [
    enumField("businessType", BUSINESS_TYPES),
    enumField("occupancyDivision", OCCUPANCY_DIVISIONS),
    enumField("businessActivity", BUSINESS_ACTIVITIES),
    textField("lessorName"),
    dateField("dateReceived"),
    textField("remarks"),
];

// business and year can't change later: the logbook serial comes from the year.
// If either was entered wrong, delete the entry and create it again.
export const validateAnnualInspectionInput = withValidationErrors([
    referenceTo(body("business").optional(BLANK_OK), Business, "business"),
    // With no business chosen, the name creates one, unless that would make a duplicate
    textField("businessName"),
    body("businessName")
        .custom(async (name, { req }) => {
            if (req.body.business) return;
            if (!name?.trim()) throw new Error("enter the business name");
            const taken = await Business.exists({ businessName: name.trim() }).collation({ locale: "en", strength: 2 });
            if (taken) throw new Error(`${name.trim()} already exists; choose it from the suggestions`);
        }),
    ...businessDetails(),
    body("year")
        .isInt({ min: 2000 })
        .withMessage("year must be 2000 or later")
        .bail()
        .toInt()
        .custom(async (year, { req }) => {
            const { business } = req.body;
            if (!isValidMongoId(business)) return;
            if (await AnnualInspection.exists({ business, year })) {
                throw new Error(`this business already has a ${year} application`);
            }
        }),
    ...annualInspectionFields(),
]);

export const validateAnnualInspectionUpdateInput = withValidationErrors([
    requiredTextField("businessName").optional(),
    ...businessDetails(),
    ...annualInspectionFields(),
]);

export const validateAnnualInspectionListQuery = validateListQuery([
    idFilter("business"),
    query("year").optional().isInt().withMessage("invalid year").toInt(),
    enumFilter("businessType", BUSINESS_TYPES),
    enumFilter("occupancyDivision", OCCUPANCY_DIVISIONS),
    enumFilter("status", ANNUAL_INSPECTION_STATUSES),
    query("onHold").optional().isIn(["true", "false"]).withMessage("invalid onHold"),
]);

export const validateHoldInput = withValidationErrors([requiredTextField("reason")]);

// Loads the entry once so the handlers after it can read req.annualInspection.
export const loadAnnualInspection = async (req, res, next) => {
    const annualInspection = await AnnualInspection.findById(
        req.params.annualInspectionId,
    );
    if (!annualInspection) {
        throw new NotFoundError(
            `No annual inspection with id ${req.params.annualInspectionId}`,
        );
    }
    req.annualInspection = annualInspection;
    next();
};
