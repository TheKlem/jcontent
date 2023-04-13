import React, {useContext} from 'react';
import {ArrowLeft, Button, Chip, Header} from '@jahia/moonstone';
import {MainActionBar} from '~/JContent/ContentRoute/MainActionBar';
import JContentConstants from '~/JContent/JContent.constants';
import ContentStatuses from '~/JContent/ContentRoute/ContentStatuses';
import {shallowEqual, useDispatch, useSelector} from 'react-redux';
import ContentPath from '~/JContent/ContentRoute/ContentPath';
import {useNodeInfo} from '@jahia/data-helper';
import {getNodeTypeIcon} from '~/JContent/JContent.utils';
import {useTranslation} from 'react-i18next';
import {CM_DRAWER_STATES, cmGoto} from '~/JContent/redux/JContent.redux';
import SearchControlBar from '~/JContent/ContentRoute/ToolBar/SearchControlBar';
import BrowseControlBar from '~/JContent/ContentRoute/ToolBar/BrowseControlBar';
import {cmClearSelection} from '~/JContent/redux/selection.redux';
import {SelectionActionsBar} from '~/JContent/ContentRoute/ToolBar/SelectionActionsBar/SelectionActionsBar';
import SearchInput from './SearchInput';
import {registry} from '@jahia/ui-extender';
import {ResizeContext} from '../MainLayout/ResizeObserver';
import {NarrowHeaderActions} from './NarrowHeaderActions';

const NARROW_HEADER_WIDTH = 750;

let extractNodeInfo = function (node, loading) {
    const nodeType = node?.primaryNodeType;
    const title = ((!loading && node && node.displayName) || 'Loading ...');
    return {nodePath: node?.path, nodeType, title};
};

const ContentHeader = () => {
    const {t} = useTranslation('jcontent');
    const dispatch = useDispatch();
    const {mode, preSearchModeMemo, path, language, displayLanguage, selection, previewSelection} = useSelector(state => ({
        mode: state.jcontent.mode,
        preSearchModeMemo: state.jcontent.preSearchModeMemo,
        path: state.jcontent.path,
        language: state.language,
        displayLanguage: state.uilang,
        selection: state.jcontent.selection,
        previewSelection: state.jcontent.previewState === CM_DRAWER_STATES.SHOW && state.jcontent.previewSelection !== null
    }), shallowEqual);

    const width = useContext(ResizeContext);
    const narrow = width !== 0 && width <= NARROW_HEADER_WIDTH;

    const inSearchMode = JContentConstants.mode.SEARCH === mode || JContentConstants.mode.SQL2SEARCH === mode;

    const viewSelector = registry.get('accordionItem', mode)?.tableConfig?.viewSelector;

    const {loading, node} = useNodeInfo({path, language: language, displayLanguage}, {getPrimaryNodeType: true, getDisplayName: true});

    let clear = () => dispatch(cmClearSelection());

    if (inSearchMode) {
        const clearSearchFunc = () => {
            const defaultMode = registry.find({type: 'accordionItem', target: 'jcontent'})[0].key;
            dispatch(cmGoto({mode: preSearchModeMemo ? preSearchModeMemo : defaultMode, params: {}}));
        };

        return narrow ? (
            <Header
                backButton={<Button icon={<ArrowLeft/>} onClick={clearSearchFunc}/>}
                mainActions={JContentConstants.mode.SEARCH === mode && <SearchInput/>}
                title={t('label.contentManager.title.search')}
                toolbarLeft={!previewSelection && selection.length > 0 ? <NarrowHeaderActions previewSelection={previewSelection} selection={selection} clear={clear}/> : <SearchControlBar/>}
            />
        ) : (
            <Header
                backButton={<Button icon={<ArrowLeft/>} onClick={clearSearchFunc}/>}
                mainActions={JContentConstants.mode.SEARCH === mode && <SearchInput/>}
                title={t('label.contentManager.title.search')}
                toolbarLeft={
                    <>
                        {!previewSelection && selection.length > 0 && <SelectionActionsBar paths={selection} clear={clear}/>}
                        {selection.length === 0 && <SearchControlBar/>}
                    </>
                }
            />
        );
    }

    const {nodePath, nodeType, title} = extractNodeInfo(node, loading);

    return narrow ? (
        <Header
            title={title}
            mainActions={<MainActionBar/>}
            breadcrumb={<ContentPath/>}
            contentType={nodeType && <Chip color="accent" label={nodeType.displayName || nodeType.name} icon={getNodeTypeIcon(nodeType.name)}/>}
            status={<ContentStatuses/>}
            toolbarLeft={<NarrowHeaderActions path={nodePath} previewSelection={previewSelection} selection={selection} clear={clear}/>}
            toolbarRight={viewSelector}
        />
    ) : (
        <Header
            title={title}
            mainActions={<MainActionBar/>}
            breadcrumb={<ContentPath/>}
            contentType={nodeType && <Chip color="accent" label={nodeType.displayName || nodeType.name} icon={getNodeTypeIcon(nodeType.name)}/>}
            status={<ContentStatuses/>}
            toolbarLeft={
                <>
                    {!previewSelection && selection.length > 0 && <SelectionActionsBar paths={selection} clear={clear}/>}
                    <BrowseControlBar isShowingActions={selection.length === 0}/>
                </>
            }
            toolbarRight={viewSelector}
        />
    );
};

export default ContentHeader;
