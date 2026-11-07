let count = 0;

// A key for a list row. crypto.randomUUID isn't available over plain http, which is how
// other devices on the office's network reach the app.
export const newKey = () => {
    count += 1;
    return `row-${count}`;
};
