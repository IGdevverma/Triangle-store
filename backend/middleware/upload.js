const multer = require("multer");
const cloudinary = require("../config/cloudinary");

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {

    const allowedExtensions = new Set([
        "jpg",
        "jpeg",
        "png",
        "webp"
    ]);

    const extension = file.originalname
        .split(".")
        .pop()
        .toLowerCase();

    const isAllowedExtension =
        allowedExtensions.has(extension);

    const isAllowedMimeType =
        [
            "image/jpeg",
            "image/png",
            "image/webp"
        ].includes(file.mimetype);

    if (
        isAllowedExtension &&
        isAllowedMimeType
    ) {
        return cb(null, true);
    }

    return cb(
        new Error(
            "Only JPG, JPEG, PNG and WEBP images are allowed"
        )
    );
};

const upload = multer({

    storage,

    fileFilter,

    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 155
    }

});

module.exports = upload;