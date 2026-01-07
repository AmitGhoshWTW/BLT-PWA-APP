// src/services/logFileService.js
import { localDB } from './pouchdbService';

/**
 * Save log file as attachment to PouchDB
 */
export async function saveLogFileAttachment(file, metadata = {}) {
  try {
    console.log('[LogFileService] Saving log file:', file.name);

    const docId = `logfile:${Date.now()}:${generateShortId()}`;

    const doc = {
      _id: docId,
      type: 'logfile',
      filename: file.name,
      filesize: file.size,
      filetype: file.type || 'text/plain',
      uploadedAt: new Date().toISOString(),
      metadata: {
        originalPath: metadata.originalPath || '',
        description: metadata.description || '',
        ...metadata
      },
      _attachments: {
        [file.name]: {
          content_type: file.type || 'text/plain',
          data: file
        }
      }
    };

    const result = await localDB.put(doc);
    console.log('[LogFileService] ✅ Log file saved:', result.id);

    return result.id;
  } catch (error) {
    console.error('[LogFileService] ❌ Error saving log file:', error);
    throw error;
  }
}

/**
 * Get log file with attachment
 */
export async function getLogFileById(logfileId) {
  try {
    const doc = await localDB.get(logfileId, {
      attachments: true,
      binary: true
    });

    return doc;
  } catch (error) {
    console.error('[LogFileService] Error getting log file:', error);
    throw error;
  }
}

/**
 * Get all log files
 */
export async function getAllLogFiles() {
  try {
    const result = await localDB.allDocs({
      include_docs: true,
      attachments: true,
      binary: true,
      startkey: 'logfile:',
      endkey: 'logfile:\uffff'
    });

    return result.rows.map(row => row.doc);
  } catch (error) {
    console.error('[LogFileService] Error getting log files:', error);
    return [];
  }
}

/**
 * Delete log file
 */
export async function deleteLogFile(logfileId) {
  try {
    const doc = await localDB.get(logfileId);
    await localDB.remove(doc);
    console.log('[LogFileService] ✅ Log file deleted:', logfileId);
  } catch (error) {
    console.error('[LogFileService] Error deleting log file:', error);
    throw error;
  }
}

/**
 * Download log file content
 */
export async function downloadLogFile(logfileId) {
  try {
    const doc = await getLogFileById(logfileId);
    
    // Get the first attachment
    const attachmentName = Object.keys(doc._attachments)[0];
    const attachment = doc._attachments[attachmentName];
    
    if (attachment.data instanceof Blob) {
      return {
        filename: doc.filename,
        blob: attachment.data,
        content_type: attachment.content_type
      };
    }
    
    throw new Error('No blob data found');
  } catch (error) {
    console.error('[LogFileService] Error downloading log file:', error);
    throw error;
  }
}

/**
 * Generate short ID
 */
function generateShortId() {
  return Math.random().toString(36).substring(2, 11);
}