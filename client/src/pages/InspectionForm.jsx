import { PiCheck, PiPlus } from "react-icons/pi";
import { useState } from "react";
import { Form, Link, redirect, useActionData, useLoaderData, useNavigation } from "react-router-dom";
import { toast } from "react-toastify";
import { ElectricalFound, ElectronicsChecklist, FieldCell, FormBox, FormError, InputField, MachineryChecklist, RecordPicker, SignsFound, ValueCell } from "../components";
import { RECORD_TYPES } from "../constants/registers";
import { totalFloorArea } from "../../../utils/feeSchedule.js";
import customFetch from "../../utils/customFetch";
import { dateInputValue, errorMessage, formatTime, inspectionName, pickerLabel, recordName, withoutEmptyFiles } from "../../utils/format";

export const loader = async ({ request, params }) => {
    if (params.id) {
        const { data } = await customFetch.get(`/inspections/${params.id}`);
        const isInspecting = new URL(request.url).pathname.endsWith("/inspect");
        // The Inspect button is what dates the visit, so it can't be skipped
        if (isInspecting && data.inspection.status !== "inspected" && !data.inspection.dateOfInspection) {
            return redirect(`/dashboard/inspections/${params.id}`);
        }
        return { inspection: data.inspection, isInspecting };
    }
    const search = new URL(request.url).searchParams;
    const type = search.get("type") || "business";
    const recordId = search.get("record");
    if (!recordId || !RECORD_TYPES[type]) return { type };
    const { data } = await customFetch.get(`${RECORD_TYPES[type].api}/${recordId}`);
    const record = Object.values(data)[0];
    return {
        type,
        picked: { id: recordId, label: pickerLabel(record) },
        // An AIF application already knows its business's owner and location
        owner: record.business,
    };
};

export const action = async ({ request, params }) => {
    const formData = withoutEmptyFiles(await request.formData());
    // Each mechanical row has its own file input, so say which row each image is for.
    // Empty inputs were removed above, so they're matched by their row's marker.
    for (const index of formData.getAll("rowHasImage")) {
        formData.append("machineryImageIndexes", index);
    }
    formData.delete("rowHasImage");
    try {
        const { data } = params.id
            ? await customFetch.patch(`/inspections/${params.id}`, formData)
            : await customFetch.post("/inspections", formData);
        toast("Saved");
        return redirect(`/dashboard/inspections/${data.inspection._id}`);
    } catch (error) {
        return { error: errorMessage(error) };
    }
};

const InspectionForm = () => {
    const { inspection, isInspecting, type: initialType, picked, owner } = useLoaderData();
    const result = useActionData();
    const navigation = useNavigation();
    const isSaving = navigation.state !== "idle";

    const [type, setType] = useState(inspection?.inspectionType || initialType);
    const [removed, setRemoved] = useState([]);
    const [floors, setFloors] = useState({ area: inspection?.area, numOfStorey: inspection?.numOfStorey });

    const toggleRemoved = (url) =>
        setRemoved((urls) => (urls.includes(url) ? urls.filter((other) => other !== url) : [...urls, url]));

    const value = (name) => inspection?.[name] ?? "";
    const datesLocked = inspection?.status === "inspected";
    const isFinishing = isInspecting && inspection.status === "pending";
    const isAif = type === "business";
    // Once linked, the application identifies the inspection
    const needsIdentity = isAif && !inspection?.record;
    const location = { name: "location", label: "Location", span: 6, type: "coordinate", required: needsIdentity };

    return (
        <Form
            method="post"
            encType="multipart/form-data"
            className="max-w-[1000px]"
            onKeyDown={(event) => {
                // Saving here finishes the inspection, so it takes the button, not a stray Enter
                if (isFinishing && event.key === "Enter" && !["TEXTAREA", "BUTTON"].includes(event.target.tagName)) {
                    event.preventDefault();
                }
            }}
        >
            <h1 className="page-title mb-5">
                {inspection ? `${isInspecting ? "Inspect" : "Edit"}: ${inspectionName(inspection)}` : "Request an inspection"}
            </h1>
            <FormError message={result?.error} />

            {isInspecting && inspection.location?.coordinates && (
                <FormBox title="Where">
                    <ValueCell field={{ name: "location", label: "Location", span: 6, type: "coordinate" }} record={inspection} />
                </FormBox>
            )}

            {!isInspecting && (
                <>
            <FormBox title={inspection ? "Inspection of" : "What will be inspected"}>
                {inspection ? (
                    <div className="cell" style={{ "--span": inspection.record ? 6 : 3 }}>
                        <span className="cell-label">{RECORD_TYPES[type].label}</span>
                        <div className={`cell-value ${inspection.record ? "" : "is-empty"}`}>
                            {inspection.record ? (
                                <>
                                    <span className="serial mr-2">{inspection.record.serialNumber}</span>
                                    {recordName(inspection.record)}
                                </>
                            ) : (
                                "Not yet linked"
                            )}
                        </div>
                    </div>
                ) : (
                    <label className="cell" style={{ "--span": isAif && !picked ? 3 : 2 }}>
                        <span className="cell-label">Type</span>
                        <select
                            name="inspectionType"
                            className="cell-input"
                            value={type}
                            onChange={(event) => setType(event.target.value)}
                        >
                            {Object.entries(RECORD_TYPES).map(([key, { label }]) => (
                                <option key={key} value={key}>
                                    {label}
                                </option>
                            ))}
                        </select>
                    </label>
                )}
                {!inspection && isAif && picked && (
                    <div className="cell" style={{ "--span": 4 }}>
                        <span className="cell-label">AIF application</span>
                        <input type="hidden" name="record" value={picked.id} />
                        <div className="cell-value">{picked.label}</div>
                    </div>
                )}
                {isAif && !picked && !inspection?.record && (
                    <InputField label="Business name (if known)" name="businessName" span={3} defaultValue={value("businessName")} />
                )}
                {!inspection && !isAif && (
                    <div className="cell" style={{ "--span": 4 }}>
                        <span className="cell-label">
                            Record <em>*</em>
                        </span>
                        <RecordPicker
                            key={type}
                            name="record"
                            required
                            api={RECORD_TYPES[type].api}
                            resultsKey={RECORD_TYPES[type].plural}
                            initial={type === initialType ? picked : undefined}
                        />
                    </div>
                )}
                {isAif && <FieldCell field={location} prefill={{ location: inspection?.location || owner?.businessCoordinate }} />}
            </FormBox>

            <FormBox title="Request">
                <InputField label="Requested by" name="requestedBy" required={needsIdentity} span={2} defaultValue={inspection?.requestedBy || owner?.businessOwner || ""} />
                <InputField label="Contact no." name="requestContact" required={needsIdentity} span={2} defaultValue={inspection?.requestContact || owner?.ownerContact || ""} />
                <InputField label="Date requested" name="dateRequested" type="date" span={2} defaultValue={dateInputValue(inspection?.dateRequested || new Date())} />
                {datesLocked ? (
                    <>
                        <ValueCell field={{ name: "preferredDate", label: "Preferred date (locked)", span: 2, type: "date" }} record={inspection} />
                        <ValueCell field={{ name: "preferredTime", label: "Preferred time (locked)", span: 2, show: (record) => formatTime(record.preferredTime) }} record={inspection} />
                    </>
                ) : (
                    <>
                        <InputField label="Preferred date" name="preferredDate" type="date" span={2} defaultValue={dateInputValue(inspection?.preferredDate)} />
                        <InputField label="Preferred time" name="preferredTime" type="time" span={2} defaultValue={value("preferredTime")} />
                    </>
                )}
                <div className="cell cell-filler" style={{ "--span": 2 }} />
            </FormBox>

                </>
            )}

            {isInspecting && (
                <FormBox title="Inspection">
                    {isFinishing && <input type="hidden" name="markInspected" value="true" />}
                    <ValueCell field={{ name: "dateOfInspection", label: "Inspection date", span: 3, type: "date" }} record={inspection} />
                    <ValueCell field={{ name: "inspectedBy", label: "Inspector", span: 3, show: (record) => record.inspectedBy?.username }} record={inspection} />
                </FormBox>
            )}

            {isInspecting && type !== "cfei" && (
                <FormBox title="Found on site">
                    <InputField label="Floor area per storey (sq. m)" name="area" type="number" min="0" step="any" defaultValue={value("area")} span={2} onChange={(event) => setFloors((current) => ({ ...current, area: event.target.value }))} />
                    <InputField label="Storeys" name="numOfStorey" type="number" min="0" defaultValue={value("numOfStorey")} span={2} onChange={(event) => setFloors((current) => ({ ...current, numOfStorey: event.target.value }))} />
                    <InputField label="Plumbing units (toilets)" name="noOfCR" type="number" min="0" defaultValue={value("noOfCR")} span={2} />
                    {floors.area > 0 && floors.numOfStorey > 1 && (
                        <div className="cell text-sm" style={{ "--span": 6 }} data-total-area>
                            Total floor area: {floors.area} × {floors.numOfStorey} storeys = <strong>{totalFloorArea(floors)} sq. m</strong>
                        </div>
                    )}
                </FormBox>
            )}

            {isInspecting && type !== "building" && (
                <FormBox title="Electrical load found">
                    <ElectricalFound inspection={inspection} />
                </FormBox>
            )}

            {isInspecting && type === "business" && (
                <FormBox title="Mechanical (Sec. 11.f)" plain>
                    <MachineryChecklist machineries={inspection.machineries} />
                </FormBox>
            )}

            {isInspecting && type === "business" && (
                <FormBox title="Electronics (Sec. 11.g)" plain>
                    <ElectronicsChecklist electronics={inspection.electronics} />
                </FormBox>
            )}

            {isInspecting && type === "business" && (
                <FormBox title="Signs (Sec. 9.h.iii)" plain>
                    <SignsFound signs={inspection.signs} hasNameSignage={inspection.hasNameSignage} />
                </FormBox>
            )}

            {isInspecting && (
            <FormBox title="Findings">
                <label className="cell" style={{ "--span": 6 }}>
                    <span className="cell-label">Violations or items to comply with</span>
                    <textarea name="findings" rows={3} className="cell-input" defaultValue={value("findings")} />
                </label>
                <label className="cell" style={{ "--span": 6 }}>
                    <span className="cell-label">Remarks</span>
                    <textarea name="remarks" rows={2} className="cell-input" defaultValue={value("remarks")} />
                </label>
            </FormBox>
            )}

            {!isInspecting && (
                <FormBox title="Remarks">
                    <label className="cell" style={{ "--span": 6 }}>
                        <span className="cell-label">Remarks</span>
                        <textarea name="remarks" rows={2} className="cell-input" defaultValue={value("remarks")} />
                    </label>
                </FormBox>
            )}

            {isInspecting && (
            <FormBox title="Photos and video">
                <label className="cell" style={{ "--span": 3 }}>
                    <span className="cell-label">Add photos (up to 20, 5 MB each)</span>
                    <input type="file" name="images" multiple accept="image/jpeg,image/png,image/webp" className="file-input" />
                </label>
                <label className="cell" style={{ "--span": 3 }}>
                    <span className="cell-label">Add videos (up to 3, 50 MB each)</span>
                    <input type="file" name="videos" multiple accept="video/mp4,video/webm,video/quicktime" className="file-input" />
                </label>
                {[...(inspection?.images || []), ...(inspection?.videos || [])].map((url) => (
                    <label key={url} className="cell" style={{ "--span": 2 }}>
                        {inspection.images.includes(url) ? (
                            <img src={url} alt="Inspection" className={`h-24 w-full rounded-md object-cover ${removed.includes(url) ? "opacity-30" : ""}`} />
                        ) : (
                            <video src={url} className={`h-24 w-full object-cover ${removed.includes(url) ? "opacity-30" : ""}`} />
                        )}
                        <span className="mt-1 flex items-center gap-2 text-sm">
                            <input type="checkbox" name="removeFiles" value={url} checked={removed.includes(url)} onChange={() => toggleRemoved(url)} />
                            Remove
                        </span>
                    </label>
                ))}
            </FormBox>
            )}

            <div className="mt-5 flex items-center gap-4">
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                    <PiCheck />
                    {isSaving ? "Saving" : isFinishing ? "Mark as inspected" : inspection ? "Save" : "Save request"}
                </button>
                <Link to={inspection ? `/dashboard/inspections/${inspection._id}` : "/dashboard/inspections"} className="text-link text-sm">
                    Cancel
                </Link>
            </div>
        </Form>
    );
};

export default InspectionForm;
