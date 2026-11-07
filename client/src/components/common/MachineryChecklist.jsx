import { newKey } from "../../../utils/newKey";
import { useState } from "react";
import { PiPlus } from "react-icons/pi";
import { acUnitTons, INSPECTION_MECHANICAL, isCounted } from "../../../../utils/feeSchedule.js";

const GROUPS = [
    ["Refrigeration, air conditioning and ventilation", ["11f-i", "11f-ii", "11f-iii", "11f-iv"]],
    ["Elevators and landings", ["11f-via", "11f-vib", "11f-vic", "11f-vid", "11f-vie", "11f-vif"]],
    ["Escalators, funiculars and cable cars", ["11f-va", "11f-vb", "11f-vc", "11f-vd", "11f-ve"]],
    ["Boilers, water heaters and pumps", ["11f-vii", "11f-viii", "11f-x"]],
    ["Engines, cranes and forklifts", ["11f-xiv"]],
    ["Fire sprinklers, compressed air and piping", ["11f-ix", "11f-xii", "11f-xiii"]],
    ["Other machinery and equipment", ["11f-xv", "11f-xvi", "11f-xvii", "11f-xviii", "11f-xix", "11f-xixa", "11f-xx"]],
].map(([title, ids]) => ({
    title,
    items: ids.map((id) => INSPECTION_MECHANICAL.find((item) => item.id === id)),
}));

const ORDER = GROUPS.flatMap(({ items }) => items.map(({ id }) => id));

const blankRow = (item) => ({
    key: newKey(),
    itemId: item.id,
    capacity: "",
    quantity: isCounted(item) ? "" : 1,
    machineName: "",
});

const NumberBox = ({ name, unit, label, ...props }) => (
    <label className="fee-row-quantity">
        <input name={name} type="number" min="0" step="any" className="cell-input" aria-label={label} {...props} />
        <span>{unit}</span>
    </label>
);

// Tons, or each unit's HP for the app to work the tons out from.
const HpEntry = ({ item, row }) => {
    const [units, setUnits] = useState(() => (row.acUnits || []).map((unit) => ({ ...unit, key: newKey() })));
    const [tons, setTons] = useState(row.capacity ?? "");
    const complete = units.filter(({ hp, quantity }) => Number(hp) > 0 && Number(quantity) >= 1);
    const update = (key, values) =>
        setUnits((current) => current.map((unit) => (unit.key === key ? { ...unit, ...values } : unit)));

    return (
        <div className="hp-entry">
            <NumberBox
                name="machineryCapacities"
                unit="tons"
                label={`${item.label}: tons`}
                value={complete.length ? acUnitTons(complete) : tons}
                readOnly={complete.length > 0}
                onChange={(event) => setTons(event.target.value)}
            />
            <input
                type="hidden"
                name="machineryAcUnits"
                value={complete.length ? JSON.stringify(complete.map(({ hp, quantity }) => ({ hp: Number(hp), quantity: Number(quantity) }))) : ""}
            />
            {units.map((unit, index) => (
                <div key={unit.key} className="hp-row" data-hp-row>
                    <NumberBox unit="HP" label={`Aircon ${index + 1} in HP`} value={unit.hp} onChange={(event) => update(unit.key, { hp: event.target.value })} />
                    <NumberBox unit="units" label={`Aircon ${index + 1} number of units`} min="1" step="1" value={unit.quantity} onChange={(event) => update(unit.key, { quantity: event.target.value })} />
                    <button
                        type="button"
                        className="text-link cursor-pointer text-sm"
                        onClick={() => setUnits((current) => current.filter((other) => other.key !== unit.key))}
                    >
                        Remove
                    </button>
                </div>
            ))}
            <button
                type="button"
                className="text-link back-link cursor-pointer text-sm"
                onClick={() => setUnits((current) => [...current, { key: newKey(), hp: "", quantity: 1 }])}
            >
                <PiPlus />
                {units.length ? "Add another size" : "Enter split type units by HP"}
            </button>
        </div>
    );
};

// One machine or set of machines. Every list the server reads gets a value for each
// row, hidden where the item doesn't ask for it, so the lists stay lined up.
const Entry = ({ item, row, index, canRemove, onRemove }) => {
    const [hasImage, setHasImage] = useState(false);
    return (
        <div className="machine-entry">
            <input type="hidden" name="machineryItems" value={item.id} />
            <input type="hidden" name="machineryOldIndexes" value={row.oldIndex ?? ""} />
            {!item.entersHp && <input type="hidden" name="machineryAcUnits" value="" />}
            {item.entersHp && (
                <>
                    <HpEntry item={item} row={row} />
                    <input type="hidden" name="machineryQuantities" value="1" />
                </>
            )}
            {!item.entersHp && isCounted(item) && (
                <>
                    <input type="hidden" name="machineryCapacities" value="" />
                    <NumberBox name="machineryQuantities" unit={item.unit} label={`${item.label}: ${item.unit}`} min="1" step="1" defaultValue={row.quantity ?? ""} />
                </>
            )}
            {!item.entersHp && !isCounted(item) && (
                <>
                    <NumberBox name="machineryCapacities" unit={item.unit} label={`${item.label}: ${item.unit}`} defaultValue={row.capacity ?? ""} />
                    {item.perUnit ? (
                        <NumberBox name="machineryQuantities" unit="units" label={`${item.label}: units`} min="1" step="1" defaultValue={row.quantity ?? 1} />
                    ) : (
                        <input type="hidden" name="machineryQuantities" value="1" />
                    )}
                </>
            )}
            <input
                name="machineNames"
                className="cell-input machine-entry-name"
                placeholder="Description (optional)"
                aria-label={`${item.label}: description`}
                defaultValue={row.machineName || ""}
            />
            <label className="machine-entry-photo">
                <span>{row.imageUrl ? "Photo on file; choose a file to replace" : "Photo"}</span>
                <input
                    type="file"
                    name="machineryImages"
                    accept="image/jpeg,image/png,image/webp"
                    className="file-input"
                    onChange={(event) => setHasImage(event.target.files.length > 0)}
                />
            </label>
            {hasImage && <input type="hidden" name="rowHasImage" value={index} />}
            {canRemove && (
                <button type="button" className="text-link cursor-pointer text-sm" onClick={onRemove}>
                    Remove
                </button>
            )}
        </div>
    );
};

// A group stays in the page when closed or filtered out, so its ticked rows still save.
const Group = ({ group, rows, words, renderRows, onToggle, onAdd }) => {
    const ticked = group.items.filter((item) => rows.some((row) => row.itemId === item.id));
    const [isOpen, setIsOpen] = useState(ticked.length > 0);
    const searching = words.length > 0;
    const matches = (item) => words.every((word) => `${item.label} ${item.ref} ${item.keywords || ""}`.toLowerCase().includes(word));

    return (
        <details
            className="fee-section"
            hidden={searching && !group.items.some(matches)}
            open={searching || isOpen}
            onToggle={(event) => {
                if (!searching) setIsOpen(event.currentTarget.open);
            }}
        >
            <summary>
                <span>{group.title}</span>
                {ticked.length > 0 && <span className="fee-section-total">{ticked.length} ticked</span>}
            </summary>
            <ul>
                {group.items.map((item) => {
                    const isTicked = ticked.includes(item);
                    return (
                        <li key={item.id} hidden={!matches(item)} className={`fee-row ${isTicked ? "is-picked" : ""}`}>
                            <label className="fee-row-label">
                                <input type="checkbox" className="fee-check" data-item={item.id} checked={isTicked} onChange={() => onToggle(item)} />
                                <span>
                                    {item.label}
                                    <span className="fee-row-ref">{item.ref}</span>
                                </span>
                            </label>
                            {isTicked && (
                                <div className="machine-entries">
                                    {renderRows(item)}
                                    {item.perUnit && (
                                        <button type="button" className="text-link back-link cursor-pointer text-sm" onClick={() => onAdd(item)}>
                                            <PiPlus />
                                            Add another size
                                        </button>
                                    )}
                                </div>
                            )}
                        </li>
                    );
                })}
            </ul>
        </details>
    );
};

// The mechanical items of the annual inspection fee (Sec. 11.f). The inspector ticks
// what's on site and enters what the fee is charged on, in that item's own unit.
const MachineryChecklist = ({ machineries = [] }) => {
    const [rows, setRows] = useState(() =>
        machineries.map((machine, oldIndex) => ({ ...machine, key: newKey(), oldIndex })),
    );
    const [search, setSearch] = useState("");
    const words = search.trim().toLowerCase().split(/\s+/).filter(Boolean);

    const toggle = (item) =>
        setRows((current) =>
            current.some((row) => row.itemId === item.id)
                ? current.filter((row) => row.itemId !== item.id)
                : [...current, blankRow(item)],
        );

    // Photos are matched to rows by their place on the page
    const onPage = ORDER.flatMap((id) => rows.filter((row) => row.itemId === id));

    const renderRows = (item) =>
        rows
            .filter((row) => row.itemId === item.id)
            .map((row, position) => (
                <Entry
                    key={row.key}
                    item={item}
                    row={row}
                    index={onPage.indexOf(row)}
                    canRemove={position > 0}
                    onRemove={() => setRows((current) => current.filter((other) => other !== row))}
                />
            ));

    return (
        <div>
            <p className="cell-hint !mt-0 mb-3">
                Tick what's on site and enter its size or count in the unit shown. If it isn't known, leave it blank and it will be assessed manually. Generators go under Electrical load found.
            </p>
            <input
                type="search"
                className="cell-input mb-3"
                placeholder="Find equipment, e.g. elevator, pump, 11.f.x"
                aria-label="Find equipment"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
            />
            <div className="space-y-2">
                {GROUPS.map((group) => (
                    <Group
                        key={group.title}
                        group={group}
                        rows={rows}
                        words={words}
                        renderRows={renderRows}
                        onToggle={toggle}
                        onAdd={(item) => setRows((current) => [...current, blankRow(item)])}
                    />
                ))}
            </div>
            {/* Tells the server the list is now empty; no rows means no other signal */}
            {rows.length === 0 && <input type="hidden" name="machineries" value="" />}
        </div>
    );
};

export default MachineryChecklist;
