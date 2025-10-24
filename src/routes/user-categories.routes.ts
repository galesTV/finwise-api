import { Router } from 'express';
import { 
  getUserCategories, 
  saveUserCategories, 
  checkSalaryPayment, 
  updateLastPayment,
  updateSubcategoryInUser
} from '../controllers/user-categories.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getUserCategories);
router.post('/save', saveUserCategories);
router.get('/check-salary', checkSalaryPayment);
router.post('/update-last-payment', updateLastPayment);
router.patch('/update-subcategory', updateSubcategoryInUser);

export default router;