import { PiArrowLeft, PiCalculator, PiClipboardText, PiFilePlus, PiPencilSimple, PiProhibit } from "react-icons/pi";
import { Form, Link, redirect, useActionData, useLoaderData, useNavigation, useRouteLoaderData } from "react-router-dom";
import { toast } from "react-toastify";
import { ConfirmDelete, FormBox, FormError, InputField, RecordPicker, Status, ValueCell } from "../components";
import { RECORD_TYPES } from "../constants/registers";
import { acUnitsText, ANNUAL_MECHANICAL, conversionText, ELECTRONICS, machineSize, SIGN_RENEWALS, totalFloorArea } from "../../../utils/feeSchedule.js";
import customFetch from "../../utils/customFetch";
import { errorMessage, formatDate, formatTime, inspectionName, recordName } from "../../utils/format";

export const loader = async ({ params }) => {
    const { data } = await customFetch.get(`/inspections/${params.id}`);
    const recordId = data.inspection.record?._id;
    const fees = recordId
        ? (await customFetch.get("/assessments", { params: { record: recordId, limit: 50 } })).data.assessments
        : [];
    return {
        ...data,
        canAssess:
            data.inspection.status === "inspected" &&
            !data.inspection.record?.onHold &&
            fees.every(({ status }) => status === "cancelled"),
    };
};

export const action = async ({ request, params }) => {
    const { intent, ...data } = Object.fromEntries(await request.formData());
    const url = `/inspections/${params.id}`;
    try {
        if (intent === "inspect") {
            await customFetch.patch(`${url}/inspect`);
            return redirect(`/dashboard/inspections/${params.id}/inspect`);
        }
        if (intent === "link") {
            await customFetch.patch(`${url}/link`, data);
            toast("Application linked");
            return null;
        }
        if (intent === "cancel") {
            await customFetch.patch(`${url}/cancel`, data);
            toast("Inspection cancelled");
            return null;
        }
        await customFetch.delete(url);
        toast("Deleted");
        return redirect("/dashboard/inspections");
    } catch (error) {
        return { error: errorMessage(error) };
    }
};

const cell = (name, label, span = 1) => ({ name, label, span });

// "50 + 30 = 80" when several were found
const addedUp = (list, total) => (list?.length > 1 ? `${list.join(" + ")} = ${total}` : total);

const whenText = (date, time) => [formatDate(date), formatTime(time)].filter(Boolean).join(", ");

const Fact = ({ label, children }) => (
    <div className="cell" style={{ "--span": 2 }}>
        <span className="cell-label">{label}</span>
        <div className={`cell-value ${children ? "" : "is-empty"}`}>{children || "None"}</div>
    </div>
);

const InspectionDetail = () => {
    const { inspection, canAssess } = useLoaderData();
    const { user } = useRouteLoaderData("dashboard");
    const result = useActionData();
    const navigation = useNavigation();
    const isBusy = navigation.state !== "idle";
    const isAdmin = user.role === "admin";
    const { record, inspectionType: type, status } = inspection;
    const recordType = RECORD_TYPES[type];
    const isOpen = status === "pending";
    const needsLink = isOpen && !record;

    return (
        <div className="max-w-[1000px]">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                <div>
                    <Link to="/dashboard/inspections" className="text-link back-link text-sm">
                        <PiArrowLeft />
                        Inspections
                    </Link>
                    <h1 className="page-title mt-2">{inspectionName(inspection)}</h1>
                </div>
                <div className="no-print flex gap-2">
                    {status !== "cancelled" && (
                        <Link to="edit" className="btn no-underline">
                            <PiPencilSimple />
                            Edit
                        </Link>
                    )}
                    {isOpen && record && (
                        <Form method="post">
                            <input type="hidden" name="intent" value="inspect" />
                            <button type="submit" className="btn btn-primary" disabled={isBusy}>
                                <PiClipboardText />
                                Inspect
                            </button>
                        </Form>
                    )}
                    {status === "inspected" && (
                        <Link to="inspect" className="btn btn-primary no-underline">
                            <PiPencilSimple />
                            Edit findings
                        </Link>
                    )}
                    {isAdmin && <ConfirmDelete />}
                </div>
            </div>

            <FormError message={result?.error} />

            <FormBox title="Inspection">
                <div className="cell" style={{ "--span": 2 }}>
                    <span className="cell-label">Status</span>
                    <div className="cell-value">
                        <Status value={status} />
                    </div>
                </div>
                <Fact label="Inspection date">{status === "inspected" && formatDate(inspection.dateOfInspection)}</Fact>
                <Fact label="Inspector">{status === "inspected" && inspection.inspectedBy?.username}</Fact>
                <div className="cell" style={{ "--span": 6 }}>
                    <span className="cell-label">{recordType.label}</span>
                    <div className={`cell-value ${record ? "" : "is-empty"}`}>
                        {record ? (
                            <Link to={`/dashboard/${recordType.path}/${record._id}`} className="text-link">
                                <span className="serial mr-2">{record.serialNumber}</span>
                                {recordName(record)}
                            </Link>
                        ) : (
                            "Not yet linked"
                        )}
                    </div>
                </div>
                {inspection.location?.coordinates && (
                    <ValueCell field={{ name: "location", label: "Location", span: 6, type: "coordinate" }} record={inspection} />
                )}
                {inspection.cancelReason && <Fact label="Reason cancelled">{inspection.cancelReason}</Fact>}
            </FormBox>

            {needsLink && (
                <Form method="post" className="form-box mb-3.5">
                    <input type="hidden" name="intent" value="link" />
                    <h2 className="form-box-heading"><PiFilePlus />Create the AIF application</h2>
                    <p className="cell-hint !mt-0 mb-3">
                        Needed before this can be inspected. Choose the business, or enter a new one to add it with the details above.
                    </p>
                    <div className="cells">
                        <div className="cell" style={{ "--span": 2 }}>
                            <span className="cell-label">Existing business</span>
                            <RecordPicker name="business" api="/businesses" resultsKey="businesses" placeholder="Type a name" />
                        </div>
                        <InputField label="Or new business name" name="businessName" span={2} defaultValue={inspection.businessName || ""} />
                        <InputField label="Year" name="year" type="number" required span={2} defaultValue={new Date().getFullYear()} />
                    </div>
                    <button type="submit" className="btn btn-primary mt-4" disabled={isBusy}>
                        <PiFilePlus />
                        Create application
                    </button>
                </Form>
            )}

            <FormBox title="Request">
                <Fact label="Requested by">{inspection.requestedBy}</Fact>
                <Fact label="Contact no.">{inspection.requestContact}</Fact>
                <Fact label="Date requested">{formatDate(inspection.dateRequested)}</Fact>
                <Fact label="Preferred date and time">{whenText(inspection.preferredDate, inspection.preferredTime)}</Fact>
                <Fact label="Recorded by">{inspection.createdBy?.username}</Fact>
                <div className="cell cell-filler" style={{ "--span": 2 }} />
            </FormBox>

            {type !== "cfei" && (
                <FormBox title="Found on site">
                    {[
                        {
                            ...cell("area", "Floor area (sq. m)", 2),
                            show: ({ area, numOfStorey }) =>
                                area && numOfStorey > 1
                                    ? `${area} × ${numOfStorey} storeys = ${totalFloorArea({ area, numOfStorey })}`
                                    : area,
                        },
                        cell("numOfStorey", "Storeys", 2),
                        cell("noOfCR", "Plumbing units (toilets)", 2),
                        ...(type === "business"
                            ? [{
                                ...cell("hasNameSignage", "Signage with the business name", 6),
                                show: ({ hasNameSignage: has }) => (has === undefined ? "" : has ? "Yes" : "No"),
                            }]
                            : []),
                    ].map((field) => (
                        <ValueCell key={field.name} field={field} record={inspection} />
                    ))}
                </FormBox>
            )}

            {type !== "building" && (
                <FormBox title="Electrical load found">
                    {[
                        {
                            ...cell("totalConnectedLoad", "Connected load (kVA)", 2),
                            show: ({ totalConnectedLoad: kva, connectedLoadConversion: from }) =>
                                from?.from ? conversionText(from, kva) : kva,
                        },
                        {
                            ...cell("totalTransformerCapacity", "Transformers / UPS (kVA)", 2),
                            show: ({ transformers, totalTransformerCapacity: total }) => addedUp(transformers, total),
                        },
                        {
                            ...cell("totalGeneratorCapacity", "Generators (kVA)", 2),
                            show: ({ generators, totalGeneratorCapacity: total }) => addedUp(generators, total),
                        },
                        ...(type === "business"
                            ? [cell("noOfPoles", "Power supply poles", 3), cell("noOfGuyingAttachments", "Guying attachments", 3)]
                            : []),
                    ].map((field) => (
                        <ValueCell key={field.name} field={field} record={inspection} />
                    ))}
                </FormBox>
            )}

            {inspection.machineries.length > 0 && (
                <FormBox title="Mechanical (Sec. 11.f)" plain>
                    <div className="max-md:overflow-x-auto">
                        <table className="ledger">
                            <thead>
                                <tr>
                                    <th>Equipment</th>
                                    <th>Description</th>
                                    <th className="num">Size or count</th>
                                    <th className="num">Units</th>
                                    <th>Photo</th>
                                </tr>
                            </thead>
                            <tbody>
                                {inspection.machineries.map((machine, index) => {
                                    const item = ANNUAL_MECHANICAL.find(({ id }) => id === machine.itemId);
                                    return (
                                    <tr key={index}>
                                        <td>
                                            {item.label}
                                            <span className="fee-row-ref">{item.ref}</span>
                                        </td>
                                        <td>{machine.machineName}</td>
                                        <td className="num">
                                            {machineSize(item, machine)}
                                            {machine.acUnits?.length > 0 && <span className="fee-row-ref">{acUnitsText(machine.acUnits)}</span>}
                                        </td>
                                        <td className="num">{item.perUnit && machine.quantity}</td>
                                        <td>
                                            {machine.imageUrl && (
                                                <a href={machine.imageUrl} target="_blank" rel="noreferrer" className="text-link">
                                                    View
                                                </a>
                                            )}
                                        </td>
                                    </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </FormBox>
            )}

            {inspection.electronics.length > 0 && (
                <FormBox title="Electronics (Sec. 11.g)" plain>
                    <div className="max-md:overflow-x-auto">
                        <table className="ledger">
                            <thead>
                                <tr>
                                    <th>Item</th>
                                    <th className="num">Count</th>
                                </tr>
                            </thead>
                            <tbody>
                                {inspection.electronics.map(({ itemId, quantity }) => {
                                    const item = ELECTRONICS.find(({ id }) => id === itemId);
                                    return (
                                        <tr key={itemId}>
                                            <td>
                                                {item.label}
                                                <span className="fee-row-ref">{item.ref}</span>
                                            </td>
                                            <td className="num">{quantity ? `${quantity} ${item.unit}` : ""}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </FormBox>
            )}

            {inspection.signs.length > 0 && (
                <FormBox title="Signs (Sec. 9.h.iii)" plain>
                    <div className="max-md:overflow-x-auto">
                        <table className="ledger">
                            <thead>
                                <tr>
                                    <th>Sign</th>
                                    <th className="num">Display surface</th>
                                </tr>
                            </thead>
                            <tbody>
                                {inspection.signs.map(({ itemId, area }, index) => (
                                    <tr key={index}>
                                        <td>{SIGN_RENEWALS.find(({ id }) => id === itemId).label}</td>
                                        <td className="num">{area ? `${area} sq. m` : ""}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </FormBox>
            )}

            <FormBox title="Findings">
                {[cell("findings", "Violations or items to comply with", 6), cell("remarks", "Remarks", 6)].map((field) => (
                    <ValueCell key={field.name} field={field} record={inspection} />
                ))}
            </FormBox>

            {(inspection.images.length > 0 || inspection.videos.length > 0) && (
                <FormBox title="Photos and video" plain>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {inspection.images.map((url) => (
                            <a key={url} href={url} target="_blank" rel="noreferrer">
                                <img src={url} alt="Taken during the inspection" className="aspect-[4/3] w-full rounded-md object-cover" />
                            </a>
                        ))}
                        {inspection.videos.map((url) => (
                            <video key={url} src={url} controls className="aspect-[4/3] w-full rounded-md bg-black object-cover" />
                        ))}
                    </div>
                </FormBox>
            )}

            {canAssess && (
                <div className="no-print mt-6">
                    <Link
                        to={`/dashboard/assessments/new?type=${type}&record=${record?._id}&inspection=${inspection._id}`}
                        className="text-link back-link"
                    >
                        <PiCalculator />
                        Assess fees from this inspection
                    </Link>
                </div>
            )}

            {isOpen && isAdmin && (
                <details className="no-print mt-6">
                    <summary className="cursor-pointer text-sm text-ink-2">Cancel this inspection</summary>
                    <Form method="post" className="mt-3">
                        <input type="hidden" name="intent" value="cancel" />
                        <div className="cells">
                            <InputField label="Reason" name="reason" span={6} />
                        </div>
                        <button type="submit" className="btn btn-danger mt-3" disabled={isBusy}>
                            <PiProhibit />
                            Cancel inspection
                        </button>
                    </Form>
                </details>
            )}
        </div>
    );
};

export default InspectionDetail;
