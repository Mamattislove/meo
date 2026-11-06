import { StatusCodes } from "http-status-codes";
import { matchedData } from "express-validator";
import Assessment from "../models/Assessment.js";
import Inspection from "../models/Inspection.js";
import { BadRequestError, UnauthorizedError } from "../errors/customErrors.js";
import { validatedBody } from "../middlewares/validationMiddleware.js";
import { RECORD_MODELS } from "../middlewares/modelMiddlewares/fieldValidators.js";
import {
    ASSESSMENT_STATUSES,
    ASSESSMENT_TYPES,
    INSPECTION_STATUSES,
    USER_ROLES,
} from "../utils/constants.js";
import {
    computeBuildingPermitFees,
    computeBusinessAnnualFees,
    computeElectricalPermitFees,
} from "../utils/feeCalculator.js";
import { listRecords } from "../utils/listRecords.js";
import {
    logPayment,
    requireNotOnHold,
    syncAssessmentCase,
} from "../utils/annualInspectionCase.js";

export const getAllAssessments = async (req, res) => {
    const { docs: assessments, ...pagination } = await listRecords(req, Assessment, {
        searchFields: ["orNumber"],
        populate: [
            { path: "record", populate: { path: "business", strictPopulate: false } },
            { path: "assessedBy", select: "username" },
        ],
    });
    res.status(StatusCodes.OK).json({ assessments, ...pagination });
};

// Proposes fees for a record without saving anything, for the assessor to review
// and then submit to createAssessment. An annual inspection fee is based on the
// given inspection, or the record's latest one.
export const computeFees = async (req, res) => {
    const {
        assessmentType,
        record: recordId,
        inspection: inspectionId,
    } = matchedData(req, { locations: ["query"] });
    const record = await RECORD_MODELS[assessmentType].findById(recordId);

    if (assessmentType === ASSESSMENT_TYPES.BUILDING) {
        return res.status(StatusCodes.OK).json(computeBuildingPermitFees(record));
    }
    if (assessmentType === ASSESSMENT_TYPES.CFEI) {
        return res.status(StatusCodes.OK).json(computeElectricalPermitFees(record));
    }

    const inspection = await Inspection.findOne({
        record: recordId,
        status: INSPECTION_STATUSES.INSPECTED,
        ...(inspectionId && { _id: inspectionId }),
    }).sort({ createdAt: -1 });
    if (!inspection) throw new BadRequestError("this record has no finished inspection yet");

    res.status(StatusCodes.OK).json(computeBusinessAnnualFees(record, inspection));
};

export const createAssessment = async (req, res) => {
    const data = validatedBody(req);
    await requireNotOnHold({ assessmentType: data.assessmentType, record: data.record });
    const assessment = await Assessment.create({
        ...data,
        assessedBy: req.user.userId,
    });
    await syncAssessmentCase(assessment);
    res.status(StatusCodes.CREATED).json({ assessment });
};

export const getAssessment = async (req, res) => {
    await req.assessment.populate([
        { path: "record", populate: { path: "business", strictPopulate: false } },
        { path: "inspection" },
        { path: "assessedBy", select: "username" },
    ]);
    res.status(StatusCodes.OK).json({ assessment: req.assessment });
};

const requireUnpaid = ({ status }) => {
    if (status !== ASSESSMENT_STATUSES.ASSESSED) {
        throw new BadRequestError(`this assessment is already ${status}`);
    }
};

export const updateAssessment = async (req, res) => {
    const { assessment } = req;
    requireUnpaid(assessment);
    for (const [field, value] of Object.entries(validatedBody(req))) {
        assessment.set(field, value);
    }
    await assessment.save();
    res.status(StatusCodes.OK).json({ assessment });
};

export const payAssessment = async (req, res) => {
    const { assessment } = req;
    requireUnpaid(assessment);
    await requireNotOnHold(assessment);
    const { orNumber, datePaid } = validatedBody(req);
    assessment.set({
        status: ASSESSMENT_STATUSES.PAID,
        orNumber,
        datePaid: datePaid || new Date(),
    });
    await assessment.save();
    await logPayment(assessment);
    res.status(StatusCodes.OK).json({ assessment });
};

// Frees the record for a new assessment. Undoing a payment is admin-only.
export const cancelAssessment = async (req, res) => {
    const { assessment } = req;
    if (assessment.status === ASSESSMENT_STATUSES.CANCELLED) {
        throw new BadRequestError("this assessment is already cancelled");
    }
    if (
        assessment.status === ASSESSMENT_STATUSES.PAID &&
        req.user.role !== USER_ROLES.ADMIN
    ) {
        throw new UnauthorizedError("only an admin can cancel a paid assessment");
    }
    const { remarks } = validatedBody(req);
    assessment.status = ASSESSMENT_STATUSES.CANCELLED;
    if (remarks) assessment.remarks = remarks;
    await assessment.save();
    await syncAssessmentCase(assessment);
    res.status(StatusCodes.OK).json({ assessment });
};

// Fee records stay on file: only one that was already cancelled can be deleted.
export const deleteAssessment = async (req, res) => {
    if (req.assessment.status !== ASSESSMENT_STATUSES.CANCELLED) {
        throw new BadRequestError("cancel this assessment before deleting it");
    }
    await req.assessment.deleteOne();
    res.status(StatusCodes.OK).json({ msg: "assessment deleted" });
};
