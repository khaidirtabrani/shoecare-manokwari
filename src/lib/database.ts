import * as firebaseDriver from './firebase';
import * as mysqlDriver from './mysqlApi';

const useMySQL = import.meta.env.VITE_DB_DRIVER === 'mysql';
const activeDriver = useMySQL ? mysqlDriver : firebaseDriver;

export const subscribeToOrders = activeDriver.subscribeToOrders;
export const saveOrderToCloud = activeDriver.saveOrderToCloud;
export const updateOrderInCloud = activeDriver.updateOrderInCloud;
export const deleteOrderFromCloud = activeDriver.deleteOrderFromCloud;

export const subscribeToNotifications = activeDriver.subscribeToNotifications;
export const saveNotificationToCloud = activeDriver.saveNotificationToCloud;
export const deleteNotificationFromCloud = activeDriver.deleteNotificationFromCloud;
export const deleteNotificationsFromCloud = activeDriver.deleteNotificationsFromCloud;

export const subscribeToSettings = activeDriver.subscribeToSettings;
export const saveSettingsToCloud = activeDriver.saveSettingsToCloud;

export const subscribeToAdminCredentials = activeDriver.subscribeToAdminCredentials;
export const saveAdminCredentialsToCloud = activeDriver.saveAdminCredentialsToCloud;

export const seedInitialCloudDataIfEmpty = activeDriver.seedInitialCloudDataIfEmpty;

export const subscribeToExpenses = activeDriver.subscribeToExpenses;
export const saveExpenseToCloud = activeDriver.saveExpenseToCloud;
export const deleteExpenseFromCloud = activeDriver.deleteExpenseFromCloud;
export const seedInitialExpensesIfEmpty = activeDriver.seedInitialExpensesIfEmpty;

export const subscribeToCapital = activeDriver.subscribeToCapital;
export const saveCapitalToCloud = activeDriver.saveCapitalToCloud;
export const deleteCapitalFromCloud = activeDriver.deleteCapitalFromCloud;
export const seedInitialCapitalIfEmpty = activeDriver.seedInitialCapitalIfEmpty;
