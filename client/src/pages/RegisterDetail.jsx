import { PiArrowLeft, PiPencilSimple } from "react-icons/pi";
import { Link, redirect, useLoaderData } from "react-router-dom";
import { toast } from "react-toastify";
import { CaseStatus, ConfirmDelete, FormBox, Ledger, ValueCell } from "../components";
import customFetch from "../../utils/customFetch";
import { errorMessage } from "../../utils/format";

export const makeLoader = (register) => async ({ params }) => {
    const { data } = await customFetch.get(`${register.api}/${params.id}`);
    const panels = register.related?.(params.id) || [];
    const related = await Promise.all(
        panels.map(async (panel) => {
            const { data: rows } = await customFetch.get(panel.api, {
                params: { ...panel.params, limit: 50 },
            });
            return { ...panel, rows: rows[panel.plural] };
        }),
    );
    return { record: Object.values(data)[0], related };
};

export const makeAction = (register) => async ({ request, params }) => {
    const { intent, reason } = Object.fromEntries(await request.formData());
    try {
        if (intent === "hold" || intent === "resume") {
            await customFetch.patch(`${register.api}/${params.id}/${intent}`, { reason });
            toast(intent === "hold" ? "Put on hold" : "Resumed");
            return null;
        }
        await customFetch.delete(`${register.api}/${params.id}`);
        toast("Deleted");
        return redirect(`/dashboard/${register.path}`);
    } catch (error) {
        toast(errorMessage(error));
        return null;
    }
};

// A record page: the same boxes as its form, filled in, then everything linked to it.
const RegisterDetail = ({ register }) => {
    const { record, related } = useLoaderData();

    return (
        <div className="max-w-[1000px]">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                <div>
                    <Link to={`/dashboard/${register.path}`} className="text-link back-link text-sm">
                        <PiArrowLeft />
                        {register.title}
                    </Link>
                    {record.serialNumber && <p className="serial mt-3 text-sm text-ink-2">No. {record.serialNumber}</p>}
                    <h1 className="page-title">{register.heading(record)}</h1>
                </div>
                <div className="no-print flex gap-2">
                    <Link to="edit" className="btn no-underline">
                        <PiPencilSimple />
                        Edit
                    </Link>
                    <ConfirmDelete />
                </div>
            </div>

            {register.showsCaseStatus && <CaseStatus record={record} />}

            {register.boxes.map(({ title, fields }) => (
                <FormBox key={title} title={title}>
                    {fields.map((field) => (
                        <ValueCell key={field.name} field={field} record={register.shownRecord ? register.shownRecord(record) : record} />
                    ))}
                </FormBox>
            ))}

            {register.documents && (
                <FormBox title="Documents submitted">
                    {register.documents.map(({ name, label }) => (
                        <div key={name} className="cell" style={{ "--span": 2 }}>
                            <span className="cell-label">{label}</span>
                            {record[name] ? (
                                <a href={record[name]} target="_blank" rel="noreferrer" className="block">
                                    <img src={record[name]} alt={label} className="h-28 w-full rounded-md border border-rule object-cover" />
                                </a>
                            ) : (
                                <div className="cell-value is-empty">Not submitted</div>
                            )}
                        </div>
                    ))}
                </FormBox>
            )}

            {related.map((panel) => (
                <section key={panel.title} className="mt-9">
                    <div className="mb-2 flex items-end justify-between gap-3">
                        <h2 className="section-title">{panel.title}</h2>
                        {(panel.canAdd?.(panel.rows, record) ?? true) && (
                            <Link to={panel.newLink} className="text-link no-print text-sm">
                                {panel.newLabel}
                            </Link>
                        )}
                    </div>
                    {panel.rows.length ? (
                        <div className="max-md:overflow-x-auto">
                            <Ledger
                                columns={panel.columns}
                                rows={panel.rows}
                                rowLink={(row) => `/dashboard/${panel.path}/${row._id}`}
                            />
                        </div>
                    ) : (
                        <p className="empty-note">None yet.</p>
                    )}
                </section>
            ))}
        </div>
    );
};

export default RegisterDetail;
