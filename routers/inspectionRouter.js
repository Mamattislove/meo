import { Router } from "express";
import {
    getAllInspections,
    createInspection,
    getInspection,
    updateInspection,
    startInspection,
    linkApplication,
    cancelInspection,
    deleteInspection,
} from "../controllers/inspectionController.js";
import { authorizePermission } from "../middlewares/authMiddleware.js";
import { validateIdParam } from "../middlewares/validationMiddleware.js";
import { uploadInspectionFiles } from "../middlewares/uploadMiddleware.js";
import {
    loadInspection,
    validateCancelInspectionInput,
    validateInspectionInput,
    validateInspectionListQuery,
    validateInspectionUpdateInput,
    validateLinkInput,
} from "../middlewares/modelMiddlewares/inspectionValidations.js";
import { USER_ROLES } from "../utils/constants.js";

const router = Router();
const adminOnly = authorizePermission(USER_ROLES.ADMIN);
const loaded = [validateIdParam("inspectionId"), loadInspection];

router
    .route("/")
    .get(validateInspectionListQuery, getAllInspections)
    .post(uploadInspectionFiles, validateInspectionInput, createInspection);

router.route("/:inspectionId/inspect").patch(loaded, startInspection);
router.route("/:inspectionId/link").patch(loaded, validateLinkInput, linkApplication);
router.route("/:inspectionId/cancel").patch(adminOnly, loaded, validateCancelInspectionInput, cancelInspection);

router
    .route("/:inspectionId")
    .all(loaded)
    .get(getInspection)
    .patch(uploadInspectionFiles, validateInspectionUpdateInput, updateInspection)
    .delete(adminOnly, deleteInspection);

export default router;
