import { Router } from "express";
import {
    getAllAnnualInspections,
    getApplications,
    getLogbook,
    holdApplication,
    resumeApplication,
    createAnnualInspection,
    getAnnualInspection,
    updateAnnualInspection,
    deleteAnnualInspection,
} from "../controllers/annualInspectionController.js";
import { authorizePermission } from "../middlewares/authMiddleware.js";
import { validateIdParam } from "../middlewares/validationMiddleware.js";
import { uploadAnnualInspectionDocuments } from "../middlewares/uploadMiddleware.js";
import {
    loadAnnualInspection,
    validateAnnualInspectionInput,
    validateAnnualInspectionListQuery,
    validateAnnualInspectionUpdateInput,
    validateHoldInput,
} from "../middlewares/modelMiddlewares/annualInspectionValidations.js";
import { USER_ROLES } from "../utils/constants.js";

const router = Router();

router
    .route("/")
    .get(validateAnnualInspectionListQuery, getAllAnnualInspections)
    .post(
        uploadAnnualInspectionDocuments,
        validateAnnualInspectionInput,
        createAnnualInspection,
    );

// These must stay above /:annualInspectionId
router.route("/applications").get(validateAnnualInspectionListQuery, getApplications);
router.route("/logbook").get(validateAnnualInspectionListQuery, getLogbook);

router
    .route("/:annualInspectionId/hold")
    .patch(
        validateIdParam("annualInspectionId"),
        loadAnnualInspection,
        validateHoldInput,
        holdApplication,
    );

router
    .route("/:annualInspectionId/resume")
    .patch(validateIdParam("annualInspectionId"), loadAnnualInspection, resumeApplication);

router
    .route("/:annualInspectionId")
    .all(validateIdParam("annualInspectionId"), loadAnnualInspection)
    .get(getAnnualInspection)
    .patch(
        uploadAnnualInspectionDocuments,
        validateAnnualInspectionUpdateInput,
        updateAnnualInspection,
    )
    .delete(authorizePermission(USER_ROLES.ADMIN), deleteAnnualInspection);

export default router;
