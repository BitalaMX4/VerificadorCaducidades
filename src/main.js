import express from "express";
import routes from './route/routes.js'


const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(routes);

app.use((req,res,next)=>{
    res.status(404).json({
        message: 'Ruta no encontrada'
    })
})

app.listen(3004, () => {
    console.log("server ejecutandose en el puerto: 3004");
});
