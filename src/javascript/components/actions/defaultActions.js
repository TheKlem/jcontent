import CallAction from './CallAction'
import {Edit} from "@material-ui/icons";
import * as _ from "lodash";
import CreateAction from "./CreateAction";

let edit = (context) => window.parent.editContent(context.path, context.displayName, ['jnt:content'], ['nt:base']);
let createContentFolder = (context) => window.parent.createContent(context.path, 'jnt:contentFolder', false);
let createContent = (context) => {
    return window.parent.createContent(context.path, _.join(context.nodeTypes, " "), true);
}

let defaultActions = {
    edit: {
        component: CallAction,
        call: edit,
        icon: Edit,
    },
    createContentFolder: {
        component: CallAction,
        call: createContentFolder,

    },
    createContent: {
        component: CreateAction,
        provideAllowedChildNodeTypes: true,
        call: createContent,
    }
}

export default defaultActions;