'use strict';

const express = require('express');
const app = express();

const config = require('./config.js');

var knex = null;

// inicializa Knex.js para usar diferentes bases de datos según el entorno:
function conectaBD() {
    if (knex === null) {
        var options;
        if (process.env.CARRITO_ENV === 'gae') {
            options = config.gae;
            console.log('Usando Cloud SQL (MySQL) como base de datos en Google App Engine');
        } else if (process.env.CARRITO_ENV === 'heroku') {
            options = config.heroku;
            console.log('Usando PostgreSQL como base de datos en Heroku');
        } else {
            options = config.localbd;
            console.log('Usando SQLite como base de datos local');
        }
        // Muestra la conversión a SQL de cada consulta:
        // options.debug= true;
        knex = require('knex')(options);
    }
}

// crea las tablas si no existen:
async function creaEsquema(res) {
    try {
        let existeTabla = await knex.schema.hasTable('cuestionarios');
        if (!existeTabla) {
            await knex.schema.createTable('cuestionarios', (tabla) => {
                tabla.increments('cuestionarioId').primary();
                tabla.string('tema', 100).notNullable().unique(); //unique
                tabla.string('collapsed').notNullable();
            });
            console.log("Se ha creado la tabla cuestionarios");
        }
        existeTabla = await knex.schema.hasTable('preguntas');
        if (!existeTabla) {
            await knex.schema.createTable('preguntas', (table) => {
                table.increments('preguntaId').primary();
                table.string('tema', 100).notNullable().references('cuestionarios.tema');
                table.string('texto', 100).notNullable();
                table.string('respuesta').notNullable();
                table.string('highlight').notNullable();
            });
            console.log("Se ha creado la tabla preguntas");
        }
    } catch (error) {
        console.log(`Error al crear las tablas: ${error}`);
        res.status(404).send({result: null, error: 'error al crear la tabla; contacta con el administrador'});
    }
}

//
// async function numeroCuestionarios() {
//   return await knex('cuestionarios').countDistinct('tema');
// }
//
async function numeroPreguntas(cuestionario) {
    let r = await knex('preguntas').select('texto')
        .where('tema', cuestionario);
    return r.length;
}

async function existeCuestionario(cuestionario) {
    let r = await knex('cuestionarios').select('tema')
        .where('tema', cuestionario);
    return r.length > 0;
}

async function existePregunta(pregunta, cuestionario) {

    let r = await knex('preguntas').select('texto')
        .where('texto', pregunta)
        .andWhere('tema', cuestionario);
    return r.length > 0;
}
async function  noHighlightsInCuestionario(cuestionario){
    let r = await knex('preguntas').select('texto')
        .where('highlight', 'true')
        .andWhere('tema', cuestionario);
}


// asume que el cuerpo del mensaje de la petición está en JSON:
app.use(express.json());

// middleware para aceptar caracteres UTF-8 en la URL:
app.use((req, res, next) => {
    req.url = decodeURI(req.url);
    next();
});

// middleware para las cabeceras de CORS:
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Methods', 'DELETE, PUT, GET, POST, OPTIONS');
    res.header("Access-Control-Allow-Headers", "content-type");
    next();
});


// middleware que establece la conexión con la base de datos y crea las 
// tablas si no existen; en una aplicación más compleja se crearía el
// esquema fuera del código del servidor:
app.use(async (req, res, next) => {
    app.locals.knex = conectaBD(app.locals.knex);
    await creaEsquema(res);
    next();
});


// crea un nuevo cuestionario:
app.post(config.app.base + '/cuestionarios', async (req, res) => {
    if (!req.body.tema) {
        res.status(404).send({result: null, error: 'datos mal formados'});
        return;
    }
    try {
        let existe = await existeCuestionario(req.body.tema);
        if (existe) {
            res.status(404).send({result: null, error: `cuestionario sobre ${req.body.tema} ya existente`});
            return;
        }

        let c = {tema: req.body.tema, collapsed: req.body.collapsed};
        await knex('cuestionarios').insert(c);
        let i = await knex('cuestionarios').select('cuestionarioId')
            .where('tema', c.tema);
        res.status(200).send({result: i, error: null});
        // res.status(200).send({ result:'ok',error:null });

    } catch (error) {
        console.log(`No se puede añadir el cuestionario: ${error}`);
        res.status(404).send({result: null, error: 'no se pudo añadir el cuestionario'});
    }
});

// crea un nueva pregunta:
app.post(config.app.base + '/:cuestionario/preguntas', async (req, res) => {
    if (!req.body.texto || !req.body.respuesta) {
        res.status(404).send({result: null, error: 'datos mal formados'});
        return;
    }
    try {
        let existe = await existeCuestionario(req.params.cuestionario);
        if (!existe) {
            res.status(404).send({result: null, error: `cuestionario ${req.params.cuestionario} no existente`});
            return;
        }
        existe = await existePregunta(req.body.texto, req.params.cuestionario);
        if (existe) {
            res.status(404).send({result: null, error: `pregunta ${req.body.texto} ya existente`});
            return;
        }

        var p = {
            tema: req.params.cuestionario,
            texto: req.body.texto,
            respuesta: req.body.respuesta,
            highlight: req.body.highlight
        };
        await knex('preguntas').insert(p);
        // let id= await knex('preguntas').select('preguntaId')
        //      .where('texto',c.texto);
        // res.status(200).send({ result:id,error:null });
        res.status(200).send({result: 'ok', error: null});
    } catch (error) {
        console.log(`No se puede añadir la pregunta: ${error}`);
        res.status(404).send({result: null, error: 'no se pudo añadir la pregunta'});
    }
});
//recuperar todos los temas (GET);
app.get(config.app.base + '/cuestionarios', async (req, res) => {
    try {

        let i = await knex('cuestionarios').select(['tema', 'collapsed']);
        res.status(200).send({result: i, error: null});
    } catch (error) {
        console.log(`No se puede obtener los temas del cuestionarios: ${error}`);
        res.status(404).send({result: null, error: 'no se pudo obtener los datos del cuestionario'});
    }
});

//obtener todas las preguntas y respuestas dado el id del tema (GET);??????????????
// lista los preguntas de un cuestionario:
app.get(config.app.base + '/:cuestionario/preguntas', async (req, res) => {
    try {
        let existe = await existeCuestionario(req.params.cuestionario);
        if (!existe) {
            res.status(404).send({result: null, error: `cuestionario sobre ${req.params.cuestionario} no existente`});
            return;
        }

        let i = await knex('preguntas').select(['texto', 'respuesta', 'highlight']).where('tema', req.params.cuestionario);

        res.status(200).send({result: i, error: null});
    } catch (error) {
        console.log(`No se puede obtener los productos del cuestionario: ${error}`);
        res.status(404).send({result: null, error: 'no se pudo obtener los datos del cuestionario'});
    }
});


// borra una pregunta:
app.delete(config.app.base + '/:cuestionario/preguntas/:texto', async (req, res) => {
    try {
        let existe = await existeCuestionario(req.params.cuestionario);
        if (!existe) {
            res.status(404).send({result: null, error: `cuestionario sobre ${req.params.cuestionario} no existente`});
            return;
        }
        existe = await existePregunta(req.params.texto, req.params.cuestionario);
        if (!existe) {
            res.status(404).send({result: null, error: `pregunta ${req.params.texto} no existente`});
            return;
        }
        await knex('preguntas').where('tema', req.params.cuestionario).andWhere('texto', req.params.texto).del(); //.andWhere('preguntaId',req.params.preguntaId)
        res.status(200).send({result: 'ok', error: null});
    } catch (error) {
        console.log(`No se pudo obtener la pregunta: ${error}`);
        res.status(404).send({result: null, error: 'no se pudo obtener la pregunta'});
    }
});


// borra un cuestionario:
app.delete(config.app.base + '/:cuestionario', async (req, res) => {
    try {
        let existe = await existeCuestionario(req.params.cuestionario);
        if (!existe) {
            res.status(404).send({result: null, error: `cuestionario sobre ${req.params.cuestionario} no existe`});
            return;
        }
        await knex('preguntas').where('tema', req.params.cuestionario)
            .del();
        await knex('cuestionarios').where('tema', req.params.cuestionario)
            .del();
        res.status(200).send({result: 'ok', error: null});
    } catch (error) {
        console.log(`No se pudo encontrar el carrito: ${error}`);
        res.status(404).send({result: null, error: 'no se pudo encontrar el carrito'});
    }
});


const secret = '12345';

// borra toda la base de datos:
app.get(config.app.base + '/clear', async (req, res) => {
    try {
        await knex('preguntas').where('tema', req.params.cuestionario)
            .del();
        await knex('cuestionarios').where('tema', req.params.cuestionario)
            .del();
        res.status(200).send({result: 'ok', error: null});
    } catch (error) {
        console.log(`No se pudo borrar la base de datos: ${error}`);
    }
});


const path = require('path');
const publico = path.join(__dirname, 'public');
// __dirname: carpeta del proyecto

app.get(config.app.base + '/', (req, res) => {
        res.status(200).send('API web para gestionar carritos de la compra');
    }
);

app.use('/', express.static(publico));

const PORT = process.env.PORT || 5000;
app.listen(PORT, function () {
    console.log(`Aplicación lanzada en el puerto ${PORT}!`);
});

// // modifica una pregunta:
// app.put(config.app.base+'/:cuestionario/:pregunta', async (req, res) => {
//   if (!req.params.pregunta) {
//     res.status(404).send({ result:null,error:'datos mal formados' });
//     return;
//   }
//   try {
//     let existe= await existeCuestionario(req.params.cuestionario);
//     if (!existe) {
//       res.status(404).send({ result:null,error:`cuestiomario sobre ${req.params.cuestionario} no existente` });
//       return;
//     }
//     existe= await existePregunta(req.params.pregunta, req.params.cuestionario);
//     if (!existe) {
//       res.status(404).send({ result:null,error:`pregunta ${req.params.pregunta} no existente` });
//       return;
//     }
//     await knex('preguntas').update('texto',req.body.texto)
//         .where('tema',req.params.cuestionario)
//         .andWhere('texto',req.params.pregunta);
//     res.status(200).send({ result:'ok',error:null });
//   } catch (error) {
//     console.log(`No se pudo obtener el item: ${error}`);
//     res.status(404).send({ result:null,error:'no se pudo obtener el item' });
//   }
// });

//modifica colapse
// modifica un item:
app.put(config.app.base + '/:cuestionario', async (req, res) => {

    try {
        let existe = await existeCuestionario(req.params.cuestionario);
        if (!existe) {
            res.status(404).send({result: null, error: `cuestiomario sobre ${req.params.cuestionario} no existente`});
            return;
        }

        await knex('cuestionarios').update('collapsed', req.body.collapsed)
            .where('tema', req.params.cuestionario);
        res.status(200).send({result: 'ok', error: null});
    } catch (error) {
        console.log(`No se pudo obtener el item: ${error}`);
        res.status(404).send({result: null, error: 'no se pudo obtener el item'});
    }
});
//update highlight
app.put(config.app.base + '/:cuestionario/:pregunta', async (req, res) => {
    if (!req.params.pregunta) {
        res.status(404).send({result: null, error: 'datos mal formados'});
        return;
    }
    try {
        let existe = await existeCuestionario(req.params.cuestionario);
        if (!existe) {
            res.status(404).send({result: null, error: `cuestiomario sobre ${req.params.cuestionario} no existente`});
            return;
        }
        existe = await existePregunta(req.params.pregunta, req.params.cuestionario);
        if (!existe) {
            res.status(404).send({result: null, error: `pregunta ${req.params.pregunta} no existente`});
            return;
        }
        if (req.body.highlight) {
            // if(req.body.highlight==='true'){
            // let noHighlights = await noHighlightsInCuestionario(req.params.cuestionario);
            // if(!noHighlights){
            //     res.status(404).send({result: null, error: `Only one can be highlighted`});
            //     return;
            // }}
            await knex('preguntas').update('highlight', req.body.highlight)
                .where('tema', req.params.cuestionario)
                .andWhere('texto', req.params.pregunta);
        }
        else if (req.body.texto)
            await knex('preguntas').update('texto', req.body.texto)
                .where('tema', req.params.cuestionario)
                .andWhere('texto', req.params.pregunta);
        res.status(200).send({result: 'ok', error: null});
    } catch (error) {
        console.log(`No se pudo obtener el item: ${error}`);
        res.status(404).send({result: null, error: 'no se pudo obtener el item'});
    }
});

//is collapsed?
app.get(config.app.base + '/:cuestionario', async (req, res) => {
    try {
        let existe = await existeCuestionario(req.params.cuestionario);
        if (!existe) {
            res.status(404).send({result: null, error: `cuestiomario sobre ${req.params.cuestionario} no existente`});
            return;
        }

        let i = await knex('cuestionarios').select('collapsed').where('tema', req.params.cuestionario);
        res.status(200).send({result: i, error: null});
    } catch (error) {
        console.log(`No se puede obtener los temas del cuestionarios: ${error}`);
        res.status(404).send({result: null, error: 'no se pudo obtener los datos del cuestionario'});
    }
});
