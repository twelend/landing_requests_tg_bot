import { Router, Request, Response, NextFunction } from 'express';
import { createRequest, getAll, deleteAll, getNumber } from '../controllers/requestController';

const router = Router();

router.post('/create', (req: Request, res: Response, next: NextFunction) => createRequest(req, res, next));
router.get('/number', (req: Request, res: Response, next: NextFunction) => getNumber(req, res, next));
router.get('/all', (req: Request, res: Response, next: NextFunction) => getAll(req, res, next));
router.delete('/delete', (req: Request, res: Response, next: NextFunction) => deleteAll(req, res, next));

export default router;
