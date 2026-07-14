const path = require('path');
const pool = require('../adapters/postgres/pool');
const { createRedisClients } = require('../adapters/redis/redisClient');

const PgCitaRepository = require('../adapters/postgres/PgCitaRepository');
const PgUserRepository = require('../adapters/postgres/PgUserRepository');
const PgParejaRepository = require('../adapters/postgres/PgParejaRepository');
const PgIdeaCitaRepository = require('../adapters/postgres/PgIdeaCitaRepository');
const PgUnitOfWork = require('../adapters/postgres/PgUnitOfWork');
const NodemailerNotificationAdapter = require('../adapters/email/NodemailerNotificationAdapter');
const LocalFileStorageAdapter = require('../adapters/filesystem/LocalFileStorageAdapter');
const BcryptPasswordHasher = require('../adapters/security/BcryptPasswordHasher');
const JwtTokenService = require('../adapters/security/JwtTokenService');
const RedisCacheAdapter = require('../adapters/redis/RedisCacheAdapter');
const RedisSessionAdapter = require('../adapters/redis/RedisSessionAdapter');
const RedisRateLimiterAdapter = require('../adapters/redis/RedisRateLimiterAdapter');
const RedisPubSubAdapter = require('../adapters/redis/RedisPubSubAdapter');
const { makeAuthMiddleware } = require('../adapters/http/middleware/auth');

const makeRegisterUser = require('../application/auth/RegisterUser');
const makeLoginUser = require('../application/auth/LoginUser');
const makeLogoutUser = require('../application/auth/LogoutUser');
const makeGetPareja = require('../application/pareja/GetPareja');
const makeJoinPareja = require('../application/pareja/JoinPareja');
const makeListCitas = require('../application/citas/ListCitas');
const makeGetCita = require('../application/citas/GetCita');
const makeUpdateCita = require('../application/citas/UpdateCita');
const makeDeleteFoto = require('../application/citas/DeleteFoto');
const makeDeleteCita = require('../application/citas/DeleteCita');
const makeCreateCita = require('../application/citas/CreateCita');
const makeUpsertMiEntrada = require('../application/citas/UpsertMiEntrada');
const makeAddFotosToEntrada = require('../application/citas/AddFotosToEntrada');
const makeCreateIdeaCita = require('../application/ideasCitas/CreateIdeaCita');
const makeListIdeasCitas = require('../application/ideasCitas/ListIdeasCitas');
const makeUpdateIdeaCita = require('../application/ideasCitas/UpdateIdeaCita');
const makeMoveIdeaCita = require('../application/ideasCitas/MoveIdeaCita');
const makeDeleteIdeaCita = require('../application/ideasCitas/DeleteIdeaCita');
const { entryBodySchema } = require('../adapters/http/schemas/citas.schemas');

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

function buildContainer() {
  const citaRepository = new PgCitaRepository(pool);
  const userRepository = new PgUserRepository(pool);
  const parejaRepository = new PgParejaRepository(pool);
  const ideaCitaRepository = new PgIdeaCitaRepository(pool);
  const unitOfWork = new PgUnitOfWork(pool);
  const notificationPort = new NodemailerNotificationAdapter();
  const fileStorage = new LocalFileStorageAdapter({ rootDir: path.join(__dirname, '..', '..') });
  const passwordHasher = new BcryptPasswordHasher();
  const tokenService = new JwtTokenService({ secret: process.env.JWT_SECRET, expiresIn: '30d' });

  const { main: redisMain, subscriber: redisSubscriber } = createRedisClients(process.env.REDIS_URL);
  const cachePort = new RedisCacheAdapter(redisMain);
  const sessionPort = new RedisSessionAdapter(redisMain);
  const rateLimiterPort = new RedisRateLimiterAdapter(redisMain);
  const pubSubPort = new RedisPubSubAdapter(redisMain, redisSubscriber);

  const { requireAuth, authenticate } = makeAuthMiddleware({ tokenService, sessionPort });

  return {
    useCases: {
      registerUser: makeRegisterUser({
        userRepository,
        unitOfWork,
        passwordHasher,
        tokenService,
        sessionPort,
        sessionTtlSeconds: SESSION_TTL_SECONDS,
      }),
      loginUser: makeLoginUser({
        userRepository,
        passwordHasher,
        tokenService,
        sessionPort,
        sessionTtlSeconds: SESSION_TTL_SECONDS,
      }),
      logoutUser: makeLogoutUser({ sessionPort }),
      getPareja: makeGetPareja({ parejaRepository, userRepository }),
      joinPareja: makeJoinPareja({
        userRepository,
        parejaRepository,
        citaRepository,
        ideaCitaRepository,
        tokenService,
        sessionPort,
        sessionTtlSeconds: SESSION_TTL_SECONDS,
      }),
      listCitas: makeListCitas({ citaRepository, cachePort }),
      getCita: makeGetCita({ citaRepository }),
      updateCita: makeUpdateCita({ citaRepository, cachePort }),
      deleteFoto: makeDeleteFoto({ citaRepository, fileStorage, cachePort }),
      deleteCita: makeDeleteCita({ citaRepository, fileStorage, cachePort }),
      createCita: makeCreateCita({
        citaRepository,
        unitOfWork,
        fileStorage,
        userRepository,
        notificationPort,
        cachePort,
      }),
      upsertMiEntrada: makeUpsertMiEntrada({
        citaRepository,
        fileStorage,
        userRepository,
        notificationPort,
        entryBodySchema,
        cachePort,
      }),
      addFotosToEntrada: makeAddFotosToEntrada({ citaRepository, fileStorage, cachePort }),
      createIdeaCita: makeCreateIdeaCita({ ideaCitaRepository, cachePort, pubSubPort }),
      listIdeasCitas: makeListIdeasCitas({ ideaCitaRepository, cachePort }),
      updateIdeaCita: makeUpdateIdeaCita({ ideaCitaRepository, cachePort, pubSubPort }),
      moveIdeaCita: makeMoveIdeaCita({ ideaCitaRepository, unitOfWork, cachePort, pubSubPort }),
      deleteIdeaCita: makeDeleteIdeaCita({ ideaCitaRepository, cachePort, pubSubPort }),
    },
    repositories: { citaRepository, userRepository, parejaRepository, ideaCitaRepository },
    fileStorage,
    notificationPort,
    requireAuth,
    authenticate,
    rateLimiterPort,
    pubSubPort,
  };
}

module.exports = { buildContainer };
