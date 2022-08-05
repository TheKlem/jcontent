import {cmGoto, cmOpenPaths} from '../JContent.redux';
import {expandTree} from './expandTree';
import {cmSetPreviewSelection} from '../preview.redux';
import JContentConstants from '../JContent.constants';
import React from 'react';
import PropTypes from 'prop-types';
import {useApolloClient} from '@apollo/react-hooks';
import {useDispatch, useSelector} from 'react-redux';
import {setTableViewType} from '~/JContent/ContentRoute/ContentLayout/StructuredView/StructuredView.redux';
import {batchActions} from 'redux-batched-actions';

export const LocateActionComponent = ({path, render: Render, ...others}) => {
    const client = useApolloClient();
    const dispatch = useDispatch();
    const mode = useSelector(state => state.jcontent.mode);

    const isVisible = (mode === JContentConstants.mode.SEARCH || mode === JContentConstants.mode.SQL2SEARCH);

    return (
        <Render
            {...others}
            isVisible={isVisible}
            enabled={isVisible}
            onClick={() => {
                expandTree(path, client).then(({mode, parentPath, viewType, ancestorPaths}) => {
                    dispatch(batchActions([
                        cmGoto({mode: mode, path: parentPath}),
                        ...(viewType ? [setTableViewType(viewType)] : []),
                        cmOpenPaths(ancestorPaths),
                        cmSetPreviewSelection(path)
                    ]));
                });
            }}
        />
    );
};

LocateActionComponent.propTypes = {
    path: PropTypes.string,

    render: PropTypes.func.isRequired
};
