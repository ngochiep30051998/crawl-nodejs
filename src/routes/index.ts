import { Router } from 'express';
import UserRouter from './Users';
import crawl from './crawl-data';
// Init router and path
const router = Router();

// Add sub-routes
router.use('/users', UserRouter);
router.use('/crawl', crawl);


// Export the base-router
export default router;
