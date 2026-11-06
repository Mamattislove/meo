import { StatusCodes } from "http-status-codes";
import AnnualInspection from "../models/AnnualInspection.js";
import Business from "../models/Business.js";
import { BadRequestError } from "../errors/customErrors.js";
import { validatedBody } from "../middlewares/validationMiddleware.js";
import { listRecords } from "../utils/listRecords.js";

export const getAllBusinesses = async (req, res) => {
    const { docs: businesses, ...pagination } = await listRecords(req, Business, {
        searchFields: ["businessName", "businessOwner"],
    });
    res.status(StatusCodes.OK).json({ businesses, ...pagination });
};

export const createBusiness = async (req, res) => {
    const business = await Business.create(validatedBody(req));
    res.status(StatusCodes.CREATED).json({ business });
};

export const getBusiness = async (req, res) => {
    res.status(StatusCodes.OK).json({ business: req.business });
};

export const updateBusiness = async (req, res) => {
    for (const [field, value] of Object.entries(validatedBody(req))) {
        req.business.set(field, value);
    }
    await req.business.save();
    res.status(StatusCodes.OK).json({ business: req.business });
};

export const deleteBusiness = async (req, res) => {
    if (await AnnualInspection.exists({ business: req.business._id })) {
        throw new BadRequestError("this business has logbook entries and cannot be deleted");
    }
    await req.business.deleteOne();
    res.status(StatusCodes.OK).json({ msg: "business deleted" });
};
