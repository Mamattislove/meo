import { withValidationErrors } from "../validationMiddleware.js";
import { NotFoundError } from "../../errors/customErrors.js";
import BuildingPermit from "../../models/BuildingPermit.js";
import {
    BARANGAYS,
    BUILDING_PERMIT_TYPES,
    CHARACTERS_OF_OCCUPANCY,
    LOT_OWNERSHIPS,
    OCCUPANCY_DIVISIONS,
    SCOPES_OF_WORK,
} from "../../utils/constants.js";
import {
    coordinateField,
    dateField,
    enumField,
    enumFilter,
    numberField,
    requiredTextField,
    textField,
    validateListQuery,
} from "./fieldValidators.js";

const buildingPermitFields = () => [
    enumField("permitType", BUILDING_PERMIT_TYPES),
    dateField("dateFiled"),
    textField("projectTitle"),
    enumField("scopeOfWork", SCOPES_OF_WORK),
    enumField("characterOfOccupancy", CHARACTERS_OF_OCCUPANCY),
    enumField("occupancyDivision", OCCUPANCY_DIVISIONS),
    enumField("barangay", BARANGAYS),
    textField("projectAddress"),
    coordinateField("projectCoordinate"),
    textField("lotNumber"),
    textField("blockNumber"),
    textField("tctNumber"),
    textField("taxDeclarationNumber"),
    enumField("lotOwnership", LOT_OWNERSHIPS),
    numberField("numberOfStoreys"),
    numberField("totalFloorArea"),
    numberField("lotArea"),
    numberField("estimatedCost"),
    textField("ownerAddress"),
    textField("ownerContact"),
    textField("engineerName"),
    textField("engineerPrcNumber"),
];

export const validateBuildingPermitInput = withValidationErrors([
    requiredTextField("ownerName"),
    ...buildingPermitFields(),
]);

export const validateBuildingPermitUpdateInput = withValidationErrors([
    requiredTextField("ownerName").optional(),
    ...buildingPermitFields(),
]);

export const validateBuildingPermitListQuery = validateListQuery([
    enumFilter("permitType", BUILDING_PERMIT_TYPES),
    enumFilter("scopeOfWork", SCOPES_OF_WORK),
    enumFilter("characterOfOccupancy", CHARACTERS_OF_OCCUPANCY),
    enumFilter("occupancyDivision", OCCUPANCY_DIVISIONS),
    enumFilter("barangay", BARANGAYS),
]);

// Loads the permit once so the handlers after it can read req.buildingPermit.
export const loadBuildingPermit = async (req, res, next) => {
    const buildingPermit = await BuildingPermit.findById(req.params.buildingPermitId);
    if (!buildingPermit) {
        throw new NotFoundError(
            `No building permit with id ${req.params.buildingPermitId}`,
        );
    }
    req.buildingPermit = buildingPermit;
    next();
};
