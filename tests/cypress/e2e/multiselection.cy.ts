import {JContent} from '../page-object'
import {Button, getComponentByRole, getComponentBySelector} from '@jahia/cypress';

describe('Multi-selection tests', () => {

    beforeEach(function () {
        cy.login() // edit in chief
    })

    afterEach(function () {
        cy.logout()
    })

    const checkToolbar = () => {
        getComponentBySelector(Button,
            '[role="toolbar"] [data-sel-role="publishAll"]',
            null,
            e => expect(e).to.be.visible);
    }

    const checkSelectionCount = count => {
        cy.get('[data-cm-role="selection-infos"]')
            .should('have.attr', 'data-cm-selection-size')
            .and('equal', count.toString());
    }

    it('Can select/de-select items in list mode', () => {
        const jcontent = JContent.visit('digitall', 'en', 'media/files')
        jcontent.switchToListMode();

        cy.log('selection: 1')
        jcontent.getTable().selectRowByLabel('images');
        checkSelectionCount(1);
        checkToolbar();

        cy.log('selection: 2')
        jcontent.getTable().selectRowByLabel('video');
        checkSelectionCount(2);
        checkToolbar();

        // unselect item
        cy.log('unselecting item')
        jcontent.getTable().selectRowByLabel('images', false);
        checkSelectionCount(1);
        checkToolbar();
    })
})
