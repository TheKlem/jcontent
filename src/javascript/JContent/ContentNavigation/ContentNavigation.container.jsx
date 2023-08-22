import React from 'react';
import {shallowEqual, useDispatch, useSelector} from 'react-redux';
import ContentNavigation from './ContentNavigation';
import PropTypes from 'prop-types';
import {useNodeChecks} from '@jahia/data-helper';
import {cmGoto, setTableViewMode} from '~/JContent/redux/JContent.redux';
import NavigationHeader from '~/JContent/ContentNavigation/NavigationHeader';
import {getAccordionItems} from '~/JContent/JContent.utils';
import {batchActions} from 'redux-batched-actions';

const ContentNavigationContainer = ({handleNavigationAction, selector, accordionItemTarget, header, accordionItemProps, isReversed}) => {
    const dispatch = useDispatch();
    const {siteKey, language, mode} = useSelector(selector, shallowEqual);
    let accordionItems = getAccordionItems(accordionItemTarget, accordionItemProps);

    const sitePermissions = [...new Set(accordionItems.map(item => item.requiredSitePermission).filter(item => item !== undefined))];

    const permissions = useNodeChecks({
        path: `/sites/${siteKey}`,
        language: language
    }, {
        requiredSitePermission: sitePermissions
    });

    if (permissions.loading) {
        return null;
    }

    accordionItems = sitePermissions.length === 0 ? accordionItems : accordionItems.filter(accordionItem =>
        permissions.node && Object.prototype.hasOwnProperty.call(permissions.node.site, accordionItem.requiredSitePermission) && permissions.node.site[accordionItem.requiredSitePermission]
    );

    return (
        <ContentNavigation header={header}
                           accordionItemTarget={accordionItemTarget}
                           accordionItems={accordionItems}
                           mode={mode}
                           siteKey={siteKey}
                           isReversed={isReversed}
                           handleNavigation={(mode, path, viewMode) => dispatch(handleNavigationAction(mode, path, viewMode))}
        />
    );
};

ContentNavigationContainer.propTypes = {
    selector: PropTypes.func,
    accordionItemProps: PropTypes.object,
    accordionItemTarget: PropTypes.string,
    handleNavigationAction: PropTypes.func,
    header: PropTypes.element,
    isReversed: PropTypes.bool
};

ContentNavigationContainer.defaultProps = {
    header: <NavigationHeader/>,
    selector: state => ({
        mode: state.jcontent.mode,
        siteKey: state.site,
        language: state.language
    }),
    handleNavigationAction: (mode, path, viewMode) => batchActions([cmGoto({mode, path, params: {}}), setTableViewMode(viewMode)]),
    accordionItemTarget: 'jcontent',
    isReversed: true
};

export default ContentNavigationContainer;
