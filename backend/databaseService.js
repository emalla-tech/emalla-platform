import {
  ensureDb,
  readDb,
  readProducts,
  readOrders,
  readCheckoutData,
  readPublicInsightsData,
  readAdminStatsData,
  readAdminRidersData,
  readRiderDashboardData,
  readStaffUsers,
  updateStaffUser,
  saveAuditLog,
  readAuthUserByIdentity,
  findLatestSellerApplicationByEmail,
  findLatestRiderApplicationByEmail,
  createAuthUser,
  saveSellerApplication,
  saveRiderApplication,
  persistAuthLogin,
  readAuthUserByToken,
  touchSessionByToken,
  deleteAuthToken,
  deleteAuthSessionById,
  deleteAuthTokensByUserId,
  persistCheckoutBundle,
  writeDb,
  getDatabaseStatus
} from './dbProvider.js';

let snapshotWriteQueue = Promise.resolve();

const queueSnapshotMutation = (mutator) => {
  snapshotWriteQueue = snapshotWriteQueue
    .catch(() => {})
    .then(async () => {
      const snapshot = await readDb();
      const updatedSnapshot = await mutator(snapshot);
      const nextSnapshot = updatedSnapshot ?? snapshot;
      await writeDb(nextSnapshot);
      return nextSnapshot;
    });

  return snapshotWriteQueue;
};

export const databaseService = {
  ensureReady: () => ensureDb(),
  getStatus: () => getDatabaseStatus(),
  readSnapshot: () => readDb(),
  readProducts: () => readProducts(),
  readOrders: () => readOrders(),
  readCheckoutData: (options) => readCheckoutData(options),
  readPublicInsightsData: () => readPublicInsightsData(),
  readAdminStatsData: () => readAdminStatsData(),
  readAdminRidersData: () => readAdminRidersData(),
  readRiderDashboardData: (userId) => readRiderDashboardData(userId),
  readStaffUsers: () => readStaffUsers(),
  updateStaffUser: (payload) => updateStaffUser(payload),
  saveAuditLog: (entry) => saveAuditLog(entry),
  readAuthUserByIdentity: (identity) => readAuthUserByIdentity(identity),
  findLatestSellerApplicationByEmail: (email) => findLatestSellerApplicationByEmail(email),
  findLatestRiderApplicationByEmail: (email) => findLatestRiderApplicationByEmail(email),
  createAuthUser: (user) => createAuthUser(user),
  saveSellerApplication: (application) => saveSellerApplication(application),
  saveRiderApplication: (application) => saveRiderApplication(application),
  persistAuthLogin: (payload) => persistAuthLogin(payload),
  readAuthUserByToken: (token) => readAuthUserByToken(token),
  touchSessionByToken: (token, timestamp) => touchSessionByToken(token, timestamp),
  deleteAuthToken: (token) => deleteAuthToken(token),
  deleteAuthSessionById: (sessionId) => deleteAuthSessionById(sessionId),
  deleteAuthTokensByUserId: (userId) => deleteAuthTokensByUserId(userId),
  persistCheckoutBundle: (bundle) => persistCheckoutBundle(bundle),
  writeSnapshot: (snapshot) => writeDb(snapshot),
  updateSnapshot: (mutator) => queueSnapshotMutation(mutator)
};

export const ensureDatabaseReady = () => databaseService.ensureReady();
export const getDatabaseServiceStatus = () => databaseService.getStatus();
export const readDatabaseSnapshot = () => databaseService.readSnapshot();
export const readProductRecords = () => databaseService.readProducts();
export const readOrderRecords = () => databaseService.readOrders();
export const readCheckoutSnapshot = (options) => databaseService.readCheckoutData(options);
export const readPublicInsightsRecords = () => databaseService.readPublicInsightsData();
export const readAdminStatsRecords = () => databaseService.readAdminStatsData();
export const readAdminRiderRecords = () => databaseService.readAdminRidersData();
export const readRiderDashboardRecords = (userId) => databaseService.readRiderDashboardData(userId);
export const readStaffUserRecords = () => databaseService.readStaffUsers();
export const updateStaffUserRecord = (payload) => databaseService.updateStaffUser(payload);
export const persistAuditLogRecord = (entry) => databaseService.saveAuditLog(entry);
export const readAuthUserRecordByIdentity = (identity) => databaseService.readAuthUserByIdentity(identity);
export const findLatestSellerApplicationRecordByEmail = (email) => databaseService.findLatestSellerApplicationByEmail(email);
export const findLatestRiderApplicationRecordByEmail = (email) => databaseService.findLatestRiderApplicationByEmail(email);
export const createAuthUserRecord = (user) => databaseService.createAuthUser(user);
export const saveSellerApplicationRecord = (application) => databaseService.saveSellerApplication(application);
export const saveRiderApplicationRecord = (application) => databaseService.saveRiderApplication(application);
export const persistAuthLoginRecord = (payload) => databaseService.persistAuthLogin(payload);
export const readAuthUserRecordByToken = (token) => databaseService.readAuthUserByToken(token);
export const touchAuthSessionByToken = (token, timestamp) => databaseService.touchSessionByToken(token, timestamp);
export const deleteAuthTokenRecord = (token) => databaseService.deleteAuthToken(token);
export const deleteAuthSessionRecordById = (sessionId) => databaseService.deleteAuthSessionById(sessionId);
export const deleteAuthTokensForUser = (userId) => databaseService.deleteAuthTokensByUserId(userId);
export const persistCheckoutBundleRecord = (bundle) => databaseService.persistCheckoutBundle(bundle);
export const writeDatabaseSnapshot = (snapshot) => databaseService.writeSnapshot(snapshot);
export const updateDatabaseSnapshot = (mutator) => databaseService.updateSnapshot(mutator);
