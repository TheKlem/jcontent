import {registry} from '@jahia/ui-extender';
import register from './JContent.register';
import {register as ceRegister} from './ContentEditor/register';
import {MoreVert} from '@jahia/moonstone';
import {Constants} from './ContentEditor/SelectorTypes/Picker/Picker.constants';
import React from 'react';

export default function () {
    registry.add('callback', 'jContent', {
        targets: ['jahiaApp-init:1'],
        callback: () => {
            register();
            ceRegister();
        }
    });

    registry.add('callback', 'updateAccordionTargetsFromPickerConfigurations', {
        targets: ['jahiaApp-init:999'],
        callback: () => {
            const registeredPickerConfigurations = registry.find({type: Constants.pickerConfig});
            registeredPickerConfigurations.forEach(pickerConfig => {
                pickerConfig.accordions?.forEach((value, index) => {
                    const accordionItem = registry.get('accordionItem', value);
                    if (accordionItem.targets) {
                        accordionItem.targets.push({id: pickerConfig.key, priority: 50 + (index * 10)});
                    } else {
                        accordionItem.targets = [{id: pickerConfig.key, priority: 50 + (index * 10)}];
                    }
                });
            });
            // Update actions targets
            registry.add('action', 'contentPickerMenu', registry.get('action', 'menuAction'), {
                buttonIcon: <MoreVert/>,
                buttonLabel: 'jcontent:label.contentManager.contentPreview.moreOptions',
                menuTarget: 'contentPickerActions',
                menuItemProps: {
                    isShowIcons: true
                }
            });

            registry.get('action', 'rename')?.targets?.push({id: 'contentPickerActions', priority: 1});
            registry.get('action', 'replaceFile')?.targets?.push({id: 'contentPickerActions', priority: 2});
            registry.get('action', 'editImage')?.targets?.push({id: 'contentPickerActions', priority: 3});
            registry.get('action', 'downloadFile')?.targets?.push({id: 'contentPickerActions', priority: 3.7});
            registry.get('action', 'openInNewTab')?.targets?.push({id: 'contentPickerActions', priority: 4});
        }
    });
}
