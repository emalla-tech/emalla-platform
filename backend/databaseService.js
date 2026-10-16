import {
  ensureDb,
  readDb,
  readProducts,
  createProductRecord,
  updateProductRecord,
  deleteProductRecord,
  readOrders,
  readMerchantWalletData,
  readUserSessions,
  updateMerchantSettings,
  readUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteUserNotification,
  readCheckoutData,
  readManualPaymentData,
  readPublicInsightsData,
  readAdminStatsData,
  readAdminOperationsData,
  saveAccountUser,
  saveAdminSettings,
  saveInquiry,
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
  createProduct: (payload) => createProductRecord(payload),
  updateProduct: (payload) => updateProductRecord(payload),
  deleteProduct: (payload) => deleteProductRecord(payload),
  readOrders: () => readOrders(),
  readMerchantWallet: (merchantId) => readMerchantWalletData(merchantId),
  readUserSessions: (userId) => readUserSessions(userId),
  updateMerchantSettings: (payload) => updateMerchantSettings(payload),
  readUserNotifications: (userId, role) => readUserNotifications(userId, role),
  markNotificationRead: (payload) => markNotificationRead(payload),
  markAllNotificationsRead: (userId) => markAllNotificationsRead(userId),
  deleteUserNotification: (payload) => deleteUserNotification(payload),
  readCheckoutData: (options) => readCheckoutData(options),
  readManualPaymentData: (options) => readManualPaymentData(options),
  readPublicInsightsData: () => readPublicInsightsData(),
  readAdminStatsData: () => readAdminStatsData(),
  readAdminOperationsData: () => readAdminOperationsData(),
  saveAccountUser: (user) => saveAccountUser(user),
  saveAdminSettings: (settings) => saveAdminSettings(settings),
  saveInquiry: (inquiry) => saveInquiry(inquiry),
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
export const createProductRecordInDatabase = (payload) => databaseService.createProduct(payload);
export const updateProductRecordInDatabase = (payload) => databaseService.updateProduct(payload);
export const deleteProductRecordInDatabase = (payload) => databaseService.deleteProduct(payload);
export const readOrderRecords = () => databaseService.readOrders();
export const readMerchantWalletSnapshot = (merchantId) => databaseService.readMerchantWallet(merchantId);
export const readUserSessionRecords = (userId) => databaseService.readUserSessions(userId);
export const updateMerchantSettingsRecord = (payload) => databaseService.updateMerchantSettings(payload);
export const readUserNotificationRecords = (userId, role) => databaseService.readUserNotifications(userId, role);
export const markNotificationReadRecord = (payload) => databaseService.markNotificationRead(payload);
export const markAllNotificationsReadRecords = (userId) => databaseService.markAllNotificationsRead(userId);
export const deleteUserNotificationRecord = (payload) => databaseService.deleteUserNotification(payload);
export const readCheckoutSnapshot = (options) => databaseService.readCheckoutData(options);
export const readManualPaymentSnapshot = (options) => databaseService.readManualPaymentData(options);
export const readPublicInsightsRecords = () => databaseService.readPublicInsightsData();
export const readAdminStatsRecords = () => databaseService.readAdminStatsData();
export const readAdminOperationsRecords = () => databaseService.readAdminOperationsData();
export const saveAccountUserRecord = (user) => databaseService.saveAccountUser(user);
export const saveAdminSettingsRecord = (settings) => databaseService.saveAdminSettings(settings);
export const saveInquiryRecord = (inquiry) => databaseService.saveInquiry(inquiry);
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
