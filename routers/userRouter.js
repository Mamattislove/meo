import { Router } from "express";
import {
    getCurrentUser,
    getAllUsers,
    getUser,
    updateUser,
    deleteUser,
} from "../controllers/userController.js";
import { authorizePermission } from "../middlewares/authMiddleware.js";
import { validateIdParam } from "../middlewares/validationMiddleware.js";
import {
    loadUser,
    validateUserUpdateInput,
} from "../middlewares/modelMiddlewares/userValidations.js";
import { USER_ROLES } from "../utils/constants.js";

const router = Router();

router.route("/current-user").get(getCurrentUser);
router.route("/").get(authorizePermission(USER_ROLES.ADMIN), getAllUsers);
router
    .route("/:userId")
    .all(
        authorizePermission(USER_ROLES.ADMIN),
        validateIdParam("userId"),
        loadUser,
    )
    .get(getUser)
    .patch(validateUserUpdateInput, updateUser)
    .delete(deleteUser);

export default router;
