import express from "express"
import mysql from "mysql2"

const app = express()
const port = 3500

app.use(express.json())

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

app.get("/", (req, res) => {
    res.send("Servidor funcionando correctamente")
})

app.get("/usuarios", (req, res) => {
    const query = "SELECT * FROM usuarios"
    conexion.query(query, (err, resultado) => {
        if (err)
            res.status(500).send("Error al obtener los usarios")
        else
            res.json(resultado)
    })
})

app.post("/usuarios", (req, res) => {
    const {nombre, edad, altura, correo, empresa_id} = req.body
    const query = "INSERT INTO usuarios (nombre, edad, altura, correo, empresa_id) VALUES (?,?,?,?,?)"

    conexion.query(query, [nombre, edad, altura, correo, empresa_id], (err, resultado) => {
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