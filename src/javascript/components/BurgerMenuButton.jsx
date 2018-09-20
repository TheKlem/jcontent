import React from "react";
import {translate} from "react-i18next";
import {withStyles} from '@material-ui/core';

const styles = theme => ({
    menuButton: {
        background: "url(" + contextJsParameters.contextPath + "/engines/jahia-anthracite/images/dx_logo_solid.png) center center no-repeat",
        marginLeft: -12,
        marginRight: 6,
        width: "3.5em",
        height: "3.5em",
        backgroundSize: "100%"
    }
});

class BurgerMenuButton extends React.Component {

    openMenu = () => {
        const clickEvent = window.top.document.createEvent("MouseEvents");
        clickEvent.initEvent("click", true, true);
        window.top.document.getElementsByClassName("editmode-managers-menu")[0].dispatchEvent(clickEvent);
    }

    render() {
        let {classes} = this.props;

        return (
            <div className={classes.menuButton}  onClick={() => this.openMenu()} data-cm-role="cm-burger-menu"/>
        );
    }
}

BurgerMenuButton = withStyles(styles, {name:"DxBurgerMenuButton"})(BurgerMenuButton);

export default translate()(BurgerMenuButton);