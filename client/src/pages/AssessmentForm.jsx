import { newKey } from "../../utils/newKey";
import { PiCalculator, PiCheck, PiPlus } from "react-icons/pi";
import { useEffect, useMemo, useState } from "react";
import { Form, Link, redirect, useActionData, useLoaderData, useNavigation } from "react-router-dom";
import { toast } from "react-toastify";
import { FeeChecklist, FormBox, FormError, RecordPicker } from "../components";
import { RECORD_TYPES } from "../constants/registers";
import { FEE_CATEGORIES } from "../../../utils/constants.js";
import { checklistFees, CHECKLISTS, itemAmount } from "../../../utils/feeSchedule.js";
import customFetch from "../../utils/customFetch";
import { errorMessage, formatDate, formatPeso, pickerLabel, recordName, sentence } from "../../utils/format";

export const loader = async ({ request, params }) => {
    if (params.id) {
        const { data } = await customFetch.get(`/assessments/${params.id}`);
        return { assessment: data.assessment };
    }
    const search = new URL(request.url).searchParams;
    const type = search.get("type") || "business";
    const recordId = search.get("record");
    const inspection = search.get("inspection") || "";
    if (!recordId || !RECORD_TYPES[type]) return { type, inspection };
    const { data } = await customFetch.get(`${RECORD_TYPES[type].api}/${recordId}`);
    return { type, inspection, picked: { id: recordId, label: pickerLabel(Object.values(data)[0]) } };
};

export const action = async ({ request, params }) => {
    const data = Object.fromEntries(await request.formData());
    data.fees = JSON.parse(data.fees);
    try {
        const { data: saved } = params.id
            ? await customFetch.patch(`/assessments/${params.id}`, data)
            : await customFetch.post("/assessments", data);
        toast("Saved");
        return redirect(`/dashboard/assessments/${saved.assessment._id}`);
    } catch (error) {
        return { error: errorMessage(error) };
    }
};

const newLine = (fee = {}) => ({
    key: newKey(),
    category: fee.category || FEE_CATEGORIES.OTHERS,
    reference: fee.reference ?? "",
    description: fee.description ?? "",
    basis: fee.basis ?? "",
    rate: fee.rate ?? "",
    amount: fee.amount ?? "",
});

const round2 = (value) => Math.round(value * 100) / 100;

const lineAmount = ({ amount, basis, rate }) => {
    if (amount !== "") return Number(amount);
    return basis !== "" && rate !== "" ? round2(basis * rate) : 0;
};

// What gets submitted: no blank numbers or row keys
const cleanLine = (line) =>
    Object.fromEntries(
        Object.entries(line).filter(([field, value]) => field !== "key" && value !== ""),
    );

// Saved lines that came from the checklist go back to being ticked items
const picksFromFees = (fees) =>
    Object.fromEntries(
        fees
            .filter((fee) => fee.itemId)
            .map((fee) => [
                fee.itemId,
                { quantity: fee.basis ?? "", units: fee.itemUnits ?? 1, conversion: fee.conversion },
            ]),
    );

// Ticks what the calculator found: the item it names, or one that gives the same
// amount. The rest, like a second size of the same machine, stays as separate lines.
const splitComputed = (sections, fees) => {
    const items = sections.flatMap((section) => section.items);
    const picks = {};
    const others = [];
    for (const fee of fees) {
        if (fee.itemId) {
            const { itemId, itemUnits, conversion, ...line } = fee;
            if (!picks[itemId]) {
                picks[itemId] = { quantity: fee.basis ?? "", units: itemUnits ?? 1, conversion };
            } else {
                others.push(itemUnits ? { ...line, basis: itemUnits, rate: round2(fee.amount / itemUnits) } : line);
            }
            continue;
        }
        const item = items.find(
            (candidate) =>
                candidate.ref === fee.reference &&
                !candidate.perUnit &&
                !picks[candidate.id] &&
                (candidate.kind === "percentOf" || itemAmount(candidate, fee.basis) === fee.amount),
        );
        if (item) picks[item.id] = { quantity: fee.basis ?? "", units: 1 };
        else others.push(fee);
    }
    return { picks, others };
};

const AssessmentForm = () => {
    const { assessment, type: initialType, picked, inspection: initialInspection } = useLoaderData();
    const result = useActionData();
    const navigation = useNavigation();
    const isSaving = navigation.state !== "idle";

    const [type, setType] = useState(assessment?.assessmentType || initialType);
    const [recordId, setRecordId] = useState(assessment?.record?._id || picked?.id || "");
    const [inspectionId, setInspectionId] = useState(assessment?.inspection?._id || initialInspection || "");
    const [inspections, setInspections] = useState([]);
    const sections = CHECKLISTS[type];
    const [picks, setPicks] = useState(() => picksFromFees(assessment?.fees || []));
    const [lines, setLines] = useState(() =>
        assessment ? assessment.fees.filter((fee) => !fee.itemId).map(newLine) : [],
    );
    const [notes, setNotes] = useState([]);
    const [computeError, setComputeError] = useState("");
    // Reopens the checklist's sections around what a computation ticked
    const [computeCount, setComputeCount] = useState(0);

    useEffect(() => {
        if (!recordId) return undefined;
        let ignore = false;
        customFetch.get("/inspections", { params: { record: recordId, status: "inspected", limit: 50 } }).then(({ data }) => {
            if (!ignore) setInspections(data.inspections);
        });
        return () => {
            ignore = true;
        };
    }, [recordId]);

    const compute = async () => {
        setComputeError("");
        try {
            const { data } = await customFetch.get("/assessments/compute-fees", {
                params: {
                    assessmentType: type,
                    record: recordId,
                    ...(inspectionId && { inspection: inspectionId }),
                },
            });
            const { picks: found, others } = splitComputed(sections, data.fees);
            setPicks(found);
            setLines(others.map(newLine));
            setComputeCount((count) => count + 1);
            setNotes(data.notes);
        } catch (error) {
            setComputeError(errorMessage(error));
        }
    };

    const updateLine = (key, field, value) =>
        setLines((rows) =>
            rows.map((row) => {
                if (row.key !== key) return row;
                const next = { ...row, [field]: value };
                // A changed basis or rate replaces the old amount
                if ((field === "basis" || field === "rate") && next.basis !== "" && next.rate !== "") {
                    next.amount = round2(next.basis * next.rate);
                }
                return next;
            }),
        );

    const checklistLines = useMemo(
        () => checklistFees(sections, picks),
        [sections, picks],
    );
    const total =
        checklistLines.reduce((sum, fee) => sum + fee.amount, 0) +
        lines.reduce((sum, line) => sum + lineAmount(line), 0);

    return (
        <Form method="post" className="max-w-[1000px]">
            <h1 className="page-title mb-5">{assessment ? "Edit assessment" : "Assess fees"}</h1>
            <FormError message={result?.error} />

            <FormBox title="Assessment of">
                {assessment ? (
                    <div className="cell" style={{ "--span": 4 }}>
                        <span className="cell-label">{RECORD_TYPES[type].label}</span>
                        <div className="cell-value">
                            <span className="serial mr-2">{assessment.record?.serialNumber}</span>
                            {recordName(assessment.record)}
                        </div>
                    </div>
                ) : (
                    <>
                        <label className="cell" style={{ "--span": 2 }}>
                            <span className="cell-label">Type</span>
                            <select
                                name="assessmentType"
                                className="cell-input"
                                value={type}
                                onChange={(event) => {
                                    setType(event.target.value);
                                    setPicks({});
                                    setLines([]);
                                    setNotes([]);
                                    setRecordId("");
                                    setInspectionId("");
                                    setInspections([]);
                                }}
                            >
                                {Object.entries(RECORD_TYPES).map(([key, { label }]) => (
                                    <option key={key} value={key}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                        </label>
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
                                onChange={(id) => {
                                    setRecordId(id);
                                    setInspectionId("");
                                    if (!id) setInspections([]);
                                }}
                            />
                        </div>
                    </>
                )}
                <label className="cell" style={{ "--span": assessment ? 2 : 6 }}>
                    <span className="cell-label">Based on inspection</span>
                    <select
                        name="inspection"
                        className="cell-input"
                        value={inspectionId}
                        onChange={(event) => setInspectionId(event.target.value)}
                    >
                        <option value="">Latest, or none</option>
                        {inspections.map((inspection) => (
                            <option key={inspection._id} value={inspection._id}>
                                {formatDate(inspection.dateOfInspection) || "Undated"}
                            </option>
                        ))}
                    </select>
                </label>
            </FormBox>

            <FormBox title="Schedule of fees checklist" plain>
                    <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2">
                        <button type="button" className="btn" onClick={compute} disabled={!recordId}>
                            <PiCalculator />
                            Compute from schedule of fees
                        </button>
                        <span className="cell-hint !mt-0">
                            Fills what it can from the {type === "business" ? "inspection" : "permit"}, or tick items yourself.
                        </span>
                    </div>
                    {computeError && <p className="mb-3 text-sm text-stamp">{computeError}</p>}
                    {notes.length > 0 && (
                        <div className="mb-3 rounded-lg bg-caution-soft px-3.5 py-2.5 text-sm text-ink">
                            <p className="font-semibold">Check by hand</p>
                            <ul className="mt-1 list-disc space-y-0.5 pl-4">
                                {notes.map((note) => (
                                    <li key={note}>{note}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    <FeeChecklist key={`${type}-${computeCount}`} sections={sections} picks={picks} onPicksChange={setPicks} />
            </FormBox>

            <FormBox title="Other fees" plain>
                <div className="overflow-x-auto">
                    <table className="ledger min-w-[780px]">
                        <thead>
                            <tr>
                                <th className="w-[170px]">Category</th>
                                <th className="w-[90px]">Sec.</th>
                                <th>Description</th>
                                <th className="num w-[90px]">Basis</th>
                                <th className="num w-[90px]">Rate</th>
                                <th className="num w-[120px]">Amount</th>
                                <th className="w-[60px]" />
                            </tr>
                        </thead>
                        <tbody>
                            {lines.map((line) => (
                                <tr key={line.key}>
                                    <td>
                                        <select
                                            aria-label="Category"
                                            className="cell-input"
                                            value={line.category}
                                            onChange={(event) => updateLine(line.key, "category", event.target.value)}
                                        >
                                            {Object.values(FEE_CATEGORIES).map((option) => (
                                                <option key={option} value={option}>
                                                    {sentence(option)}
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                    {["reference", "description"].map((field) => (
                                        <td key={field}>
                                            <input
                                                aria-label={field}
                                                className="cell-input"
                                                value={line[field]}
                                                onChange={(event) => updateLine(line.key, field, event.target.value)}
                                            />
                                        </td>
                                    ))}
                                    {["basis", "rate", "amount"].map((field) => (
                                        <td key={field} className="num">
                                            <input
                                                aria-label={field}
                                                type="number"
                                                min="0"
                                                step="any"
                                                className="cell-input text-right"
                                                value={line[field]}
                                                onChange={(event) => updateLine(line.key, field, event.target.value)}
                                            />
                                        </td>
                                    ))}
                                    <td>
                                        <button
                                            type="button"
                                            className="text-link cursor-pointer text-sm"
                                            onClick={() => setLines((rows) => rows.filter((row) => row.key !== line.key))}
                                        >
                                            Remove
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {lines.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="text-ink-2">
                                        No other fees. Add a line for anything not on the checklist.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colSpan={5} className="pt-2 text-right font-semibold">
                                    Total, with checklist
                                </td>
                                <td className="num pt-2 text-[15px] font-semibold">{formatPeso(total)}</td>
                                <td />
                            </tr>
                        </tfoot>
                    </table>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button" className="btn" onClick={() => setLines((rows) => [...rows, newLine()])}>
                        <PiPlus />
                        Add line
                    </button>
                </div>
            </FormBox>

            <FormBox title="Remarks">
                <label className="cell" style={{ "--span": 6 }}>
                    <span className="cell-label">Remarks</span>
                    <textarea name="remarks" rows={2} className="cell-input" defaultValue={assessment?.remarks || ""} />
                </label>
            </FormBox>

            <input type="hidden" name="fees" value={JSON.stringify([...checklistLines, ...lines.map(cleanLine)])} />

            <div className="fee-total-bar">
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                    <PiCheck />
                    {isSaving ? "Saving" : "Save assessment"}
                </button>
                <Link to={assessment ? `/dashboard/assessments/${assessment._id}` : "/dashboard/assessments"} className="text-link text-sm">
                    Cancel
                </Link>
                <strong data-total>Total {formatPeso(total)}</strong>
            </div>
        </Form>
    );
};

export default AssessmentForm;
