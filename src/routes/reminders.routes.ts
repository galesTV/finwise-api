import express from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { ReminderController } from "../controllers/reminder.controller";

const router = express.Router();

router.use(authenticate);

router.post("/createR", ReminderController.createReminder);

router.get("/getR", ReminderController.getReminders);

router.get("/:id", ReminderController.getReminderById);

router.put("/:id", ReminderController.updateReminder);

router.delete("/:id", ReminderController.deleteReminder);

export default router;
