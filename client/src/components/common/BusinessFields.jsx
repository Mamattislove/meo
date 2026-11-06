import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import customFetch from "../../../utils/customFetch";
import FieldCell from "./FieldCell";
import FormBox from "../wrappers/FormBox";

const THIS_YEAR_FIELDS = ["occupancyDivision", "businessActivity", "lessorName"];

const startingValues = (record) =>
    record ? { ...record.business, ...Object.fromEntries(THIS_YEAR_FIELDS.map((name) => [name, record[name]])) } : {};

// The business part of an AIF application. Typing a name offers existing businesses;
// picking one fills in its details and last year's, and a new name creates a business
// when the application is saved. Other fields remount when picked, to take the new values.
const BusinessFields = ({ record, fields }) => {
    const [searchParams] = useSearchParams();
    const fromLink = searchParams.get("business");
    const [values, setValues] = useState(() => startingValues(record));
    const [name, setName] = useState(record?.business?.businessName || "");
    const [pickedId, setPickedId] = useState("");
    const [results, setResults] = useState([]);
    const [version, setVersion] = useState(0);

    const pick = async (business) => {
        const { data } = await customFetch.get("/annual-inspections", { params: { business: business._id, limit: 1 } });
        const lastYear = data.annualInspections[0] || {};
        setValues({
            ...business,
            ...Object.fromEntries(THIS_YEAR_FIELDS.map((field) => [field, lastYear[field]])),
        });
        setName(business.businessName);
        setPickedId(business._id);
        setResults([]);
        setVersion((current) => current + 1);
    };

    // Reached from a business's page
    useEffect(() => {
        if (!fromLink || record) return;
        customFetch.get(`/businesses/${fromLink}`).then(({ data }) => pick(data.business));
    }, [fromLink, record]);

    useEffect(() => {
        if (record || pickedId || !name.trim()) return undefined;
        let ignore = false;
        const timer = setTimeout(async () => {
            try {
                const { data } = await customFetch.get("/businesses", { params: { search: name.trim(), limit: 8 } });
                if (!ignore) setResults(data.businesses);
            } catch {
                if (!ignore) setResults([]);
            }
        }, 200);
        return () => {
            ignore = true;
            clearTimeout(timer);
        };
    }, [name, pickedId, record]);

    const hint = record
        ? "Changes to the name, owner, contact or location update the business for every year."
        : pickedId
          ? "Existing business. Its details are filled in, and any change here updates it."
          : "Pick an existing business to fill in its details, or type a new name to add it.";

    return (
        <FormBox title="Business">
            <div className="cell relative" style={{ "--span": 6 }}>
                <label>
                    <span className="cell-label">
                        Business name <em> *</em>
                    </span>
                    <input
                        name="businessName"
                        className="cell-input"
                        required
                        autoComplete="off"
                        value={name}
                        onChange={(event) => {
                            setName(event.target.value);
                            setPickedId("");
                            if (!event.target.value.trim()) setResults([]);
                        }}
                    />
                </label>
                <input type="hidden" name="business" value={pickedId} />
                <span className="cell-hint">{hint}</span>
                {name.trim() !== "" && results.length > 0 && (
                    <ul className="business-suggestions absolute top-[62px] right-0 left-0 z-20 overflow-hidden rounded-lg border border-rule bg-sheet shadow-lg">
                        {results.map((business) => (
                            <li key={business._id}>
                                <button
                                    type="button"
                                    className="block w-full cursor-pointer truncate px-2.5 py-1.5 text-left text-sm hover:bg-tint"
                                    onClick={() => pick(business)}
                                >
                                    {business.businessName}
                                    {business.businessOwner && <span className="text-ink-2"> · {business.businessOwner}</span>}
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            {fields.map((field) => (
                <FieldCell key={`${version}-${field.name}`} field={field} record={values} />
            ))}
        </FormBox>
    );
};

export default BusinessFields;
