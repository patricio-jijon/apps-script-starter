import { getGmailAliases } from './server/gmail.js';
import { createQueryString, makeQueryString } from './server/http.js';
import { doGet } from './server/webapp.js';
import {
  getAppData,
  getAvailability,
  getDatabaseInfo,
  getStaffAdminData,
  saveSetting,
  saveStaffRecord,
  approveReservation,
  sendReservationReminder,
  installD3AutomationTriggers,
  runD3DailyAutomation,
  submitReservation,
} from './server/fieldTrips.js';

export {
  createQueryString,
  doGet,
  getAppData,
  getAvailability,
  getDatabaseInfo,
  getStaffAdminData,
  getGmailAliases,
  installD3AutomationTriggers,
  makeQueryString,
  runD3DailyAutomation,
  saveSetting,
  saveStaffRecord,
  sendReservationReminder,
  approveReservation,
  submitReservation,
};
