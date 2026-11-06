import { Link, useRouteError } from "react-router-dom";

const ErrorPage = () => {
    const error = useRouteError();
    console.log(error);

    return (
        <div className="max-w-xl px-4 py-10 sm:px-6">
            <h1 className="page-title">That page could not be opened</h1>
            <p className="mt-3 text-ink-2">
                {error?.response?.data?.msg || error?.message || "Unexpected error"}
            </p>
            <Link to="/dashboard" className="text-link mt-4 inline-block">
                Back to the desk
            </Link>
        </div>
    );
};

export default ErrorPage;
