import React from "react";
import {withStyles, Typography, Button, Input, InputAdornment, Paper, IconButton, Grid} from "@material-ui/core";
import Search from '@material-ui/icons/Search';
import ContentTypeSelect from './ContentTypeSelect';
import {translate, Trans} from 'react-i18next';
import {compose} from "react-apollo/index";
import {Query} from 'react-apollo';
import {DxContext} from "./DxContext";
import {NodeDisplayNameQuery} from "./gqlQueries";
import {withNotifications, ProgressOverlay} from '@jahia/react-material';
import connect from "react-redux/es/connect/connect";
import {cmGoto} from "./redux/actions";

const styles = theme => ({
    underneathNode: {
        marginTop: 6
    },
    sql2Form: {
        padding: theme.spacing.unit,
        color: theme.palette.text.secondary,
        fontFamily: 'monospace'
    },
    sql2Input: {
        margin: 0,
        padding: 0,
        fontFamily: 'monospace'
    },
    footer: {
        display: 'flex',
        marginTop: theme.spacing.unit
    },
    actionButton: {
        textTransform: 'none'
    },
    link: {
        color: 'inherit'
    }
});

class CmSearchBar extends React.Component {

    constructor(props) {

        super(props);

        this.onSql2Click = this.onSql2Click.bind(this);
        this.onNormalClick = this.onNormalClick.bind(this);
        let {params} = props;
        this.normal = <CmSearchBarNormal contentType={params.searchContentType} onSql2Click={this.onSql2Click}
                                         onClear={this.onClear}/>;
        this.sql2 = <CmSearchBarSql2 onNormalClick={this.onNormalClick} onClear={this.onClear}/>;
        this.state = {
            current: (params.sql2SearchFrom == null ? this.normal : this.sql2)
        };
    }

    onSql2Click() {
        this.setState({
            current: this.sql2
        });
    }

    onNormalClick() {
        this.setState({
            current: this.normal
        });
    }

    render() {
        return (
            <div>
                {this.state.current}
            </div>
        )
    }
}

class CmSearchBarNormal extends React.Component {

    constructor(props) {
        super(props);
        this.search = React.createRef();
        this.state = {
            contentType: (props.contentType !== undefined ? props.contentType : null)
        }
    }

    onContentTypeChange(path, params, contentType, onSearch) {
        this.setState({
            contentType: contentType
        });
        this.onSearch(path, params, contentType, onSearch);
    }

    onSearchInputChange(path, params, onSearch) {
        // Perform search only when the user has paused changing search terms for a second.
        if (this.timeout) {
            clearTimeout(this.timeout);
        }
        this.timeout = setTimeout(function () {
            this.onSearch(path, params, this.state.contentType, onSearch);
        }.bind(this), 1000);
    }

    onSearchInputKeyDown(e, path, params, onSearch) {
        if (e.key === 'Enter') {
            this.onSearch(path, params, this.state.contentType, onSearch);
        }
    }

    onSearch(path, params, contentType, onSearch) {

        let searchTerms = this.search.current ? this.search.current.value : params.searchTerms;
        if (!searchTerms) {
            return;
        }
        searchTerms = searchTerms.trim();
        if (searchTerms == '') {
            return;
        }

        params.searchTerms = searchTerms;
        if (contentType) {
            params.searchContentType = contentType;
        } else {
            _.unset(params, 'searchContentType');
        }

        onSearch("search", path, params);
    }

    onClear(params, onClear) {

        this.setState({
            contentType: null
        });
        this.search.current.value = '';

        _.unset(params, 'searchContentType');
        _.unset(params, 'searchTerms');

        onClear(params);
    }

    render() {

        let {onSql2Click, classes, t, notificationContext, siteKey, lang, path, onSearch, onClear, params} = this.props;

        return (<React.Fragment>
                <SearchBarLayout
                    onSearch={() => this.onSearch(path, params, this.state.contentType, onSearch)}
                    rightFooter={
                        <React.Fragment>
                            {(params.searchTerms != null) &&
                            <ActionButton label={'label.contentManager.search.clear'} variant={'contained'}
                                          onClick={() => this.onClear(params, onClear)}
                                          cmRole={'search-clear'}/>
                            }
                            {(params.searchTerms == null) &&
                            <ActionButton label={'label.contentManager.search.sql2'} onClick={onSql2Click}
                                          cmRole={'search-type-sql2search'}/>
                            }
                        </React.Fragment>
                    }
                >
                    <DxContext.Consumer>{(dxContext) => {
                        return <ContentTypeSelect
                            siteKey={siteKey}
                            displayLanguage={dxContext.uilang}
                            contentType={this.state.contentType}
                            onSelectionChange={(contentType) => this.onContentTypeChange(path, params, contentType, onSearch)}
                        />
                    }}</DxContext.Consumer>
                    <Query query={NodeDisplayNameQuery} variables={{path: path, language: lang}}>
                        {({loading, error, data}) => {

                            if (loading) {
                                return <ProgressOverlay/>
                            }

                            if (error) {
                                console.log("Error when fetching data: " + error);
                                let message = t('label.contentManager.error.queryingContent', {details: (error.message ? error.message : '')});
                                notificationContext.notify(message, ['closeButton', 'noAutomaticClose']);
                                return null;
                            }

                            let displayName = data.jcr.nodeByPath.displayName;

                            return (
                                <Input
                                    inputProps={{maxLength: 2000, 'data-cm-role': 'search-input-term'}}
                                    defaultValue={params.searchTerms}
                                    placeholder={t('label.contentManager.search.normalPrompt')}
                                    endAdornment={<InputAdornment position="end"
                                                                  classes={{root: classes.underneathNode}}>
                                        {t('label.contentManager.search.underneathNode', {nodeDisplayName: displayName})}
                                    </InputAdornment>}
                                    inputRef={this.search}
                                    style={{flexGrow: 10}}
                                    onChange={() => this.onSearchInputChange(path, params, onSearch)}
                                    onKeyDown={(e) => this.onSearchInputKeyDown(e, path, params, onSearch)}
                                />
                            );
                        }}
                    </Query>
                </SearchBarLayout>
            </React.Fragment>
        );
    }
}

class CmSearchBarSql2 extends React.Component {

    constructor(props) {
        super(props);
        this.from = React.createRef();
        this.where = React.createRef();
    }

    onSearch(path, params, onSearch) {

        params.sql2SearchFrom = this.from.current.value;
        if (this.where.current.value == '') {
            _.unset(params, 'sql2SearchWhere');
        } else {
            params.sql2SearchWhere = this.where.current.value;
        }

        onSearch("sql2Search", path, params);
    }

    onClear(params, onClear) {

        this.from.current.value = '';
        this.where.current.value = '';

        params.sql2SearchFrom = '';
        _.unset(params, 'sql2SearchWhere');
        onClear(params);
    }

    render() {

        let {onNormalClick, classes, t, onSearch, onClear, path, params} = this.props;

        return (
            <React.Fragment>
                <SearchBarLayout onSearch={() => this.onSearch(path, params, onSearch)}
                                 leftFooter={
                                     <DxContext.Consumer>{(dxContext) => {
                                         return <Trans
                                             i18nKey={'label.contentManager.search.sql2Prompt'}
                                             components={[<a href={dxContext.config.sql2CheatSheetUrl} target={'_blank'}
                                                             className={classes.link}>univers</a>]}
                                         />
                                     }}</DxContext.Consumer>
                                 }
                                 rightFooter={
                                     <React.Fragment>
                                         {(params.sql2SearchFrom != null && params.sql2SearchFrom.length > 0) &&
                                         <ActionButton label={'label.contentManager.search.clear'} variant={'contained'}
                                                       onClick={() => this.onClear(params, onClear)}
                                                       cmRole={'search-clear'}/>
                                         }
                                         {(params.sql2SearchFrom == null || params.sql2SearchFrom.length === 0) &&
                                         <ActionButton label={'label.contentManager.search.normal'}
                                                       onClick={onNormalClick} cmRole={'search-type-normal'}/>
                                         }
                                     </React.Fragment>
                                 }
                >
                    <Grid container alignItems={'center'} classes={{container: classes.sql2Form}}>
                        SELECT * FROM [
                        <Sql2Input maxLength={100} size={15} defaultValue={params.sql2SearchFrom} inputRef={this.from}
                                   onSearch={() => this.onSearch(path, params, onSearch)}
                                   cmRole={'sql2search-input-from'}/>
                        ] WHERE ISDESCENDANTNODE('{path}') AND (
                        <Sql2Input maxLength={2000} style={{flexGrow: 10}} defaultValue={params.sql2SearchWhere}
                                   inputRef={this.where}
                                   onSearch={() => this.onSearch(path, params, onSearch)}
                                   cmRole={'sql2search-input-where'}/>
                        )
                    </Grid>
                </SearchBarLayout>
            </React.Fragment>
        );
    }
}

class Sql2Input extends React.Component {

    constructor(props) {
        super(props);
        this.onKeyDown = this.onKeyDown.bind(this);
    }

    onKeyDown(e) {
        if (e.key === 'Enter') {
            this.props.onSearch();
        }
    }

    render() {

        let {maxLength, size, defaultValue, inputRef, classes, style, cmRole} = this.props;

        return (
            <Input
                inputProps={{maxLength: maxLength, size: size, 'data-cm-role': cmRole}}
                defaultValue={defaultValue}
                inputRef={inputRef}
                classes={{root: classes.sql2Input, input: classes.sql2Input}}
                style={style}
                onKeyDown={(e) => this.onKeyDown(e)}
            />
        );
    }
}

class SearchBarLayout extends React.Component {

    render() {

        let {children, leftFooter, rightFooter, onSearch, classes} = this.props;

        return (
            <React.Fragment>
                <Paper square>
                    <Grid container wrap={'nowrap'}>
                        {children}
                        <IconButton color={'secondary'} onClick={onSearch} data-cm-role={'search-submit'}>
                            <Search/>
                        </IconButton>
                    </Grid>
                </Paper>
                <Grid container>
                    <Grid item xs={8}>
                        <Typography color="inherit" variant="body1" gutterBottom align="left">
                            {leftFooter}
                        </Typography>
                    </Grid>
                    <Grid item xs={4}>
                        <Typography color="inherit" variant="body1" gutterBottom align="right">
                            {rightFooter}
                        </Typography>
                    </Grid>
                </Grid>
            </React.Fragment>
        )
    }
}

class ActionButton extends React.Component {

    render() {

        let {label, variant, onClick, classes, t, cmRole} = this.props;

        return (
            <Button variant={variant} size={'small'} onClick={onClick} classes={{root: classes.actionButton}}
                    data-cm-role={cmRole}>
                {t(label)}
            </Button>
        );
    }
}

const mapStateToProps = (state, ownProps) => ({
    siteKey: state.site,
    lang: state.language,
    path: state.path,
    params: state.params
})

const mapDispatchToProps = (dispatch, ownProps) => {
    return {
        onSearch: (mode, path, params) => dispatch(cmGoto({mode, path, params})),
        onClear: (params) => dispatch(cmGoto({"mode": "browse", params}))
    }
}

CmSearchBarNormal = compose(
    withNotifications(),
    translate(),
    withStyles(styles),
    connect(mapStateToProps, mapDispatchToProps)
)(CmSearchBarNormal);

CmSearchBarSql2 = compose(
    translate(),
    withStyles(styles),
    connect(mapStateToProps, mapDispatchToProps)
)(CmSearchBarSql2);

Sql2Input = withStyles(styles)(Sql2Input);

SearchBarLayout = withStyles(styles)(SearchBarLayout);

ActionButton = compose(
    translate(),
    withStyles(styles)
)(ActionButton);

CmSearchBar = compose(
    translate(),
    withStyles(styles),
    connect(mapStateToProps, mapDispatchToProps)
)(CmSearchBar);

export {CmSearchBar};