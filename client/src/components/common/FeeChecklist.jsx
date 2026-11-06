import { useMemo, useState } from "react";
import { checklistFees, itemAmount, LOAD_DEFAULTS, needsQuantity, toKva } from "../../../../utils/feeSchedule.js";
import { formatPeso } from "../../../utils/format";

const matches = (item, words) =>
    words.every((word) => `${item.label} ${item.ref}`.toLowerCase().includes(word));

const NumberBox = ({ label, unit, data, value, onChange, width, ...props }) => (
    <label className="fee-row-quantity">
        <input
            type="number"
            min="0"
            step="any"
            className="cell-input"
            style={width ? { width } : undefined}
            aria-label={label}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            {...data}
            {...props}
        />
        <span>{unit}</span>
    </label>
);

// Connected load as kVA, or as kW or a breaker size that converts to kVA
export const ConnectedLoad = ({ item, pick, onChange, focusFirst = true }) => {
    const conversion = pick.conversion;
    const from = conversion?.from || "kVA";
    const update = (values) => {
        const next = { ...conversion, ...values };
        onChange({ conversion: next, quantity: toKva(next) });
    };

    return (
        <div className="fee-load">
            <select
                className="cell-input"
                aria-label="Connected load is given as"
                data-load-from={item.id}
                value={from}
                onChange={(event) =>
                    onChange(
                        event.target.value === "kVA"
                            ? { conversion: undefined, quantity: "" }
                            : { conversion: { from: event.target.value, value: "", ...LOAD_DEFAULTS[event.target.value] }, quantity: "" },
                    )
                }
            >
                <option value="kVA">kVA</option>
                <option value="kW">kW</option>
                <option value="AT">Breaker (AT)</option>
            </select>

            {from === "kVA" && (
                <NumberBox
                    label="Connected load in kVA"
                    unit="kVA"
                    data={{ "data-quantity": item.id }}
                    value={pick.quantity}
                    autoFocus={focusFirst && !pick.quantity}
                    onChange={(quantity) => onChange({ quantity })}
                />
            )}
            {from === "kW" && (
                <>
                    <NumberBox
                        label="Connected load in kW"
                        unit="kW"
                        data={{ "data-load-value": item.id }}
                        value={conversion.value}
                        autoFocus={focusFirst && !conversion.value}
                        onChange={(value) => update({ value })}
                    />
                    <NumberBox
                        label="Power factor"
                        unit="power factor"
                        data={{ "data-load-pf": item.id }}
                        max="1"
                        value={conversion.powerFactor ?? ""}
                        onChange={(powerFactor) => update({ powerFactor })}
                    />
                </>
            )}
            {from === "AT" && (
                <>
                    <NumberBox
                        label="Breaker size in amperes"
                        unit="AT"
                        data={{ "data-load-value": item.id }}
                        value={conversion.value}
                        autoFocus={focusFirst && !conversion.value}
                        onChange={(value) => update({ value })}
                    />
                    <span className="fee-load-phase" role="radiogroup" aria-label="Phase">
                        {[
                            [1, "Single phase"],
                            [3, "3 phase"],
                        ].map(([phase, label]) => (
                            <label key={phase}>
                                <input
                                    type="radio"
                                    name={`${item.id}-phase`}
                                    data-load-phase={phase}
                                    checked={Number(conversion.phase) === phase}
                                    onChange={() => update({ phase })}
                                />
                                {label}
                            </label>
                        ))}
                    </span>
                </>
            )}
            {conversion && pick.quantity !== "" && (
                <span className="fee-load-result" data-load-result={item.id}>
                    = {pick.quantity} kVA
                </span>
            )}
        </div>
    );
};

const Row = ({ item, pick, amount, onToggle, onChange }) => (
    <li className={`fee-row ${pick ? "is-picked" : ""}`}>
        <label className="fee-row-label">
            {item.group ? (
                // onClick, not onChange: a chosen radio fires no change, and clicking it again clears it
                <input type="radio" name={item.group} className="fee-check" data-item={item.id} checked={Boolean(pick)} onClick={onToggle} readOnly />
            ) : (
                <input type="checkbox" className="fee-check" data-item={item.id} checked={Boolean(pick)} onChange={onToggle} />
            )}
            <span>
                {item.label}
                <span className="fee-row-ref">{item.ref}</span>
            </span>
        </label>
        <div className="fee-row-inputs">
            {pick && item.convertsToKva && <ConnectedLoad item={item} pick={pick} onChange={onChange} />}
            {pick && needsQuantity(item) && !item.convertsToKva && (
                <label className="fee-row-quantity">
                    <input
                        type="number"
                        min="0"
                        step="any"
                        autoFocus={!pick.quantity}
                        className="cell-input"
                        aria-label={`${item.label}: ${item.unit}`}
                        data-quantity={item.id}
                        value={pick.quantity}
                        onChange={(event) => onChange({ quantity: event.target.value })}
                    />
                    <span>{item.unit}</span>
                </label>
            )}
            {pick && item.perUnit && (
                <label className="fee-row-quantity">
                    <input
                        type="number"
                        min="1"
                        className="cell-input"
                        aria-label={`${item.label}: ${item.unitsLabel || "units"}`}
                        data-units={item.id}
                        value={pick.units}
                        onChange={(event) => onChange({ units: event.target.value })}
                    />
                    <span>{item.unitsLabel || "units"}</span>
                </label>
            )}
            {pick && <span className="fee-row-amount">{formatPeso(amount)}</span>}
        </div>
    </li>
);

// Stays as the user left it. Searching opens it only while the search lasts, and
// unticking its last item doesn't snap it shut.
const Section = ({ section, items, searching, picks, amounts, onToggle, onChange }) => {
    const ticked = section.items.filter((item) => picks[item.id]);
    const [isOpen, setIsOpen] = useState(section.open || ticked.length > 0);
    const subtotal = ticked.reduce((sum, item) => sum + (amounts[item.id] || 0), 0);

    return (
        <details
            className="fee-section"
            hidden={items.length === 0}
            open={searching || isOpen}
            onToggle={(event) => {
                if (!searching) setIsOpen(event.currentTarget.open);
            }}
        >
            <summary>
                <span>{section.title}</span>
                {ticked.length > 0 && <span className="fee-section-total">{formatPeso(subtotal)}</span>}
            </summary>
            {section.note && <p className="fee-section-note">{section.note}</p>}
            <ul>
                {items.map((item) => (
                    <Row
                        key={item.id}
                        item={item}
                        pick={picks[item.id]}
                        amount={item.kind === "flat" ? itemAmount(item) : amounts[item.id] || 0}
                        onToggle={() => onToggle(item)}
                        onChange={(values) => onChange(item, values)}
                    />
                ))}
            </ul>
        </details>
    );
};

// Every item of the schedule of fees, grouped by section. Tick an item and enter its
// quantity; the amount comes from the schedule.
const FeeChecklist = ({ sections, picks, onPicksChange }) => {
    const [search, setSearch] = useState("");
    const words = search.trim().toLowerCase().split(/\s+/).filter(Boolean);

    const amounts = useMemo(
        () =>
            Object.fromEntries(
                checklistFees(sections, picks).map((fee) => [fee.itemId, fee.amount]),
            ),
        [sections, picks],
    );

    const toggle = (item) => {
        const { [item.id]: existing, ...rest } = picks;
        if (existing) return onPicksChange(rest);
        // Choosing a radio replaces the other choice in its group
        const siblings = sections
            .flatMap((section) => section.items)
            .filter((other) => item.group && other.group === item.group)
            .map((other) => other.id);
        const kept = Object.fromEntries(Object.entries(picks).filter(([id]) => !siblings.includes(id)));
        return onPicksChange({ ...kept, [item.id]: { quantity: "", units: 1 } });
    };
    const change = (item, values) =>
        onPicksChange({ ...picks, [item.id]: { ...picks[item.id], ...values } });

    return (
        <div>
            <input
                type="search"
                className="cell-input mb-3"
                placeholder="Find a fee, e.g. fence, elevator, 9.c"
                aria-label="Find a fee"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
            />
            <div className="space-y-2">
                {sections.map((section) => {
                    const items = section.items.filter((item) => matches(item, words));
                    return (
                        <Section
                            key={section.id}
                            section={section}
                            items={items}
                            searching={words.length > 0}
                            picks={picks}
                            amounts={amounts}
                            onToggle={toggle}
                            onChange={change}
                        />
                    );
                })}
            </div>
        </div>
    );
};

export default FeeChecklist;
