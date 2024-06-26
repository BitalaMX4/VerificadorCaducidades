import { Router } from 'express';
import { getToken, getInventory, getLotesPorNotaProducto } from '../controller/controller.js';

const router = Router();

//mandar un html
router.get('/home', (req,res)=>{
 res.sendFile('index.html', {root: './src'})
})
// Token
router.post('/token', getToken);

router.post('/lotes', getInventory);

router.post('/lotesByNotaProducto', getLotesPorNotaProducto);

export default router