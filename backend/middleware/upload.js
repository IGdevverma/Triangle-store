const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: "triangle-sports",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    resource_type: "image",
  }),
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpg|jpeg|png|webp/;

  const extName = allowedTypes.test(
    file.originalname.split(".").pop().toLowerCase()
  );

  const mimeType = file.mimetype.startsWith("image/");

  if (extName && mimeType) {
    return cb(null, true);
  }

  cb(new Error("Only Images are Allowed"));
};

const upload = multer({
  storage,
  fileFilter,
});

module.exports = upload;