import React from 'react';
import {registry} from '@jahia/ui-extender';
import {useHistory} from 'react-router-dom';
import {Collections, PrimaryNavItem} from '@jahia/moonstone';
import {useTranslation} from 'react-i18next';
import JContentApp from './JContentApp';
import {jContentRoutes} from './JContent/JContent.routes';
import {jContentActions} from './JContent/JContent.actions';
import {jContentAccordionItems} from './JContent/JContent.accordion-items';
import {jContentAppRoot} from './JContent/JContent.app-root';
import {buildUrl, jContentRedux} from './JContent/redux/JContent.redux';
import {fileuploadRedux} from './JContent/ContentRoute/ContentLayout/Upload/Upload.redux';
import {previewRedux} from './JContent/redux/preview.redux';
import {copypasteRedux} from './JContent/actions/copyPaste/copyPaste.redux';
import {filesGridRedux} from './JContent/redux/filesGrid.redux';
import {paginationRedux} from './JContent/redux/pagination.redux';
import {sortRedux} from './JContent/redux/sort.redux';
import {selectionRedux} from '~/JContent/redux/selection.redux';
import {shallowEqual, useSelector} from 'react-redux';
import {useNodeChecks} from '@jahia/data-helper';
import {tableViewRedux} from './JContent/redux/tableView.redux';
import {DndProvider} from 'react-dnd';
import {HTML5Backend} from 'react-dnd-html5-backend';
import {DragLayer} from '~/JContent/dnd/DragLayer';
import hashes from './localesHash!';

window.jahia.localeFiles = window.jahia.localeFiles || {};
window.jahia.localeFiles.jcontent = hashes;

export default function () {
    const CmmNavItem = () => {
        const history = useHistory();
        const {t} = useTranslation('jcontent');
        const {site, language, path, mode, params, pathname} = useSelector(state => ({
            language: state.language,
            site: state.site,
            path: state.jcontent.path,
            mode: state.jcontent.mode,
            params: state.jcontent.params,
            pathname: state.router.location.pathname
        }), shallowEqual);

        let accordions = registry.find({type: 'accordionItem', target: 'jcontent'});
        const permissions = useNodeChecks({
            path: `/sites/${site}`,
            language: language
        }, {
            requiredSitePermission: [...new Set(accordions.filter(acc => acc.requiredSitePermission).map(acc => acc.requiredSitePermission))]
        });

        if (permissions.loading) {
            return null;
        }

        let defaultMode = accordions.find(acc => permissions.node?.site[acc.requiredSitePermission])?.key;

        return (
            <PrimaryNavItem key="/jcontent"
                            role="jcontent-menu-item"
                            isSelected={pathname.startsWith('/jcontent') && pathname.split('/').length > 3}
                            label={t('label.name')}
                            icon={<Collections/>}
                            onClick={() => {
                                history.push(buildUrl({site, language, mode: mode || defaultMode, path, params}));
                            }}/>
        );
    };

    registry.add('primary-nav-item', 'jcontentGroupItem', {
        targets: ['nav-root-top:2'],
        requiredPermission: 'jContentAccess',
        render: () => <CmmNavItem/>
    });

    registry.add('route', 'route-jcontent', {
        targets: ['main:2'],
        path: '/jcontent/:siteKey/:lang/:mode', // Catch everything that's jcontent and let the app resolve correct view
        render: () => registry.get('route', 'requireCoreLicenseRoot').render() || <JContentApp/>
    });

    registry.add('app', 'dnd', {
        targets: ['root:2'],
        render: next => (
            <DndProvider debugMode={(!process.env.NODE_ENV || process.env.NODE_ENV === 'development')} backend={HTML5Backend}>
                <DragLayer/>
                {next}
            </DndProvider>
        )
    });

    jContentRoutes(registry);
    jContentActions(registry);

    fileuploadRedux(registry);
    previewRedux(registry);
    copypasteRedux(registry);
    tableViewRedux(registry);
    filesGridRedux(registry);
    paginationRedux(registry);
    sortRedux(registry);
    selectionRedux(registry);
    jContentAccordionItems(registry);
    jContentRedux(registry);
    jContentAppRoot(registry);

    return import('./shared').then(m => {
        window.jahia.jcontent = m;
    });
}
