'use strict';

const multer = require('multer');
const {fileSize} = require('../config');

const getFileExtension = filename => {
    return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
};

class Upload {
    constructor({ filename, destination, newName }) {
        this.filename = filename;
        this.destination = destination;
        this.newName = newName;
    }


    save( req, res ) {
        
        let self = this;

        const storage = multer.diskStorage({
            destination: (req, file, cb) => {
                cb(null, self.destination);
            },
            filename: (req, file, cb) => {
                const ext = getFileExtension(file.originalname);
                cb(null, self.newName + '.' + ext);
            }
        });

        const uploader = multer(
            { 
                storage: storage, 
                limits: {
                    fileSize
                },
                fileFilter: (req, file, cb) => {
                    if (!file.mimetype.includes('image')) {
                        return cb(new Error('Invalid file type.'), false);
                    }
                    cb(null, true);
                }    
        }).single(self.filename);

        return new Promise((resolve, reject) => {
            uploader(req, res, err => {
                if(err) {
                    resolve({error: 'Upload failed', info: err});
                } else {
                    resolve({
                        done: true,
                        body: req.body,
                        file: req.file
                    });
                } 
            });
        });
    }
}

module.exports = Upload;