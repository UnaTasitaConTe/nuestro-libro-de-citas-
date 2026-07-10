// MAX_FOTOS_POR_REQUEST es solo documental: hoy se aplica vía multer.array('fotos', 6)
// en la capa HTTP, y NO es un límite acumulado por entry (se puede superar subiendo
// fotos en varias requests). No convertir esto en una regla de dominio acumulativa.
const MAX_FOTOS_POR_REQUEST = 6;

const CitaEntry = {
  MAX_FOTOS_POR_REQUEST,

  nextOrden(maxOrden) {
    return maxOrden + 1;
  },
};

module.exports = CitaEntry;
