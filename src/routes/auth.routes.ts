import express from "express";
import { AuthController } from "../controllers/auth.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = express.Router();

router.post(
  "/register",
  AuthController.validateRegister,
  AuthController.registerMobile
);

router.post("/login", AuthController.loginMobile);

router.post("/logout", AuthController.logout);

router.post("/refresh", AuthController.refreshToken);

router.post("/validate-token", authenticate, AuthController.validateToken);

export default router;
