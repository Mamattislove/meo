import { PiPause, PiPlay } from "react-icons/pi";
import { Form, useNavigation } from "react-router-dom";
import InputField from "./InputField";
import Status from "./Status";
import { formatDate } from "../../../utils/format";

const STEPS = ["for inspection", "inspected", "assessed", "paid"];

// Where an AIF application stands, and putting it on hold or resuming it.
const CaseStatus = ({ record }) => {
    const navigation = useNavigation();
    const isBusy = navigation.state !== "idle";
    const current = STEPS.indexOf(record.status);
    const hold = record.holds?.at(-1);
    const pastHolds = (record.holds || []).filter((entry) => entry.resumedAt);

    return (
        <section className="form-box no-print mb-3.5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <ol className="case-steps" aria-label="Application status">
                    {STEPS.map((step, index) => (
                        <li key={step} className={index <= current ? "is-done" : ""}>
                            {index === current ? <Status value={step} /> : step.charAt(0).toUpperCase() + step.slice(1)}
                        </li>
                    ))}
                </ol>
                {record.onHold && (
                    <Form method="post">
                        <input type="hidden" name="intent" value="resume" />
                        <button type="submit" className="btn btn-primary" disabled={isBusy}>
                            <PiPlay />
                            Resume
                        </button>
                    </Form>
                )}
            </div>

            {record.onHold && (
                <p role="status" className="mt-3 rounded-lg bg-caution-soft px-3.5 py-2.5 text-sm">
                    <strong>On hold:</strong> {hold.reason}
                    <span className="block text-[13px] text-ink-2">
                        Since {formatDate(hold.heldAt)}
                        {hold.heldBy?.username && `, by ${hold.heldBy.username}`}. It can't be assessed or paid until it's resumed.
                    </span>
                </p>
            )}

            {!record.onHold && record.status !== "paid" && (
                <details className="mt-3">
                    <summary className="cursor-pointer text-sm text-ink-2">Put on hold</summary>
                    <Form method="post" className="mt-3 flex flex-wrap items-end gap-3">
                        <input type="hidden" name="intent" value="hold" />
                        <div className="cells min-w-[260px] flex-1">
                            <InputField label="What's missing?" name="reason" required span={6} placeholder="e.g. No building permit yet" />
                        </div>
                        <button type="submit" className="btn" disabled={isBusy}>
                            <PiPause />
                            Put on hold
                        </button>
                    </Form>
                </details>
            )}

            {pastHolds.length > 0 && (
                <ul className="mt-3 space-y-0.5 text-[13px] text-ink-2">
                    {pastHolds.map((entry) => (
                        <li key={entry._id}>
                            Held {formatDate(entry.heldAt)} to {formatDate(entry.resumedAt)}: {entry.reason}
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
};

export default CaseStatus;
