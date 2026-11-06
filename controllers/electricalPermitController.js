import { StatusCodes } from "http-status-codes";
import Assessment from "../models/Assessment.js";
import ElectricalPermit from "../models/ElectricalPermit.js";
import { BadRequestError } from "../errors/customErrors.js";
import { validatedBody } from "../middlewares/validationMiddleware.js";
import {
    ELECTRICAL_PERMIT_DOCUMENT_FIELDS,
    removeUploadedFile,
    updateWithDocuments,
    uploadedDocuments,
} from "../middlewares/uploadMiddleware.js";
import { hasDoneInspection, removeOpenInspections } from "../utils/inspectionRecords.js";
import { listRecords } from "../utils/listRecords.js";

export const getAllElectricalPermits = async (req, res) => {
    const { docs: electricalPermits, ...pagination } = await listRecords(
        req,
        ElectricalPermit,
        { searchFields: ["serialNumber", "projectTitle", "ownerName"] },
    );
    res.status(StatusCodes.OK).json({ electricalPermits, ...pagination });
};

export const createElectricalPermit = async (req, res) => {
    const electricalPermit = await ElectricalPermit.create({
        ...validatedBody(req),
        ...uploadedDocuments(req),
    });
    res.status(StatusCodes.CREATED).json({ electricalPermit });
};

export const getElectricalPermit = async (req, res) => {
    await req.electricalPermit.populate("buildingPermit");
    res.status(StatusCodes.OK).json({ electricalPermit: req.electricalPermit });
};

export const updateElectricalPermit = async (req, res) => {
    await updateWithDocuments(req.electricalPermit, validatedBody(req), req);
    res.status(StatusCodes.OK).json({ electricalPermit: req.electricalPermit });
};

export const deleteElectricalPermit = async (req, res) => {
    const { electricalPermit } = req;
    const record = electricalPermit._id;
    const inUse = await Promise.all([
        hasDoneInspection(record),
        Assessment.exists({ record }),
    ]);
    if (inUse.some(Boolean)) {
        throw new BadRequestError(
            "this permit has inspections or assessments and cannot be deleted",
        );
    }
    await electricalPermit.deleteOne();
    await removeOpenInspections(record);
    await Promise.all(
        ELECTRICAL_PERMIT_DOCUMENT_FIELDS.map((field) =>
            removeUploadedFile(electricalPermit[field]),
        ),
    );
    res.status(StatusCodes.OK).json({ msg: "electrical permit deleted" });
};
