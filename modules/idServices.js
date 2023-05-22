const crypto = require('crypto');

function checkIfIdExists(id, dataBase) {
  const club = dataBase.find((obj) => obj.id === id);
  return !!club;
}

function generateId(dataBase) {
  let id;
  do {
    const bytes = crypto.randomBytes(4);
    id = bytes.readUInt32BE(0).toString();
  } while (checkIfIdExists(id, dataBase));
  return parseInt(id); // return a unique id
}

module.exports = { generateId };
