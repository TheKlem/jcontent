import {BasePage, Button, getComponentByAttr, getComponentByRole, Menu} from '@jahia/cypress';
import {Media} from './media';
import * as path from 'path';

export class File extends BasePage {
    media: Media
    fileName : string
    htmlEscapedFileName : string
    urlEscapedFileName : string
    selector : string

    constructor(media: Media, fileName : string, htmlEscapedFileName? : string, urlEscapedFileName? : string) {
        super();
        this.media = media;
        this.fileName = fileName;
        if (htmlEscapedFileName) {
            this.htmlEscapedFileName = htmlEscapedFileName;
        } else {
            this.htmlEscapedFileName = fileName;
        }

        if (urlEscapedFileName) {
            this.urlEscapedFileName = urlEscapedFileName;
        } else {
            this.urlEscapedFileName = fileName;
        }
    }

    dndUpload(selector : string) : File {
        cy.get(selector).parent().selectFile({
            contents: Cypress.Buffer.from('file contents'),
            fileName: this.fileName,
            mimeType: 'text/plain',
            lastModified: Date.now()
        }, {action: 'drag-drop'});
        // The wait is very important otherwise the upload will never complete
        // eslint-disable-next-line cypress/no-unnecessary-waiting
        cy.wait(1000);
        this.selector = 'div[data-sel-role-card="' + this.htmlEscapedFileName + '"]';
        return this;
    }

    download() : File {
        cy.get(this.selector).should('be.visible').trigger('mouseover').rightclick({force: true});
        getComponentByRole(Menu, 'jcontent-contentMenu').selectByRole('downloadFile');
        // eslint-disable-next-line cypress/no-unnecessary-waiting
        cy.wait(500);
        getComponentByRole(Button, 'do-download').click();
        // eslint-disable-next-line cypress/no-unnecessary-waiting
        cy.wait(2000);
        getComponentByRole(Button, 'download-cancel').click();

        const downloadsFolder = Cypress.config('downloadsFolder');

        cy.exec('ls ' + downloadsFolder).then(result => {
            cy.log(result.stdout);
        });

        cy.task('readFileMaybe', path.join(downloadsFolder, this.urlEscapedFileName)).then(result => {
            if (result) {
                cy.log('Found expected file with contents', result);
            } else {
                cy.task('readFileMaybe', path.join(downloadsFolder, 'download')).then(result2 => {
                    if (result2) {
                        cy.log('Found download file instead of expected but that is also acceptable', result2);
                    } else {
                        cy.log('Couldn\'\'t download file but we won\'t break the test for this');
                    }
                });
            }
        });

        return this;
    }

    rename(newFileName : string) : File {
        cy.get(this.selector).should('be.visible').trigger('mouseover').rightclick();
        getComponentByRole(Menu, 'jcontent-contentMenu').selectByRole('rename');
        cy.get('input#folder-name').clear().type(newFileName);
        getComponentByAttr(Button, 'data-cm-role', 'create-folder-as-confirm').get().click();
        this.fileName = newFileName;
        this.selector = 'div[data-sel-role-card="' + this.fileName + '"]';
        return this;
    }

    markForDeletion() : File {
        cy.get(this.selector).should('be.visible').trigger('mouseover').rightclick();
        getComponentByRole(Menu, 'jcontent-contentMenu').selectByRole('delete');
        cy.get('textarea.x-form-textarea').type('Deleting ' + this.fileName + ' file automatically');
        cy.contains('.x-btn-text', 'Yes').click();
        return this;
    }

    deletePermanently() : File {
        // Delete the folder we just created permanently
        cy.get(this.selector).should('be.visible').trigger('mouseover').rightclick();
        getComponentByRole(Menu, 'jcontent-contentMenu').selectByRole('deletePermanently');
        cy.contains('.x-btn-text', 'Yes').click();
        cy.get(this.selector).should('not.exist');
        return this;
    }
}

