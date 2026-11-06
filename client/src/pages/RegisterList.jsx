import { PiMagnifyingGlass, PiPlus } from "react-icons/pi";
import { Form, Link, useLoaderData, useSearchParams, useSubmit } from "react-router-dom";
import { Ledger, Pagination } from "../components";
import customFetch from "../../utils/customFetch";
import { sentence } from "../../utils/format";

export const makeLoader = (register) => async ({ request }) => {
    const params = Object.fromEntries(
        [...new URL(request.url).searchParams].filter(([, value]) => value !== ""),
    );
    const { data } = await customFetch.get(register.listApi || register.api, { params });
    return data;
};

// The list page shared by every register, driven by constants/registers.jsx
const RegisterList = ({ register }) => {
    const data = useLoaderData();
    const rows = data[register.plural];
    const [searchParams] = useSearchParams();
    const submit = useSubmit();
    const isFiltered = [...searchParams.keys()].some((key) => key !== "page");

    return (
        <>
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                <h1 className="page-title">{register.title}</h1>
                {!register.noNew && (
                    <Link to="new" className="btn btn-primary no-underline">
                        <PiPlus />
                        {register.newLabel || `New ${register.singular}`}
                    </Link>
                )}
            </div>

            <Form
                method="get"
                className="mb-5 flex flex-wrap items-end gap-x-5 gap-y-3"
                onChange={(event) => {
                    if (event.target.tagName === "SELECT") submit(event.currentTarget);
                }}
            >
                {register.searchHint && (
                    <label className="filter min-w-[220px] flex-1 sm:max-w-sm">
                        Search
                        <span className="search-field">
                            <PiMagnifyingGlass aria-hidden="true" />
                            <input
                                type="search"
                                name="search"
                                key={searchParams.get("search") || ""}
                                defaultValue={searchParams.get("search") || ""}
                                placeholder={register.searchHint}
                            />
                        </span>
                    </label>
                )}
                {register.filters.map(({ name, label, options, hints, optionLabels }) => (
                    <label key={name} className="filter">
                        {label}
                        <select
                            name={name}
                            key={searchParams.get(name) || ""}
                            defaultValue={searchParams.get(name) || ""}
                        >
                            <option value="">All</option>
                            {options.map((option) => (
                                <option key={option} value={option}>
                                    {optionLabels?.[option] || (hints ? `${option}: ${hints[option].short}` : sentence(option))}
                                </option>
                            ))}
                        </select>
                    </label>
                ))}
                {isFiltered && (
                    <Link to="." className="text-link pb-1.5 text-sm">
                        Clear
                    </Link>
                )}
            </Form>

            {rows.length === 0 ? (
                <p className="empty-note">
                    {isFiltered
                        ? "Nothing in this register matches."
                        : register.emptyText || `This register is empty. Add the first ${register.singular} when one comes in.`}
                </p>
            ) : (
                <>
                    <div className="sticky-head max-md:overflow-x-auto">
                        <Ledger columns={register.columns} rows={rows} rowLink={(row) => (register.rowPath ? `${register.rowPath}/${row._id}` : row._id)} />
                    </div>
                    <Pagination page={data.page} totalPages={data.totalPages} totalItems={data.totalItems} />
                </>
            )}
        </>
    );
};

export default RegisterList;
