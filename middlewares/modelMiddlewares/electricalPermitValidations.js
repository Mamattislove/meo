import { body } from "express-validator";
import { withValidationErrors } from "../validationMiddleware.js";
import { NotFoundError } from "../../errors/customErrors.js";
import BuildingPermit from "../../models/BuildingPermit.js";
import ElectricalPermit from "../../models/ElectricalPermit.js";
import {
    BARANGAYS,
    CHARACTERS_OF_OCCUPANCY,
    ELECTRICAL_PERMIT_TYPES,
    ELECTRICAL_SCOPES_OF_WORK,
} from "../../utils/constants.js";
import {
    BLANK_OK,
    coordinateField,
    dateField,
    enumField,
    enumFilter,
    idFilter,
    numberField,
    referenceTo,
    requiredTextField,
    textField,
    validateListQuery,
} from "./fieldValidators.js";

const electricalPermitFields = () => [
    enumField("permitType", ELECTRICAL_PERMIT_TYPES),
    dateField("dateFiled"),
    textField("projectTitle"),
    referenceTo(body("buildingPermit").optional(BLANK_OK), BuildingPermit, "buildingPermit"),
    enumField("scopeOfWork", ELECTRICAL_SCOPES_OF_WORK),
    enumField("characterOfOccupancy", CHARACTERS_OF_OCCUPANCY),
    enumField("barangay", BARANGAYS),
    textField("projectAddress"),
    coordinateField("projectCoordinate"),
    numberField("totalConnectedLoad"),
    numberField("totalTransformerCapacity"),
    numberField("totalGeneratorCapacity"),
    textField("ownerAddress"),
    textField("ownerContact"),
    textField("electricalEngineerName"),
    textField("electricalEngineerPrcNumber"),
    textField("electricalEngineerPtrNumber"),
    dateField("finalInspectionDate"),
    dateField("cfeiDateIssued"),
];

export const validateElectricalPermitInput = withValidationErrors([
    requiredTextField("ownerName"),
    ...electricalPermitFields(),
]);

export const validateElectricalPermitUpdateInput = withValidationErrors([
    requiredTextField("ownerName").optional(),
    ...electricalPermitFields(),
]);

export const validateElectricalPermitListQuery = validateListQuery([
    enumFilter("permitType", ELECTRICAL_PERMIT_TYPES),
    enumFilter("scopeOfWork", ELECTRICAL_SCOPES_OF_WORK),
    enumFilter("characterOfOccupancy", CHARACTERS_OF_OCCUPANCY),
    enumFilter("barangay", BARANGAYS),
    idFilter("buildingPermit"),
]);

// Loads the permit once so the handlers after it can read req.electricalPermit.
export const loadElectricalPermit = async (req, res, next) => {
    const electricalPermit = await ElectricalPermit.findById(
        req.params.electricalPermitId,
    );
    if (!electricalPermit) {
        throw new NotFoundError(
            `No electrical permit with id ${req.params.electricalPermitId}`,
        );
    }
    req.electricalPermit = electricalPermit;
    next();
};
