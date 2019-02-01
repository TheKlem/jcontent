import classNames from 'classnames';
import {CircularProgress, Typography, withStyles} from '@material-ui/core';
import {CheckCircle, Info} from '@material-ui/icons';
import React from 'react';
import {compose} from 'react-apollo';
import {translate} from 'react-i18next';

let styles = theme => ({
    headerText: {
        color: theme.palette.text.contrastText,
        display: 'flex',
        alignItems: 'center',
        marginBottom: '16px'
    },
    statusIcon: {
        marginRight: theme.spacing.unit
    }
});

export function UploadHeader({classes, t, status}) {
    if (!status) {
        return null;
    }

    if (status.uploading !== 0) {
        return (
            <div className={classNames(classes.headerText)}>
                <CircularProgress size={20}
                                  color="inherit"
                                  className={classes.statusIcon}/>
                <Typography color="inherit"
                            data-cm-role="upload-status-uploading"
                >
                    {t('label.contentManager.fileUpload.uploadingMessage', {
                        uploaded: status.uploaded,
                        total: status.total
                    })}
                </Typography>
                {(status.error !== 0) &&
                <Typography color="inherit">
                    {t('label.contentManager.fileUpload.uploadingActionMessage')}
                </Typography>
                }
            </div>
        );
    }

    if (status.error !== 0) {
        return (
            <div className={classNames(classes.headerText)}>
                <Info className={classNames(classes.statusIcon)}/>
                <Typography color="inherit"
                            data-cm-role="upload-status-error"
                >
                    {t('label.contentManager.fileUpload.errorMessage')}
                </Typography>
            </div>
        );
    }

    return (
        <div className={classNames(classes.headerText)}>
            <CheckCircle className={classNames(classes.statusIcon)}/>
            <Typography color="inherit"
                        data-cm-role="upload-status-success"
            >
                {t('label.contentManager.fileUpload.successfulUploadMessage', {
                    count: status.total,
                    number: status.total
                })}
            </Typography>
        </div>
    );
}

export default compose(
    withStyles(styles, {withTheme: true}),
    translate(),
)(UploadHeader);