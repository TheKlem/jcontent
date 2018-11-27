import React from 'react';
import {Tooltip, withStyles} from '@material-ui/core';
import Slider from '@material-ui/lab/Slider';
import {translate} from 'react-i18next';
import {compose} from 'react-apollo';
import connect from 'react-redux/es/connect/connect';
import {setSize} from './redux/actions';

const styles = theme => ({
    root: {
        display: 'inline-grid',
        width: 105,
        padding: 5,
        marginRight: theme.spacing.unit,
        verticalAlign: 'middle',
        color: theme.palette.common.white
    },
    track: {
        backgroundColor: theme.palette.common.white
    },
    thumb: {
        backgroundColor: theme.palette.common.white
    }
});

const totalsValues = 5;
const step = 1;

class FilesGridSizeSelector extends React.Component {
    render() {
        const {classes, t, setSize, size, visible} = this.props;

        return visible && (
            <Tooltip title={t('label.contentManager.filesGrid.fileSizeSelector')}>
                <Slider
                    value={size}
                    classes={{root: classes.root, track: classes.track, thumb: classes.thumb}}
                    min={1}
                    max={totalsValues}
                    step={step}
                    onChange={(event, value) => {
                        setSize(value);
                    }}
                />
            </Tooltip>
        );
    }
}

export default compose(
    connect(state => ({size: state.filesGrid.size, visible: state.filesGrid.mode === 'grid'}), dispatch => ({setSize: size => dispatch(setSize(size))})),
    translate(),
    withStyles(styles)
)(FilesGridSizeSelector);
