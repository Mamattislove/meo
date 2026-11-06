import { PiSignOut } from "react-icons/pi";
import { Link, NavLink, useNavigate } from "react-router-dom";
import customFetch from "../../../utils/customFetch";
import { NAV_LINKS } from "../../constants/navigation";
import ThemeToggle from "./ThemeToggle";

// One row from 1280px, the width where every tab fits; two rows below that.
const Masthead = ({ user }) => {
    const navigate = useNavigate();

    const logout = async () => {
        await customFetch.get("/auth/logout");
        navigate("/login");
    };

    return (
        <header className="no-print z-30 border-b border-rule bg-sheet min-[1280px]:sticky min-[1280px]:top-0">
            <div className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-x-5 px-4 sm:px-6 min-[1280px]:flex-nowrap">
                <Link
                    to="/dashboard"
                    title="Office of the Building Official"
                    className="flex h-14 items-center gap-2 text-[15px] font-semibold tracking-tight no-underline"
                >
                    <img src="/favicon.svg" alt="" className="size-6 rounded-[5px]" />
                    OBO
                </Link>
                <div className="ml-auto flex h-14 shrink-0 items-center gap-3 text-sm min-[1280px]:order-last">
                    <ThemeToggle />
                    <button type="button" onClick={logout} aria-label="Sign out" title={`Sign out (${user.username})`} className="btn !min-h-8 !px-2">
                        <PiSignOut className="size-[18px]" />
                    </button>
                </div>
                <nav
                    aria-label="Registers"
                    className="tabs -mx-4 flex w-screen gap-3.5 border-t border-rule px-4 sm:-mx-6 sm:px-6 min-[1280px]:mx-0 min-[1280px]:w-auto min-[1280px]:min-w-0 min-[1280px]:flex-1 min-[1280px]:border-t-0 min-[1280px]:px-0"
                >
                    {NAV_LINKS.map(({ label, path, end, icon: Icon }) => (
                        <NavLink key={path} to={path} end={end} className="tab">
                            <Icon aria-hidden="true" />
                            {label}
                        </NavLink>
                    ))}
                </nav>
            </div>
        </header>
    );
};

export default Masthead;
