import { body } from "express-validator";
import { withValidationErrors } from "../validationMiddleware.js";
import { NotFoundError } from "../../errors/customErrors.js";
import Item from "../../models/Item.js";

export const validateItemInput = withValidationErrors([
    body("name").trim().notEmpty().withMessage("name is required"),
    body("description").optional().trim(),
]);

export const validateItemUpdateInput = withValidationErrors([
    body("name")
        .optional()
        .trim()
        .notEmpty()
        .withMessage("name cannot be empty"),
    body("description").optional().trim(),
]);

// Loads the item once so the handlers after it can read req.item.
export const loadItem = async (req, res, next) => {
    const item = await Item.findById(req.params.itemId);
    if (!item) throw new NotFoundError(`No item with id ${req.params.itemId}`);
    req.item = item;
    next();
};
