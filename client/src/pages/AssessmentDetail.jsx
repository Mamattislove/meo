import { PiArrowLeft, PiMoney, PiPencilSimple, PiPrinter, PiProhibit } from "react-icons/pi";
import { Form, Link, redirect, useActionData, useLoaderData, useNavigation } from "react-router-dom";
import { toast } from "react-toastify";
import { ConfirmDelete, FormError, InputField } from "../components";
import { RECORD_TYPES } from "../constants/registers";
import customFetch from "../../utils/customFetch";
import { errorMessage, formatDate, formatPeso, recordName } from "../../utils/format";

export const loader = async ({ params }) => {
    const { data } = await customFetch.get(`/assessments/${params.id}`);
    return data;
};

export const action = async ({ request, params }) => {
    const { intent, ...data } = Object.fromEntries(await request.formData());
    const url = `/assessments/${params.id}`;
    try {
        if (intent === "delete") {
            await customFetch.delete(url);
            toast("Deleted");
            return redirect("/dashboard/assessments");
        }
        await customFetch.patch(`${url}/${intent}`, data);
        toast(intent === "pay" ? "Payment recorded" : "Assessment cancelled");
        return null;
    } catch (error) {
        return { error: errorMessage(error) };
    }
};

const STAMP_COLORS = { paid: "text-pass", cancelled: "text-stamp" };

// The order of payment, laid out to be printed and handed to the applicant.
const AssessmentDetail = () => {
    const { assessment } = useLoaderData();
    const result = useActionData();
    const navigation = useNavigation();
    const isBusy = navigation.state !== "idle";
    const { record, status } = assessment;
    const recordType = RECORD_TYPES[assessment.assessmentType];
    const isOpen = status === "assessed";

    return (
        <div className="max-w-[860px]">
            <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3">
                <Link to="/dashboard/assessments" className="text-link back-link text-sm">
                    <PiArrowLeft />
                    Assessments
                </Link>
                <div className="flex gap-2">
                    <button type="button" className="btn" onClick={() => window.print()}>
                        <PiPrinter />
                        Print
                    </button>
                    {isOpen && (
                        <Link to="edit" className="btn no-underline">
                            <PiPencilSimple />
                            Edit
                        </Link>
                    )}
                    {status === "cancelled" && <ConfirmDelete />}
                </div>
            </div>

            <FormError message={result?.error} />

            <article className="relative rounded-[10px] border border-rule bg-sheet p-5 sm:p-8 print:border-0 print:p-0">
                <header className="flex items-start justify-between gap-4 border-b border-rule pb-4">
                    <div>
                        <p className="text-sm text-ink-2">Office of the Building Official</p>
                        <h1 className="page-title mt-1">Order of payment</h1>
                    </div>
                    {status !== "assessed" && (
                        <span className={`stamp mt-1 ${STAMP_COLORS[status]}`}>{status}</span>
                    )}
                </header>

                <dl className="grid gap-x-8 gap-y-3 py-4 text-sm sm:grid-cols-2">
                    <div>
                        <dt className="cell-label">{recordType.label}</dt>
                        <dd>
                            <Link to={`/dashboard/${recordType.path}/${record?._id}`} className="no-underline">
                                <span className="serial mr-2">{record?.serialNumber}</span>
                                {recordName(record)}
                            </Link>
                        </dd>
                    </div>
                    <div>
                        <dt className="cell-label">Date assessed</dt>
                        <dd>
                            {formatDate(assessment.dateAssessed)}
                            {assessment.assessedBy && `, by ${assessment.assessedBy.username}`}
                        </dd>
                    </div>
                    {assessment.orNumber && (
                        <div>
                            <dt className="cell-label">Official receipt</dt>
                            <dd>
                                <span className="serial">{assessment.orNumber}</span>, {formatDate(assessment.datePaid)}
                            </dd>
                        </div>
                    )}
                    {assessment.remarks && (
                        <div>
                            <dt className="cell-label">Remarks</dt>
                            <dd>{assessment.remarks}</dd>
                        </div>
                    )}
                </dl>

                <div className="overflow-x-auto">
                    <table className="ledger ledger-flat">
                        <thead>
                            <tr>
                                <th>Sec.</th>
                                <th>Particulars</th>
                                <th className="num">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {assessment.fees.map((fee, index) => (
                                <tr key={index}>
                                    <td className="whitespace-nowrap text-ink-2 tabular-nums">{fee.reference}</td>
                                    <td>
                                        {fee.description || fee.category}
                                        {fee.description && <span className="block text-[13px] text-ink-2 first-letter:uppercase">{fee.category}</span>}
                                    </td>
                                    <td className="num whitespace-nowrap">{formatPeso(fee.amount)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colSpan={2} className="!border-b-0 pt-3 text-right font-semibold">
                                    Total amount due
                                </td>
                                <td className="num whitespace-nowrap !border-b-[3px] !border-double !border-b-ink pt-3 text-[17px] font-semibold">
                                    {formatPeso(assessment.totalAmount)}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <div className="mt-14 hidden grid-cols-2 gap-12 text-center text-sm print:grid">
                    <div className="border-t border-ink pt-1">Assessed by</div>
                    <div className="border-t border-ink pt-1">Building Official</div>
                </div>
            </article>

            {isOpen && record?.onHold && (
                <p className="no-print mt-4 rounded-lg bg-caution-soft px-3.5 py-2.5 text-sm">
                    This application is on hold. Resume it before recording payment.
                </p>
            )}

            {isOpen && !record?.onHold && (
                <Form method="post" className="form-box no-print mt-4">
                    <input type="hidden" name="intent" value="pay" />
                    <h2 className="form-box-heading"><PiMoney />Record payment</h2>
                    <div className="cells">
                        <InputField label="O.R. number" name="orNumber" required span={3} />
                        <InputField label="Date paid" name="datePaid" type="date" span={3} />
                    </div>
                    <button type="submit" className="btn btn-primary mt-3" disabled={isBusy}>
                        <PiMoney />
                        Record payment
                    </button>
                </Form>
            )}

            {status !== "cancelled" && (
                <details className="no-print mt-6">
                    <summary className="cursor-pointer text-sm text-ink-2">Cancel this assessment</summary>
                    <Form method="post" className="mt-3">
                        <input type="hidden" name="intent" value="cancel" />
                        <div className="cells">
                            <InputField label="Reason" name="remarks" span={6} />
                        </div>
                        <button type="submit" className="btn btn-danger mt-3" disabled={isBusy}>
                            <PiProhibit />
                            Cancel assessment
                        </button>
                    </Form>
                </details>
            )}
        </div>
    );
};

export default AssessmentDetail;
