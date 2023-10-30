import React, {useEffect, useRef, useState} from 'react';
import {HandleDrag} from '@jahia/moonstone';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import styles from './Box.scss';
import {registry} from '@jahia/ui-extender';
import {useNodeDrag} from '~/JContent/dnd/useNodeDrag';
import editStyles from './EditFrame.scss';
import {useNodeDrop} from '~/JContent/dnd/useNodeDrop';
import {DefaultBar} from '~/JContent/EditFrame/DefaultBar';
import {getCoords} from '~/JContent/EditFrame/EditFrame.utils';
import Breadcrumbs from './Breadcrumbs';

function getBoundingBox(element, isHeaderDisplayed) {
    const rect = getCoords(element);

    const left = Math.max(2, (rect.left - 4));
    const width = Math.min(element.ownerDocument.documentElement.clientWidth - left - 2, rect.width + 8) + (isHeaderDisplayed ? 0 : 4);
    const top = rect.top;
    const height = rect.height + (isHeaderDisplayed ? 0 : 4);
    return {top, left, width, height};
}

const reposition = function (element, currentOffset, setCurrentOffset, isHeaderDisplayed) {
    const box = getBoundingBox(element, isHeaderDisplayed);
    if (box.top !== currentOffset.top || box.left !== currentOffset.left || box.width !== currentOffset.width || box.height !== currentOffset.height) {
        setCurrentOffset(box);
    }
};

export const Box = React.memo(({
    node,
    element,
    breadcrumbs,
    entries,
    language,
    displayLanguage,
    addIntervalCallback,
    onMouseOver,
    onMouseOut,
    onClick,
    onSaved,
    rootElementRef,
    currentFrameRef,
    isHeaderDisplayed,
    isCurrent,
    isSelected,
    isActionsHidden,
    onDoubleClick
}) => {
    const ref = useRef(element);
    const [currentOffset, setCurrentOffset] = useState(getBoundingBox(element, isHeaderDisplayed));

    useEffect(() => {
        element.addEventListener('mouseenter', onMouseOver);
        element.addEventListener('mouseleave', onMouseOut);
        element.addEventListener('click', onClick);
        element.addEventListener('dblclick', onDoubleClick);

        return () => {
            element.removeEventListener('mouseenter', onMouseOver);
            element.removeEventListener('mouseleave', onMouseOut);
            element.removeEventListener('click', onClick);
            element.removeEventListener('dblclick', onDoubleClick);
        };
    }, [element, node, onMouseOut, onMouseOver, onClick, onDoubleClick]);

    element.dataset.current = isCurrent;

    let parent = element.dataset.jahiaParent && element.ownerDocument.getElementById(element.dataset.jahiaParent);
    if (!parent) {
        parent = element.closest('[jahiatype=module]');

        if (parent) {
            element.dataset.jahiaParent = parent.id;
        }
    }

    const rootDiv = useRef();

    const [{dragging}, drag] = useNodeDrag({dragSource: node});
    const [{isCanDrop, insertPosition, destParent}, drop] = useNodeDrop({
        dropTarget: parent && node,
        orderable: true,
        entries,
        onSaved
    });

    drop(ref);

    useEffect(() => {
        const currentRootElement = rootElementRef.current;
        if (dragging) {
            element.ownerDocument.body.classList.add(editStyles.disablePointerEvents);
            element.classList.add(editStyles.dragging);
            currentRootElement?.classList?.add?.(styles.dragging);
        }

        return () => {
            element.ownerDocument.body.classList.remove(editStyles.disablePointerEvents);
            element.classList.remove(editStyles.dragging);
            currentRootElement?.classList?.remove?.(styles.dragging);
        };
    }, [dragging, element, rootElementRef]);

    useEffect(() => {
        if (parent) {
            element.classList.add(editStyles.enablePointerEvents);
        }

        return () => {
            element.classList.remove(editStyles.enablePointerEvents);
        };
    }, [parent, element]);

    useEffect(() => {
        const classname = insertPosition ? styles['dropTarget_' + insertPosition] : styles.dropTarget;
        if (isCanDrop) {
            element.style.setProperty('--droplabel', `"[${destParent?.name?.replace(/[\u00A0-\u9999<>&]/g, i => '&#' + i.charCodeAt(0) + ';')}]"`);
            element.classList.add(classname);
        }

        return () => {
            element.classList.remove(classname);
            element.style.removeProperty('--droplabel');
        };
    }, [isCanDrop, insertPosition, destParent, element]);

    useEffect(() => addIntervalCallback(() => reposition(element, currentOffset, setCurrentOffset, isHeaderDisplayed)), [addIntervalCallback, currentOffset, element, setCurrentOffset, isHeaderDisplayed]);

    if (!isCurrent && !isSelected) {
        return false;
    }

    reposition(element, currentOffset, setCurrentOffset, isHeaderDisplayed);

    const type = element.getAttribute('type');

    const customBarItem = node && registry.get('customContentEditorBar', node.primaryNodeType.name);
    const Bar = (customBarItem && customBarItem.component) || DefaultBar;

    // Display current header through portal to be able to always position it on top of existing selection(s)
    const headerProps = {
        className: clsx(styles.sticky, 'flexRow_nowrap', 'alignCenter', editStyles.enablePointerEvents)
    };
    const Header = (
        <div {...headerProps}
             jahiatype="header" // eslint-disable-line react/no-unknown-property
             data-current={isCurrent}
             data-jahia-id={element.getAttribute('id')}
             onMouseOver={onMouseOver}
             onMouseOut={onMouseOut}
             onClick={onClick}
             onDoubleClick={onDoubleClick}
        >
            <div className={clsx(styles.header, 'flexRow_nowrap', 'alignCenter')}>
                {type === 'existingNode' && !isActionsHidden && (
                    <div ref={drag} className={clsx(editStyles.enablePointerEvents, styles.dragHandle, 'flexRow_center', 'alignCenter')}>
                        <HandleDrag size="default"/>
                    </div>
                )}
                {node && <Bar isActionsHidden={isActionsHidden} node={node} language={language} displayLanguage={displayLanguage} width={currentOffset.width} currentFrameRef={currentFrameRef}/>}
            </div>
        </div>
    );

    const boxStyle = breadcrumbs.length > 0 ? styles.relHeaderAndFooter : styles.relHeader;

    return (
        <div ref={rootDiv}
             className={clsx(styles.root)}
             style={currentOffset}
        >
            <div className={clsx(styles.rel, isHeaderDisplayed ? boxStyle : styles.relNoHeader, isSelected ? styles.selected : styles.current)}>
                {isHeaderDisplayed && Header}

                {breadcrumbs.length > 0 &&
                    <div className={clsx(styles.relFooter)}
                         data-current={isCurrent}
                         data-jahia-id={element.getAttribute('id')}
                         jahiatype="footer" // eslint-disable-line react/no-unknown-property
                         onClick={onClick}
                    >
                        <Breadcrumbs nodes={breadcrumbs} isResponsiveMode={element.getBoundingClientRect().width < 350}/>
                    </div>}
            </div>
        </div>
    );
});

Box.propTypes = {
    element: PropTypes.any,

    breadcrumbs: PropTypes.array,

    node: PropTypes.any,

    entries: PropTypes.array,

    language: PropTypes.string,

    displayLanguage: PropTypes.string,

    addIntervalCallback: PropTypes.func,

    onSaved: PropTypes.func,

    onMouseOver: PropTypes.func,

    onMouseOut: PropTypes.func,

    onClick: PropTypes.func,

    rootElementRef: PropTypes.any,

    currentFrameRef: PropTypes.any,

    isHeaderDisplayed: PropTypes.bool,

    isCurrent: PropTypes.bool,

    isSelected: PropTypes.bool,

    isActionsHidden: PropTypes.bool,

    onDoubleClick: PropTypes.func
};
