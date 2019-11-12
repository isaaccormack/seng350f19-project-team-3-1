import { NextFunction, Request, Response, Router } from "express";
import { BaseRoute } from "./route";

/**
 * / route
 *
 * @class NotFoundRoute
 */
export class NotFoundRoute extends BaseRoute {

  /**
   * Create the routes.
   *
   * @class NotFoundRoute
   * @method create
   * @static
   */
  public static create(router: Router) {
    // log
    console.log("[NotFoundRoute::create] Creating not found route.");

    // Catch all requests for endpoints which are not found
    router.get("/*", (req: Request, res: Response, next: NextFunction) => {
      new NotFoundRoute().display(req, res, next);
    });
  }

  /**
   * Constructor
   *
   * @class IndexRoute
   * @constructor
   */
  constructor() {
    super();
  }

  /**
   * The home page route.
   *
   * @class IndexRoute
   * @method index
   * @param req {Request} The express Request object.
   * @param res {Response} The express Response object.
   * @next {NextFunction} Execute the next method.
   */
  public display(req: Request, res: Response, next: NextFunction) {
    this.render(req, res, "404");
  }
}