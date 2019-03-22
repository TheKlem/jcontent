import React from 'react';
import PropTypes from 'prop-types';
import {compose, withApollo} from 'react-apollo';
import {ContextualMenu, withNotifications} from '@jahia/react-material';
import {Drawer, Paper, withStyles} from '@material-ui/core';
import ContentListTable from './ContentListTable';
import PreviewDrawer from './PreviewDrawer';
import classNames from 'classnames';
import ContentTrees from './ContentTrees';
import {translate} from 'react-i18next';
import Upload from './Upload';
import {CM_DRAWER_STATES} from '../../ContentManager.redux-actions';
import FilesGrid from './FilesGrid';
import ContentData from './ContentData';
import {connect} from 'react-redux';
import ContentManagerConstants from '../../ContentManager.constants';
import {refetchContentTreeAndListData, setContentListDataRefetcher, setRefetcher} from '../../ContentManager.refetches';

const styles = theme => ({
    root: {
        flex: '1 1 0%',
        display: 'flex',
        flexDirection: 'row',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: theme.palette.background.paper
    },
    content: {
        flex: '1 2 0%',
        order: 2,
        display: 'flex',
        transition: 'margin-left .25s,margin-right .25s',
        backgroundColor: theme.palette.background.default,
        marginLeft: -theme.contentManager.treeDrawerWidth,
        marginRight: -theme.contentManager.previewDrawerWidth
    },
    contentPaper: {
        flex: '1 1 auto',
        flexDirection: 'column',
        display: 'flex'
    },
    contentLeftShift: {
        marginLeft: 0
    },
    contentRightShift: {
        marginRight: 0
    },
    treeDrawer: {
        flex: '0 1 ' + theme.contentManager.treeDrawerWidth + 'px',
        display: 'flex',
        order: 1,
        transition: 'transform .15s'
    },
    treeDrawerPaper: {
        position: 'relative',
        display: 'flex',
        zIndex: 'auto',
        height: 'unset',
        overflow: 'hidden'
    },
    previewDrawer: {
        flex: '0 1 ' + theme.contentManager.previewDrawerWidth + 'px',
        order: 3,
        display: 'flex',
        overflow: 'hidden',
        transition: 'transform .15s'
    },
    previewDrawerHidden: {
        transform: 'translate(600px)'
    },
    previewDrawerPaper: {
        position: 'relative',
        display: 'flex',
        zIndex: 'auto',
        height: 'unset',
        transition: '.15s !important',
        overflow: 'hidden',
        maxWidth: theme.contentManager.previewDrawerWidth
    },
    previewDrawerPaperFullScreen: {
        transition: '.15s !important',
        width: '100vw',
        height: '100vh',
        top: 0,
        right: 0
    }
});

export class ContentLayout extends React.Component {
    setContentRefetcher(refetchingData) {
        setContentListDataRefetcher(refetchingData);
    }

    setTreeRefetcher(type) {
        return refetchingData => setRefetcher(type, refetchingData);
    }

    refreshContentsAndTree(contentTreeConfigs) {
        refetchContentTreeAndListData(contentTreeConfigs);
    }

    render() {
        const {contentTreeConfigs, mode, path, previewState, classes, filesMode, treeState, previewSelection} = this.props;
        let contextualMenu = React.createRef();
        let treeOpen = treeState >= CM_DRAWER_STATES.SHOW && mode !== ContentManagerConstants.mode.SEARCH && mode !== ContentManagerConstants.mode.SQL2SEARCH;
        let previewOpen = previewState >= CM_DRAWER_STATES.SHOW;
        return (
            <React.Fragment>
                <ContentData setRefetch={this.setContentRefetcher}>
                    {({rows, contentNotFound, totalCount, loading}) => (
                        <div className={classes.root}>
                            <Drawer
                                variant="persistent"
                                anchor="left"
                                open={treeOpen}
                                classes={{
                                    root: classes.treeDrawer,
                                    paper: classes.treeDrawerPaper
                                }}
                            >
                                <ContentTrees isOpen={treeOpen} setRefetch={this.setTreeRefetcher}/>
                            </Drawer>
                            <Drawer
                                data-cm-role="preview-drawer"
                                variant="persistent"
                                anchor="right"
                                open={previewOpen}
                                classes={{
                                    root: classNames(classes.previewDrawer, {[classes.previewDrawerHidden]: !previewOpen}),
                                    paper: classNames({
                                        [classes.previewDrawerPaper]: previewState !== CM_DRAWER_STATES.FULL_SCREEN,
                                        [classes.previewDrawerPaperFullScreen]: previewState === CM_DRAWER_STATES.FULL_SCREEN
                                    })
                                }}
                            >
                                {previewOpen &&
                                <PreviewDrawer previewSelection={rows.find(node => node.path === previewSelection)}/>
                                }
                            </Drawer>
                            <ContextualMenu ref={contextualMenu} actionKey="contentMenu" context={{path: path}}/>
                            <div
                                className={classNames(classes.content, {
                                    [classes.contentLeftShift]: treeOpen,
                                    [classes.contentRightShift]: previewOpen
                                })}
                                onContextMenu={event => contextualMenu.current.open(event)}
                            >
                                <Paper className={classes.contentPaper}>
                                    {mode === ContentManagerConstants.mode.FILES && filesMode === 'grid' ?
                                        <FilesGrid totalCount={totalCount} rows={rows} contentNotFound={contentNotFound} loading={loading}/> :
                                        <ContentListTable totalCount={totalCount} rows={rows} contentNotFound={contentNotFound} loading={loading}/>
                                    }
                                </Paper>
                            </div>
                        </div>
                    )}
                </ContentData>

                <Upload uploadUpdateCallback={status => {
                    if (status && status.uploading === 0) {
                        this.refreshContentsAndTree(contentTreeConfigs);
                    }
                }}/>
            </React.Fragment>
        );
    }
}

const mapStateToProps = state => {
    return {
        mode: state.mode,
        siteKey: state.site,
        path: state.path,
        previewState: state.previewState,
        treeState: state.treeState,
        filesMode: state.filesGrid.mode,
        previewSelection: state.previewSelection
    };
};

ContentLayout.propTypes = {
    mode: PropTypes.string.isRequired,
    path: PropTypes.string.isRequired,
    classes: PropTypes.object.isRequired,
    filesMode: PropTypes.string.isRequired,
    treeState: PropTypes.number.isRequired,
    previewState: PropTypes.number.isRequired,
    contentTreeConfigs: PropTypes.object,
    previewSelection: PropTypes.string
};

export default compose(
    withNotifications(),
    translate(),
    withStyles(styles),
    withApollo,
    connect(mapStateToProps)
)(ContentLayout);