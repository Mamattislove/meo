import { withValidationErrors } from "../validationMiddleware.js";
import { NotFoundError } from "../../errors/customErrors.js";
import Business from "../../models/Business.js";
import { BARANGAYS } from "../../utils/constants.js";
import {
    coordinateField,
    enumField,
    enumFilter,
    requiredTextField,
    textField,
    validateListQuery,
} from "./fieldValidators.js";

const businessFields = () => [
    enumField("barangay", BARANGAYS),
    coordinateField("businessCoordinate"),
    textField("businessOwner"),
    textField("ownerAddress"),
    textField("ownerContact"),
];

export const validateBusinessInput = withValidationErrors([
    requiredTextField("businessName"),
    ...businessFields(),
]);

export const validateBusinessUpdateInput = withValidationErrors([
    requiredTextField("businessName").optional(),
    ...businessFields(),
]);

export const validateBusinessListQuery = validateListQuery([
    enumFilter("barangay", BARANGAYS),
]);

// Loads the business once so the handlers after it can read req.business.
export const loadBusiness = async (req, res, next) => {
    const business = await Business.findById(req.params.businessId);
    if (!business) {
        throw new NotFoundError(`No business with id ${req.params.businessId}`);
    }
    req.business = business;
    next();
};
