function citasVersionKey(parejaId) {
  return `citas:v:${parejaId}`;
}

function citasListKey(parejaId, version, page, limit) {
  return `citas:list:${parejaId}:v${version}:${page}:${limit}`;
}

function ideasVersionKey(parejaId) {
  return `ideas:v:${parejaId}`;
}

function ideasListKey(parejaId, version) {
  return `ideas:list:${parejaId}:v${version}`;
}

module.exports = { citasVersionKey, citasListKey, ideasVersionKey, ideasListKey };
