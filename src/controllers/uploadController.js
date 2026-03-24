// src/controllers/uploadController.js
import cloudinary from '../config/cloudinary.js';

export const uploadImage = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Aucun fichier n'a ete envoye." });
  }

  try {
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { resource_type: 'auto' },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );
      uploadStream.end(req.file.buffer);
    });

    res.status(200).json({ url: result.secure_url });
  } catch (error) {
    const status = error.statusCode || 500;
    const message = status !== 500 && error.message ? error.message : "Erreur lors de l'upload de l'image.";
    res.status(status).json({ message });
  }
};
