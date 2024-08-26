import {isMarkedForDeletion} from '../../JContent.utils';
import {useSelector} from 'react-redux';
import {useNodeChecks} from '@jahia/data-helper';
import PropTypes from 'prop-types';
import React, {useContext} from 'react';
import {PATH_CONTENTS_ITSELF, PATH_FILES_ITSELF} from '../actions.constants';
import Delete from './Delete';
import {ComponentRendererContext} from '@jahia/ui-extender';

function checkAction(node) {
    return node.operationsSupport.markForDeletion && !isMarkedForDeletion(node) && !node.lockOwner;
}

export const DeleteActionComponent = ({path, paths, buttonProps, render: Render, loading: Loading, ...others}) => {
    const componentRenderer = useContext(ComponentRendererContext);
    const language = useSelector(state => state.language);

    const res = useNodeChecks(
        {path, paths, language},
        {
            getProperties: ['jcr:mixinTypes'],
            getDisplayName: true,
            getOperationSupport: true,
            requiredPermission: ['jcr:removeNode'],
            hideOnNodeTypes: ['jnt:virtualsite'],
            hideForPaths: [PATH_FILES_ITSELF, PATH_CONTENTS_ITSELF],
            getLockInfo: true
        },
        {
            fetchPolicy: 'network-only'
        }
    );

    const onExit = () => {
        componentRenderer.destroy('deleteDialog');
    };

    if (res.loading) {
        return (Loading && <Loading {...others}/>) || false;
    }

    const isVisible = res.checksResult && (res.node ? checkAction(res.node) : res.nodes.reduce((acc, node) => acc && checkAction(node), true));

    return (
        <Render
            {...others}
            isVisible={isVisible}
            buttonProps={{...buttonProps, color: 'danger'}}
            enabled={isVisible}
            onClick={() => {
                componentRenderer.render('deleteDialog', Delete, {
                    dialogType: 'mark',
                    node: res.node,
                    nodes: res.nodes,
                    onExit: onExit
                });
            }}
        />
    );
};

DeleteActionComponent.propTypes = {
    path: PropTypes.string,

    paths: PropTypes.arrayOf(PropTypes.string),

    buttonProps: PropTypes.object,

    render: PropTypes.func.isRequired,

    loading: PropTypes.func
};
