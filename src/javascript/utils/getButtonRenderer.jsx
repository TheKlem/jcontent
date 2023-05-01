import {useTranslation} from 'react-i18next';
import {Button} from '@jahia/moonstone';
import PropTypes from 'prop-types';
import React from 'react';
import {ellipsizeText} from '~/JContent/JContent.utils';

export const getButtonRenderer = ({labelStyle, ellipsis, defaultButtonProps} = {}) => {
    const ButtonRenderer = props => {
        const {
            buttonLabelNamespace,
            buttonLabelShort,
            buttonLabel,
            isVisible,
            buttonLabelParams,
            buttonIcon,
            buttonIconEnd,
            actionKey,
            enabled,
            isDisabled,
            onClick,
            renderOnClick,
            buttonProps
        } = props;
        const {t} = useTranslation(buttonLabelNamespace);

        let label = buttonLabel;
        if (labelStyle === 'none') {
            label = null;
        } else if (labelStyle === 'short' && buttonLabelShort) {
            label = buttonLabelShort;
        }

        label = t(label, buttonLabelParams);

        if (ellipsis) {
            label = ellipsizeText(label, ellipsis);
        }

        return (isVisible !== false &&
            <Button data-sel-role={actionKey}
                    label={label}
                    icon={buttonIcon}
                    iconEnd={buttonIconEnd}
                    disabled={enabled === false || isDisabled}
                    onClick={e => {
                        e.stopPropagation();
                        // Call any onClick handler on the rendering side before calling onClick from the action side
                        if (typeof renderOnClick === 'function') {
                            renderOnClick();
                        }

                        onClick(props, e);
                    }}
                    {...defaultButtonProps}
                    {...buttonProps}
            />
        );
    };

    ButtonRenderer.propTypes = {
        buttonLabelNamespace: PropTypes.string,
        buttonLabelShort: PropTypes.string,
        buttonLabel: PropTypes.string,
        isVisible: PropTypes.bool,
        buttonLabelParams: PropTypes.object,
        buttonIcon: PropTypes.node,
        buttonIconEnd: PropTypes.node,
        actionKey: PropTypes.string,
        enabled: PropTypes.bool,
        isDisabled: PropTypes.bool,
        onClick: PropTypes.func,
        renderOnClick: PropTypes.func,
        buttonProps: PropTypes.object
    };

    return ButtonRenderer;
};

export const ButtonRenderer = getButtonRenderer();
export const ButtonRendererNoLabel = getButtonRenderer({labelStyle: 'none'});
export const ButtonRendererShortLabel = getButtonRenderer({labelStyle: 'short'});
