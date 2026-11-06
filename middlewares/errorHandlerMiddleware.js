import { StatusCodes } from "http-status-codes";
import { removeRequestFiles } from "./uploadMiddleware.js";

const errorHandlerMiddleware = async (err, req, res, next) => {
    // The upload runs before validation, so a rejected request leaves files behind.
    await removeRequestFiles(req);

    // A unique index caught a duplicate that got past the validators (two
    // requests at once), or Mongoose rejected a value: the client's error, not ours.
    if (err.code === 11000) {
        const fields = Object.keys(err.keyValue || {}).join(", ");
        return res
            .status(StatusCodes.BAD_REQUEST)
            .json({ msg: `that ${fields} is already in use` });
    }
    if (err.name === "ValidationError" || err.name === "CastError") {
        return res.status(StatusCodes.BAD_REQUEST).json({ msg: err.message });
    }

    // Unexpected errors (no status set by us) are logged so they aren't lost.
    if (!err.statusCodes) console.log(err);
    const statusCodes = err.statusCodes || StatusCodes.INTERNAL_SERVER_ERROR;
    const msg = err.message || "something went wrong, try again later";
    res.status(statusCodes).json({ msg });
};

export default errorHandlerMiddleware;
