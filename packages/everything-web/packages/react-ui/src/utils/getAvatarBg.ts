import { useMemo } from 'react';

export const getAvatarBg = (initials: string): string => {
    const indexFactor = 20;
    const colorIndex = useMemo(
        () => ((initials?.codePointAt(0) || 0) % indexFactor) + 1,
        [initials]
    );
    return colorsList[colorIndex - 1];
};

const colorsList = [
    '#F44336',
    '#3F51B5',
    '#4CAF50',
    '#FFA000',
    '#795548',
    '#E91E63',
    '#2F80FF',
    '#8BC34A',
    '#F57C00',
    '#4E342E',
    '#9C27B0',
    '#00BCD4',
    '#C0CA33',
    '#F4511E',
    '#616161',
    '#673AB7',
    '#009688',
    '#FBC02D',
    '#BF360C',
    '#455A64'
];
