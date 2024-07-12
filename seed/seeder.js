import {exit} from 'node:process'
import categorias from './categorias.js'
import precios from './precios.js'
import Categoria from '../models/Categoria.js'
import Precios from '../models/Precio.js'
import db from '../config/db.js'

const importarDatos = async () => {
    try {
        //autenticar
        await db.authenticate()
        //generar las columnas
        await db.sync()
        //insertamos los datos
        await Promise.all([
            Categoria.bulkCreate(categorias),
            Precios.bulkCreate(precios)
        ])

        console.log('datos importados correctamente')
        exit()
    } catch (error) {
         console.log(error)
        exit(1)   
    }
}

if(process.argv[2]=== "-i"){
    importarDatos();
}