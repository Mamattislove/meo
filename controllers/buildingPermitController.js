import { StatusCodes } from "http-status-codes";
import Assessment from "../models/Assessment.js";
import BuildingPermit from "../models/BuildingPermit.js";
import ElectricalPermit from "../models/ElectricalPermit.js";
import { BadRequestError } from "../errors/customErrors.js";
import { validatedBody } from "../middlewares/validationMiddleware.js";
import {
    BUILDING_PERMIT_DOCUMENT_FIELDS,
    removeUploadedFile,
    updateWithDocuments,
    uploadedDocuments,
} from "../middlewares/uploadMiddleware.js";
import { hasDoneInspection, removeOpenInspections } from "../utils/inspectionRecords.js";
import { listRecords } from "../utils/listRecords.js";

export const getAllBuildingPermits = async (req, res) => {
    const { docs: buildingPermits, ...pagination } = await listRecords(
        req,
        BuildingPermit,
        { searchFields: ["serialNumber", "projectTitle", "ownerName"] },
    );
    res.status(StatusCodes.OK).json({ buildingPermits, ...pagination });
};

export const createBuildingPermit = async (req, res) => {
    const buildingPermit = await BuildingPermit.create({
        ...validatedBody(req),
        ...uploadedDocuments(req),
    });
    res.status(StatusCodes.CREATED).json({ buildingPermit });
};

export const getBuildingPermit = async (req, res) => {
    res.status(StatusCodes.OK).json({ buildingPermit: req.buildingPermit });
};

export const updateBuildingPermit = async (req, res) => {
    await updateWithDocuments(req.buildingPermit, validatedBody(req), req);
    res.status(StatusCodes.OK).json({ buildingPermit: req.buildingPermit });
};

export const deleteBuildingPermit = async (req, res) => {
    const { buildingPermit } = req;
    const record = buildingPermit._id;
    const inUse = await Promise.all([
        hasDoneInspection(record),
        Assessment.exists({ record }),
        ElectricalPermit.exists({ buildingPermit: record }),
    ]);
    if (inUse.some(Boolean)) {
        throw new BadRequestError(
            "this permit has inspections, assessments or electrical permits and cannot be deleted",
        );
    }
    await buildingPermit.deleteOne();
    await removeOpenInspections(record);
    await Promise.all(
        BUILDING_PERMIT_DOCUMENT_FIELDS.map((field) =>
            removeUploadedFile(buildingPermit[field]),
        ),
    );
    res.status(StatusCodes.OK).json({ msg: "building permit deleted" });
};
