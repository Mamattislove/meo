import { Router } from "express";
import {
    getAllElectricalPermits,
    createElectricalPermit,
    getElectricalPermit,
    updateElectricalPermit,
    deleteElectricalPermit,
} from "../controllers/electricalPermitController.js";
import { authorizePermission } from "../middlewares/authMiddleware.js";
import { validateIdParam } from "../middlewares/validationMiddleware.js";
import { uploadElectricalPermitDocuments } from "../middlewares/uploadMiddleware.js";
import {
    loadElectricalPermit,
    validateElectricalPermitInput,
    validateElectricalPermitListQuery,
    validateElectricalPermitUpdateInput,
} from "../middlewares/modelMiddlewares/electricalPermitValidations.js";
import { USER_ROLES } from "../utils/constants.js";

const router = Router();

router
    .route("/")
    .get(validateElectricalPermitListQuery, getAllElectricalPermits)
    .post(
        uploadElectricalPermitDocuments,
        validateElectricalPermitInput,
        createElectricalPermit,
    );

router
    .route("/:electricalPermitId")
    .all(validateIdParam("electricalPermitId"), loadElectricalPermit)
    .get(getElectricalPermit)
    .patch(
        uploadElectricalPermitDocuments,
        validateElectricalPermitUpdateInput,
        updateElectricalPermit,
    )
    .delete(authorizePermission(USER_ROLES.ADMIN), deleteElectricalPermit);

export default router;
