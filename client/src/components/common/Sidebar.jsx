import { NavLink, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { MdLogout } from "react-icons/md";
import customFetch from "../../../utils/customFetch";
import { NAV_LINKS } from "../../constants/navigation";

const Sidebar = ({ user }) => {
    const navigate = useNavigate();

    const logout = async () => {
        await customFetch.get("/auth/logout");
        toast.success("Logged out");
        navigate("/login");
    };

    return (
        <aside className="flex w-56 shrink-0 flex-col bg-slate-900 text-slate-200">
            <div className="px-5 py-4 text-lg font-semibold text-white">
                OBO
            </div>
            <nav className="flex-1 space-y-1 px-3">
                {NAV_LINKS.map(({ label, path, icon: Icon, end }) => (
                    <NavLink
                        key={path}
                        to={path}
                        end={end}
                        className={({ isActive }) =>
                            `flex items-center gap-3 rounded-md px-3 py-2 text-sm ${
                                isActive ? "bg-slate-700 text-white" : "hover:bg-slate-800"
                            }`
                        }
                    >
                        <Icon className="size-5" />
                        {label}
                    </NavLink>
                ))}
            </nav>
            <div className="border-t border-slate-800 p-3 text-sm">
                <div className="px-3 pb-2 text-slate-400">
                    {user.username} ({user.role})
                </div>
                <button
                    type="button"
                    onClick={logout}
                    className="flex w-full items-center gap-3 rounded-md px-3 py-2 hover:bg-slate-800"
                >
                    <MdLogout className="size-5" />
                    Logout
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
