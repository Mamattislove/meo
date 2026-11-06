// Example CRUD page wired to /api/v1/items. Copy it for each new resource.
import { Form, useLoaderData, useNavigation } from "react-router-dom";
import { toast } from "react-toastify";
import { Card, InputField } from "../components";
import customFetch from "../../utils/customFetch";

export const loader = async ({ request }) => {
    const params = Object.fromEntries(new URL(request.url).searchParams);
    const { data } = await customFetch.get("/items", { params });
    return data;
};

export const action = async ({ request }) => {
    const formData = await request.formData();
    const { intent, id, ...data } = Object.fromEntries(formData);
    try {
        if (intent === "delete") {
            await customFetch.delete(`/items/${id}`);
            toast.success("Item deleted");
        } else {
            await customFetch.post("/items", data);
            toast.success("Item added");
        }
    } catch (error) {
        toast.error(error?.response?.data?.msg || "Something went wrong");
    }
    return null;
};

const Items = () => {
    const { items, totalItems } = useLoaderData();
    const navigation = useNavigation();
    const isSubmitting = navigation.state === "submitting";

    return (
        <div className="space-y-6">
            <Card title="Add item">
                <Form method="post" className="grid gap-4 sm:grid-cols-[1fr_2fr_auto] sm:items-end">
                    <InputField label="Name" name="name" required />
                    <InputField label="Description" name="description" />
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
                    >
                        Add
                    </button>
                </Form>
            </Card>

            <Card title={`Items (${totalItems})`}>
                {items.length === 0 ? (
                    <p className="text-sm text-slate-500">No items yet.</p>
                ) : (
                    <ul className="divide-y divide-slate-100">
                        {items.map((item) => (
                            <li key={item._id} className="flex items-center justify-between py-2 text-sm">
                                <div>
                                    <div className="font-medium text-slate-800">{item.name}</div>
                                    <div className="text-slate-500">{item.description}</div>
                                </div>
                                <Form method="post">
                                    <input type="hidden" name="id" value={item._id} />
                                    <button
                                        name="intent"
                                        value="delete"
                                        className="text-red-600 hover:underline"
                                    >
                                        Delete
                                    </button>
                                </Form>
                            </li>
                        ))}
                    </ul>
                )}
            </Card>
        </div>
    );
};

export default Items;
