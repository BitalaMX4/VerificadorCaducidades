//Funciones con intervalos de tiempo para verificar las conexiones a las apis
import Service from "../service/service.js";

const service = new Service();

const URL_API = "http://hidalgo.no-ip.info:5610/CaducidadAlmacenes/Controllers/apiback.php";
const URL_LOCAL = "http://192.168.16.154/Caducidad_Almacenesh/Controllers/apiback.php";

export default class Request {

  async obtenerLotes(idferrum) {

    const formData = new FormData();
    formData.append("opcion", "11");
    formData.append("idferrum", idferrum);

    try {
      let response = await service.fetchApi(URL_API, formData);

      if (typeof response.data !== "string") {
        //Hecho
        return response.data;
      } else {
        // Lanzar un error 500
        throw { status: response.status, message: response.statusText };
      }
    } catch (error) {
      // Capturar y lanzar errores con el código de estado y el mensaje apropiados
      throw { status: error.status || 500, message: error.message ?? 'Internal Server Error' };
    }
  }

  async editarCantidadLotes(jsonObjects) {

    const formData = new FormData();
    formData.append("opcion", "10");
    formData.append("json", jsonObjects);

    try {
      let response = await service.fetchApi(URL_API, formData);

      if (response.data == "exito") {
        //Hecho
        return response.data;
      } else {
        // Lanzar un error 500
        throw { status: response.status, message: response.statusText };
      }
    } catch (error) {
      // Capturar y lanzar errores con el código de estado y el mensaje apropiados
      throw { status: error.status || 500, message: error.message || 'Internal Server Error' };
    }
  }

}
