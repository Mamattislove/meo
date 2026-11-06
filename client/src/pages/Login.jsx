import { PiSignIn } from "react-icons/pi";
import { Form, redirect, useActionData, useNavigation } from "react-router-dom";
import { InputField, ThemeToggle } from "../components";
import customFetch from "../../utils/customFetch";
import { errorMessage } from "../../utils/format";

export const action = async ({ request }) => {
    try {
        const data = Object.fromEntries(await request.formData());
        await customFetch.post("/auth/login", data);
        return redirect("/dashboard");
    } catch (error) {
        return { error: errorMessage(error) };
    }
};

// Name large at the left, form at the right, both resting on the same line.
const Login = () => {
    const result = useActionData();
    const navigation = useNavigation();
    const isSubmitting = navigation.state !== "idle";

    return (
        <div className="mx-auto flex min-h-screen max-w-[1240px] flex-col px-5 py-5 sm:px-8 sm:py-8">
            <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
                    <img src="/favicon.svg" alt="" className="size-6 rounded-[5px]" />
                    OBO
                </span>
                <ThemeToggle />
            </div>

            <div className="flex flex-1 flex-col justify-center gap-10 py-10 lg:flex-row lg:items-end lg:justify-between lg:gap-16">
                <div>
                    <h1 className="text-[clamp(2.5rem,6.5vw,5rem)] leading-[1.02] font-semibold tracking-[-0.04em]">
                        Office of the
                        <br />
                        Building Official
                    </h1>
                    <p className="mt-5 max-w-md text-[15px] text-ink-2">
                        Permits, annual inspections and fee assessments, all in one register.
                    </p>
                </div>

                <Form method="post" className="form-box w-full shrink-0 !p-6 lg:mb-1 lg:max-w-[380px]">
                    <h2 className="section-title mb-5">Sign in</h2>
                    <div className="cells">
                        <InputField label="Username" name="username" required span={6} autoComplete="username" autoFocus />
                        <InputField label="Password" name="password" type="password" required span={6} autoComplete="current-password" />
                    </div>
                    {result?.error && (
                        <p role="alert" className="mt-4 rounded-md bg-danger-soft px-3 py-2 text-sm text-stamp">
                            {result.error}
                        </p>
                    )}
                    <button type="submit" disabled={isSubmitting} className="btn btn-primary mt-5 w-full">
                        <PiSignIn />
                        {isSubmitting ? "Signing in" : "Sign in"}
                    </button>
                </Form>
            </div>
        </div>
    );
};

export default Login;
