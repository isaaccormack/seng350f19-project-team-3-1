import { Request, Response, NextFunction } from "express";
import { Storage } from "@google-cloud/storage";
import multer from "multer";
import { IPhotoResult, IPhotoService } from "../services/IPhotoService";
import { GCP_PROJECT_ID, CLOUD_CREDENTIAL_FILE, BUCKET_NAME } from "../services/GCPService";

const uploader = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // no larger than 5mb
  }
}).fields([{ name: "avatar", maxCount: 1 }, { name: "gallery", maxCount: 8 }]);

// Creates reference to storage and bucket
const storage = new Storage({
  projectId: GCP_PROJECT_ID,
  keyFilename: CLOUD_CREDENTIAL_FILE
});
const bucket = storage.bucket(BUCKET_NAME);

export class UploadHandler {
  private photoService: IPhotoService;

  constructor(photoService: IPhotoService) {
    this.photoService = photoService;
  }

  /**
   * Add New Photo
   */
  public uploadPhoto(req: Request, res: Response, next: NextFunction) {
    uploader(req, res, async (err: any) => {
      if (err) { // unify this error handling
        console.error("Upload photo failed: " + err);
        req.flash("error", "Photo upload failed!");
        return next(err);
      }

      if ("gallery" in req.files) { // fix the need for this if condition
        const all = req.files.gallery.map((file) => this.uploadArtworkPhoto(file, req.session!.user._id));
        const combine = Promise.all(all);
        await combine;
      }
      next();
    });
  }

  /**
   * Add New Avatar
   */
  public uploadAvatar(req: Request, res: Response, next: NextFunction) {
    uploader(req, res, async (err: any) => {
      if (err) {
        console.error("Upload avatar failed: " + err);
        req.flash("error", "Photo upload failed!");
        return next(err);
      }
      if ("avatar" in req.files) {
        await this.uploadToGCP(req.files.avatar[0], req.session!.user.username);
      }

      next();
    });
  }

  private async uploadArtworkPhoto(exFile: Express.Multer.File, userId: string): Promise<IPhotoResult> {
    const result: IPhotoResult = await this.photoService.insertNewPhoto(userId);
    if (result.err) {
      exFile.filename = "-1";
      return result;
    }
    await this.uploadToGCP(exFile, result.result!._id.toString());
    exFile.filename = result.result!._id.toString();
    return result;
  }

  private async uploadToGCP(exFile: Express.Multer.File, photoId: string) {
    return new Promise<void>(async (res) => {
      const file = bucket.file(photoId);
      const stream = file.createWriteStream({
        metadata: {
          contentType: exFile.mimetype,
          cacheControl: "public, max-age=31536000"
        },
        resumable: false
      });

      stream.on("error", async (errr) => {
        try {
          await this.photoService.removePhotoById(photoId);
        } catch (err) {
          console.log("Error Deleting: " + photoId);
        }
        res();
      });

      stream.on("finish", () => {
        console.log(`${photoId} uploaded to ${BUCKET_NAME}.`);
        res();
      });
      stream.end(exFile.buffer);
    });
  }
}
