import { matchedData } from "express-validator";

const DEFAULT_LIMIT = 20;

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Runs a list request validated by validateListQuery: every query value other than
// page, limit and search is an exact-match filter. Newest records come first.
// searchRelated(pattern) can add more conditions, e.g. matches on a linked record.
// where limits the list; the request's own filters take priority over it.
// translate can turn shortcut query values into real conditions.
export const listRecords = async (
    req,
    Model,
    { searchFields = [], searchRelated, populate = [], where = {}, sort = { _id: -1 }, translate } = {},
) => {
    const {
        page = 1,
        limit = DEFAULT_LIMIT,
        search,
        ...filter
    } = matchedData(req, { locations: ["query"] });

    if (search && searchFields.length) {
        const pattern = new RegExp(escapeRegex(search), "i");
        filter.$or = searchFields.map((field) => ({ [field]: pattern }));
        if (searchRelated) filter.$or.push(...(await searchRelated(pattern)));
    }

    translate?.(filter);
    Object.assign(filter, { ...where, ...filter });

    const [docs, totalItems] = await Promise.all([
        Model.find(filter)
            .sort(sort)
            .skip((page - 1) * limit)
            .limit(limit)
            .populate(populate),
        Model.countDocuments(filter),
    ]);
    return { docs, totalItems, page, totalPages: Math.ceil(totalItems / limit) };
};
