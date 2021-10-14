export const getInitials = (name: string | undefined) => {
    if (!name) {
        return undefined;
    } else {
        return name
            .match(/(^\S\S?|\b\S)?/g)
            ?.join('')
            ?.match(/(^\S|\S$)?/g)
            ?.join('')
            .toUpperCase();
    }
};
