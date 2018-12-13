import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {Card, CardContent, CardMedia, Tooltip, Typography, withStyles} from '@material-ui/core';
import {compose} from 'react-apollo';
import {ContextualMenu, DisplayActions, iconButtonRenderer} from '@jahia/react-material';
import {translate} from 'react-i18next';
import PublicationStatus from '../publicationStatus/PublicationStatusComponent';
import Moment from 'react-moment';
import 'moment-timezone';
import {fileIcon, isBrowserImage} from './filesGridUtils';
import {cmSetSelection, cmGoto} from '../redux/actions';
import {connect} from 'react-redux';
import {ellipsizeText, allowDoubleClickNavigation, isMarkedForDeletion} from '../utils';

const styles = theme => ({
    card: {
        display: 'flex',
        maxHeight: 300,
        cursor: 'pointer',
        position: 'relative'
    },
    cardMedium: {
        display: 'flex',
        maxHeight: 150,
        cursor: 'pointer',
        position: 'relative'
    },
    cardVertical: {
        display: 'flex',
        flexDirection: 'column',
        maxHeight: 200,
        minHeight: 200,
        cursor: 'pointer',
        position: 'relative'
    },
    details: {
        display: 'flex',
        '-ms-flex': 1,
        flexDirection: 'row'
    },
    verticalDetails: {
        display: 'flex',
        position: 'relative'
    },
    content: {
        flex: '10'
    },
    publicationStatus: {
        flex: '1',
        height: 'auto'
    },
    coverLarge: {
        width: 300,
        backgroundColor: theme.palette.common.white,
        height: 300
    },
    coverMedium: {
        width: 150,
        height: 150
    },
    coverVertical: {
        height: 150
    },
    selectedCard: {
        backgroundColor: 'rgb(250,250,250)',
        boxShadow: '1px 0px 15px 4px rgba(247,150,5,1)'
    },
    actionButtons: {
        position: 'absolute',
        top: 0,
        right: 0,
        '& button': {
            padding: '8px'
        }
    },
    cardStyle: {
        marginLeft: 0,
        marginRight: 0,
        padding: 0,
        minHeight: 200,
        maxHeight: 200,
        backgroundColor: theme.palette.background.paper
    },
    cardContent: {
        marginLeft: Number(theme.spacing.unit),
        marginRight: '0 !important',
        padding: '5 !important'
    },
    isDeleted: {
        textDecoration: 'line-through'
    }
});

const PUBLICATION_INFO_WIDTH_LARGE = 400;
const PUBLICATION_INFO_WIDTH_MED = 300;
const PUBLICATION_INFO_WIDTH_SMALL = 150;

const MAX_LENGTH_MEDIA_LABELS_LARGE = 30;
const MAX_LENGTH_MEDIA_LABELS_MEDIUM = 25;
const MAX_LENGTH_MEDIA_LABELS_VERTICAL = 25;
const MAX_LENGTH_FILES_LABELS_VERTICAL = 15;

let Actions = ({classes, isHovered, node}) => isHovered &&
    <div className={classes.actionButtons}>
        <DisplayActions target="tableActions"
                        context={{path: node.path}}
                        render={iconButtonRenderer({
                            disableRipple: true
                        }, {
                            fontSize: 'small'
                        }, true)}/>
    </div>;

class FileCard extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isHovered: false
        };
    }

    render() {
        const {node} = this.props;
        let contextualMenu = React.createRef();
        return (
            <React.Fragment>
                <ContextualMenu ref={contextualMenu} actionKey="contextualMenuContent" context={{path: node.path}}/>
                {isBrowserImage(node.path) ? this.regularMediaCard(contextualMenu) : this.fileCard(contextualMenu)}
            </React.Fragment>
        );
    }

    regularMediaCard(contextualMenu) {
        let {cardType} = this.props;

        switch (cardType) {
            case 2:
                return this.verticalMediaCard(contextualMenu);
            case 6:
            case 12:
                return this.largeMediaCard(contextualMenu);
            default:
                return this.mediumMediaCard(contextualMenu);
        }
    }

    fileCard(contextualMenu) {
        let {cardType} = this.props;

        switch (cardType) {
            case 2:
                return this.verticalFileCard(contextualMenu);
            case 3:
                return this.mediumFileCard(contextualMenu);
            case 6:
            case 12:
                return this.largeFileCard(contextualMenu);
            default:
                return this.mediumFileCard(contextualMenu);
        }
    }

    onHoverEnter() {
        this.setState({isHovered: true});
    }

    onHoverExit() {
        this.setState({isHovered: false});
    }

    largeMediaCard(contextualMenu) {
        const {classes, t, node, dxContext, uiLang, setPath} = this.props;

        let {isHovered} = this.state;

        return (
            <Card
                className={this.generateCardClass(node, classes.card)}
                classes={{root: classes.cardStyle}}
                data-cm-role="grid-content-list-card"
                onContextMenu={event => {
                    event.stopPropagation();
                    contextualMenu.current.open(event);
                }}
                onClick={() => this.props.onSelect(node.path)}
                onDoubleClick={allowDoubleClickNavigation(node.primaryNodeType, () => setPath(node.path))}
                onMouseEnter={event => this.onHoverEnter(event)}
                onMouseLeave={event => this.onHoverExit(event)}
            >
                <PublicationStatus node={node} publicationInfoWidth={PUBLICATION_INFO_WIDTH_LARGE}/>
                <CardMedia
                    className={classes.coverLarge}
                    image={`${dxContext.contextPath}/files/default/${node.path}?lastModified=${node.lastModified}`}
                    title={node.name}
                />
                <div className={classes.details}>
                    <CardContent className={classes.content} classes={{root: classes.cardContent}}>
                        <Actions classes={classes} node={node} isHovered={isHovered}/>
                        <Typography color="textSecondary" variant="caption">
                            {t('label.contentManager.filesGrid.name')}
                        </Typography>
                        {this.fileName(node, MAX_LENGTH_MEDIA_LABELS_LARGE, 6)}
                        <Typography color="textSecondary" variant="caption">
                            {t('label.contentManager.filesGrid.createdBy')}
                        </Typography>
                        <Typography color="textSecondary" variant="body2">
                            {t('label.contentManager.filesGrid.author', {author: node.createdBy})}
                            &nbsp;
                            <Moment format="LLL" locale={uiLang}>
                                {node.created}
                            </Moment>
                        </Typography>
                        <Typography color="textSecondary" variant="caption">
                            {t('label.contentManager.filesGrid.fileInfo')}
                        </Typography>
                        <Typography color="textSecondary" variant="body2">
                            {`${node.width} x ${node.height}`}
                        </Typography>
                    </CardContent>
                </div>
            </Card>
        );
    }

    mediumMediaCard(contextualMenu) {
        const {classes, t, node, dxContext, uiLang, setPath} = this.props;

        let {isHovered} = this.state;

        return (
            <Card className={this.generateCardClass(node, classes.cardMedium)}
                  classes={{root: classes.cardStyle}}
                  data-cm-role="grid-content-list-card"
                  onContextMenu={event => {
                      event.stopPropagation();
                      contextualMenu.current.open(event);
                  }}
                  onClick={() => this.props.onSelect(node.path)}
                  onDoubleClick={allowDoubleClickNavigation(node.primaryNodeType, () => setPath(node.path))}
                  onMouseEnter={event => this.onHoverEnter(event)}
                  onMouseLeave={event => this.onHoverExit(event)}
            >
                <PublicationStatus node={node} publicationInfoWidth={PUBLICATION_INFO_WIDTH_MED}/>
                <CardMedia
                    className={classes.coverMedium}
                    image={`${dxContext.contextPath}/files/default/${node.path}?t=thumbnail2`}
                    title={node.name}
                />
                <div className={classes.details}>
                    <CardContent className={classes.content}
                                 classes={{root: classes.cardContent}}
                                 style={{width: '100%'}}
                    >
                        <Actions classes={classes} node={node} isHovered={isHovered}/>
                        <Typography color="textSecondary" variant="caption">
                            {t('label.contentManager.filesGrid.name')}
                        </Typography>
                        {this.fileName(node, MAX_LENGTH_MEDIA_LABELS_MEDIUM)}
                        <Typography color="textSecondary" variant="caption">
                            {t('label.contentManager.filesGrid.createdBy')}
                        </Typography>
                        <Typography color="textSecondary" variant="body2">
                            {t('label.contentManager.filesGrid.author', {author: node.createdBy})}
                            &nbsp;
                            <Moment format="LLL" locale={uiLang}>
                                {node.created}
                            </Moment>
                        </Typography>
                    </CardContent>
                </div>
            </Card>
        );
    }

    verticalMediaCard(contextualMenu) {
        const {classes, t, node, dxContext, setPath} = this.props;

        let {isHovered} = this.state;

        return (
            <Card className={this.generateCardClass(node, classes.cardVertical)}
                  classes={{root: classes.cardStyle}}
                  data-cm-role="grid-content-list-card"
                  onContextMenu={event => {
                      event.stopPropagation();
                      contextualMenu.current.open(event);
                  }}
                  onClick={() => this.props.onSelect(node.path)}
                  onDoubleClick={allowDoubleClickNavigation(node.primaryNodeType, () => setPath(node.path))}
                  onMouseEnter={event => this.onHoverEnter(event)}
                  onMouseLeave={event => this.onHoverExit(event)}
            >
                <CardMedia
                    style={{flex: 2}}
                    className={classes.coverVertical}
                    image={`${dxContext.contextPath}/files/default/${node.path}?t=thumbnail2`}
                    title={node.name}
                />
                <div className={classes.verticalDetails} style={{flex: 1.5}}>
                    <PublicationStatus node={node} publicationInfoWidth={PUBLICATION_INFO_WIDTH_SMALL}/>
                    <CardContent className={classes.content} classes={{root: classes.cardContent}}>
                        <Actions classes={classes} node={node} isHovered={isHovered}/>

                        <Typography color="textSecondary" variant="caption">
                            {t('label.contentManager.filesGrid.name')}
                        </Typography>
                        {this.fileName(node, MAX_LENGTH_MEDIA_LABELS_VERTICAL)}
                    </CardContent>
                </div>
            </Card>
        );
    }

    largeFileCard(contextualMenu) {
        const {classes, t, node, uiLang, setPath} = this.props;

        let {isHovered} = this.state;

        return (
            <Card className={this.generateCardClass(node, classes.card)}
                  classes={{root: classes.cardStyle}}
                  data-cm-role="grid-content-list-card"
                  onContextMenu={event => {
                      event.stopPropagation();
                      contextualMenu.current.open(event);
                  }}
                  onClick={() => this.props.onSelect(node.path)}
                  onDoubleClick={allowDoubleClickNavigation(node.primaryNodeType, () => setPath(node.path))}
                  onMouseEnter={event => this.onHoverEnter(event)}
                  onMouseLeave={event => this.onHoverExit(event)}
            >
                <PublicationStatus node={node} publicationInfoWidth={PUBLICATION_INFO_WIDTH_LARGE}/>
                {fileIcon(node.path, '6x', {fontSize: '160px'})}
                <div className={classes.details}>
                    <CardContent className={classes.content} classes={{root: classes.cardContent}}>
                        <Actions classes={classes} node={node} isHovered={isHovered}/>

                        <Typography color="textSecondary" variant="caption">
                            {t('label.contentManager.filesGrid.name')}
                        </Typography>
                        {this.fileName(node)}
                        <Typography color="textSecondary" variant="caption">
                            {t('label.contentManager.filesGrid.createdBy')}
                        </Typography>
                        <Typography color="textSecondary" variant="body2">
                            {t('label.contentManager.filesGrid.author', {author: node.createdBy})}
                            &nbsp;
                            <Moment format="LLL" locale={uiLang}>
                                {node.created}
                            </Moment>
                        </Typography>
                        <Typography color="textSecondary" variant="caption">
                            {t('label.contentManager.filesGrid.fileInfo')}
                        </Typography>
                        <Typography color="textSecondary" variant="body2">
                            {`${node.width} x ${node.height}`}
                        </Typography>
                    </CardContent>
                </div>
            </Card>
        );
    }

    mediumFileCard(contextualMenu) {
        const {classes, t, node, uiLang, setPath} = this.props;

        let {isHovered} = this.state;

        return (
            <Card className={this.generateCardClass(node, classes.card)}
                  classes={{root: classes.cardStyle}}
                  data-cm-role="grid-content-list-card"
                  onContextMenu={event => {
                      event.stopPropagation();
                      contextualMenu.current.open(event);
                  }}
                  onClick={() => this.props.onSelect(node.path)}
                  onDoubleClick={allowDoubleClickNavigation(node.primaryNodeType, () => setPath(node.path))}
                  onMouseEnter={event => this.onHoverEnter(event)}
                  onMouseLeave={event => this.onHoverExit(event)}
            >
                <PublicationStatus node={node} publicationInfoWidth={PUBLICATION_INFO_WIDTH_MED}/>
                {fileIcon(node.path, '6x', {fontSize: '110px'})}
                <div className={classes.details}>
                    <CardContent className={classes.content} classes={{root: classes.cardContent}}>
                        <Actions classes={classes} node={node} isHovered={isHovered}/>

                        <Typography color="textSecondary" variant="caption">
                            {t('label.contentManager.filesGrid.name')}
                        </Typography>
                        {this.fileName(node, MAX_LENGTH_MEDIA_LABELS_VERTICAL, 3)}
                        <Typography color="textSecondary" variant="caption">
                            {t('label.contentManager.filesGrid.createdBy')}
                        </Typography>
                        <Typography color="textSecondary" variant="body2">
                            {t('label.contentManager.filesGrid.author', {author: node.createdBy})}
                            &nbsp;
                            <Moment format="LLL" locale={uiLang}>
                                {node.created}
                            </Moment>
                        </Typography>
                    </CardContent>
                </div>
            </Card>
        );
    }

    verticalFileCard(contextualMenu) {
        const {classes, t, node, cardType, uiLang, setPath} = this.props;

        let {isHovered} = this.state;

        return (
            <Card className={this.generateCardClass(node, classes.cardVertical)}
                  classes={{root: classes.cardStyle}}
                  data-cm-role="grid-content-list-card"
                  onContextMenu={event => {
                      event.stopPropagation();
                      contextualMenu.current.open(event);
                  }}
                  onClick={() => this.props.onSelect(node.path)}
                  onDoubleClick={allowDoubleClickNavigation(node.primaryNodeType, () => setPath(node.path))}
                  onMouseEnter={event => this.onHoverEnter(event)}
                  onMouseLeave={event => this.onHoverExit(event)}
            >
                {fileIcon(node.path, '6x', {fontSize: '110px'})}
                <div className={classes.details} style={{height: '100%'}}>
                    <PublicationStatus node={node} publicationInfoWidth={PUBLICATION_INFO_WIDTH_SMALL}/>
                    <CardContent className={classes.content} classes={{root: classes.cardContent}}>
                        <Actions classes={classes} node={node} isHovered={isHovered}/>

                        <Typography color="textSecondary" variant="caption">
                            {t('label.contentManager.filesGrid.name')}
                        </Typography>
                        {this.fileName(node, MAX_LENGTH_FILES_LABELS_VERTICAL)}
                        {cardType !== 2 &&
                        <React.Fragment>
                            <Typography color="textSecondary" variant="caption">
                                {t('label.contentManager.filesGrid.createdBy')}
                            </Typography>
                            <Typography color="textSecondary" variant="body2">
                                {t('label.contentManager.filesGrid.author', {author: node.createdBy})}
                                &nbsp;
                                <Moment format="LLL" locale={uiLang}>
                                    {node.created}
                                </Moment>
                            </Typography>
                        </React.Fragment>
                        }
                    </CardContent>
                </div>
            </Card>
        );
    }

    fileName(node, maxLength, cardType) {
        let name = node.name;
        let shortenName = (!cardType || this.props.cardType === cardType) && name.length > maxLength;

        let typography = (
            <Typography color="textSecondary"
                        classeName={isMarkedForDeletion(node) ? this.props.classes.isDeleted : ''}
                        variant="body2"
                        data-cm-role="grid-content-list-card-name"
            >
                {shortenName ? ellipsizeText(name, maxLength) : name}
            </Typography>
        );

        return shortenName ? (
            <Tooltip title={name}>
                {typography}
            </Tooltip>
        ) : typography;
    }

    generateCardClass(node, baseClass) {
        const {classes} = this.props;
        return node.isSelected ? `${baseClass} ${classes.selectedCard}` : baseClass;
    }
}

FileCard.propTypes = {
    cardType: PropTypes.number.isRequired,
    node: PropTypes.object.isRequired,
    onSelect: PropTypes.func.isRequired
};

const mapStateToProps = state => ({
    uiLang: state.uiLang
});

const mapDispatchToProps = dispatch => ({
    onSelect: selection => dispatch(cmSetSelection(selection)),
    setPath: (path, params) => dispatch(cmGoto({path, params}))
});

const ComposedFileCard = compose(
    withStyles(styles),
    translate(),
    connect(mapStateToProps, mapDispatchToProps)
)(FileCard);

export default ComposedFileCard;
