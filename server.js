import express from "express";
import mysql from "mysql2";
import path from 'path';
import { fileURLToPath } from "url";
import { dirname } from "path";
import fs from "fs";


const app = express()
const port = 3500

app.use(express.json())
app.use(express.static(path.join('public')));
app.use(express.urlencoded({ extended: true }));

function jsonA_tabla(resultado) {
  const columns = Object.keys(resultado[0]);

   let table = `
    <table style="
      border-collapse: collapse;
      width: 100%;
      margin-top: 20px;
      font-family: Arial, sans-serif;
    ">
      <thead>
        <tr style="background-color: #f2f2f2;">
  `;
  columns.forEach(column => {
    table += `<th style="border: 1px solid #ddd; padding: 8px; text-align: left;">${column}</th>`;
  });

  table += "</tr></thead><tbody>";

  resultado.forEach(item => {
    table += "<tr>";
    columns.forEach(column => {
      table += `<td style="border: 1px solid #ddd; padding: 8px;">${item[column] ?? ""}</td>`;
    });
    table += "</tr>";
  });

  table += "</tbody></table>";

  return table;
}


const conexion = mysql.createConnection(
    {
        host: "localhost",
        user: "root",
        password: "root1234",
        database: "aprendiendo_sql2"
    }
)

conexion.connect( (err) => {
    if(err)
        console.log("Error al conectar con la base de datos", err.message)
    else
        console.log("Conexion exitosa a mysql")
} )

app.get("/local_serverUP", (req, res) => {
    res.send("Servidor funcionando correctamente =)")
})

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'))
}
)


app.get("/usuarios", (req, res) => {
    const { filtro, valor } = req.query;

    let query = "SELECT id, nombre, dpi, correo FROM usuarios";
    let params = [];

    if (filtro && valor) {
        query += ` WHERE ${conexion.escapeId(filtro)} LIKE ?`;
        params.push(`%${valor}%`);
    }

    conexion.query(query, params, (err, resultado) => {
        if (err) {
            console.error("Error en la consulta:", err.message);
            return res.status(500).send("Error al obtener los usuarios");
        }

        const tablaHtml = `<div class="table-container">${jsonA_tabla(resultado)}</div>`;

        fs.readFile(path.join('public', 'verUsuario.html'), "utf8", (err, data) => {
            if (err) {
                return res.status(500).send("Error al cargar la vista");
            }

            const pagina_data = data.replace("{{TABLAFINAL}}", tablaHtml);
            res.send(pagina_data);
        });
    });
});



app.post("/crearUsuario", (req, res) => {
    const {nombre, dpi, altura, edad, correo} = req.body
    const query = "INSERT INTO usuarios (nombre, dpi, altura, edad, correo) VALUES (?,?,?,?,?)"

    conexion.query(query, [nombre, dpi ,altura, edad, correo], (err, resultado) => {
        if (err){
            console.log("Error al insertar:", err.message);
            res.status(500).send("Error al insertar los datos del usuario");
        }else{
            console.log(`Usuario ${nombre} agregado correctamente`);
            res.send(`
  <!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="UTF-8">
    <title>Formulario enviado</title>
    <style>
      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        background-color: #11467e;
        text-align: center;
        padding: 50px;
      }

      .card {
        background-color: white;
        border-radius: 10px;
        padding: 30px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        max-width: 600px;
        margin: 0 auto;
      }

      h2 {
        color: #2e7d32;
        margin-top: 20px;
      }

      img {
        max-width: 100%;
        height: auto;
        border-radius: 8px;
        margin-top: 20px;
      }

      .links {
        margin-top: 30px;
      }

      .links a {
        text-decoration: none;
        color: #1565c0;
        font-weight: bold;
        margin: 0 15px;
      }

      .links a:hover {
        text-decoration: underline;
      }
    </style>
  </head>
  <body>
    <div class="card">
      <h2>¡Formulario enviado con éxito!</h2>
      <img src="https://start.docuware.com/hs-fs/hubfs/blog-images/11%20Tips%20for%20creating%20web%20forms/Form%20on%20computer%20with%20green%20check%20mark%20(1).jpg?width=600&name=Form%20on%20computer%20with%20green%20check%20mark%20(1).jpg" 
           alt="Formulario enviado correctamente">
      <h2>El usuario <span style="color: #388e3c;">${nombre}</span> fue guardado correctamente.</h2>

      <div class="links">
        <a href="/nuevoUsuario.html">← Volver al formulario</a>
        <a href="/usuarios">Ver listado</a>
      </div>
    </div>
  </body>
  </html>
`);
        }
            
    })
})

app.listen( port, () => {
    console.log(`server corriendo en http://localhost:${port}`)
}
)