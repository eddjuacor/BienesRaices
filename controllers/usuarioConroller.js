import { check, validationResult } from 'express-validator'
import bcrypt from 'bcrypt'
import Usuario from '../models/Usuario.js'
import {generarJWT,generarId} from '../helpers/tokens.js';
import {emailRegistro} from '../helpers/email.js';
import { emailOlvidePassword } from '../helpers/email.js';


//aqui se recibe de los Router la peticion del link que quieren ver o solicitan y se envia informacion a la vista

const formularioLogin = (req, res) =>{
    res.render('auth/login',{
        pagina: 'Iniciar Sesion',
        csrfToken: req.csrfToken()     
    })
}

const autenticar = async(req, res) =>{

    await check('email').isEmail().withMessage('El Email es obligatorio').run(req)

    await check('password').notEmpty().withMessage('El Password es obligatorio').run(req)

    let resultado = validationResult(req)


    // verificar que el resutado este vacia
    if(!resultado.isEmpty()){
        //error
       return res.render('auth/login',{
            pagina:'Iniciar Sesion',
            csrfToken : req.csrfToken(),
            errores: resultado.array(),
           
        })
    }

    const {email, password} = req.body
    //comprobar si el usuario existe
   
    const usuario = await Usuario.findOne({where: {email}}) 
    if(!usuario){
       return res.render('auth/login',{
            pagina:'Iniciar Sesion',
            csrfToken : req.csrfToken(),
            errores: [{msg: 'El Usuario No Existe'}]
        })
    }

    // si el usuario esta confirmado
    if(!usuario.confirmado){
        return res.render('auth/login',{
            pagina:'Iniciar Sesion',
            csrfToken : req.csrfToken(),
            errores: [{msg: 'Tu cuenta no ha sido confirmada'}]
        })
    }

    // revisar el password
    if(!usuario.verificarPassword(password)){
        return res.render('auth/login',{
            pagina:'Iniciar Sesion',
            csrfToken : req.csrfToken(),
            errores: [{msg: 'El password es incorrecto'}]
        })
    }

    //Autenticar al usuario
    const token = generarJWT({id: usuario.id, nombre: usuario.nombre})

    console.log(token)

    //almacenar en un kookie
    return res.cookie('_token', token,{
        httpOnly: true,
        //secure: true
    }).redirect('/mis-propiedades')

}

const formularioRegistro = (req, res) =>{
              //carpeta y vista a mostrar 
    res.render('auth/registro',{
        pagina: 'Crear Cuenta',
        csrfToken : req.csrfToken()       
    })
}

const registrar = async (req, res) =>{
    
    await check('nombre').notEmpty().withMessage('El nombre es obligatorio').run(req)

    await check('email').isEmail().withMessage('Eso no parece un Email').run(req)

    await check('password').isLength({min:6}).withMessage('El password debe ser de al menos 6 caracteres').run(req)

    await check('repetir_password').equals('password').withMessage('Los password no son iguales').run(req)

    let resultado = validationResult(req)


    // verificar que el resutado este vacia
    if(!resultado.isEmpty()){
        //error
       return res.render('auth/registro',{
            pagina:'Crear Cuenta',
            csrfToken : req.csrfToken(),
            errores: resultado.array(),
            usuario:{
                nombre: req.body.nombre,
                email: req.body.email 
            }
        })
    }

    
    //extraer datos
    const {nombre, email, password}= req.body

    //verificar que el usuario no esta duplicado

    const existeUsuario = await Usuario.findOne({where : {email}})

    if(existeUsuario){
        return res.render('auth/registro',{
            pagina:'Crear Cuenta',
            csrfToken : req.csrfToken(),
            errores: [{msg: 'El usuario ya esta registrado'}],
            usuario:{
                nombre: req.body.nombre,
                email: req.body.email 
            }
        })
    }   
    

    //almacenar un usuario

    const usuario = await Usuario.create({
        nombre,
        email,
        password,
        token: generarId()
    })

    //Envia email de confirmacion

    emailRegistro({
        nombre: usuario.nombre,
        email: usuario.email,
        token: usuario.token
    })


    //mostrar mensaje de confrmacion

    res.render('templates/mensaje',{
        pagina: 'Cuenta Creada Correctamente',
        mensaje: 'Hemos Enviado un Email de Configuracion, presiona el enlace'
    })
}



    //Funcion que comprueba una cuenta

    const confirmar = async (req, res)=>{
        const { token } = req.params;
        
        // verificar si el token es valido
        const usuario = await Usuario.findOne({where: {token}})
        
        if(!usuario){
            return res.render('auth/confirmar-cuenta',{
                pagina: 'Error al confirmar tu cuenta',
                mensaje: 'Hubo un error al confirmar tu cuenta, intenta de nuevo',
                error: true
            })
        }

        // confirmar la cuenta
        usuario.token = null;
        usuario.confirmado = true;
        await usuario.save();

        res.render('auth/confirmar-cuenta',{
            pagina: 'Cuenta Confirmada',
            mensaje: 'La cuenta se confirmo correctamente',
            
        })
 
      
    }


const formularioOlvidePassword = (req, res) =>{
    //carpeta y vista a mostrar 
res.render('auth/olvide-password',{
    pagina: 'Recupera tu acceso a Bienes Raices', 
    csrfToken : req.csrfToken(),
})
}


const resetPassword= async(req,res)=>{
   
    await check('email').isEmail().withMessage('Eso no parece un Email').run(req)

    let resultado = validationResult(req)


    // verificar que el resutado este vacia
    if(!resultado.isEmpty()){
        //error
       return res.render('auth/olvide-password',{
          pagina: 'Recupera tu acceso a Bienes Raices', 
          csrfToken : req.csrfToken(),
          errores : resultado.array()
        })
    }

    //Buscar el usuario
    const {email} = req.body

    const usuario = await Usuario.findOne({where: {email}})

    if(!usuario){
     return res.render('auth/olvide-password',{ 
        pagina: 'Recupera tu cuenta a Bienes Raices',
        csrfToken: req.csrfToken(),
        errores: [{msg: 'El Email no Pertenece a ningun usuario'}]
    })

} 

// generar un token y enviar email

    usuario.token = generarId();
    await usuario.save();

    //enviar un email
    emailOlvidePassword({
        email: usuario.email,
        nombre: usuario.nombre,
        token: usuario.token
    })

    //renderizar mensaje
    res.render('templates/mensaje',{
        pagina: 'Reestablece tu password',
        mensaje: 'Hemos Enviado un Email con las instrucciones'
    })
}

    const comprobarToken= async (req, res) =>{
        const {token} = req.params;

        const usuario = await Usuario.findOne({where:{token}})

        if(!usuario){
            return res.render('auth/confirmar-cuenta',{
                pagina: 'Restablece tu Password',
                mensaje: 'Hubo un error al validar tu informacion, intenta de nuevo',
                error: true   
            })
        }

        
         //mostrar formulario para modificar el password
         res.render('auth/reset-password',{
            pagina: 'Reestablece tu password',
            csrfToken: req.csrfToken()
        })
    }

    const nuevoPassword=async (req, res) =>{
        // validar el password
        await check('password').isLength({min: 6}).withMessage('El Password debe ser de al menos 6 caracteres').run(req)
       
        let resultado = validationResult(req)    
        
        if(!resultado.isEmpty()){
            //errores
            return res.render('auth/reset-password',{
                pagina: 'Reestablece tu Password',
                csrfToken :  req.csrfToken(),
                errores: resultado.array()
            })
        }

        const {token} = req.params
        const { password} = req.body;

        //identificar quien hace el cambio
        const usuario = await Usuario.findOne({where: {token}})
    
        //ashear password
        const salt = await bcrypt.genSalt(10)
        usuario.password = await bcrypt.hash(password, salt)
        usuario.token = null;

        await usuario.save()

        res.render('auth/confirmar-cuenta',{
            pagina: 'Password Reestablecido',
            mensaje: 'El Password se guardo correctamente'
        })
    }

//Exportamos el controlador al Router
export{
    formularioLogin,
    autenticar,
    formularioRegistro,
    registrar,
    confirmar,
    formularioOlvidePassword,
    resetPassword,
    comprobarToken,
    nuevoPassword
}