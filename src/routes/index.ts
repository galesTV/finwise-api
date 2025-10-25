import express from "express";
import authRoutes from "./auth.routes";
import userRoutes from "./user.routes";
import userCategoriesRoutes from "./user-categories.routes";
import financeRoutes from "./transactions.routes";
import remindersRoutes from "./reminders.routes";
import statsRoutes from "./stats.routes";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/user", userRoutes);
router.use("/user-categories", userCategoriesRoutes);
router.use("/finance", financeRoutes);
router.use("/reminders", remindersRoutes);
router.use("/stats", statsRoutes);

export default router;
