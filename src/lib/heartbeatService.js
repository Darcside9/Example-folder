// ============================================================================
// CHRIS SHOPPER — HEARTBEAT & DATABASE KEEP-ALIVE CLIENT SERVICE
// Manages Appwrite database activity status, tracking, and manual triggers
// ============================================================================

import { databases, functions, APPWRITE_CONFIG } from './appwrite';

const COLLECTION_ID = 'system_heartbeat';
const DOC_ID = 'appwrite_keepalive_heartbeat';

/**
 * Formats an ISO date string into a friendly relative time (e.g. "5 mins ago")
 */
export function formatRelativeTime(dateString) {
  if (!dateString) return 'Never';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Never';
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSec < 45) return 'Just now';
    if (diffSec < 90) return '1 minute ago';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} minutes ago`;
    if (diffSec < 7200) return '1 hour ago';
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hours ago`;
    if (diffSec < 172800) return 'Yesterday';
    return `${Math.floor(diffSec / 86400)} days ago`;
  } catch {
    return dateString;
  }
}

/**
 * Formats an ISO date string into a readable full date string
 */
export function formatDateTime(dateString) {
  if (!dateString) return 'Not available';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Not available';
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  } catch {
    return dateString;
  }
}

/**
 * Fetches the current database heartbeat document from Appwrite Cloud
 */
export async function fetchHeartbeatStatus() {
  try {
    const doc = await databases.getDocument(APPWRITE_CONFIG.databaseId, COLLECTION_ID, DOC_ID);
    return {
      success: true,
      lastPing: doc.last_ping || doc.$updatedAt,
      pingCount: Number(doc.ping_count || 0),
      source: doc.source || 'appwrite_cron',
      status: doc.status || 'healthy',
      updatedAt: doc.$updatedAt,
      createdAt: doc.$createdAt,
      metadata: doc.metadata ? (typeof doc.metadata === 'string' ? JSON.parse(doc.metadata) : doc.metadata) : null
    };
  } catch (err) {
    console.warn('[HeartbeatService] fetchHeartbeatStatus note:', err.message);
    return {
      success: false,
      error: err.message,
      lastPing: null,
      pingCount: 0,
      source: 'unknown',
      status: 'unreachable'
    };
  }
}

/**
 * Triggers an immediate keep-alive heartbeat ping via Appwrite Serverless Function
 * with fallback to direct database document update
 */
export async function triggerHeartbeatPing(source = 'admin_manual') {
  const startTime = Date.now();
  let executedViaFunction = false;

  // Attempt 1: Call serverless function (log-dispenser) with action 'keep_alive'
  try {
    const execution = await functions.createExecution(
      APPWRITE_CONFIG.functionId,
      JSON.stringify({ action: 'keep_alive', source }),
      false // synchronous
    );

    if (execution && execution.responseBody) {
      const parsed = JSON.parse(execution.responseBody);
      if (parsed.success) {
        executedViaFunction = true;
        return {
          success: true,
          method: 'serverless_function',
          durationMs: Date.now() - startTime,
          lastPing: parsed.lastPing,
          pingCount: parsed.pingCount,
          source: parsed.source,
          status: parsed.status
        };
      }
    }
  } catch (fnErr) {
    console.warn('[HeartbeatService] Function invocation fallback note:', fnErr.message);
  }

  // Attempt 2: Direct Database mutation fallback
  try {
    let currentDoc = null;
    try {
      currentDoc = await databases.getDocument(APPWRITE_CONFIG.databaseId, COLLECTION_ID, DOC_ID);
    } catch {}

    const nextCount = currentDoc ? (Number(currentDoc.ping_count || 0) + 1) : 1;
    const nowIso = new Date().toISOString();
    const payload = {
      last_ping: nowIso,
      ping_count: nextCount,
      source,
      status: 'healthy',
      metadata: JSON.stringify({ triggeredBy: 'client_service', durationMs: Date.now() - startTime })
    };

    if (currentDoc) {
      await databases.updateDocument(APPWRITE_CONFIG.databaseId, COLLECTION_ID, DOC_ID, payload);
    } else {
      await databases.createDocument(APPWRITE_CONFIG.databaseId, COLLECTION_ID, DOC_ID, payload);
    }

    return {
      success: true,
      method: 'database_direct',
      durationMs: Date.now() - startTime,
      lastPing: nowIso,
      pingCount: nextCount,
      source,
      status: 'healthy'
    };
  } catch (dbErr) {
    return {
      success: false,
      error: dbErr.message,
      durationMs: Date.now() - startTime
    };
  }
}
