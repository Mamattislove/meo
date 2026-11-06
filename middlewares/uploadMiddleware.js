import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import multer from "multer";
import { BadRequestError } from "../errors/customErrors.js";

const DEFAULT_UPLOAD_DIR = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../uploads"
);

// Read at call time: .env is loaded in server.js after this module is imported.
export const getUploadDir = () =>
    process.env.UPLOAD_DIR
        ? path.resolve(process.env.UPLOAD_DIR)
        : DEFAULT_UPLOAD_DIR;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Lease documents submitted with each year's AIF logbook entry
export const ANNUAL_INSPECTION_DOCUMENT_FIELDS = [
    "contractOfLease",
    "businessPermitOfLessor",
    "occupancyPermitOfLessor",
];

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = getUploadDir();
        fs.promises
            .mkdir(dir, { recursive: true })
            .then(() => cb(null, dir))
            .catch(cb);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `${file.fieldname}-${Date.now()}-${crypto.randomUUID()}${ext}`);
    },
});

const fileFilter = (req, file, cb) => {
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
        return cb(new BadRequestError("Only JPG, PNG, or WEBP images are allowed"));
    }
    cb(null, true);
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: MAX_FILE_SIZE },
});

export const BUILDING_PERMIT_DOCUMENT_FIELDS = [
    "transferCertificateOfTitle",
    "taxDeclaration",
    "realPropertyTaxReceipt",
    "barangayClearance",
    "contractOfLease",
    "buildingPlans",
];

export const ELECTRICAL_PERMIT_DOCUMENT_FIELDS = [
    "electricalPlans",
    "billOfMaterials",
    "buildingPermitCopy",
    "transferCertificateOfTitle",
    "electricalEngineerPrcId",
    "certificateOfCompletion",
];

// Builds a middleware that runs multer for the given image fields, turns its
// errors into 400s, and puts each uploaded image's URL on req.body
// (e.g. req.body.contractOfLease = "/uploads/contractOfLease-...jpg").
const createImageUpload = (fields) => {
    const fieldsUpload = upload.fields(
        fields.map((name) => ({ name, maxCount: 1 }))
    );

    return (req, res, next) => {
        fieldsUpload(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                const msg =
                    err.code === "LIMIT_FILE_SIZE"
                        ? "Image must be 5MB or smaller"
                        : err.message;
                return next(new BadRequestError(msg));
            }
            if (err) return next(err);

            for (const field of fields) {
                const file = req.files?.[field]?.[0];
                if (file) req.body[field] = `/uploads/${file.filename}`;
            }
            next();
        });
    };
};

export const uploadAnnualInspectionDocuments = createImageUpload(
    ANNUAL_INSPECTION_DOCUMENT_FIELDS
);
export const uploadBuildingPermitDocuments = createImageUpload(
    BUILDING_PERMIT_DOCUMENT_FIELDS
);
export const uploadElectricalPermitDocuments = createImageUpload(
    ELECTRICAL_PERMIT_DOCUMENT_FIELDS
);

// Inspections take many photos plus videos, so they get their own limits.
const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB; Cloudflare's free plan caps a whole request at 100MB
const INSPECTION_IMAGE_FIELDS = ["images", "machineryImages"];

const inspectionUpload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (file.fieldname === "videos") {
            if (!VIDEO_TYPES.includes(file.mimetype)) {
                return cb(new BadRequestError("Only MP4, WEBM, or MOV videos are allowed"));
            }
            return cb(null, true);
        }
        fileFilter(req, file, cb);
    },
    limits: { fileSize: MAX_VIDEO_SIZE },
}).fields([
    { name: "images", maxCount: 20 },
    { name: "machineryImages", maxCount: 20 },
    { name: "videos", maxCount: 3 },
]);

const toArray = (value) =>
    value === undefined ? [] : Array.isArray(value) ? value : [value];

// Puts the uploaded files' URLs on req.body:
//   images   -> req.body.images = ["/uploads/images-...jpg", ...]
//   videos   -> req.body.videos = ["/uploads/videos-...mp4", ...]
//   machineryItems + machineryImages (+ machineNames, machineryCapacities, machineryQuantities,
//   machineryOldIndexes) -> req.body.machineries = [{ itemId, machineName, imageUrl, capacity, quantity, oldIndex }]
// The Nth entry of each list belongs to the Nth machineryItems entry. If only some
// machines have a new image, machineryImageIndexes says which machine each image is for.
export const uploadInspectionFiles = (req, res, next) => {
    inspectionUpload(req, res, async (err) => {
        if (err instanceof multer.MulterError) {
            const msg =
                err.code === "LIMIT_FILE_SIZE"
                    ? "Video must be 50MB or smaller"
                    : err.message;
            return next(new BadRequestError(msg));
        }
        if (err) return next(err);

        const files = req.files || {};
        const urlsOf = (field) =>
            (files[field] || []).map((file) => `/uploads/${file.filename}`);

        // Multer's limit is sized for videos, so check images separately.
        const oversizedImage = INSPECTION_IMAGE_FIELDS.flatMap(
            (field) => files[field] || []
        ).some((file) => file.size > MAX_FILE_SIZE);
        if (oversizedImage) {
            await Promise.all(
                Object.values(files)
                    .flat()
                    .map((file) => fs.promises.unlink(file.path).catch(() => {}))
            );
            return next(new BadRequestError("Image must be 5MB or smaller"));
        }

        if (files.images) req.body.images = urlsOf("images");
        if (files.videos) req.body.videos = urlsOf("videos");

        // Blank boxes are left out; none left means an empty list
        for (const [field, list] of [
            ["generatorCapacities", "generators"],
            ["transformerCapacities", "transformers"],
        ]) {
            if (req.body[field] !== undefined) {
                req.body[list] = toArray(req.body[field]).filter((amount) => amount !== "");
                delete req.body[field];
            }
        }

        const electronicsItems = toArray(req.body.electronicsItems);
        if (electronicsItems.length) {
            const counts = toArray(req.body.electronicsQuantities);
            req.body.electronics = electronicsItems.map((itemId, i) => ({ itemId, quantity: counts[i] || undefined }));
        }
        const signItems = toArray(req.body.signItems);
        if (signItems.length) {
            const areas = toArray(req.body.signAreas);
            req.body.signs = signItems.map((itemId, i) => ({ itemId, area: areas[i] || undefined }));
        }
        delete req.body.signItems;
        delete req.body.signAreas;
        delete req.body.electronicsItems;
        delete req.body.electronicsQuantities;

        const itemIds = toArray(req.body.machineryItems);
        if (itemIds.length) {
            const machineNames = toArray(req.body.machineNames);
            const oldIndexes = toArray(req.body.machineryOldIndexes);
            const machineryImageUrls = urlsOf("machineryImages");
            const capacities = toArray(req.body.machineryCapacities);
            const quantities = toArray(req.body.machineryQuantities);
            const imageIndexes = toArray(req.body.machineryImageIndexes);
            const imageUrlFor = (i) =>
                machineryImageUrls[
                    imageIndexes.length ? imageIndexes.indexOf(String(i)) : i
                ];
            req.body.machineries = itemIds.map((itemId, i) => ({
                itemId,
                machineName: machineNames[i] || undefined,
                imageUrl: imageUrlFor(i),
                oldIndex: oldIndexes[i] || undefined,
                capacity: capacities[i] === "" ? undefined : capacities[i],
                quantity: quantities[i] || undefined,
            }));
        }
        for (const key of ["machineryItems", "machineNames", "machineryCapacities", "machineryQuantities", "machineryImageIndexes", "machineryOldIndexes"]) {
            delete req.body[key];
        }
        next();
    });
};

// The files uploaded with this request, as { field: url }. Read from req.files
// rather than req.body so a client can't attach a file by typing its URL.
export const uploadedDocuments = (req) =>
    Object.fromEntries(
        Object.entries(req.files || {}).map(([field, [file]]) => [
            field,
            `/uploads/${file.filename}`,
        ])
    );

// Applies validated fields and newly uploaded documents to a record, saves it,
// then deletes the files those documents replaced.
export const updateWithDocuments = async (record, data, req) => {
    const documents = uploadedDocuments(req);
    const replaced = Object.keys(documents).map((field) => record[field]);
    for (const [field, value] of Object.entries({ ...data, ...documents })) {
        record.set(field, value);
    }
    await record.save();
    await Promise.all(replaced.map(removeUploadedFile));
};

// Deletes everything saved by this request; used when the request ends in an error.
export const removeRequestFiles = (req) =>
    Promise.all(
        Object.values(req.files || {})
            .flat()
            .map((file) => fs.promises.unlink(file.path).catch(() => {}))
    );

// Deletes a previously uploaded image, e.g. when replacing or deleting a record.
export const removeUploadedFile = async (url) => {
    if (!url || !url.startsWith("/uploads/")) return;
    const filePath = path.join(getUploadDir(), path.basename(url));
    await fs.promises.unlink(filePath).catch(() => {});
};
