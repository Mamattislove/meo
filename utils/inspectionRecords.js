import Inspection from "../models/Inspection.js";
import { removeUploadedFile } from "../middlewares/uploadMiddleware.js";
import { INSPECTION_STATUSES } from "./constants.js";

export const fileUrlsOf = (inspection) => [
    ...inspection.images,
    ...inspection.videos,
    ...(inspection.machineries || []).map((machine) => machine.imageUrl),
];

// Only a finished inspection stops a record being deleted
export const hasDoneInspection = (record) =>
    Inspection.exists({ record, status: INSPECTION_STATUSES.INSPECTED });

// Removes the requests still attached to a record that is being deleted
export const removeOpenInspections = async (record) => {
    const inspections = await Inspection.find({ record });
    await Inspection.deleteMany({ record });
    await Promise.all(inspections.flatMap(fileUrlsOf).map(removeUploadedFile));
};
