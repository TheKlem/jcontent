import React, {useEffect, useMemo} from 'react';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import {registry} from '@jahia/ui-extender';
import {useTranslation} from 'react-i18next';
import {CM_DRAWER_STATES, cmCloseTablePaths, cmGoto, cmOpenPaths, cmOpenTablePaths} from '~/JContent/redux/JContent.redux';
import {extractPaths, getCanDisplayItemParams} from '~/JContent/JContent.utils';
import {shallowEqual, useDispatch, useSelector} from 'react-redux';
import {cmSetPreviewSelection} from '~/JContent/redux/preview.redux';
import {cmSetPage, cmSetPageSize} from '~/JContent/redux/pagination.redux';
import {cmRemoveSelection} from '~/JContent/redux/selection.redux';
import JContentConstants from '~/JContent/JContent.constants';
import ContentEmptyDropZone from './ContentEmptyDropZone';
import ContentNotFound from './ContentNotFound';
import EmptyTable from './EmptyTable';
import {Table, TableBody, TablePagination} from '@jahia/moonstone';
import {useTable} from 'react-table';
import {useExpandedControlled, useRowSelection, useSort} from './reactTable/plugins';
import ContentListHeader from './ContentListHeader/ContentListHeader';
import {mainColumnData, reducedColumnData} from './reactTable/columns';
import ContentTableWrapper from './ContentTableWrapper';
import {flattenTree, isInSearchMode} from '../ContentLayout.utils';
import {useKeyboardNavigation} from '../useKeyboardNavigation';
import {cmSetSort} from '~/JContent/redux/sort.redux';
import {Row} from '~/JContent/ContentRoute/ContentLayout/ContentTable/Row';
import {useFileDrop} from '~/JContent/dnd/useFileDrop';
import styles from './ContentTable.scss';

export const ContentTable = ({rows, isContentNotFound, totalCount, isLoading, isStructured}) => {
    const {t} = useTranslation('jcontent');
    const dispatch = useDispatch();

    const {mode, previewSelection, siteKey, path, pagination, previewState, selection, searchTerms, tableOpenPaths, sort} = useSelector(state => ({
        mode: state.jcontent.mode,
        previewSelection: state.jcontent.previewSelection,
        siteKey: state.site,
        path: state.jcontent.path,
        pagination: state.jcontent.pagination,
        previewState: state.jcontent.previewState,
        selection: state.jcontent.selection,
        tableView: state.jcontent.tableView,
        searchTerms: state.jcontent.params.searchTerms,
        tableOpenPaths: state.jcontent.tableOpenPaths,
        sort: state.jcontent.sort
    }), shallowEqual);

    const onPreviewSelect = previewSelection => dispatch(cmSetPreviewSelection(previewSelection));
    const setPath = (siteKey, path, mode, params) => {
        dispatch(cmOpenPaths(extractPaths(siteKey, path, mode)));
        dispatch(cmGoto({path, params}));
    };

    const setMode = mode => dispatch(cmGoto({mode}));
    const setCurrentPage = page => dispatch(cmSetPage(page - 1));
    const setPageSize = pageSize => dispatch(cmSetPageSize(pageSize));

    const paths = useMemo(() => flattenTree(rows).map(n => n.path), [rows]);
    const {
        mainPanelRef,
        handleKeyboardNavigation,
        setFocusOnMainContainer,
        setSelectedItemIndex
    } = useKeyboardNavigation({
        listLength: paths.length,
        onSelectionChange: index => {
            if (isPreviewOpened) {
                onPreviewSelect(paths[index]);
            }
        }
    });
    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        rows: tableRows,
        prepareRow
    } = useTable(
        {
            columns: mainColumnData,
            data: rows,
            isExpanded: row => tableOpenPaths.indexOf(row.path) > -1,
            onExpand: (id, value) => {
                const node = id.split('.').reduce((p, i) => p.subRows[i], {subRows: rows});
                if (value === false) {
                    dispatch(cmCloseTablePaths([node.path]));
                } else {
                    dispatch(cmOpenTablePaths([node.path]));
                }
            },
            sort,
            onSort: (column, order) => {
                dispatch(cmSetSort({order, orderBy: column.property}));
            }
        },
        useRowSelection,
        useSort,
        useExpandedControlled
    );

    useEffect(() => {
        const removeSelection = path => dispatch(cmRemoveSelection(path));

        if (selection.length > 0) {
            const toRemove = selection.filter(path => paths.indexOf(path) === -1);
            if (toRemove.length > 0) {
                removeSelection(toRemove);
            }
        }
    }, [rows, selection, dispatch, paths]);

    const doubleClickNavigation = node => {
        let newMode = mode;
        if (mode === JContentConstants.mode.SEARCH) {
            const params = getCanDisplayItemParams(node);
            newMode = registry.find({type: 'accordionItem', target: 'jcontent'}).find(acc => acc.canDisplayItem && acc.canDisplayItem(params))?.key;
            if (newMode) {
                setMode(newMode);
            }
        }

        setPath(siteKey, node.path, newMode, {sub: node.primaryNodeType.name !== 'jnt:page' && node.primaryNodeType.name !== 'jnt:contentFolder'});
    };

    let columnData = previewState === CM_DRAWER_STATES.SHOW ? reducedColumnData : mainColumnData;
    let isPreviewOpened = previewState === CM_DRAWER_STATES.SHOW;

    const tableConfig = registry.get('accordionItem', mode)?.tableConfig;

    const [{isCanDrop}, drop] = useFileDrop({uploadType: tableConfig?.uploadType, uploadPath: path});

    if (isContentNotFound) {
        return <ContentNotFound columnSpan={columnData.length} t={t}/>;
    }

    const tableHeader = tableConfig?.tableHeader;

    if (!rows?.length && !isLoading) {
        if ((mode === JContentConstants.mode.SEARCH || mode === JContentConstants.mode.SQL2SEARCH)) {
            return <EmptyTable text={searchTerms}/>;
        }

        return (
            <>
                {tableHeader}
                <ContentEmptyDropZone reference={drop} uploadType={tableConfig?.uploadType} isCanDrop={isCanDrop}/>
            </>
        );
    }

    return (
        <div ref={drop} className={clsx({'moonstone-drop_card': isCanDrop}, 'flexFluid', 'flexCol')}>
            {tableHeader}
            <ContentTableWrapper isCanDrop={isCanDrop}
                                 reference={mainPanelRef}
                                 uploadType={tableConfig?.uploadType}
                                 onKeyDown={handleKeyboardNavigation}
                                 onClick={setFocusOnMainContainer}
            >
                <Table aria-labelledby="tableTitle"
                       data-cm-role="table-content-list"
                       style={{width: '100%', minWidth: '1100px'}}
                       {...getTableProps()}
                >
                    <ContentListHeader headerGroups={headerGroups}/>
                    <TableBody {...getTableBodyProps()}>
                        {tableRows.map((row, index) => {
                            prepareRow(row);
                            return (
                                <Row key={'row' + row.original.uuid}
                                     row={row}
                                     tableConfig={tableConfig}
                                     selection={selection}
                                     previewSelection={previewSelection}
                                     isPreviewOpened={isPreviewOpened}
                                     setSelectedItemIndex={setSelectedItemIndex}
                                     doubleClickNavigation={doubleClickNavigation}
                                     index={index}
                                     onPreviewSelect={onPreviewSelect}
                                />
                            );
                        })}
                    </TableBody>
                </Table>
            </ContentTableWrapper>
            {(!isStructured || isInSearchMode(mode) || JContentConstants.mode.MEDIA === mode) &&
            <TablePagination className={styles.pagination}
                             totalNumberOfRows={totalCount}
                             currentPage={pagination.currentPage + 1}
                             rowsPerPage={pagination.pageSize}
                             label={{
                                 rowsPerPage: t('jcontent:label.pagination.rowsPerPage'),
                                 of: t('jcontent:label.pagination.of')
                             }}
                             rowsPerPageOptions={[10, 25, 50, 100]}
                             onPageChange={setCurrentPage}
                             onRowsPerPageChange={setPageSize}
            />}
        </div>
    );
};

ContentTable.propTypes = {
    isContentNotFound: PropTypes.bool,
    isLoading: PropTypes.bool,
    isStructured: PropTypes.bool,
    rows: PropTypes.array.isRequired,
    totalCount: PropTypes.number.isRequired
};

export default ContentTable;
