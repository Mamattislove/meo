import { StatusCodes } from "http-status-codes";
import User from "../models/User.js";
import AnnualInspection from "../models/AnnualInspection.js";
import Assessment from "../models/Assessment.js";
import Inspection from "../models/Inspection.js";
import { BadRequestError, NotFoundError } from "../errors/customErrors.js";
import { validatedBody } from "../middlewares/validationMiddleware.js";
import { hashPassword } from "../utils/passwordUtils.js";

export const getCurrentUser = async (req, res) => {
    const user = await User.findById(req.user.userId);
    if (!user) throw new NotFoundError("user not found");
    res.status(StatusCodes.OK).json({ user });
};

export const getAllUsers = async (req, res) => {
    const users = await User.find().sort({ username: 1 });
    res.status(StatusCodes.OK).json({ users });
};

export const getUser = async (req, res) => {
    res.status(StatusCodes.OK).json({ user: req.targetUser });
};

export const updateUser = async (req, res) => {
    const { confirmPassword, ...data } = validatedBody(req);
    if (data.password) data.password = await hashPassword(data.password);
    for (const [field, value] of Object.entries(data)) {
        req.targetUser.set(field, value);
    }
    await req.targetUser.save();
    res.status(StatusCodes.OK).json({ user: req.targetUser });
};

export const deleteUser = async (req, res) => {
    const { targetUser } = req;
    if (targetUser._id.equals(req.user.userId)) {
        throw new BadRequestError("you cannot delete your own account");
    }
    // Keeps "inspected by" / "assessed by" history intact
    const hasRecords = await Promise.all([
        AnnualInspection.exists({ receivedBy: targetUser._id }),
        Inspection.exists({ inspectedBy: targetUser._id }),
        Assessment.exists({ assessedBy: targetUser._id }),
        Inspection.exists({ createdBy: targetUser._id }),
    ]);
    if (hasRecords.some(Boolean)) {
        throw new BadRequestError("this user has records and cannot be deleted");
    }
    await targetUser.deleteOne();
    res.status(StatusCodes.OK).json({ msg: "user deleted" });
};
