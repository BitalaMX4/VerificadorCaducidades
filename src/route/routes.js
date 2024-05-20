import { Router } from 'express';
import { getToken } from '../controller/controller.js';

const router = Router();

//mandar un html
router.get('/home', (req,res)=>{
 res.sendFile('index.html', {root: './src'})
})
// Token
router.post('/token', getToken);

export default router