import { PiBookOpenText, PiBuildings, PiClipboardText, PiClock, PiFileText, PiFiles, PiHourglassMedium, PiLightning, PiMoney, PiPause, PiPlus, PiWarningCircle } from "react-icons/pi";
import { Link, useLoaderData } from "react-router-dom";
import { Ledger } from "../components";
import { assessments, buildingPermits, inspections } from "../constants/registers";
import customFetch from "../../utils/customFetch";
import { formatPeso, longDate } from "../../utils/format";

const TALLIES = [
    { api: "/annual-inspections/applications", label: "Open AIF applications", one: "AIF application", path: "aif-applications", icon: PiFileText },
    { api: "/annual-inspections/logbook", label: "AIF logbook entries", path: "annual-inspections", icon: PiBookOpenText },
    { api: "/building-permits", label: "Building permits", one: "Building permit", path: "building-permits", icon: PiBuildings },
    { api: "/electrical-permits", label: "Electrical permits", one: "Electrical permit", path: "electrical-permits", icon: PiLightning },
    { api: "/inspections", label: "Inspections", one: "Inspection", path: "inspections", icon: PiClipboardText },
];

const list = (api, params) => customFetch.get(api, { params }).then(({ data }) => data);

export const loader = async () => {
    const [tallies, unpaid, permits, today, undated, overdue, onHold] = await Promise.all([
        Promise.all(TALLIES.map(({ api }) => list(api, { limit: 1 }))),
        list("/assessments", { status: "assessed", limit: 8 }),
        list("/building-permits", { limit: 6 }),
        list("/inspections", { view: "today", limit: 20 }),
        list("/inspections", { view: "undated", limit: 8 }),
        list("/inspections", { view: "overdue", limit: 8 }),
        list("/annual-inspections/applications", { onHold: true, limit: 8 }),
    ]);
    const now = Date.now();
    const DAY = 24 * 60 * 60 * 1000;
    onHold.annualInspections = onHold.annualInspections.map((row) => ({
        ...row,
        holdReason: row.holds.at(-1)?.reason,
        daysWaiting: Math.floor((now - new Date(row.holds.at(-1)?.heldAt)) / DAY),
    }));
    return {
        tallies: tallies.map(({ totalItems }, index) => ({ ...TALLIES[index], totalItems })),
        unpaid,
        permits,
        today,
        undated,
        overdue,
        onHold,
    };
};

const Heading = ({ title, to, count, icon: Icon }) => (
    <div className="mb-2 flex items-baseline justify-between gap-3">
        <h2 className="section-title">
            <Icon aria-hidden="true" />
            {title}
        </h2>
        <Link to={to} className="text-link text-[13px] whitespace-nowrap">
            {count > 0 ? `All ${count}` : "Open register"}
        </Link>
    </div>
);

const Empty = ({ children }) => (
    <p className="empty-note">{children}</p>
);

// The first page of the day: what is waiting on the office, not a wall of totals.
const Dashboard = () => {
    const { tallies, unpaid, permits, today, undated, overdue, onHold } = useLoaderData();
    const inspectionLedger = (data, labels) => (
        <Ledger
            columns={pick(inspections, labels)}
            rows={data.inspections}
            rowLink={(row) => `inspections/${row._id}`}
        />
    );
    const pick = (register, labels) =>
        labels.map((label) => register.columns.find((column) => column.label === label));
    const unpaidTotal = unpaid.assessments.reduce((sum, row) => sum + row.totalAmount, 0);

    return (
        <>
            <div className="mb-7">
                <p className="text-sm text-ink-2">{longDate()}</p>
                <h1 className="page-title mt-1">
                    {unpaid.totalItems === 0
                        ? "No orders of payment outstanding"
                        : `${unpaid.totalItems} order${unpaid.totalItems === 1 ? "" : "s"} of payment outstanding`}
                </h1>
            </div>

            <div className="grid gap-x-10 gap-y-9 lg:grid-cols-[minmax(0,1fr)_280px]">
                <div className="min-w-0 space-y-9">
                    <section>
                        <Heading icon={PiClock} title="Preferred for today" to="/dashboard/inspections?view=today" count={today.totalItems} />
                        {today.inspections.length ? (
                            inspectionLedger(today, ["When", "Record", "Requested by"])
                        ) : (
                            <Empty>No inspection is preferred for today.</Empty>
                        )}
                    </section>

                    {overdue.totalItems > 0 && (
                        <section>
                            <Heading icon={PiWarningCircle} title="Past the preferred date" to="/dashboard/inspections?view=overdue" count={overdue.totalItems} />
                            {inspectionLedger(overdue, ["When", "Record", "Requested by"])}
                        </section>
                    )}

                    {undated.totalItems > 0 && (
                        <section>
                            <Heading icon={PiHourglassMedium} title="No preferred date" to="/dashboard/inspections?view=undated" count={undated.totalItems} />
                            {inspectionLedger(undated, ["Record", "Requested by", "Type"])}
                        </section>
                    )}

                    <section>
                        <Heading icon={PiMoney} title="Waiting for payment" to="/dashboard/assessments?status=assessed" count={unpaid.totalItems} />
                        {unpaid.assessments.length ? (
                            <>
                                <Ledger
                                    columns={pick(assessments, ["Record", "Assessed", "Total"]).map((column) =>
                                        column.label === "Assessed" ? { ...column, hideOnPhone: true } : column,
                                    )}
                                    rows={unpaid.assessments}
                                    rowLink={(row) => `assessments/${row._id}`}
                                />
                                {unpaid.totalItems <= unpaid.assessments.length && (
                                    <p className="serial mt-2 pr-3.5 text-right text-sm">Total {formatPeso(unpaidTotal)}</p>
                                )}
                            </>
                        ) : (
                            <Empty>Every order of payment has been settled.</Empty>
                        )}
                    </section>

                    <section>
                        <Heading icon={PiPause} title="On hold" to="/dashboard/aif-applications?onHold=true" count={onHold.totalItems} />
                        {onHold.annualInspections.length ? (
                            <Ledger
                                columns={[
                                    { label: "Business", render: (row) => row.business?.businessName },
                                    { label: "What's missing", render: (row) => row.holdReason },
                                    {
                                        label: "Waiting",
                                        nowrap: true,
                                        render: (row) => `${row.daysWaiting} ${row.daysWaiting === 1 ? "day" : "days"}`,
                                    },
                                ]}
                                rows={onHold.annualInspections}
                                rowLink={(row) => `aif-applications/${row._id}`}
                            />
                        ) : (
                            <Empty>No application is on hold.</Empty>
                        )}
                    </section>

                    <section>
                        <Heading icon={PiBuildings} title="Latest building permits" to="/dashboard/building-permits" count={permits.totalItems} />
                        {permits.buildingPermits.length ? (
                            <Ledger
                                columns={pick(buildingPermits, ["Serial", "Project / owner", "Filed"])}
                                rows={permits.buildingPermits}
                                rowLink={(row) => `building-permits/${row._id}`}
                            />
                        ) : (
                            <Empty>No building permits filed yet.</Empty>
                        )}
                    </section>
                </div>

                <aside className="min-w-0 space-y-9">
                    <section>
                        <h2 className="mb-2 section-title"><PiFiles aria-hidden="true" />On file</h2>
                        <table className="ledger">
                            <tbody>
                                {tallies.map(({ label, path, totalItems, icon: Icon }) => (
                                    <tr key={path} className="is-link">
                                        <td>
                                            <Link to={path} className="row-link">
                                                <Icon aria-hidden="true" className="mr-2 inline size-4 align-[-3px] text-ink-2" />
                                                {label}
                                            </Link>
                                        </td>
                                        <td className="num">{totalItems}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </section>
                    <section>
                        <h2 className="mb-2 section-title"><PiPlus aria-hidden="true" />New entry</h2>
                        <ul className="empty-note space-y-1.5">
                            {TALLIES.filter(({ one }) => one).map(({ one, path, icon: Icon }) => (
                                <li key={path}>
                                    <Link to={`${path}/new`} className="text-link">
                                        <Icon aria-hidden="true" className="mr-2 inline size-4 align-[-3px]" />
                                        {one}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </section>
                </aside>
            </div>
        </>
    );
};

export default Dashboard;
