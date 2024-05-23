import { query } from "express";
import { conexion } from "../model/conexion.js";
import Request from "../request/request.js";
import jwt from "jsonwebtoken";

const secret = process.env.SECRET || "BITALA4";
const request = new Request();

export const getToken = async (req, res) => {
  try {
    const { sub, name } = req.body;

    const token = jwt.sign(
      {
        sub,
        name,
        exp: Math.floor(Date.now() / 1000) + 60 * 3,
      },
      secret
    );
    res.json({ token });
  } catch (error) {
    res.status(401).send({ error: error.message });
  }
};

export const getInventory = async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];

    if (token !== "BITALA4") {
      throw { status: 401, message: "Unauthorized" };
    }

    const { id_ferrum, cantidad, unidad, tipo } = req.body;
    const response = await request.obtenerLotes(id_ferrum);
    const fechaActual = new Date();

    // Llamada a las funciones refactorizadas
    const lotesProximosACaducar = encontrarVencimientosCercanos(
      response,
      id_ferrum,
      unidad,
      fechaActual
    );
    const { jsonUpdate, noLotesString } = calcularCantidadesYJsonUpdate(
      lotesProximosACaducar,
      cantidad
    );

    console.log(jsonUpdate);

    const responseUpdate = await request.editarCantidadLotes(
      JSON.stringify(jsonUpdate)
    );

    console.log("Respuesta update:", responseUpdate);

    res.status(200).send(noLotesString);
  } catch (error) {
    res
      .status(error.status || 500)
      .send(error.message || "Internal Server Error");
  }
};

// Función para encontrar las 4 o menos fechas de caducidad más próximas segùn la cantidad (recursiva)
const encontrarVencimientosCercanos = (
  data,
  id_ferrum,
  unidad,
  fechaActual,
  indexActual = 0,
  lotes = []
) => {
  try {
    const convertToDate = (dateString) => new Date(dateString);

    if (indexActual >= data.length) {
      return lotes;
    }

    const item = data[indexActual];
    const currentDate = convertToDate(item["fecha_caducidad"]);

    if (
      item["id_productoferrum"].toString() === id_ferrum.toString() &&
      item["unidad"].toString() === unidad &&
      parseFloat(item["cantidad"]) > 0
    ) {
      if (lotes.length < 4) {
        lotes.push(item);
      } else {
        let maxDiffIndex = 0;
        let maxDiff = Math.abs(
          convertToDate(lotes[0]["fecha_caducidad"]) - fechaActual
        );

        for (let j = 1; j < 4; j++) {
          const diff = Math.abs(
            convertToDate(lotes[j]["fecha_caducidad"]) - fechaActual
          );
          if (diff > maxDiff) {
            maxDiff = diff;
            maxDiffIndex = j;
          }
        }

        if (Math.abs(currentDate - fechaActual) < maxDiff) {
          lotes[maxDiffIndex] = item;
        }
      }

      lotes.sort(
        (a, b) =>
          Math.abs(convertToDate(a["fecha_caducidad"]) - fechaActual) -
          Math.abs(convertToDate(b["fecha_caducidad"]) - fechaActual)
      );
    }

    return encontrarVencimientosCercanos(
      data,
      id_ferrum,
      unidad,
      fechaActual,
      indexActual + 1,
      lotes
    );
  } catch (error) {
    throw { status: 500, message: "Error al encontrar vencimientos cercanos" };
  }
};

// Función para calcular las cantidades y preparar el objeto jsonUpdate
const calcularCantidadesYJsonUpdate = (lotesProximosACaducar, cantidad) => {
  try {
    const lotes = [];
    const cantidadBuffer = [];
    let sum = 0;
    let faltantes = 0;

    if (lotesProximosACaducar.length > 0) {
      for (const lote of lotesProximosACaducar) {
        lotes.push(lote);
        cantidadBuffer.push(parseFloat(lote["cantidad"]));

        sum = cantidadBuffer.reduce(
          (accumulator, currentValue) => accumulator + currentValue,
          0
        );

        if (sum >= parseFloat(cantidad)) {
          faltantes = 0;
          break;
        } else {
          faltantes = cantidad - sum;
        }
      }
    } else {
      faltantes = cantidad;
    }

    const idsRegistros =
      lotes.length > 0 ? lotes.map((lote) => lote.idregistro_productos) : "0";
    const cantidadesRegistros =
      lotes.length > 0 ? lotes.map((lote) => parseFloat(lote.cantidad)) : "0";

    const cantidades = [];
    let bufferCantidades = cantidad;
    let jsonUpdate = {};

    for (let i = 0; i < cantidadesRegistros.length; i++) {
      if (bufferCantidades - cantidadesRegistros[i] >= 0) {
        cantidades.push(0);
        // jsonUpdate.push({
        //   id_registro: idsRegistros[i],
        //   cantidad: cantidades[i],
        // });

        jsonUpdate[`${idsRegistros[i]}`] = cantidades[i];
      } else {
        cantidades.push(Math.abs(bufferCantidades - cantidadesRegistros[i]));
        // jsonUpdate.push({
        //   id_registro: idsRegistros[i],
        //   cantidad: cantidades[i],
        // });

        jsonUpdate[`${idsRegistros[i]}`] = cantidades[i];
      }
      bufferCantidades -= cantidadesRegistros[i];
    }

    const noLotesString =
      lotes.length > 0 ? lotes.map((lote) => lote.n_lote).join(", ") : "0";

    return { jsonUpdate, noLotesString };
  } catch (error) {
    throw { status: 500, message: "Error al encontrar las cantidades" };
  }
};

export const test = async (req, res) => {
  // Inicialización de variables
  let piezasSolicitadas = 0,
    piezasDisponibles = 0;

  const { cantidadSolicitada, unidad, piezasPorCaja } = req.body;

  // Cantidad de stock en cajas
  const cajasDisponibles = 30;

  // Conversión a medias cajas
  const piezasPorMediaCaja = piezasPorCaja / 2;

  // Convertir las cantidades a piezas (solo con CJ y MC)
  if (unidad !== "PZ") {
    piezasSolicitadas = cantidadSolicitada * piezasPorCaja;
    piezasDisponibles = cajasDisponibles * piezasPorCaja;
  } else {
    piezasSolicitadas = cantidadSolicitada;
    piezasDisponibles = cajasDisponibles * piezasPorCaja;
  }

  // Verificar si hay suficiente stock
  if (piezasDisponibles < piezasSolicitadas) {
    const message = "No hay suficiente stock para cumplir con el pedido";
    res.status(200).send(message);
    return message;
  }

  // Inicialización de variables para la distribución
  let cajasCompletas = 0;
  let piezasFaltantes = 0;
  let mediasCajas = 0;
  let stockRestante = 0;

  // Calcular la distribución en cajas, medias cajas y piezas
  switch (unidad) {
    case "CJ":
      cajasCompletas = Math.floor(piezasSolicitadas / piezasPorCaja);
      piezasFaltantes = piezasSolicitadas % piezasPorCaja;
      mediasCajas = Math.floor(piezasFaltantes / piezasPorMediaCaja);
      piezasFaltantes = piezasFaltantes % piezasPorMediaCaja;
      break;
    case "MC":
      mediasCajas = Math.floor(piezasSolicitadas / piezasPorMediaCaja);
      piezasFaltantes = piezasSolicitadas % piezasPorMediaCaja;
      break;
    case "PZ":
      cajasCompletas = Math.floor(piezasSolicitadas / piezasPorCaja);
      piezasFaltantes = piezasSolicitadas % piezasPorCaja;
      mediasCajas = Math.floor(piezasFaltantes / piezasPorMediaCaja);
      piezasFaltantes = piezasFaltantes % piezasPorMediaCaja;
      break;
  }

  // Calcular el stock restante
  if (unidad !== "PZ") {
    stockRestante = cajasDisponibles - cantidadSolicitada;
  } else {
    stockRestante = cajasDisponibles - cajasCompletas + mediasCajas / 2;
  }

  // Registro de resultados
  console.log(
    "cajasCompletas::", cajasCompletas,
    "\nmediasCajas::", mediasCajas,
    "\npiezasFaltantes:::", piezasFaltantes,
    "\nstock restante (CJ):::", stockRestante,
    "\nPiezas por caja:::", piezasPorCaja
  );

  // Crear la respuesta
  const respuesta = {
    cajasCompletas,
    mediasCajas,
    piezasFaltantes,
    stockOriginal: cajasDisponibles,
    stockRestante,
  };

  // Enviar la respuesta
  res.status(200).send(respuesta);
};
