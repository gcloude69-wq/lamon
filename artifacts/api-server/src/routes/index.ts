import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import listingsRouter from "./listings";
import discoverRouter from "./discover";
import bookingsRouter from "./bookings";
import reviewsRouter from "./reviews";
import vendorRouter from "./vendor";

const router: IRouter = Router();

router.use(healthRouter);
router.use(usersRouter);
router.use(listingsRouter);
router.use(discoverRouter);
router.use(bookingsRouter);
router.use(reviewsRouter);
router.use(vendorRouter);

export default router;
