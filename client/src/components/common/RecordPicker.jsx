import { useEffect, useState } from "react";
import customFetch from "../../../utils/customFetch";
import { pickerLabel } from "../../../utils/format";

// Finds a record by typing part of its name or serial, for lists too long for a
// dropdown. The chosen id goes in a hidden input, so it submits like any field.
const RecordPicker = ({ name, api, resultsKey, initial, required, onChange, placeholder }) => {
    const [selected, setSelected] = useState(initial || null);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [active, setActive] = useState(0);

    useEffect(() => {
        if (!query.trim()) return undefined;
        let ignore = false;
        const timer = setTimeout(async () => {
            try {
                const { data } = await customFetch.get(api, {
                    params: { search: query.trim(), limit: 8 },
                });
                if (!ignore) {
                    setResults(data[resultsKey]);
                    setActive(0);
                }
            } catch {
                if (!ignore) setResults([]);
            }
        }, 200);
        return () => {
            ignore = true;
            clearTimeout(timer);
        };
    }, [query, api, resultsKey]);

    const choose = (record) => {
        const choice = record && { id: record._id, label: pickerLabel(record) };
        setSelected(choice);
        setQuery("");
        setResults([]);
        onChange?.(choice?.id || "");
    };

    const onKeyDown = (event) => {
        if (event.key === "ArrowDown") {
            event.preventDefault();
            setActive((index) => Math.min(index + 1, results.length - 1));
        } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setActive((index) => Math.max(index - 1, 0));
        } else if (event.key === "Enter" && results[active]) {
            event.preventDefault();
            choose(results[active]);
        } else if (event.key === "Escape") {
            setResults([]);
        }
    };

    if (selected) {
        return (
            <div className="picker-selected">
                <input type="hidden" name={name} value={selected.id} />
                <span className="truncate">{selected.label}</span>
                <button
                    type="button"
                    className="text-link shrink-0 cursor-pointer text-sm"
                    onClick={() => choose(null)}
                >
                    Change
                </button>
            </div>
        );
    }

    return (
        <div className="relative">
            <input
                className="cell-input"
                value={query}
                required={required}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={onKeyDown}
                placeholder={placeholder || "Type a name or serial"}
                autoComplete="off"
            />
            {/* An empty hidden field lets an optional link be cleared on update */}
            <input type="hidden" name={name} value="" />
            {query.trim() !== "" && results.length > 0 && (
                <ul className="absolute top-full right-0 left-0 z-20 mt-1 overflow-hidden rounded-lg border border-rule-strong bg-sheet shadow-lg">
                    {results.map((record, index) => (
                        <li key={record._id}>
                            <button
                                type="button"
                                onClick={() => choose(record)}
                                className={`block w-full cursor-pointer truncate px-2.5 py-1.5 text-left text-sm ${
                                    index === active ? "bg-tint" : ""
                                }`}
                            >
                                {pickerLabel(record)}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default RecordPicker;
