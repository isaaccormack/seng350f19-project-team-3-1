import { Request, Response, NextFunction } from "express";
import { Validator } from "validator.ts/Validator";

import { ILikeDataJSON, ILikeService } from "./../services/ILikeService";
import { IArtworkDataJSON, IArtworkService } from "./../services/IArtworkService";
import { ArtworkDTO } from "./../DTOs/ArtworkDTO";
import { PhotoDTO } from "../DTOs/PhotoDTO";
import { LikeDTO } from "../DTOs/LikeDTO";

export class LikesHandler {
  private likeService: ILikeService;
  private artworkService: IArtworkService;

  constructor(likeService: ILikeService, artworkService: IArtworkService) {
    this.likeService = likeService;
    this.artworkService = artworkService;
  }

  public async likeArtwork(req: Request, res: Response, next: NextFunction) {
    const userId: string = req.session!.user;
    const artworkId: string = req.body.artworkId;

    try {
      await this.likeService.addArtworkLike(userId, artworkId);
      // TODO: what to do in this case? flash success of some sort? -> depends on frontend
    } catch (err) {
      console.error(err);
      req.flash("serverError", "We couldn't like that artwork right now");
      return res.status(500).redirect("back");
    }
  }

  public async unlikeArtwork(req: Request, res: Response, next: NextFunction) {
    const userId: string = req.session!.user;
    const artworkId: string = req.body.artworkId;

    try {
      await this.likeService.removeArtworkLike(userId, artworkId);
      // TODO: what to do in this case? flash success of some sort? -> depends on frontend
    } catch (err) {
      console.error(err);
      req.flash("serverError", "We couldn't un-like that artwork right now");
      return res.status(500).redirect("back");
    }
  }

  /**
   * Get all of the current user's liked artworks.
   * @param req express request object
   * @param res express response object
   * @param next express callback
   */
  public async getAllLikes(req: Request, res: Response, next: NextFunction): Promise<ArtworkDTO[]> {
    const userId: string = req.session!.user;

    try {
      const likes: ILikeDataJSON[] = await this.likeService.findAllLikes(userId);
      const artworkIds: string[] = likes.map((like) => like.artworkId);
      console.log("successfully found all likes:" + artworkIds);
      const artworks: IArtworkDataJSON[] = await this.artworkService.findArtworkByArtworkID(artworkIds);
      return artworks.map((artwork) => new ArtworkDTO(artwork));
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  /**
   * TODO: implement pagination
   * Get more likes in a paginated likes view. Not yet implemented.
   * @param req express request object
   * @param res express response object
   * @param next express callback
   */
  public async getMoreLikes(req: Request, res: Response, next: NextFunction): Promise<ArtworkDTO[]> {
    const userId: string = req.session!.user;
    const numToSkip: number = req.body.likesSeen ? req.body.likesSeen : 0;

    try {
      const results: ILikeDataJSON[] = await this.likeService.findNextLikes(userId, numToSkip);
      throw new Error("getMoreLikes not implemented");
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

}
