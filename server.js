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
      const valor = item[column] ?? "";
      if (column === "nombre") {
        table += `<td style="border: 1px solid #ddd; padding: 8px;">
                    <a href="/perfil/${item.id}" style="color: #1565c0; text-decoration: none;">${valor}</a>
                  </td>`;
      } else {
        table += `<td style="border: 1px solid #ddd; padding: 8px;">${valor}</td>`;
      }
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
        database: "aprendiendo_sql"
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

  let query = "SELECT id, nombre, dpi, correo, empresa_id FROM usuarios";
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

    let tablaHtml = "";

    if (resultado.length === 0) {
      tablaHtml = `
        <div class="table-container">
          <p style="color: red; font-weight: bold;">No se encontraron usuarios con ese criterio de búsqueda.</p>
        </div>
      `;
    } else {
      tablaHtml = `<div class="table-container">${jsonA_tabla(resultado)}</div>`;
    }

    // Cargar HTML y reemplazar {{TABLAFINAL}}
    fs.readFile(path.join('public', 'verUsuario.html'), "utf8", (err, data) => {
      if (err) {
        return res.status(500).send("Error al cargar la vista");
      }

      const pagina_data = data.replace("{{TABLAFINAL}}", tablaHtml);
      res.send(pagina_data);
    });
  });
});


app.get("/perfil/:id", (req, res) => {
  const id = req.params.id;

  const query = "SELECT nombre, empresa_id, dpi, correo, edad, altura, foto FROM usuarios WHERE id = ?";
  conexion.query(query, [id], (err, resultados) => {
    if (err) {
      console.error("Error al buscar el perfil:", err.message);
      return res.status(500).send("Error al buscar el perfil del usuario.");
    }

    if (resultados.length === 0) {
      return res.status(404).send("<h2>Usuario no encontrado</h2><a href='/usuarios'>← Volver</a>");
    }

    const usuario = resultados[0];
    res.send(`
      <html>
      <head>
        <title>Perfil de ${usuario.nombre}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-image:url(https://images.pexels.com/photos/335887/pexels-photo-335887.jpeg?_gl=1*9xgm1l*_ga*MzIxNTI5OTMyLjE3NTY5MzU3MDk.*_ga_8JE65Q40S6*czE3NTk0NDIxMjckbzUkZzEkdDE3NTk0NDIyMDAkajUxJGwwJGgw);
            background-size :cover;
            text-align: center;
            padding: 30px;
          }
          .card {
            background-color: #fff;
            padding: 20px;
            margin: 0 auto;
            max-width: 500px;
            border-radius: 10px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.1);
          }
          img {
            max-width: 150px;
            border-radius: 50%;
            margin-bottom: 20px;
          }
          .info {
            text-align: left;
            margin-top: 10px;
          }
          .info p {
            margin: 8px 0;
          }
          a {
            display: inline-block;
            margin-top: 20px;
            text-decoration: none;
            color: #1565c0;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <img src="${usuario.foto ?? 'https://via.placeholder.com/150'}" alt="Foto de ${usuario.nombre}">
          <h2>${usuario.nombre}</h2>
          <div class="info">
            <p><strong>DPI:</strong> ${usuario.dpi}</p>
            <p><strong>Correo:</strong> ${usuario.correo}</p>
            <p><strong>Edad:</strong> ${usuario.edad}</p>
            <p><strong>Altura:</strong> ${usuario.altura} m</p>
            <p><strong>Empresa_id:</strong> ${usuario.empresa_id}</p>
          </div>
          <a href="/usuarios">← Volver al listado</a>
        </div>
      </body>
      </html>
    `);
  });
});




app.post("/crearUsuario", (req, res) => {
    const {nombre, dpi, altura, edad, correo, empresa_id} = req.body
    const query = "INSERT INTO usuarios (nombre, dpi, altura, edad, correo, empresa_id) VALUES (?,?,?,?,?,?)"

    conexion.query(query, [nombre, dpi ,altura, edad, correo, empresa_id], (err, resultado) => {
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
        background-image:url(https://images.pexels.com/photos/335887/pexels-photo-335887.jpeg?_gl=1*9xgm1l*_ga*MzIxNTI5OTMyLjE3NTY5MzU3MDk.*_ga_8JE65Q40S6*czE3NTk0NDIxMjckbzUkZzEkdDE3NTk0NDIyMDAkajUxJGwwJGgw);
        background-size :cover;
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