import { PiCaretLeft, PiCaretRight } from "react-icons/pi";
import { Link, useSearchParams } from "react-router-dom";

const Pagination = ({ page, totalPages, totalItems }) => {
    const [searchParams] = useSearchParams();

    const linkTo = (target) => {
        const params = new URLSearchParams(searchParams);
        params.set("page", target);
        return `?${params}`;
    };

    return (
        <div className="flex items-baseline justify-between py-3 text-sm text-ink-2">
            <span>
                {totalItems} {totalItems === 1 ? "entry" : "entries"}
            </span>
            {totalPages > 1 && (
                <span className="flex items-baseline gap-4">
                    {page > 1 && (
                        <Link to={linkTo(page - 1)} className="text-link back-link">
                            <PiCaretLeft />
                            Previous
                        </Link>
                    )}
                    <span>
                        Page {page} of {totalPages}
                    </span>
                    {page < totalPages && (
                        <Link to={linkTo(page + 1)} className="text-link back-link">
                            Next
                            <PiCaretRight />
                        </Link>
                    )}
                </span>
            )}
        </div>
    );
};

export default Pagination;
