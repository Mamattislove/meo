import AnnualInspection from "../models/AnnualInspection.js";
import Assessment from "../models/Assessment.js";
import { nextSerial } from "../models/Counter.js";
import Inspection from "../models/Inspection.js";
import { BadRequestError } from "../errors/customErrors.js";
import {
    ANNUAL_INSPECTION_STATUSES as STATUS,
    ASSESSMENT_STATUSES,
    ASSESSMENT_TYPES,
    INSPECTION_STATUSES,
} from "./constants.js";

// Puts an AIF case on the step its inspection and assessment show. Call after
// anything that adds, removes, pays or cancels one of them.
export const syncCaseStatus = async (caseId) => {
    const assessment = await Assessment.findOne({
        record: caseId,
        status: { $ne: ASSESSMENT_STATUSES.CANCELLED },
    });
    let status = STATUS.FOR_INSPECTION;
    if (assessment?.status === ASSESSMENT_STATUSES.PAID) status = STATUS.PAID;
    else if (assessment) status = STATUS.ASSESSED;
    else if (await Inspection.exists({ record: caseId, status: INSPECTION_STATUSES.INSPECTED })) status = STATUS.INSPECTED;
    await AnnualInspection.findByIdAndUpdate(caseId, { status });
};

export const syncAssessmentCase = async ({ assessmentType, record }) => {
    if (assessmentType === ASSESSMENT_TYPES.BUSINESS) await syncCaseStatus(record);
};

// Payment is what puts a case in the logbook, so this is where its serial is assigned.
// A case paid again after a cancellation keeps its number.
export const logPayment = async (assessment) => {
    if (assessment.assessmentType !== ASSESSMENT_TYPES.BUSINESS) return;
    const aifCase = await AnnualInspection.findById(assessment.record);
    if (!aifCase.serialNumber) {
        aifCase.serialNumber = await nextSerial("annual-inspection", aifCase.year);
    }
    aifCase.orNumber = assessment.orNumber;
    aifCase.datePaid = assessment.datePaid;
    aifCase.status = STATUS.PAID;
    await aifCase.save();
};

export const requireNotOnHold = async ({ assessmentType, record }) => {
    if (assessmentType !== ASSESSMENT_TYPES.BUSINESS || !record) return;
    if (await AnnualInspection.exists({ _id: record, onHold: true })) {
        throw new BadRequestError("this application is on hold; resume it first");
    }
};
