import { PiUserPlus } from "react-icons/pi";
import { Form, useActionData, useLoaderData, useNavigation } from "react-router-dom";
import { toast } from "react-toastify";
import { FormBox, FormError, InputField } from "../components";
import { USER_ROLES } from "../../../utils/constants.js";
import customFetch from "../../utils/customFetch";
import { errorMessage, formatDate, sentence } from "../../utils/format";

export const loader = async () => {
    const { data } = await customFetch.get("/users");
    return data;
};

export const action = async ({ request }) => {
    const { intent, id, ...data } = Object.fromEntries(await request.formData());
    try {
        if (intent === "delete") {
            await customFetch.delete(`/users/${id}`);
            toast("User deleted");
        } else if (intent === "role") {
            await customFetch.patch(`/users/${id}`, data);
            toast("Role changed");
        } else {
            await customFetch.post("/auth/register", data);
            toast("User added");
        }
        return { added: intent === "create" };
    } catch (error) {
        return { error: errorMessage(error) };
    }
};

const Users = () => {
    const { users } = useLoaderData();
    const result = useActionData();
    const navigation = useNavigation();

    return (
        <div className="max-w-[1000px]">
            <h1 className="page-title mb-5">Users</h1>
            <FormError message={result?.error} />

            <table className="ledger mb-8">
                <thead>
                    <tr>
                        <th>Username</th>
                        <th className="hidden sm:table-cell">Email</th>
                        <th className="hidden sm:table-cell">Added</th>
                        <th>Role</th>
                        <th />
                    </tr>
                </thead>
                <tbody>
                    {users.map((user) => (
                        <tr key={user._id}>
                            <td>{user.username}</td>
                            <td className="hidden sm:table-cell">{user.email}</td>
                            <td className="hidden sm:table-cell">{formatDate(user.createdAt)}</td>
                            <td>
                                <Form method="post">
                                    <input type="hidden" name="intent" value="role" />
                                    <input type="hidden" name="id" value={user._id} />
                                    <select
                                        name="role"
                                        aria-label={`Role of ${user.username}`}
                                        defaultValue={user.role}
                                        key={user.role}
                                        className="plain-select"
                                        onChange={(event) => event.target.form.requestSubmit()}
                                    >
                                        {Object.values(USER_ROLES).map((role) => (
                                            <option key={role} value={role}>
                                                {sentence(role)}
                                            </option>
                                        ))}
                                    </select>
                                </Form>
                            </td>
                            <td className="text-right">
                                <Form method="post">
                                    <input type="hidden" name="intent" value="delete" />
                                    <input type="hidden" name="id" value={user._id} />
                                    <button type="submit" className="text-link cursor-pointer text-sm">
                                        Delete
                                    </button>
                                </Form>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <Form method="post" key={users.length}>
                <input type="hidden" name="intent" value="create" />
                <FormBox title="Add a user">
                    <InputField label="Username" name="username" required span={3} autoComplete="off" />
                    <InputField label="Email" name="email" type="email" required span={3} autoComplete="off" />
                    <InputField label="Password (8 characters or more)" name="password" type="password" required minLength={8} span={3} autoComplete="new-password" />
                    <InputField label="Confirm password" name="confirmPassword" type="password" required span={3} autoComplete="new-password" />
                </FormBox>
                <button type="submit" className="btn btn-primary mt-3" disabled={navigation.state !== "idle"}>
                    <PiUserPlus />
                    Add user
                </button>
            </Form>
        </div>
    );
};

export default Users;
