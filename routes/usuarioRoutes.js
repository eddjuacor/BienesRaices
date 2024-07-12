import express from 'express';
//importamos las funciones del controlador
import { formularioLogin,autenticar, formularioRegistro,registrar, confirmar, formularioOlvidePassword, resetPassword,comprobarToken,nuevoPassword  } from '../controllers/usuarioConroller.js';


const router = express.Router(); 

// aqui se hace la peticion de la url que queremos ver
router.get('/login', formularioLogin);
router.post('/login', autenticar);

router.get('/registro', formularioRegistro);
router.post('/registro', registrar);

router.get('/confirmar/:token', confirmar);

router.get('/olvide-password', formularioOlvidePassword);
router.post('/olvide-password', resetPassword);

//almacena el nuevo password
router.get('/olvide-password/:token', comprobarToken);
router.post('/olvide-password/:token', nuevoPassword );



export default router