export type Paginated<T = any> = {
    saved?: T[];
    existingRecords: T[],
    hasPreviousPage: boolean,
    previousPages: number,
    hasNextPage: boolean,
    nextPages: number,
    totalPages: number,
    totalDocuments: number,
    currentPage: number
};
    