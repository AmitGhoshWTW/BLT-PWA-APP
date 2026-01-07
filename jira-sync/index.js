// jira-sync/index.js
const express = require("express");
const Nano = require("nano");
const axios = require("axios");

const COUCH_URL = process.env.COUCH_URL || "http://admin:adminpassword@localhost:5984";
const DB_NAME = process.env.DB_NAME || "blt_remote_db";

const nano = Nano(COUCH_URL);
const db = nano.db.use(DB_NAME);

const app = express();
app.use(express.json());

async function createJiraTicket(report) {
  // Placeholder: replace this with your real Jira REST API call (with auth)
  // Example return { key: 'BLT-123', url: 'https://jira/...' }
  console.log("Creating JIRA ticket for report:", report._id);
  await new Promise((res) => setTimeout(res, 1000)); // simulate delay
  return { key: "POC-1234", url: "https://example.atlassian.net/browse/POC-1234" };
}

async function processChange(change) {
  try {
    const doc = await db.get(change.id, { attachments: false });
    if (!doc || doc.type !== "report") return;

    // If already synced, skip
    if (doc.synced) return;

    // call createJiraTicket (replace with your Jira logic)
    const jiraInfo = await createJiraTicket(doc);

    // attach jira info & mark synced
    doc.synced = true;
    doc.status = "synced";
    doc.jira = jiraInfo;
    doc.syncedAt = new Date().toISOString();

    await db.insert(doc);
    console.log("Report updated with Jira info:", doc._id, jiraInfo);
  } catch (err) {
    console.error("Process change error:", err);
  }
}

async function listenChanges() {
    console.log("Listening to CouchDB changes (long-poll mode)…");
  
    // Always track the last sequence so we don’t re-process docs
    let since = "now";
  
    while (true) {
      try {
        const url = `${COUCH_URL}/${DB_NAME}/_changes?feed=longpoll&since=${since}&include_docs=false&timeout=60000`;
  
        const response = await axios.get(url, {
          auth: {
            username: "admin",
            password: "adminpassword"
          },
          timeout: 65000
        });
  
        const data = response.data;
  
        if (data.results && data.results.length > 0) {
          for (const change of data.results) {
            await processChange(change);
          }
        }
  
        // Update last sequence
        if (data.last_seq) {
          since = data.last_seq;
        }
  
      } catch (err) {
        console.error("Change feed error:", err.message);
        // Wait before retry
        await new Promise((res) => setTimeout(res, 5000));
      }
    }
  }
  

app.get("/health", (req, res) => res.json({ ok: true }));

const port = process.env.PORT || 4000;
// app.listen(port, () => {
//   console.log(`Jira-sync service listening on ${port}`);
//   listenChanges();
// });

app.listen(port, () => {
    console.log(`Jira-sync service listening on ${port}`);
    listenChanges();
  });
  
