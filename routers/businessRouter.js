import { Router } from "express";
import {
    getAllBusinesses,
    createBusiness,
    getBusiness,
    updateBusiness,
    deleteBusiness,
} from "../controllers/businessController.js";
import { authorizePermission } from "../middlewares/authMiddleware.js";
import { validateIdParam } from "../middlewares/validationMiddleware.js";
import {
    loadBusiness,
    validateBusinessInput,
    validateBusinessListQuery,
    validateBusinessUpdateInput,
} from "../middlewares/modelMiddlewares/businessValidations.js";
import { USER_ROLES } from "../utils/constants.js";

const router = Router();

router
    .route("/")
    .get(validateBusinessListQuery, getAllBusinesses)
    .post(validateBusinessInput, createBusiness);

router
    .route("/:businessId")
    .all(validateIdParam("businessId"), loadBusiness)
    .get(getBusiness)
    .patch(validateBusinessUpdateInput, updateBusiness)
    .delete(authorizePermission(USER_ROLES.ADMIN), deleteBusiness);

export default router;
