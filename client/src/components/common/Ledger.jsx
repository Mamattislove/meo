import { Link } from "react-router-dom";

// A register table. With rowLink, the first column's link stretches over the whole row.
const Ledger = ({ columns, rows, rowLink }) => {
    const hideClass = (column) =>
        `${column.hideOnPhone ? "hidden md:table-cell" : ""} ${column.nowrap ? "whitespace-nowrap" : ""}`;

    return (
        <table className="ledger">
            <thead>
                <tr>
                    {columns.map((column) => (
                        <th
                            key={column.label}
                            className={`${column.numeric ? "num" : ""} ${hideClass(column)}`}
                        >
                            {column.label}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {rows.map((row) => (
                    <tr key={row._id} className={rowLink ? "is-link" : ""}>
                        {columns.map((column, index) => (
                            <td
                                key={column.label}
                                className={`${column.numeric ? "num" : ""} ${hideClass(column)}`}
                            >
                                {rowLink && index === 0 ? (
                                    <Link to={rowLink(row)} className="row-link">
                                        {column.render(row) || "Open"}
                                    </Link>
                                ) : (
                                    column.render(row)
                                )}
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export default Ledger;
