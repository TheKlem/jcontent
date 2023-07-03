import {fileuploadAddUploads, fileuploadTakeFromQueue, uploadSeed} from './Upload.redux';
import {NUMBER_OF_SIMULTANEOUS_UPLOADS} from './Upload.constants';
import {v4} from 'uuid';
import {
    CheckNodeFolder
} from '~/JContent/ContentRoute/ContentLayout/UploadTransformComponent/UploadTransformComponent.gql-queries';
import {
    CreateFolders
} from '~/JContent/ContentRoute/ContentLayout/UploadTransformComponent/UploadTransformComponent.gql-mutations';

const IGNORED_FILES = ['.DS_Store', '.localized'];

export const onFilesSelected = ({acceptedFiles, dispatchBatch, type, additionalActions = []}) => {
    if (acceptedFiles.length > 0) {
        const uploads = acceptedFiles.map(file => ({
            ...uploadSeed,
            ...file,
            id: v4(),
            type
        }));

        dispatchBatch(additionalActions.concat([
            fileuploadAddUploads(uploads),
            fileuploadTakeFromQueue(NUMBER_OF_SIMULTANEOUS_UPLOADS)
        ]));
    }
};

export const isDragDataWithFiles = evt => {
    if (!evt.dataTransfer) {
        return false;
    }

    // https://developer.mozilla.org/en-US/docs/Web/API/DataTransfer/types
    // https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API/Recommended_drag_types#file
    return Array.prototype.every.call(
        evt.dataTransfer.types,
        type => type === 'Files' || type === 'application/x-moz-file'
    );
};

export const getDataTransferItems = event => {
    let dataTransferItemsList = [];
    if (event.dataTransfer) {
        const dt = event.dataTransfer;

        // NOTE: Only the 'drop' event has access to DataTransfer.files,
        // otherwise it will always be empty
        if (dt.items && dt.items.length) {
            // During the drag even the dataTransfer.files is null
            // but Chrome implements some drag store, which is accessible via dataTransfer.items
            dataTransferItemsList = dt.items;
        } else if (dt.files && dt.files.length) {
            dataTransferItemsList = dt.files;
        }
    } else if (event.target && event.target.files) {
        dataTransferItemsList = event.target.files;
    }

    // Convert from DataTransferItemsList to the native Array
    return Array.prototype.slice.call(dataTransferItemsList);
};

export const fileMatchSize = (file, maxSize, minSize) => {
    return file.size <= maxSize && file.size >= minSize;
};

export const fileIgnored = file => {
    return IGNORED_FILES.find(f => f === file.name);
};

export const checkFolderNames = async (client, directories) => {
    const invalidFolderNames = directories.filter(dir => {
        const reg = /[\\/:*?"<>|%]/g;
        return reg.test(dir.entry.name);
    });

    return {
        invalidFolderNames
    };
};

export const createMissingFolders = async (client, directories) => {
    const {invalidFolderNames} = await checkFolderNames(client, directories);

    const foldersChecks = await client.query({
        query: CheckNodeFolder,
        variables: {
            paths: directories.map(dir => dir.path + '/' + dir.entry.name)
        },
        fetchPolicy: 'network-only',
        errorPolicy: 'ignore'
    });

    const conflicts = directories.filter(dir => {
        const existingNode = foldersChecks.data.jcr.nodesByPath.find(
            n =>
                n.path === dir.path + '/' + dir.entry.name && !n.isNodeType
        );

        return existingNode || invalidFolderNames.includes(dir);
    });

    const exists = directories.filter(dir => {
        const existingNode = foldersChecks.data.jcr.nodesByPath.find(
            n =>
                n.path === dir.path + '/' + dir.entry.name && n.isNodeType
        );

        return existingNode && !invalidFolderNames.includes(dir);
    });

    const created = directories.filter(dir => {
        const existingNode = foldersChecks.data.jcr.nodesByPath.find(
            n => n.path === dir.path + '/' + dir.entry.name
        );

        const isConflict = conflicts.find(f =>
            dir.path.startsWith(f.path + '/' + f.entry.name)
        );

        return (
            !existingNode &&
            !isConflict &&
            !invalidFolderNames.includes(dir)
        );
    });

    await client.mutate({
        mutation: CreateFolders,
        variables: {
            nodes: created.map(dir => ({
                parentPathOrId: dir.path,
                name: dir.entry.name,
                primaryNodeType: 'jnt:folder'
            }))
        }
    });

    return {
        created,
        exists,
        conflicts,
        invalidFolderNames
    };
};

