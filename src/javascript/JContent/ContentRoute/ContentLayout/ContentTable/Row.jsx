import React, {useRef} from 'react';
import {useNodeDrop} from '~/JContent/dnd/useNodeDrop';
import {useNodeDrag} from '~/JContent/dnd/useNodeDrag';
import {TableRow} from '@jahia/moonstone';
import clsx from 'clsx';
import css from '~/JContent/ContentRoute/ContentLayout/ContentTable/ContentTable';
import {allowDoubleClickNavigation} from '~/JContent/JContent.utils';
import {ContextualMenu} from '@jahia/ui-extender';
import PropTypes from 'prop-types';
import styles from './Row.scss';

export const Row = ({
    row,
    selection,
    previewSelection,
    isPreviewOpened,
    setSelectedItemIndex,
    onPreviewSelect,
    doubleClickNavigation,
    index
}) => {
    const rowProps = row.getRowProps();
    const node = row.original;
    const isSelected = node.path === previewSelection && isPreviewOpened;

    const contextualMenu = useRef();

    const ref = useRef(null);
    const {canDrop} = useNodeDrop(node, ref);
    const {dragging} = useNodeDrag(node, ref);

    row.ref = ref;

    const openContextualMenu = event => {
        contextualMenu.current(event);
    };

    return (
        <TableRow {...rowProps}
                  data-cm-role="table-content-list-row"
                  className={clsx(css.tableRow, canDrop && styles.drop, dragging && styles.drag)}
                  isHighlighted={isSelected}
                  onClick={() => {
                      if (isPreviewOpened && !node.notSelectableForPreview) {
                          setSelectedItemIndex(index);
                          onPreviewSelect(node.path);
                      }
                  }}
                  onContextMenu={event => {
                      event.stopPropagation();
                      openContextualMenu(event);
                  }}
                  onDoubleClick={allowDoubleClickNavigation(
                      node.primaryNodeType.name,
                      node.subNodes ? node.subNodes.pageInfo.totalCount : null,
                      () => doubleClickNavigation(node)
                  )}
        >
            <ContextualMenu
                setOpenRef={contextualMenu}
                actionKey={selection.length === 0 || selection.indexOf(node.path) === -1 ? 'contentMenu' : 'selectedContentMenu'}
                path={selection.length === 0 || selection.indexOf(node.path) === -1 ? node.path : null}
                paths={selection.length === 0 || selection.indexOf(node.path) === -1 ? null : selection}
            />
            {row.cells.map(cell => <React.Fragment key={cell.column.id}>{cell.render('Cell')}</React.Fragment>)}
        </TableRow>
    );
};

Row.propTypes = {
    row: PropTypes.object.isRequired,
    selection: PropTypes.array,
    previewSelection: PropTypes.object,
    isPreviewOpened: PropTypes.bool,
    setSelectedItemIndex: PropTypes.func,
    onPreviewSelect: PropTypes.func,
    doubleClickNavigation: PropTypes.func,
    index: PropTypes.number
};