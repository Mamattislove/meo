import { Outlet, redirect, useLoaderData, useNavigation } from "react-router-dom";
import customFetch from "../../utils/customFetch";
import { Masthead } from "../components";

export const loader = async () => {
    try {
        const { data } = await customFetch.get("/users/current-user");
        return { user: data.user };
    } catch {
        return redirect("/login");
    }
};

const DashboardLayout = () => {
    const { user } = useLoaderData();
    const navigation = useNavigation();

    return (
        <div className="min-h-screen">
            <Masthead user={user} />
            <main
                className={`mx-auto max-w-[1240px] px-4 py-6 transition-opacity sm:px-6 sm:py-8 ${
                    navigation.state === "loading" ? "opacity-60" : ""
                }`}
            >
                <Outlet context={{ user }} />
            </main>
        </div>
    );
};

export default DashboardLayout;
