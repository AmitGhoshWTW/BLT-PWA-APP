// src/services/jiraService.js
// PouchDB-aware Jira helper (placeholder implementation).
// It fetches report docs and their attachments and simulates sending to Jira.
// Replace `createJiraTicket` with your real Jira integration (OAuth/basic with attachments).
import axios from "axios";
import { localDB, getPendingReports,  markReportSyncedLocal, getAllScreenshots } from "./pouchdbService";

/**
 * Placeholder: createJiraTicket
 * - Accepts reportData and attachments array of Blob
 * - Implement real Jira API call here
 */
async function createJiraTicket(report, attachments = []) {
  // Simulate network delay
  await new Promise((res) => setTimeout(res, 800));
  // Return fake JIRA info
  return { key: `POC-${Math.floor(Math.random() * 9000) + 1000}`, url: "https://example.atlassian.net/browse/POC-1234" };
}

/**
 * Build attachments array by fetching attachments from CouchDB localDB
 * Each attachment is { name, blob, contentType }
 */
async function fetchAttachmentsForReport(report) {
  const list = [];
  if (!report.captures || !report.captures.length) return list;

  for (const capId of report.captures) {
    try {
      const blob = await localDB.getAttachment(capId, "screenshot.png");
      list.push({
        id: capId,
        name: `${capId}.png`,
        blob
      });
    } catch (err) {
      console.warn("Missing attachment for", capId, err);
    }
  }
  return list;
}

// Send a single report to Jira and mark it synced
export async function sendReportToJira(report) {
  try {
    const attachments = await fetchAttachmentsForReport(report);
    const jiraInfo = await createJiraTicket(report, attachments);

    // Mark local as synced with Jira info
    await markReportSyncedLocal(report._id, jiraInfo);
    return { ok: true, jiraInfo };
  } catch (err) {
    console.error("sendReportToJira error", err);
    return { ok: false, error: err };
  }
}

// Bulk send (used by UI)
export async function sendBulkToJira(reports) {
  const results = [];
  for (const r of reports) {
    const res = await sendReportToJira(r);
    results.push({ id: r._id || r.id, res });
  }
  return results;
}

// Automatic worker: send all pending
export async function syncPendingToJira() {
  const pending = await getPendingReports();
  for (const p of pending) {
    await sendReportToJira(p);
  }
}

export default {
  sendReportToJira,
  sendBulkToJira,
  syncPendingToJira
};
