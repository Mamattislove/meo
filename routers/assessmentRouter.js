import { Router } from "express";
import {
    getAllAssessments,
    computeFees,
    createAssessment,
    getAssessment,
    updateAssessment,
    payAssessment,
    cancelAssessment,
    deleteAssessment,
} from "../controllers/assessmentController.js";
import { authorizePermission } from "../middlewares/authMiddleware.js";
import { validateIdParam } from "../middlewares/validationMiddleware.js";
import {
    loadAssessment,
    validateAssessmentCancelInput,
    validateAssessmentInput,
    validateAssessmentListQuery,
    validateAssessmentPaymentInput,
    validateAssessmentUpdateInput,
    validateComputeFeesQuery,
} from "../middlewares/modelMiddlewares/assessmentValidations.js";
import { USER_ROLES } from "../utils/constants.js";

const router = Router();

router
    .route("/")
    .get(validateAssessmentListQuery, getAllAssessments)
    .post(validateAssessmentInput, createAssessment);

// Must stay above /:assessmentId
router.route("/compute-fees").get(validateComputeFeesQuery, computeFees);

router
    .route("/:assessmentId")
    .all(validateIdParam("assessmentId"), loadAssessment)
    .get(getAssessment)
    .patch(validateAssessmentUpdateInput, updateAssessment)
    .delete(authorizePermission(USER_ROLES.ADMIN), deleteAssessment);

router
    .route("/:assessmentId/pay")
    .patch(
        validateIdParam("assessmentId"),
        loadAssessment,
        validateAssessmentPaymentInput,
        payAssessment,
    );

router
    .route("/:assessmentId/cancel")
    .patch(
        validateIdParam("assessmentId"),
        loadAssessment,
        validateAssessmentCancelInput,
        cancelAssessment,
    );

export default router;
