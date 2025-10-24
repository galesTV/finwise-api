import express from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { TransactionController } from '../controllers/transaction.controller';

const router = express.Router();

router.use(authenticate);

router.post('/search', 
    TransactionController.searchTransactions
);

router.get('/balance', 
    TransactionController.getBalance
);

router.post('/createT', 
    TransactionController.createTransaction
);

router.post('/objetivo/adicionar-valor',
    TransactionController.adicionarValorObjetivo
);

router.get('/getAT', 
    TransactionController.getAllTransactions
);

router.get('/:id', 
    authenticate,
    TransactionController.getTransactionById
);

router.patch('/:id', 
    TransactionController.updateTransaction
);

router.delete('/:id', 
    authenticate,
    TransactionController.removeTransaction
);

export default router;