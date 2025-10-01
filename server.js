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
        if (err)
            res.status(500).send("Error al insertar los datos del usuario")
        else
            res.send("Usuarios agregado correctamente")
    })
})

app.listen( port, () => {
    console.log(`server corriendo en http://localhost:${port}`)
}
)