import { body, matchedData, param, validationResult } from "express-validator";
import mongoose from "mongoose";
import { BadRequestError } from "../errors/customErrors.js";
import User from "../models/User.js";
import { USER_ROLES } from "../utils/constants.js";

export const withValidationErrors = (validateValues) => {
    return [
        ...validateValues,
        (req, res, next) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                const errorMessages = errors.array().map((error) => error.msg);
                throw new BadRequestError(errorMessages.join(", "));
            }
            next();
        },
    ];
};

// The body fields this route's validators cover, so anything else a client sends
// (serialNumber, totalAmount, ...) is ignored. A blank value becomes undefined,
// which clears that field on update.
export const validatedBody = (req) => {
    const data = matchedData(req, { locations: ["body"], includeOptionals: true });
    return Object.fromEntries(
        Object.entries(data)
            .filter(([key]) => key in req.body)
            .map(([key, value]) => [
                key,
                value === "" || value === null ? undefined : value,
            ]),
    );
};

export const isValidMongoId = (id) => mongoose.Types.ObjectId.isValid(id);

// Usage: router.route("/:itemId").all(validateIdParam("itemId"), ...)
export const validateIdParam = (name = "id") =>
    withValidationErrors([
        param(name).custom(isValidMongoId).withMessage("invalid Mongo ID"),
    ]);

export const validateAuthRegisterInput = withValidationErrors([
    body("username")
        .trim()
        .notEmpty()
        .withMessage("username is required")
        .custom(async (username) => {
            const user = await User.findOne({ username });
            if (user) throw new Error("that username is already in use");
        }),
    body("email")
        .notEmpty()
        .withMessage("email is required")
        .isEmail()
        .withMessage("invalid email format")
        .custom(async (email) => {
            const user = await User.findOne({ email });
            if (user) throw new Error("that email is already in use");
        }),
    body("password")
        .isLength({ min: 8 })
        .withMessage("password must be at least 8 characters"),
    body("confirmPassword")
        .custom((confirmPassword, { req }) => confirmPassword === req.body.password)
        .withMessage("password and confirm password are not equal"),
    body("role")
        .optional()
        .isIn(Object.values(USER_ROLES))
        .withMessage("invalid role"),
]);

export const validateAuthLoginInput = withValidationErrors([
    body("username").trim().notEmpty().withMessage("username is required"),
    body("password").notEmpty().withMessage("password is required"),
]);
