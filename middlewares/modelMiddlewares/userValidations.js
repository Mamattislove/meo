import { body } from "express-validator";
import { withValidationErrors } from "../validationMiddleware.js";
import { NotFoundError } from "../../errors/customErrors.js";
import User from "../../models/User.js";
import { USER_ROLES } from "../../utils/constants.js";

const notTakenByAnother = (field) => async (value, { req }) => {
    const user = await User.findOne({ [field]: value });
    if (user && !user._id.equals(req.params.userId)) {
        throw new Error(`that ${field} is already in use`);
    }
};

export const validateUserUpdateInput = withValidationErrors([
    body("username")
        .optional()
        .isString()
        .withMessage("username must be text")
        .bail()
        .trim()
        .notEmpty()
        .withMessage("username cannot be empty")
        .bail()
        .custom(notTakenByAnother("username")),
    body("email")
        .optional()
        .isEmail()
        .withMessage("invalid email format")
        .bail()
        .custom(notTakenByAnother("email")),
    body("password")
        .optional()
        .isString()
        .withMessage("password must be text")
        .isLength({ min: 8 })
        .withMessage("password must be at least 8 characters"),
    body("confirmPassword")
        .custom(
            (confirmPassword, { req }) =>
                req.body.password === undefined || confirmPassword === req.body.password,
        )
        .withMessage("password and confirm password are not equal"),
    body("role")
        .optional()
        .isIn(Object.values(USER_ROLES))
        .withMessage("invalid role")
        .bail()
        // Otherwise the only admin could lock everyone out of admin routes
        .custom(
            (role, { req }) =>
                req.params.userId !== req.user.userId || role === req.user.role,
        )
        .withMessage("you cannot change your own role"),
]);

// Named targetUser because req.user is the logged-in user.
export const loadUser = async (req, res, next) => {
    const targetUser = await User.findById(req.params.userId);
    if (!targetUser) throw new NotFoundError(`No user with id ${req.params.userId}`);
    req.targetUser = targetUser;
    next();
};
