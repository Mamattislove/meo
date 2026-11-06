import { useState } from "react";
import { PiPlus } from "react-icons/pi";

const DISPLAYS = [
    ["n", "Neon"],
    ["i", "Illuminated"],
    ["o", "Others"],
    ["p", "Painted-on"],
];
const USES = [
    ["b", "Business"],
    ["a", "Advertising"],
];

// Sec. 9.h.iii item ids end in display then use: 9h-iii-nb is a neon business sign
const newRow = (sign = {}) => {
    const code = sign.itemId?.split("-").at(-1) || "nb";
    return { key: crypto.randomUUID(), display: code[0], use: code[1], area: sign.area ?? "" };
};

// Each sign found on site, charged on its own display surface and type (Sec. 9.h.iii).
const SignsFound = ({ signs = [], hasNameSignage }) => {
    const [rows, setRows] = useState(() => signs.map(newRow));
    const update = (key, values) =>
        setRows((current) => current.map((row) => (row.key === key ? { ...row, ...values } : row)));

    return (
        <div>
            <fieldset className="name-signage">
                <legend className="cell-label">
                    Does it have a signage with the business name, even a tarpaulin? <em>*</em>
                </legend>
                {[
                    ["true", "Yes"],
                    ["false", "No"],
                ].map(([answer, label]) => (
                    <label key={answer}>
                        <input
                            type="radio"
                            name="hasNameSignage"
                            value={answer}
                            required
                            defaultChecked={String(hasNameSignage) === answer}
                        />
                        {label}
                    </label>
                ))}
            </fieldset>
            <p className="cell-hint !mt-0 mb-3">List the signs to be charged below. Tarpaulins aren't charged, so don't list them.</p>
            {rows.length === 0 && <p className="mb-3 text-sm text-ink-2">No signs listed.</p>}
            <div className="space-y-2">
                {rows.map((row, index) => (
                    <div key={row.key} className="sign-row">
                        <input type="hidden" name="signItems" value={`9h-iii-${row.display}${row.use}`} />
                        <label className="sign-field">
                            <span className="cell-label">Type of display</span>
                            <select className="cell-input" value={row.display} aria-label={`Sign ${index + 1} type of display`} onChange={(event) => update(row.key, { display: event.target.value })}>
                                {DISPLAYS.map(([code, label]) => (
                                    <option key={code} value={code}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="sign-field">
                            <span className="cell-label">Used for</span>
                            <select className="cell-input" value={row.use} aria-label={`Sign ${index + 1} used for`} onChange={(event) => update(row.key, { use: event.target.value })}>
                                {USES.map(([code, label]) => (
                                    <option key={code} value={code}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="sign-field">
                            <span className="cell-label">Display surface (sq. m)</span>
                            <input
                                type="number"
                                name="signAreas"
                                min="0"
                                step="any"
                                className="cell-input"
                                aria-label={`Sign ${index + 1} display surface in sq. m`}
                                value={row.area}
                                onChange={(event) => update(row.key, { area: event.target.value })}
                            />
                        </label>
                        <button
                            type="button"
                            className="text-link cursor-pointer pb-2 text-sm"
                            onClick={() => setRows((current) => current.filter((other) => other.key !== row.key))}
                        >
                            Remove
                        </button>
                    </div>
                ))}
            </div>
            <button
                type="button"
                className="text-link back-link mt-3 cursor-pointer text-sm"
                onClick={() => setRows((current) => [...current, newRow()])}
            >
                <PiPlus />
                {rows.length ? "Add another sign" : "Add a sign"}
            </button>
            {/* Tells the server the list is now empty; no rows means no other signal */}
            {rows.length === 0 && <input type="hidden" name="signs" value="" />}
        </div>
    );
};

export default SignsFound;
