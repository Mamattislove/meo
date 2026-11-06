import { StatusCodes } from "http-status-codes";
import { hashPassword, comparePassword } from "../utils/passwordUtils.js";
import { createJWT } from "../utils/tokenUtils.js";
import { UnauthenticatedError } from "../errors/customErrors.js";
import User from "../models/User.js";

const cookieOptions = (expires) => {
    const secure = process.env.COOKIE_SECURE === "true";
    return {
        httpOnly: true,
        expires,
        secure,
        sameSite: secure ? "strict" : "lax",
    };
};

export const login = async (req, res) => {
    const user = await User.findOne({ username: req.body.username });
    const isValidUser =
        user && (await comparePassword(req.body.password, user.password));
    if (!isValidUser) throw new UnauthenticatedError("invalid credentials");

    const token = createJWT({ userId: user._id, role: user.role });
    const oneDay = 1000 * 60 * 60 * 24;
    res.cookie("token", token, cookieOptions(new Date(Date.now() + oneDay)));

    res.status(StatusCodes.OK).json({ msg: "user logged in", user });
};

// Admin-only: creates another user account.
export const register = async (req, res) => {
    const { confirmPassword, ...data } = req.body;
    data.password = await hashPassword(data.password);
    const user = await User.create(data);
    res.status(StatusCodes.CREATED).json({ user });
};

export const logout = (req, res) => {
    res.cookie("token", "logout", cookieOptions(new Date(Date.now())));
    res.status(StatusCodes.OK).json({ msg: "user logged out!" });
};
