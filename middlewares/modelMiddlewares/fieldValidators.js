import { body, query } from "express-validator";
import { isValidMongoId, withValidationErrors } from "../validationMiddleware.js";
import AnnualInspection from "../../models/AnnualInspection.js";
import BuildingPermit from "../../models/BuildingPermit.js";
import ElectricalPermit from "../../models/ElectricalPermit.js";
import { ASSESSMENT_TYPES } from "../../utils/constants.js";

// The model `record` points to, for each Inspection.inspectionType and
// Assessment.assessmentType (both use the same values)
export const RECORD_MODELS = {
    [ASSESSMENT_TYPES.BUSINESS]: AnnualInspection,
    [ASSESSMENT_TYPES.BUILDING]: BuildingPermit,
    [ASSESSMENT_TYPES.CFEI]: ElectricalPermit,
};

// Forms send "" for an empty input. It skips validation, and validatedBody then
// turns it into a cleared field. (A number 0 also skips, and is stored as it is.)
export const BLANK_OK = { values: "falsy" };

export const textField = (name) =>
    body(name).optional(BLANK_OK).isString().withMessage(`${name} must be text`).trim();

// Add .optional() on update routes: may be left out, but not emptied.
export const requiredTextField = (name) =>
    body(name)
        .isString()
        .withMessage(`${name} is required`)
        .trim()
        .notEmpty()
        .withMessage(`${name} is required`);

export const enumField = (name, constants) =>
    body(name)
        .optional(BLANK_OK)
        .isIn(Object.values(constants))
        .withMessage(`invalid ${name}`);

export const numberField = (name) =>
    body(name)
        .optional(BLANK_OK)
        .isFloat({ min: 0 })
        .withMessage(`${name} must be a number, 0 or more`)
        .toFloat();

export const dateField = (name) =>
    body(name)
        .optional(BLANK_OK)
        .isISO8601({ strict: true })
        .withMessage(`${name} must be a valid date`)
        .toDate();

// Multipart forms can only send text, so a coordinate may arrive as a JSON string
export const parseJson = (value) => {
    if (typeof value !== "string") return value;
    try {
        return JSON.parse(value);
    } catch {
        return value;
    }
};

const isGeoJsonPoint = (value) => {
    const [longitude, latitude] = Array.isArray(value?.coordinates)
        ? value.coordinates
        : [];
    return (
        value?.type === "Point" &&
        value.coordinates?.length === 2 &&
        Number.isFinite(longitude) &&
        Number.isFinite(latitude) &&
        Math.abs(longitude) <= 180 &&
        Math.abs(latitude) <= 90
    );
};

export const coordinateField = (name) =>
    body(name)
        .optional(BLANK_OK)
        .customSanitizer(parseJson)
        .custom(isGeoJsonPoint)
        .withMessage(`${name} must be a GeoJSON Point: [longitude, latitude]`);

// `chain` is e.g. body("business"), with .optional(BLANK_OK) if it isn't required
export const referenceTo = (chain, Model, name) =>
    chain.custom(async (id) => {
        if (!isValidMongoId(id) || !(await Model.exists({ _id: id }))) {
            throw new Error(`${name} not found`);
        }
    });

// The record of an inspection or assessment. Its model depends on typeField,
// which is validated by its own chain.
export const recordReference = (chain, typeField) =>
    chain.custom(async (id, { req, location }) => {
        const type = req[location][typeField];
        if (!Object.hasOwn(RECORD_MODELS, type)) return;
        const found =
            isValidMongoId(id) && (await RECORD_MODELS[type].exists({ _id: id }));
        if (!found) throw new Error(`no ${type} record found with that id`);
    });

// List filters
export const enumFilter = (name, constants) =>
    query(name)
        .optional()
        .isIn(Object.values(constants))
        .withMessage(`invalid ${name}`);

export const idFilter = (name) =>
    query(name)
        .optional()
        .custom(isValidMongoId)
        .withMessage(`invalid ${name}`);

const isPositiveInt = (value) => typeof value === "string" && /^[1-9]\d*$/.test(value);

export const validateListQuery = (filters = []) =>
    withValidationErrors([
        query("page")
            .optional()
            .custom(isPositiveInt)
            .withMessage("page must be a positive number")
            .toInt(),
        query("limit")
            .optional()
            .custom((value) => isPositiveInt(value) && Number(value) <= 100)
            .withMessage("limit must be between 1 and 100")
            .toInt(),
        query("search").optional().isString().withMessage("search must be text").trim(),
        ...filters,
    ]);
