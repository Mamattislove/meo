import { Link } from "react-router-dom";

const NotFound = () => {
    return (
        <div className="max-w-xl px-4 py-10 sm:px-6">
            <h1 className="page-title">No such page</h1>
            <p className="mt-3 text-ink-2">The address may be mistyped, or the record may have been removed.</p>
            <Link to="/dashboard" className="text-link mt-4 inline-block">
                Back to the desk
            </Link>
        </div>
    );
};

export default NotFound;
