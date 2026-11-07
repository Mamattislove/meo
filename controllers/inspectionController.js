import { StatusCodes } from "http-status-codes";
import AnnualInspection from "../models/AnnualInspection.js";
import Assessment from "../models/Assessment.js";
import Business from "../models/Business.js";
import Inspection from "../models/Inspection.js";
import { BadRequestError } from "../errors/customErrors.js";
import { validatedBody } from "../middlewares/validationMiddleware.js";
import { removeUploadedFile } from "../middlewares/uploadMiddleware.js";
import { requireNotOnHold, syncCaseStatus } from "../utils/annualInspectionCase.js";
import {
    ANNUAL_INSPECTION_STATUSES,
    ASSESSMENT_STATUSES,
    INSPECTION_STATUSES as STATUS,
    INSPECTION_TYPES,
} from "../utils/constants.js";
import { acUnitTons, toKva } from "../utils/feeSchedule.js";
import { fileUrlsOf } from "../utils/inspectionRecords.js";
import { listRecords } from "../utils/listRecords.js";

const DAY = 24 * 60 * 60 * 1000;

const POPULATE = [
    { path: "record", populate: { path: "business", strictPopulate: false } },
    { path: "inspectedBy", select: "username" },
];

// Dates are stored as midnight UTC of the calendar day, and the office runs on
// Philippine time wherever the server is.
const todayInOffice = () =>
    new Date(new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format());

const VIEWS = {
    today: () => {
        const today = todayInOffice();
        return {
            status: STATUS.PENDING,
            preferredDate: { $gte: today, $lt: new Date(today.getTime() + DAY) },
        };
    },
    overdue: () => ({ status: STATUS.PENDING, preferredDate: { $lt: todayInOffice() } }),
    undated: () => ({ status: STATUS.PENDING, preferredDate: null }),
    upcoming: () => ({ status: STATUS.PENDING, preferredDate: { $gte: todayInOffice() } }),
};

const uploadedUrls = (req, field) =>
    (req.files?.[field] || []).map((file) => `/uploads/${file.filename}`);

const syncCase = ({ inspectionType, record }) =>
    inspectionType === INSPECTION_TYPES.BUSINESS && record ? syncCaseStatus(record) : undefined;

const sameDay = (a, b) => (a ? new Date(a).getTime() : null) === (b ? new Date(b).getTime() : null);

// Once an inspection is done, the date and time asked for are part of the record.
const requireDatesUnchanged = (inspection, body) => {
    if (inspection.status !== STATUS.INSPECTED) return;
    const dateChanged = "preferredDate" in body && !sameDay(inspection.preferredDate, body.preferredDate);
    const timeChanged = "preferredTime" in body && (inspection.preferredTime || "") !== (body.preferredTime || "");
    if (dateChanged || timeChanged) {
        throw new BadRequestError("the dates are locked once the inspection is done");
    }
};

// Air conditioning entered in HP: the tons always follow from it
const applyAcUnits = (machineries) =>
    machineries?.map((machine) =>
        machine.acUnits?.length ? { ...machine, capacity: acUnitTons(machine.acUnits) } : machine,
    );

// A connected load given as kW or a breaker size: the kVA always follows from it
const applyConnectedLoad = (data) => {
    if (!("connectedLoadConversion" in data)) return;
    if (data.connectedLoadConversion) data.totalConnectedLoad = toKva(data.connectedLoadConversion);
    else data.connectedLoadConversion = undefined;
};

// The inspector has been: note who and when, if not already given.
const finishInspection = (inspection, userId) => {
    // Every business is checked for a name signage (an inspection with no application
    // yet is refused by the model, with its own message)
    if (inspection.inspectionType === INSPECTION_TYPES.BUSINESS && inspection.record && typeof inspection.hasNameSignage !== "boolean") {
        throw new BadRequestError("answer whether it has a signage with the business name");
    }
    inspection.status = STATUS.INSPECTED;
    if (!inspection.inspectedBy) inspection.inspectedBy = userId;
    if (!inspection.dateOfInspection) inspection.dateOfInspection = todayInOffice();
};

export const getAllInspections = async (req, res) => {
    const { docs: inspections, ...pagination } = await listRecords(req, Inspection, {
        searchFields: ["businessName", "requestedBy", "requestContact"],
        populate: POPULATE,
        sort: req.query.view ? { preferredDate: 1, preferredTime: 1 } : { _id: -1 },
        // view is a shortcut, not a field of the model
        translate: (filter) => {
            const { view } = filter;
            delete filter.view;
            if (view) Object.assign(filter, VIEWS[view]());
        },
    });
    res.status(StatusCodes.OK).json({ inspections, ...pagination });
};

export const createInspection = async (req, res) => {
    const { markInspected, ...data } = validatedBody(req);
    applyConnectedLoad(data);
    if (data.machineries) data.machineries = applyAcUnits(data.machineries);
    const inspection = new Inspection({
        ...data,
        images: uploadedUrls(req, "images"),
        videos: uploadedUrls(req, "videos"),
        createdBy: req.user.userId,
    });
    if (markInspected) finishInspection(inspection, req.user.userId);
    await inspection.save();
    await syncCase(inspection);
    res.status(StatusCodes.CREATED).json({ inspection });
};

export const getInspection = async (req, res) => {
    await req.inspection.populate([...POPULATE, { path: "createdBy", select: "username" }]);
    res.status(StatusCodes.OK).json({ inspection: req.inspection });
};

// New images and videos are added to the existing ones; removeFiles lists any to
// delete. A resent machinery list replaces the old one, and a machine sent without
// a new image keeps the image of the old row it names.
export const updateInspection = async (req, res) => {
    const { inspection } = req;
    if (inspection.status === STATUS.CANCELLED) {
        throw new BadRequestError("this inspection is cancelled");
    }
    const body = validatedBody(req);
    requireDatesUnchanged(inspection, body);
    const { removeFiles = [], markInspected, ...data } = body;
    applyConnectedLoad(data);
    const oldUrls = fileUrlsOf(inspection);
    const isKept = (url) => !removeFiles.includes(url);

    if (data.machineries) {
        const oldMachineries = inspection.machineries;
        data.machineries = applyAcUnits(data.machineries).map(({ oldIndex, ...machine }) => ({
            ...machine,
            imageUrl: machine.imageUrl || oldMachineries[oldIndex]?.imageUrl,
        }));
    }
    for (const [field, value] of Object.entries(data)) {
        inspection.set(field, value);
    }
    if (markInspected && inspection.status === STATUS.PENDING) {
        finishInspection(inspection, req.user.userId);
    }
    inspection.images = [
        ...inspection.images.filter(isKept),
        ...uploadedUrls(req, "images"),
    ];
    inspection.videos = [
        ...inspection.videos.filter(isKept),
        ...uploadedUrls(req, "videos"),
    ];
    await inspection.save();
    await syncCase(inspection);

    const newUrls = fileUrlsOf(inspection);
    await Promise.all(
        oldUrls.filter((url) => !newUrls.includes(url)).map(removeUploadedFile),
    );
    res.status(StatusCodes.OK).json({ inspection });
};

// The Inspect button dates the visit. Until it's marked as inspected the latest click counts,
// so a click by mistake is put right by the real one.
export const startInspection = async (req, res) => {
    const { inspection } = req;
    if (inspection.status !== STATUS.PENDING) {
        throw new BadRequestError(`this inspection is already ${inspection.status}`);
    }
    if (!inspection.record) {
        throw new BadRequestError("create the AIF application before inspecting");
    }
    await requireNotOnHold({ assessmentType: inspection.inspectionType, record: inspection.record });
    inspection.dateOfInspection = todayInOffice();
    inspection.inspectedBy = req.user.userId;
    await inspection.save();
    res.status(StatusCodes.OK).json({ inspection });
};

// Gives an inspection that started with no record its AIF application, creating the
// business and the application if they don't exist yet.
export const linkApplication = async (req, res) => {
    const { inspection } = req;
    if (inspection.inspectionType !== INSPECTION_TYPES.BUSINESS || inspection.record) {
        throw new BadRequestError("this inspection is already linked");
    }
    if (inspection.status === STATUS.CANCELLED) {
        throw new BadRequestError("this inspection is cancelled");
    }
    const { business, businessName, year } = validatedBody(req);
    const businessId =
        business ||
        (
            await Business.create({
                businessName,
                businessOwner: inspection.requestedBy,
                ownerContact: inspection.requestContact,
                businessCoordinate: inspection.location,
            })
        )._id;

    let application = await AnnualInspection.findOne({ business: businessId, year });
    if (application?.status === ANNUAL_INSPECTION_STATUSES.PAID) {
        throw new BadRequestError(`this business's ${year} application is already paid`);
    }
    if (application) {
        const open = await Inspection.exists({
            record: application._id,
            status: STATUS.PENDING,
        });
        if (open) {
            throw new BadRequestError(`this business's ${year} application already has an open inspection`);
        }
    } else {
        // A renewal starts from what last year's application said
        const lastYear = await AnnualInspection.findOne({ business: businessId }).sort({ year: -1 });
        application = await AnnualInspection.create({
            business: businessId,
            year,
            occupancyDivision: lastYear?.occupancyDivision,
            businessActivity: lastYear?.businessActivity,
            lessorName: lastYear?.lessorName,
            dateReceived: inspection.dateRequested,
            receivedBy: req.user.userId,
        });
    }
    inspection.record = application._id;
    await inspection.save();
    res.status(StatusCodes.OK).json({ inspection });
};

export const cancelInspection = async (req, res) => {
    const { inspection } = req;
    if (inspection.status === STATUS.CANCELLED || inspection.status === STATUS.INSPECTED) {
        throw new BadRequestError(`this inspection is already ${inspection.status}`);
    }
    inspection.status = STATUS.CANCELLED;
    inspection.cancelReason = validatedBody(req).reason;
    await inspection.save();
    res.status(StatusCodes.OK).json({ inspection });
};

export const deleteInspection = async (req, res) => {
    const { inspection } = req;
    const usedByAssessment = await Assessment.exists({
        inspection: inspection._id,
        status: { $ne: ASSESSMENT_STATUSES.CANCELLED },
    });
    if (usedByAssessment) {
        throw new BadRequestError("this inspection has an active assessment and cannot be deleted");
    }
    await inspection.deleteOne();
    await syncCase(inspection);
    await Promise.all(fileUrlsOf(inspection).map(removeUploadedFile));
    res.status(StatusCodes.OK).json({ msg: "inspection deleted" });
};
