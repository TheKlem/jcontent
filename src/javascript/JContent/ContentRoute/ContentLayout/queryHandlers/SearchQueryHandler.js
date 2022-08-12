import {SearchQuery} from '~/JContent/ContentRoute/ContentLayout/queryHandlers/SearchQueryHandler.gql-queries';

export const SearchQueryHandler = {
    getQuery() {
        return SearchQuery;
    },

    getQueryParams({uilang, lang, params, pagination, sort}) {
        return {
            searchPath: params.searchPath,
            nodeType: (params.searchContentType || 'jmix:searchable'),
            searchTerms: params.searchTerms,
            nodeNameSearchTerms: `%${params.searchTerms}%`,
            language: lang,
            displayLanguage: uilang,
            offset: pagination.currentPage * pagination.pageSize,
            limit: pagination.pageSize,
            fieldSorter: sort.orderBy === '' ? null : {
                sortType: sort.order === '' ? null : (sort.order === 'DESC' ? 'ASC' : 'DESC'),
                fieldName: sort.orderBy === '' ? null : sort.orderBy,
                ignoreCase: true
            },
            fieldFilter: {
                filters: [],
                multi: 'NONE'
            }
        };
    },

    getResultsPath(data) {
        return data && data.jcr && data.jcr.nodesByCriteria;
    }
};
