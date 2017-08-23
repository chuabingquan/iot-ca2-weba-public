'use strict';

exports.generateSearchQuery = (sort, pageNumber, numberPerPage) => {
    var searchQueryObj = {};
    searchQueryObj.sort = sort;
    searchQueryObj.page = pageNumber;
    searchQueryObj.per_page = numberPerPage;
    return searchQueryObj;
};