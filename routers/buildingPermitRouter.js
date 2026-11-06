import { Router } from "express";
import {
    getAllBuildingPermits,
    createBuildingPermit,
    getBuildingPermit,
    updateBuildingPermit,
    deleteBuildingPermit,
} from "../controllers/buildingPermitController.js";
import { authorizePermission } from "../middlewares/authMiddleware.js";
import { validateIdParam } from "../middlewares/validationMiddleware.js";
import { uploadBuildingPermitDocuments } from "../middlewares/uploadMiddleware.js";
import {
    loadBuildingPermit,
    validateBuildingPermitInput,
    validateBuildingPermitListQuery,
    validateBuildingPermitUpdateInput,
} from "../middlewares/modelMiddlewares/buildingPermitValidations.js";
import { USER_ROLES } from "../utils/constants.js";

const router = Router();

router
    .route("/")
    .get(validateBuildingPermitListQuery, getAllBuildingPermits)
    .post(
        uploadBuildingPermitDocuments,
        validateBuildingPermitInput,
        createBuildingPermit,
    );

router
    .route("/:buildingPermitId")
    .all(validateIdParam("buildingPermitId"), loadBuildingPermit)
    .get(getBuildingPermit)
    .patch(
        uploadBuildingPermitDocuments,
        validateBuildingPermitUpdateInput,
        updateBuildingPermit,
    )
    .delete(authorizePermission(USER_ROLES.ADMIN), deleteBuildingPermit);

export default router;
