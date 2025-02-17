const fs = require('fs-extra');
const path = require('path');


function monitorDiskSpace(config) {
    const interval = 5 * 1000;
    setInterval(async () => {
        const spaceThresholdMB = config.diskSpaceThresholdMb; // max size of folder in MB

        try {
            const files = await fs.promises.readdir(config.recordingsDirectory);
            const folderSizeMB = await calculateFolderSize(files, config.recordingsDirectory) / (1024 * 1024); // to MB

            console.log(`Folder size: ${folderSizeMB}MB`);
            if (folderSizeMB > spaceThresholdMB) {
                console.log(`Folder size exceeds ${spaceThresholdMB}MB. Deleting oldest files.`);
                await removeOldestFile(config.recordingsDirectory);
            }
        } catch (error) {
            console.error('Error while reading folder size ', error);
        }
    }, interval);
}
function cleanupStreamLeftOver(){ 
    // remove all ts and m3u8 files from stream folder
    fs.readdir('stream', (err, files) => {
        if (err) {
            console.error('Error while reading stream folder:', err);
            return;
        }
    
        for (const file of files) {
            if (file.endsWith('.ts') || file.endsWith('.m3u8')) {
                fs.unlink(path.join('stream', file), (err) => {
                    if (err) {
                        console.error('Error while deleting file:', err);
                    } else {
                        console.log('File deleted:', file);
                    }
                });
            }
        }
    });
}

async function calculateFolderSize(files, folderPath) {
    let size = 0;

    for (const file of files) {
        const filePath = path.join(folderPath, file);
        const stats = await fs.promises.stat(filePath);

        if (stats.isDirectory()) {
            const subFiles = await fs.promises.readdir(filePath);
            size += await calculateFolderSize(subFiles, filePath);
        } else {
            size += stats.size;
        }
    }

    return size;
}

async function removeOldestFile(baseDirectory) {
    try {
        const folders = await fs.readdir(baseDirectory);

        if (folders.length > 0) {
            const oldestFolder = folders.reduce((oldest, folder) => {
                const folderPath = path.join(baseDirectory, folder);
                const stats = fs.statSync(folderPath);

                if (stats.isDirectory()) {
                    return stats.birthtimeMs < oldest.stats.birthtimeMs ? { folder, stats } : oldest;
                } else {
                    return oldest;
                }
            }, { folder: null, stats: { birthtimeMs: Infinity } });

            if (oldestFolder.folder) {
                const folderPath = path.join(baseDirectory, oldestFolder.folder);
                const filesInFolder = await fs.readdir(folderPath);

                if (filesInFolder.length > 0) {
                    const oldestFile = filesInFolder.reduce((oldest, file) => {
                        const filePath = path.join(folderPath, file);
                        const stats = fs.statSync(filePath);
                        return stats.birthtimeMs < oldest.stats.birthtimeMs ? { file, stats } : oldest;
                    }, { file: null, stats: { birthtimeMs: Infinity } });

                    if (oldestFile.file) {
                        await fs.unlink(path.join(folderPath, oldestFile.file));
                        console.log('Oldest file in oldest folder was deleted: ', oldestFile.file);

                        // check if folder is empty
                        const isFolderEmpty = (await fs.readdir(folderPath)).length === 0;
                        if (isFolderEmpty) {
                            await fs.rmdir(folderPath);
                            console.log('Oldest folder was empty so it was deleted', oldestFolder.folder);
                        }
                    } else {
                        console.log('No files to delete in oldest folder');
                    }
                } else {
                    console.log('Oldest folder is empty, no files to delete');
                }
            } else {
                console.log('No folders to delete');
            }
        } else {
            console.log('No folders to delete');
        }
    } catch (err) {
        console.error('Error reading dictionary ', err);
    }
}

module.exports = {
    monitorDiskSpace,
    calculateFolderSize,
    removeOldestFile,
    cleanupStreamLeftOver
};