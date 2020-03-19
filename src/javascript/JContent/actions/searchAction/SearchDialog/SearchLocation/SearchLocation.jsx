import React from 'react';
import {Typography} from '@jahia/moonstone';
import {Radio, RadioGroup} from '@material-ui/core';
import {FormControlLabel} from '@jahia/design-system-kit';
import styles from './SearchLocation.scss';
import {useTranslation} from 'react-i18next';
import PropTypes from 'prop-types';

const SearchLocation = ({searchPath, nodePath, nodeDisplayName, siteInfo, handleSearchChanges}) => {
    const {t} = useTranslation('jcontent');

    return (
        <>
            <Typography variant="caption" weight="semiBold" className={styles.label}>
                {t('label.contentManager.search.searchLocation')}
            </Typography>
            <RadioGroup aria-label="Search path"
                        name="searchPath"
                        value={searchPath}
                        onChange={event => handleSearchChanges('searchPath', event.target.value)}
            >
                <FormControlLabel
                    className={styles.radio}
                    value={siteInfo.path}
                    control={<Radio color="primary"/>}
                    label={t('label.contentManager.search.searchInWebsite', {siteName: siteInfo.displayName})}
                    labelPlacement="end"
                    color="alpha"
                />
                <FormControlLabel
                    className={styles.radio}
                    value={nodePath}
                    control={<Radio color="primary"/>}
                    label={t('label.contentManager.search.searchInCurrentLocation', {nodeName: nodeDisplayName})}
                    labelPlacement="end"
                    color="alpha"
                />
            </RadioGroup>
        </>
    );
};

SearchLocation.propTypes = {
    searchPath: PropTypes.string.isRequired,
    nodePath: PropTypes.string.isRequired,
    nodeDisplayName: PropTypes.string.isRequired,
    siteInfo: PropTypes.object.isRequired,
    handleSearchChanges: PropTypes.func.isRequired
};

export default SearchLocation;
