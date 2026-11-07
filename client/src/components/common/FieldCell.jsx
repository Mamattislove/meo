import { PiCrosshairSimple } from "react-icons/pi";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import RecordPicker from "./RecordPicker";
import { OFFICE_TOWN } from "../../../../utils/constants.js";
import { findBarangay } from "../../../utils/barangayLookup";
import { dateInputValue, formatDate, formatPeso, sentence } from "../../../utils/format";

// Loaded only when a page shows a location, so other pages don't carry the map library
const CoordinateMap = lazy(() => import("./CoordinateMap"));
const mapFallback = (
    <div className="coordinate-map-wrap">
        <div className="coordinate-map" />
    </div>
);

const Cell = ({ label, span, required, children }) => (
    <div className="cell" style={{ "--span": span }}>
        <span className="cell-label">
            {label}
            {required && <em> *</em>}
        </span>
        {children}
    </div>
);

// Latitude and longitude boxes and a map that stay in step, stored as GeoJSON
// [longitude, latitude]
const CoordinateInput = ({ name, value }) => {
    const [longitude, setLongitude] = useState(value?.coordinates?.[0] ?? "");
    const [latitude, setLatitude] = useState(value?.coordinates?.[1] ?? "");
    const [shown, setShown] = useState({ latitude, longitude });
    const hasPoint = longitude !== "" && latitude !== "";
    const hiddenInput = useRef(null);
    const savedPoint = useRef(`${latitude},${longitude}`);
    const filledBarangay = useRef("");
    const [fromMap, setFromMap] = useState(null);

    // On a form with a barangay box, a new point fills in the barangay from the LGU's
    // boundaries. It never replaces one the clerk chose, and a saved point is left alone.
    useEffect(() => {
        const box = hiddenInput.current?.form?.elements.barangay;
        const point = `${shown.latitude},${shown.longitude}`;
        if (!box || point === savedPoint.current) return undefined;
        setFromMap(null);
        if (shown.latitude === "" || shown.longitude === "") return undefined;
        let ignore = false;
        findBarangay(shown.latitude, shown.longitude).then((barangay) => {
            if (ignore) return;
            if (barangay && (box.value === "" || box.value === filledBarangay.current)) {
                box.value = barangay;
                filledBarangay.current = barangay;
            }
            setFromMap({ barangay });
        });
        return () => {
            ignore = true;
        };
    }, [shown.latitude, shown.longitude]);

    // Typing "120.9" passes through 1, 12 and 120, each a real place, so the map
    // waits for a pause in typing instead of flying across the world.
    useEffect(() => {
        const timer = setTimeout(() => setShown({ latitude, longitude }), 400);
        return () => clearTimeout(timer);
    }, [latitude, longitude]);

    const pick = (pickedLatitude, pickedLongitude) => {
        setLatitude(pickedLatitude);
        setLongitude(pickedLongitude);
        setShown({ latitude: pickedLatitude, longitude: pickedLongitude });
    };

    const useMyLocation = () => {
        navigator.geolocation?.getCurrentPosition(({ coords }) => {
            pick(Number(coords.latitude.toFixed(6)), Number(coords.longitude.toFixed(6)));
        });
    };

    return (
        <>
            <input
                ref={hiddenInput}
                type="hidden"
                name={name}
                value={
                    hasPoint
                        ? JSON.stringify({
                              type: "Point",
                              coordinates: [Number(longitude), Number(latitude)],
                          })
                        : ""
                }
            />
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <input
                    className="cell-input !w-[calc(50%-6px)] sm:!w-40"
                    aria-label="Latitude"
                    placeholder="Latitude"
                    type="number"
                    step="any"
                    value={latitude}
                    onChange={(event) => setLatitude(event.target.value)}
                />
                <input
                    className="cell-input !w-[calc(50%-6px)] sm:!w-40"
                    aria-label="Longitude"
                    placeholder="Longitude"
                    type="number"
                    step="any"
                    value={longitude}
                    onChange={(event) => setLongitude(event.target.value)}
                />
                {/* Browsers only share a location over https or on the computer itself */}
                {window.isSecureContext && navigator.geolocation && (
                    <button type="button" onClick={useMyLocation} className="text-link shrink-0 cursor-pointer text-[13px]">
                        <PiCrosshairSimple className="mr-1 inline size-4 align-[-3px]" />
                        Use my location
                    </button>
                )}
                {(latitude !== "" || longitude !== "") && (
                    <button type="button" onClick={() => pick("", "")} className="text-link shrink-0 cursor-pointer text-[13px]">
                        Clear
                    </button>
                )}
            </div>
            <Suspense fallback={mapFallback}>
                <CoordinateMap latitude={shown.latitude} longitude={shown.longitude} onPick={pick} />
            </Suspense>
            <span className="cell-hint">Click the map or drag the marker to set the location, or type the coordinates.</span>
            {fromMap && (
                <span className="cell-hint" data-barangay-hint>
                    {fromMap.barangay
                        ? `The barangay boundary map puts this point in ${fromMap.barangay}.`
                        : `This point is outside ${OFFICE_TOWN}'s barangay boundaries. Please check the location.`}
                </span>
            )}
        </>
    );
};

// A dropdown that explains the chosen option underneath it
const HintedSelect = ({ field, value }) => {
    const { name, label, span, required, options, hints, defaultHint } = field;
    const [selected, setSelected] = useState(value ?? "");

    return (
        <label className="cell" style={{ "--span": span }}>
            <span className="cell-label">{label}</span>
            <select
                name={name}
                value={selected}
                onChange={(event) => setSelected(event.target.value)}
                className="cell-input"
                required={required}
            >
                <option value="">Not specified</option>
                {options.map((option) => (
                    <option key={option} value={option}>
                        {option}: {hints[option].short}
                    </option>
                ))}
            </select>
            <span className="cell-hint">{hints[selected]?.full || defaultHint}</span>
        </label>
    );
};

const asInputValue = (field, value) => {
    if (value === undefined || value === null) return "";
    return field.type === "date" ? dateInputValue(value) : value;
};

// One editable box of a register form. On a new record `record` is undefined.
const FieldCell = ({ field, record, prefill }) => {
    const { name, label, span, type, required, options, step } = field;
    const value = record ? record[name] : (prefill?.[name] ?? field.defaultValue);

    if (type === "blank") return <div className="cell cell-filler" style={{ "--span": span }} />;
    if (type === "display") {
        return record ? <ValueCell field={field} record={record} /> : <div className="cell" style={{ "--span": span }} />;
    }
    if (record && field.lockedOnEdit) return <ValueCell field={field} record={record} />;

    if (type === "reference") {
        const shown = record && field.show(record);
        const id = record?.[name]?._id || record?.[name];
        const initial = shown && id ? { id, label: shown } : prefill?.[`${name}Picked`];
        return (
            <Cell label={label} span={span} required={required}>
                <RecordPicker
                    name={name}
                    api={field.api}
                    resultsKey={field.resultsKey}
                    required={required}
                    initial={initial}
                />
            </Cell>
        );
    }
    if (type === "coordinate") {
        return (
            <Cell label={label} span={span} required={required}>
                <CoordinateInput name={name} value={value} />
            </Cell>
        );
    }
    if (type === "select" && field.hints) {
        return <HintedSelect field={field} value={value} />;
    }
    if (type === "select") {
        return (
            <label className="cell" style={{ "--span": span }}>
                <span className="cell-label">{label}</span>
                <select name={name} defaultValue={value ?? ""} className="cell-input" required={required}>
                    <option value="">Not specified</option>
                    {options.map((option) => (
                        <option key={option} value={option}>
                            {sentence(option)}
                        </option>
                    ))}
                </select>
            </label>
        );
    }
    return (
        <label className="cell" style={{ "--span": span }}>
            <span className="cell-label">
                {label}
                {required && <em> *</em>}
            </span>
            <input
                name={name}
                type={type}
                min={type === "number" ? 0 : undefined}
                step={step}
                required={required}
                defaultValue={asInputValue(field, value)}
                className="cell-input"
            />
        </label>
    );
};

const coordinateText = (point) => {
    const [longitude, latitude] = point.coordinates;
    return (
        <>
            {latitude}, {longitude}
            <Suspense fallback={mapFallback}>
                <CoordinateMap latitude={latitude} longitude={longitude} />
            </Suspense>
        </>
    );
};

// The same box on a record page, filled in
export const ValueCell = ({ field, record }) => {
    const { label, span, type, show, money } = field;
    if (type === "blank") return <div className="cell cell-filler" style={{ "--span": span }} />;

    let value = show ? show(record) : record[field.name];
    if (type === "date") value = formatDate(value);
    if (type === "select") value = sentence(value);
    if (type === "coordinate" && value?.coordinates) value = coordinateText(value);
    if (money && value != null) value = formatPeso(value);
    const isEmpty = value === undefined || value === null || value === "";

    return (
        <Cell label={label} span={span}>
            <div className={`cell-value ${isEmpty ? "is-empty" : ""}`}>{isEmpty ? "None" : value}</div>
            {field.hints?.[value] && <span className="cell-hint">{field.hints[value].full}</span>}
        </Cell>
    );
};

export const FormError = ({ message }) =>
    message ? (
        <p role="alert" className="mb-4 rounded-lg bg-danger-soft px-3.5 py-2.5 text-sm text-stamp">
            {message}
        </p>
    ) : null;

export default FieldCell;
