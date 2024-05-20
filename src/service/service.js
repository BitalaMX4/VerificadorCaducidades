import axios from 'axios';

export default class Service {
    async fetchApi(url) {
        try {
            const response = await axios.post(url, null, {
                headers: {
                    'Content-Type': 'multipart/form-data' 
                }
            });
            // Devuelve un objeto con el estado y el mensaje del estado
            return {
                status: response.status,
                statusText: response.statusText,
                data: response.data
            };
        } catch (error) {
            // Si hay un error, devolver un objeto con el estado y el mensaje de error
            if (error.response) {
                return {
                    status: error.response.status,
                    statusText: error.response.statusText,
                    data: error.response.data
                };
            } else {
                // Si el error es de red u otro tipo, devolver un estado genérico y el mensaje de error
                return {
                    status: 500,
                    statusText: 'Internal Server Error',
                    data: `error_conex ${error.message}`
                };
            }
        }
    }
}
