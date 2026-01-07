// src/services/pouchdbService.js
import PouchDB from "pouchdb-browser";
import PouchDBFind from "pouchdb-find";

PouchDB.plugin(PouchDBFind);

// Initialize local database
export const localDB = new PouchDB("blt_local_db");

// Random ID generator
function generateRandomId() {
  return Math.random().toString(36).substring(2, 11);
}

/**
 * Create database indexes
 */
// export async function createIndexes() {
//   try {
//     await localDB.createIndex({
//       index: { fields: ["type", "createdAt"] }
//     });
    
//     await localDB.createIndex({
//       index: { fields: ["synced"] }
//     });
    
//     await localDB.createIndex({
//       index: { fields: ["type", "synced"] }
//     });

//     console.log("[pouchdbService] ✅ Indexes created");
//   } catch (error) {
//     console.error("[pouchdbService] ❌ Index creation error:", error);
//   }
// }

/**
 * Create database indexes (only if they don't exist)
 */
export async function createIndexes() {
    try {
      // Check if indexes already exist
      const existingIndexes = await localDB.getIndexes();
      
      const hasTypeCreatedAtIndex = existingIndexes.indexes.some(
        idx => idx.def.fields.includes('type') && idx.def.fields.includes('createdAt')
      );
      
      const hasSyncedIndex = existingIndexes.indexes.some(
        idx => idx.def.fields.includes('synced')
      );
      
      const hasTypeSyncedIndex = existingIndexes.indexes.some(
        idx => idx.def.fields.includes('type') && idx.def.fields.includes('synced')
      );
  
      // Only create missing indexes
      if (!hasTypeCreatedAtIndex) {
        await localDB.createIndex({
          index: { fields: ["type", "createdAt"] }
        });
        console.log("[pouchdbService] ✅ Created type+createdAt index");
      }
      
      if (!hasSyncedIndex) {
        await localDB.createIndex({
          index: { fields: ["synced"] }
        });
        console.log("[pouchdbService] ✅ Created synced index");
      }
      
      if (!hasTypeSyncedIndex) {
        await localDB.createIndex({
          index: { fields: ["type", "synced"] }
        });
        console.log("[pouchdbService] ✅ Created type+synced index");
      }
  
      if (hasTypeCreatedAtIndex && hasSyncedIndex && hasTypeSyncedIndex) {
        console.log("[pouchdbService] ✅ All indexes already exist");
      }
  
    } catch (error) {
      console.error("[pouchdbService] ❌ Index creation error:", error);
    }
  }

  /**
 * Mark screenshots as attached to a report
 */
export async function markScreenshotsAttached(screenshotIds, reportId) {
    try {
      const updates = [];
      
      for (const screenshotId of screenshotIds) {
        try {
          const doc = await localDB.get(screenshotId);
          doc.attachedToReport = reportId;
          doc.attachedAt = new Date().toISOString();
          updates.push(doc);
        } catch (error) {
          console.warn('[pouchdbService] Could not find screenshot:', screenshotId);
        }
      }
  
      if (updates.length > 0) {
        await localDB.bulkDocs(updates);
        console.log('[pouchdbService] ✅ Marked screenshots as attached:', updates.length);
      }
    } catch (error) {
      console.error('[pouchdbService] ❌ Error marking screenshots:', error);
    }
  }
  
  /**
   * Get unattached screenshots (for current session)
   */
  export async function getUnattachedScreenshots() {
    try {
      const allScreenshots = await getAllScreenshots();
      
      // Filter out screenshots already attached to reports
      const unattached = allScreenshots.filter(s => !s.attachedToReport);
      
      return unattached;
    } catch (error) {
      console.error('[pouchdbService] ❌ Error fetching unattached screenshots:', error);
      return [];
    }
  }

/**
 * Save report
 */
// export async function saveReport(reportData) {
//   try {
//     const docId = `report:${Date.now()}:${generateRandomId()}`;
    
//     const doc = {
//       _id: docId,
//       type: "report",
//       reporter: reportData.reporter || {},
//       category: reportData.category || "Other",
//       description: reportData.description || "",
//       screenshots: reportData.screenshots || [],
//       logFiles: reportData.logFiles || [],
//       createdAt: reportData.createdAt || new Date().toISOString(),
//       synced: false,
//       metadata: reportData.metadata || {}
//     };

//     console.log('[pouchdbService] Saving report:', {
//         id: reportId,
//         screenshots: doc.screenshots.length,
//         logFiles: doc.logFiles.length,
//         reporter: doc.reporter.fullName
//       });

//     const result = await localDB.put(doc);
//     console.log("[pouchdbService] ✅ Report saved:", result.id);
    
//     return result.id;
//   } catch (error) {
//     console.error("[pouchdbService] ❌ Error saving report:", error);
//     throw error;
//   }
// }

export async function saveReport(reportData) {
    try {
      // 1. Generate ID first
      const reportId = `report:${Date.now()}:${generateShortId()}`;
  
      // 2. Build document
      const doc = {
        _id: reportId,
        type: 'report',
        reporter: reportData.reporter || {},
        category: reportData.category || '',
        description: reportData.description || '',
        screenshots: reportData.screenshots || [],
        logFiles: reportData.logFiles || [], // Include log files
        createdAt: reportData.createdAt || new Date().toISOString(),
        synced: reportData.synced || false,
        metadata: reportData.metadata || {}
      };
  
      console.log('[pouchdbService] Saving report:', {
        id: reportId,
        screenshots: doc.screenshots.length,
        logFiles: doc.logFiles.length
      });
  
      // 3. Save to database
      const result = await localDB.put(doc);
      console.log('[pouchdbService] ✅ Report saved:', result.id);
  
      // 4. Return the ID
      return result.id;
  
    } catch (error) {
      console.error('[pouchdbService] ❌ Error saving report:', error);
      throw error;
    }
  }

function generateShortId() {
    return Math.random().toString(36).substring(2, 11);
  }

/**
 * Get all reports
 */
export async function getAllReports() {
  try {
    const result = await localDB.allDocs({
      include_docs: true,
      startkey: "report:",
      endkey: "report:\uffff"
    });

    const reports = result.rows
      .filter(row => row.doc && row.doc.type === "report")
      .map(row => row.doc)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return reports;
  } catch (error) {
    console.error("[pouchdbService] ❌ Error fetching reports:", error);
    return [];
  }
}

/**
 * Get pending (unsynced) reports
 */
export async function getPendingReports() {
  try {
    const result = await localDB.find({
      selector: {
        type: "report",
        synced: false
      },
      sort: [{ createdAt: "desc" }]
    });

    return result.docs;
  } catch (error) {
    console.error("[pouchdbService] ❌ Error fetching pending reports:", error);
    return [];
  }
}

/**
 * Mark report as synced
 */
export async function markReportSyncedLocal(reportId) {
  try {
    const doc = await localDB.get(reportId);
    doc.synced = true;
    doc.syncedAt = new Date().toISOString();
    
    await localDB.put(doc);
    console.log("[pouchdbService] ✅ Report marked as synced:", reportId);
  } catch (error) {
    console.error("[pouchdbService] ❌ Error marking report as synced:", error);
    throw error;
  }
}

/**
 * Get report by ID
 */
export async function getReportById(reportId) {
  try {
    const doc = await localDB.get(reportId);
    return doc;
  } catch (error) {
    console.error("[pouchdbService] ❌ Error fetching report:", error);
    throw error;
  }
}

/**
 * Update report
 */
export async function updateReport(reportId, updates) {
  try {
    const doc = await localDB.get(reportId);
    const updated = { ...doc, ...updates };
    await localDB.put(updated);
    console.log("[pouchdbService] ✅ Report updated:", reportId);
    return updated;
  } catch (error) {
    console.error("[pouchdbService] ❌ Error updating report:", error);
    throw error;
  }
}

/**
 * Delete report
 */
export async function deleteReport(reportId) {
  try {
    const doc = await localDB.get(reportId);
    await localDB.remove(doc);
    console.log("[pouchdbService] ✅ Report deleted:", reportId);
  } catch (error) {
    console.error("[pouchdbService] ❌ Error deleting report:", error);
    throw error;
  }
}

/**
 * Save screenshot with attachment
 */
export async function saveScreenshotAttachment(metadata, imageData) {
  try {
    // Convert to Blob if needed
    let blob;
    
    if (imageData instanceof Blob || imageData instanceof File) {
      blob = imageData;
    } else if (typeof imageData === 'string') {
      const base64Data = imageData.split(',')[1];
      const mimeType = imageData.match(/data:([^;]+)/)?.[1] || 'image/png';
      
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      blob = new Blob([bytes], { type: mimeType });
    } else {
      throw new Error('Invalid image data format');
    }

    // Generate document ID
    const timestamp = Date.now();
    const randomId = generateRandomId();
    const docId = `screenshot:${timestamp}:${randomId}`;
    
    // Create document
    const doc = {
      _id: docId,
      type: 'screenshot',
      description: metadata.description || 'Screenshot',
      from: metadata.from || 'browser',
      timestamp: metadata.timestamp || timestamp,
      createdAt: new Date().toISOString(),
      position: metadata.position || 0,
      synced: false,
      url: metadata.url || window.location.href,
      _attachments: {
        'image.png': {
          content_type: blob.type || 'image/png',
          data: blob
        }
      }
    };

    const result = await localDB.put(doc);
    console.log("[pouchdbService] ✅ Screenshot saved:", result.id);
    
    return result.id;
  } catch (error) {
    console.error("[pouchdbService] ❌ Error saving screenshot:", error);
    throw error;
  }
}

/**
 * Get all screenshots
 */
export async function getAllScreenshots() {
  try {
    const result = await localDB.allDocs({
      include_docs: true,
      attachments: true,
      binary: true,
      startkey: 'screenshot:',
      endkey: 'screenshot:\uffff'
    });

    const screenshots = result.rows
      .filter(row => row.doc && row.doc.type === 'screenshot')
      .map(row => {
        const doc = row.doc;
        
        if (doc._attachments && doc._attachments['image.png']) {
          const attachment = doc._attachments['image.png'];
          
          if (attachment.data instanceof Blob) {
            doc.blob = attachment.data;
            doc.imageUrl = URL.createObjectURL(attachment.data);
          }
        }
        
        return doc;
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return screenshots;
  } catch (error) {
    console.error("[pouchdbService] ❌ Error fetching screenshots:", error);
    return [];
  }
}

/**
 * Get screenshot by ID
 */
export async function getScreenshotById(screenshotId) {
  try {
    const doc = await localDB.get(screenshotId, {
      attachments: true,
      binary: true
    });

    if (doc._attachments && doc._attachments['image.png']) {
      const attachment = doc._attachments['image.png'];
      
      if (attachment.data instanceof Blob) {
        doc.blob = attachment.data;
        doc.imageUrl = URL.createObjectURL(attachment.data);
      }
    }

    return doc;
  } catch (error) {
    console.error("[pouchdbService] ❌ Error fetching screenshot:", error);
    throw error;
  }
}

/**
 * Delete screenshot
 */
export async function deleteScreenshot(docId) {
  try {
    const doc = await localDB.get(docId);
    await localDB.remove(doc);
    console.log("[pouchdbService] ✅ Screenshot deleted:", docId);
  } catch (error) {
    console.error("[pouchdbService] ❌ Error deleting screenshot:", error);
    throw error;
  }
}

/**
 * Update screenshot
 */
export async function updateScreenshot(docId, updates) {
  try {
    const doc = await localDB.get(docId);
    const updated = { ...doc, ...updates };
    await localDB.put(updated);
    console.log("[pouchdbService] ✅ Screenshot updated:", docId);
    return updated;
  } catch (error) {
    console.error("[pouchdbService] ❌ Error updating screenshot:", error);
    throw error;
  }
}

/**
 * Delete multiple screenshots
 */
export async function deleteScreenshots(docIds) {
  try {
    const docsToDelete = [];
    
    for (const docId of docIds) {
      try {
        const doc = await localDB.get(docId);
        docsToDelete.push({
          _id: doc._id,
          _rev: doc._rev,
          _deleted: true
        });
      } catch (error) {
        console.warn("[pouchdbService] Could not find screenshot to delete:", docId);
      }
    }

    if (docsToDelete.length > 0) {
      await localDB.bulkDocs(docsToDelete);
      console.log("[pouchdbService] ✅ Deleted screenshots:", docsToDelete.length);
    }
  } catch (error) {
    console.error("[pouchdbService] ❌ Error deleting screenshots:", error);
    throw error;
  }
}

/**
 * Get database info
 */
export async function getDatabaseInfo() {
  try {
    const info = await localDB.info();
    return info;
  } catch (error) {
    console.error("[pouchdbService] ❌ Error getting database info:", error);
    throw error;
  }
}

/**
 * Clear all data (dangerous!)
 */
export async function clearAllData() {
  try {
    await localDB.destroy();
    console.log("[pouchdbService] ✅ Database destroyed");
    
    // Recreate the database
    const newDB = new PouchDB("blt_local_db");
    return newDB;
  } catch (error) {
    console.error("[pouchdbService] ❌ Error clearing database:", error);
    throw error;
  }
}