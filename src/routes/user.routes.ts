import express from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { ensureUserDocumentExists } from '../middlewares/user.middleware';

const router = express.Router();

router.get('/profile', 
    authenticate,
    UserController.getProfile
);

router.patch('/profile', 
    authenticate,
    UserController.updateProfile
);

router.put('/complete-profile',
  authenticate,
  UserController.validateCompleteProfile,
  ensureUserDocumentExists,
  UserController.updateCompleteProfile
);

router.get('/complete-profile', 
    authenticate,
    ensureUserDocumentExists,
    UserController.getCompleteProfile
);

router.patch('/saldo', 
  authenticate,
  UserController.updateSaldo
);

router.get('/saldo', 
  authenticate,
  UserController.getSaldo
);

router.delete('/profile', 
    authenticate,
    UserController.deleteAccount
);

export default router;