import { Router } from "express";
import rateLimit from "express-rate-limit";
import { register, login, logout } from "../controllers/authController.js";
import {
    validateAuthLoginInput,
    validateAuthRegisterInput,
} from "../middlewares/validationMiddleware.js";
import {
    authenticateUser,
    authorizePermission,
} from "../middlewares/authMiddleware.js";
import { USER_ROLES } from "../utils/constants.js";

const router = Router();

// Brute-force guard on the only unauthenticated write endpoint.
// Behind a reverse proxy, set `app.set("trust proxy", n)` in server.js.
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    skipSuccessfulRequests: true,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { msg: "too many login attempts, try again in 15 minutes" },
});

router
    .route("/register")
    .post(
        authenticateUser,
        authorizePermission(USER_ROLES.ADMIN),
        validateAuthRegisterInput,
        register,
    );
router.route("/login").post(loginLimiter, validateAuthLoginInput, login);
router.route("/logout").get(logout);

export default router;
