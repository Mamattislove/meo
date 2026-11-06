import { useState } from "react";
import { PiPlus } from "react-icons/pi";

const newRow = (value = "") => ({ key: crypto.randomUUID(), value });

// One box per thing found on site, for when there can be several of different sizes.
const AmountList = ({ name, rowLabel, unit, addLabel, initial = [], showTotal = false }) => {
    const [rows, setRows] = useState(() => (initial.length ? initial : [""]).map(newRow));
    const total = rows.reduce((sum, { value }) => sum + (Number(value) || 0), 0);

    return (
        <>
            <div className="amount-rows">
                {rows.map(({ key, value }, index) => (
                    <div key={key} className="amount-row">
                        <input
                            type="number"
                            name={name}
                            min="0"
                            step="any"
                            className="cell-input"
                            aria-label={`${rowLabel} ${index + 1} in ${unit}`}
                            value={value}
                            onChange={(event) =>
                                setRows((current) =>
                                    current.map((row) => (row.key === key ? { ...row, value: event.target.value } : row)),
                                )
                            }
                        />
                        {rows.length > 1 && (
                            <button
                                type="button"
                                className="text-link cursor-pointer text-sm"
                                onClick={() => setRows((current) => current.filter((row) => row.key !== key))}
                            >
                                Remove
                            </button>
                        )}
                    </div>
                ))}
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                <button
                    type="button"
                    className="text-link back-link cursor-pointer text-sm"
                    onClick={() => setRows((current) => [...current, newRow()])}
                >
                    <PiPlus />
                    {addLabel}
                </button>
                {showTotal && rows.length > 1 && (
                    <span className="text-sm font-medium" data-total={name}>
                        Total {Math.round(total * 100) / 100} {unit}
                    </span>
                )}
            </div>
        </>
    );
};

export default AmountList;
