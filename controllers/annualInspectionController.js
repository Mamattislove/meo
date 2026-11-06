import { StatusCodes } from "http-status-codes";
import AnnualInspection from "../models/AnnualInspection.js";
import Assessment from "../models/Assessment.js";
import Business from "../models/Business.js";
import Inspection from "../models/Inspection.js";
import { BadRequestError } from "../errors/customErrors.js";
import { validatedBody } from "../middlewares/validationMiddleware.js";
import {
    ANNUAL_INSPECTION_DOCUMENT_FIELDS,
    removeUploadedFile,
    updateWithDocuments,
    uploadedDocuments,
} from "../middlewares/uploadMiddleware.js";
import { ANNUAL_INSPECTION_STATUSES as STATUS, INSPECTION_TYPES } from "../utils/constants.js";
import { hasDoneInspection, removeOpenInspections } from "../utils/inspectionRecords.js";
import { listRecords } from "../utils/listRecords.js";

const BUSINESS_DETAILS = ["businessName", "businessOwner", "ownerContact", "barangay", "businessCoordinate"];

// The application's form holds the business's details too; they're saved on the Business.
const splitBusinessDetails = (body) => {
    const details = {};
    const application = { ...body };
    for (const field of BUSINESS_DETAILS) {
        if (field in application) {
            details[field] = application[field];
            delete application[field];
        }
    }
    return { details, application };
};

const sendList = async (req, res, options) => {
    const { docs: annualInspections, ...pagination } = await listRecords(
        req,
        AnnualInspection,
        {
            searchFields: ["serialNumber"],
            searchRelated: async (pattern) => {
                const businesses = await Business.find({ businessName: pattern }).select("_id");
                return [{ business: { $in: businesses.map(({ _id }) => _id) } }];
            },
            populate: ["business"],
            ...options,
        },
    );
    res.status(StatusCodes.OK).json({ annualInspections, ...pagination });
};

export const getAllAnnualInspections = (req, res) => sendList(req, res);

// Still being worked on
export const getApplications = (req, res) =>
    sendList(req, res, { where: { status: { $ne: STATUS.PAID } } });

// Everything that has been paid, including payments later cancelled, so the
// serial numbers have no gaps
export const getLogbook = (req, res) =>
    sendList(req, res, {
        where: { serialNumber: { $exists: true } },
        sort: { serialNumber: -1 },
    });

export const holdApplication = async (req, res) => {
    const { annualInspection } = req;
    if (annualInspection.status === STATUS.PAID) {
        throw new BadRequestError("this application is already paid");
    }
    if (annualInspection.onHold) {
        throw new BadRequestError("this application is already on hold");
    }
    annualInspection.onHold = true;
    annualInspection.holds.push({
        reason: validatedBody(req).reason,
        heldBy: req.user.userId,
    });
    await annualInspection.save();
    res.status(StatusCodes.OK).json({ annualInspection });
};

export const resumeApplication = async (req, res) => {
    const { annualInspection } = req;
    if (!annualInspection.onHold) {
        throw new BadRequestError("this application is not on hold");
    }
    annualInspection.onHold = false;
    const hold = annualInspection.holds.at(-1);
    hold.resumedAt = new Date();
    hold.resumedBy = req.user.userId;
    await annualInspection.save();
    res.status(StatusCodes.OK).json({ annualInspection });
};

export const createAnnualInspection = async (req, res) => {
    const { business: chosenId, ...body } = validatedBody(req);
    const { details, application } = splitBusinessDetails(body);
    const business = chosenId ? await Business.findById(chosenId) : new Business();
    business.set(details);
    await business.save();
    const annualInspection = await AnnualInspection.create({
        ...application,
        ...uploadedDocuments(req),
        business: business._id,
        receivedBy: req.user.userId,
    });
    // The owner reporting is the request for inspection
    await Inspection.create({
        inspectionType: INSPECTION_TYPES.BUSINESS,
        record: annualInspection._id,
        requestedBy: business.businessOwner,
        requestContact: business.ownerContact,
        // A blank location is still an object on the saved business, so check for its point
        location: business.businessCoordinate?.coordinates?.length ? business.businessCoordinate : undefined,
        dateRequested: annualInspection.dateReceived,
        createdBy: req.user.userId,
    });
    res.status(StatusCodes.CREATED).json({ annualInspection });
};

export const getAnnualInspection = async (req, res) => {
    await req.annualInspection.populate([
        { path: "business" },
        { path: "receivedBy", select: "username" },
        { path: "holds.heldBy", select: "username" },
    ]);
    res.status(StatusCodes.OK).json({ annualInspection: req.annualInspection });
};

export const updateAnnualInspection = async (req, res) => {
    const { details, application } = splitBusinessDetails(validatedBody(req));
    if (Object.keys(details).length) {
        const business = await Business.findById(req.annualInspection.business);
        business.set(details);
        await business.save();
    }
    await updateWithDocuments(req.annualInspection, application, req);
    res.status(StatusCodes.OK).json({ annualInspection: req.annualInspection });
};

export const deleteAnnualInspection = async (req, res) => {
    const { annualInspection } = req;
    if (annualInspection.serialNumber) {
        throw new BadRequestError("this application is in the logbook and cannot be deleted");
    }
    const record = annualInspection._id;
    const inUse = await Promise.all([
        hasDoneInspection(record),
        Assessment.exists({ record }),
    ]);
    if (inUse.some(Boolean)) {
        throw new BadRequestError(
            "this entry has inspections or assessments and cannot be deleted",
        );
    }
    await annualInspection.deleteOne();
    await removeOpenInspections(record);
    await Promise.all(
        ANNUAL_INSPECTION_DOCUMENT_FIELDS.map((field) =>
            removeUploadedFile(annualInspection[field]),
        ),
    );
    res.status(StatusCodes.OK).json({ msg: "annual inspection deleted" });
};
