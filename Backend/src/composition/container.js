const path = require('path');
const pool = require('../adapters/postgres/pool');

const PgCitaRepository = require('../adapters/postgres/PgCitaRepository');
const PgUserRepository = require('../adapters/postgres/PgUserRepository');
const PgParejaRepository = require('../adapters/postgres/PgParejaRepository');
const PgUnitOfWork = require('../adapters/postgres/PgUnitOfWork');
const NodemailerNotificationAdapter = require('../adapters/email/NodemailerNotificationAdapter');
const LocalFileStorageAdapter = require('../adapters/filesystem/LocalFileStorageAdapter');
const BcryptPasswordHasher = require('../adapters/security/BcryptPasswordHasher');
const JwtTokenService = require('../adapters/security/JwtTokenService');

const makeRegisterUser = require('../application/auth/RegisterUser');
const makeLoginUser = require('../application/auth/LoginUser');
const makeGetPareja = require('../application/pareja/GetPareja');
const makeListCitas = require('../application/citas/ListCitas');
const makeGetCita = require('../application/citas/GetCita');
const makeUpdateCita = require('../application/citas/UpdateCita');
const makeDeleteFoto = require('../application/citas/DeleteFoto');
const makeDeleteCita = require('../application/citas/DeleteCita');
const makeCreateCita = require('../application/citas/CreateCita');
const makeUpsertMiEntrada = require('../application/citas/UpsertMiEntrada');
const makeAddFotosToEntrada = require('../application/citas/AddFotosToEntrada');
const { entryBodySchema } = require('../adapters/http/schemas/citas.schemas');

function buildContainer() {
  const citaRepository = new PgCitaRepository(pool);
  const userRepository = new PgUserRepository(pool);
  const parejaRepository = new PgParejaRepository(pool);
  const unitOfWork = new PgUnitOfWork(pool);
  const notificationPort = new NodemailerNotificationAdapter();
  const fileStorage = new LocalFileStorageAdapter({ rootDir: path.join(__dirname, '..', '..') });
  const passwordHasher = new BcryptPasswordHasher();
  const tokenService = new JwtTokenService({ secret: process.env.JWT_SECRET, expiresIn: '30d' });

  return {
    useCases: {
      registerUser: makeRegisterUser({ userRepository, unitOfWork, passwordHasher, tokenService }),
      loginUser: makeLoginUser({ userRepository, passwordHasher, tokenService }),
      getPareja: makeGetPareja({ parejaRepository, userRepository }),
      listCitas: makeListCitas({ citaRepository }),
      getCita: makeGetCita({ citaRepository }),
      updateCita: makeUpdateCita({ citaRepository }),
      deleteFoto: makeDeleteFoto({ citaRepository, fileStorage }),
      deleteCita: makeDeleteCita({ citaRepository, fileStorage }),
      createCita: makeCreateCita({ citaRepository, unitOfWork, fileStorage, userRepository, notificationPort }),
      upsertMiEntrada: makeUpsertMiEntrada({
        citaRepository,
        fileStorage,
        userRepository,
        notificationPort,
        entryBodySchema,
      }),
      addFotosToEntrada: makeAddFotosToEntrada({ citaRepository, fileStorage }),
    },
    repositories: { citaRepository, userRepository, parejaRepository },
    fileStorage,
    notificationPort,
  };
}

module.exports = { buildContainer };
