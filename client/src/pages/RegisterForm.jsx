import { PiCheck } from "react-icons/pi";
import { Form, Link, redirect, useActionData, useLoaderData, useNavigation, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { FieldCell, FormBox, FormError } from "../components";
import customFetch from "../../utils/customFetch";
import { errorMessage, pickerLabel, toPayload } from "../../utils/format";

// Reference fields can be pre-chosen from the URL when reached from a related
// record's page, so the clerk doesn't have to search for it again.
export const makeLoader = (register) => async ({ request, params }) => {
    const id = params.id;
    if (id) {
        const { data } = await customFetch.get(`${register.api}/${id}`);
        return { record: Object.values(data)[0] };
    }
    const prefill = {};
    const search = new URL(request.url).searchParams;
    const references = register.boxes
        .flatMap(({ fields }) => fields)
        .filter((field) => field.type === "reference" && search.get(field.name));
    await Promise.all(
        references.map(async (field) => {
            const pickedId = search.get(field.name);
            const { data } = await customFetch.get(`${field.api}/${pickedId}`);
            prefill[`${field.name}Picked`] = {
                id: pickedId,
                label: pickerLabel(Object.values(data)[0]),
            };
        }),
    );
    return { prefill };
};

export const makeAction = (register) => async ({ request, params }) => {
    const payload = toPayload(await request.formData());
    try {
        if (params.id) {
            await customFetch.patch(`${register.api}/${params.id}`, payload);
            toast("Saved");
            return redirect(`/dashboard/${register.path}/${params.id}`);
        }
        const { data } = await customFetch.post(register.api, payload);
        toast("Saved");
        return redirect(`/dashboard/${register.path}/${Object.values(data)[0]._id}`);
    } catch (error) {
        return { error: errorMessage(error) };
    }
};

// The entry form shared by every register, driven by constants/registers.jsx
const RegisterForm = ({ register }) => {
    const { record, prefill } = useLoaderData();
    const result = useActionData();
    const navigation = useNavigation();
    const { id } = useParams();
    const isSaving = navigation.state !== "idle";

    return (
        <Form method="post" encType="multipart/form-data" className="max-w-[1000px]">
            <div className="mb-5">
                <p className="serial mb-1 text-sm text-ink-2">{record?.serialNumber || (!id && register.columns.some(({ label }) => label === "Serial") ? "Serial assigned on saving" : "")}</p>
                <h1 className="page-title">
                    {record ? register.heading(record) || `Edit ${register.singular}` : `New ${register.singular}`}
                </h1>
            </div>

            <FormError message={result?.error} />

            {register.formTop && <register.formTop record={record} fields={register.formTopFields} />}

            {(register.formBoxes || register.boxes).map(({ title, fields }) => (
                <FormBox key={title} title={title}>
                    {fields.map((field) => (
                        <FieldCell key={field.name} field={field} record={record} prefill={prefill} />
                    ))}
                </FormBox>
            ))}

            {register.documents && (
                <FormBox title="Documents submitted">
                    {register.documents.map(({ name, label }) => (
                        <label key={name} className="cell" style={{ "--span": 2 }}>
                            <span className="cell-label">{label}</span>
                            {record?.[name] && (
                                <a href={record[name]} target="_blank" rel="noreferrer" className="text-link mb-1 block text-[13px]">
                                    On file; choose a file to replace
                                </a>
                            )}
                            <input
                                type="file"
                                name={name}
                                accept="image/jpeg,image/png,image/webp"
                                className="file-input"
                            />
                        </label>
                    ))}
                </FormBox>
            )}
            {register.documents && (
                <p className="mt-2 text-sm text-ink-2">JPG, PNG or WEBP, up to 5 MB each.</p>
            )}

            <div className="mt-5 flex items-center gap-4">
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                    <PiCheck />
                    {isSaving ? "Saving" : "Save"}
                </button>
                <Link to={id ? `/dashboard/${register.path}/${id}` : `/dashboard/${register.path}`} className="text-link text-sm">
                    Cancel
                </Link>
            </div>
        </Form>
    );
};

export default RegisterForm;
