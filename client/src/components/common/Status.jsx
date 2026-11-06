import { PiCheckCircle, PiClock, PiPause, PiReceipt, PiXCircle } from "react-icons/pi";
const COLORS = {
    paid: "bg-pass-soft text-pass",
    cancelled: "bg-danger-soft text-stamp",
    assessed: "bg-caution-soft text-caution",
    pending: "bg-caution-soft text-caution",
    "for inspection": "bg-neutral-soft text-ink-2",
    inspected: "bg-pass-soft text-pass",
    "on hold": "bg-caution-soft text-caution",
    "payment cancelled": "bg-danger-soft text-stamp",
};

const ICONS = {
    paid: PiCheckCircle,
    cancelled: PiXCircle,
    "payment cancelled": PiXCircle,
    assessed: PiReceipt,
    pending: PiClock,
    "for inspection": PiClock,
    inspected: PiCheckCircle,
    "on hold": PiPause,
};

const Status = ({ value }) => {
    const Icon = ICONS[value];
    return (
        <span className={`badge ${COLORS[value] || "bg-neutral-soft text-ink-2"}`}>
            {Icon && <Icon aria-hidden="true" />}
            {value.charAt(0).toUpperCase() + value.slice(1)}
        </span>
    );
};

export default Status;
