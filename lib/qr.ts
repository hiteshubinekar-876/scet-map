import { Node, getNode } from './graph';
import { getAppBaseUrl } from './qr-generator';

export type QrVerificationStatus =
  | 'MATCH'
  | 'MISMATCH'
  | 'UNKNOWN_SCANNED'
  | 'INVALID_FORMAT'
  | 'NO_TARGET';

export type QrVerificationResult = {
  status: QrVerificationStatus;
  scannedId: string | null;
  targetId: string | null;
  scannedNode?: Node;
  targetNode?: Node;
  message: string;
};

/**
 * Extract clean permanent node ID from any supported QR format.
 * Supports:
 *  - Raw ID string: "GATE_MAIN" or "F1_S34"
 *  - Query parameters: "https://campuspath.edu/?node=GATE_MAIN" or "?s=GATE_MAIN"
 *  - Target and Node params: "https://campuspath.edu/verify?target=F1_S34&node=F1_S34"
 *  - Path-based URLs: "https://campuspath.edu/verify/F1_S34" or "/start/GATE_MAIN"
 */
export function parseQrPayload(raw: string, defaultOrigin = 'http://localhost:3000'): string | null {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // 1. Direct alphanumeric ID check (e.g. "GATE", "GATE_MAIN", "F1_S34")
  if (/^[A-Za-z0-9_-]{2,40}$/.test(trimmed) && !trimmed.includes('/') && !trimmed.includes('?')) {
    return trimmed;
  }

  // 1b. Support JSON-encoded payload if formatted as JSON object
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const obj = JSON.parse(trimmed);
      const val = obj.node || obj.node_id || obj.nodeId || obj.target || obj.destination || obj.id;
      if (typeof val === 'string' && /^[A-Za-z0-9_-]+$/.test(val.trim())) {
        return val.trim();
      }
    } catch {
      // Continue to URL parsing
    }
  }

  // 2. Parse as URL
  try {
    const url = new URL(trimmed, defaultOrigin);

    // Check query params: node, legacy s, target (used in /verify?target=ID), destination, or to
    const paramNode =
      url.searchParams.get('node') ||
      url.searchParams.get('s') ||
      url.searchParams.get('target') ||
      url.searchParams.get('destination') ||
      url.searchParams.get('to') ||
      url.searchParams.get('room');
    if (paramNode && /^[A-Za-z0-9_-]+$/.test(paramNode.trim())) {
      return paramNode.trim();
    }

    // Check path segments (e.g. /verify/F1_S34 or /start/GATE)
    const segments = url.pathname.split('/').filter(Boolean);
    if (segments.length >= 2 && (segments[0] === 'verify' || segments[0] === 'start')) {
      const candidate = decodeURIComponent(segments[1]).trim();
      if (/^[A-Za-z0-9_-]+$/.test(candidate)) return candidate;
    }

    // Fallback: check if the final segment of pathname looks like a node ID
    if (segments.length > 0) {
      const last = decodeURIComponent(segments[segments.length - 1]).trim();
      if (/^[A-Za-z0-9_-]+$/.test(last) && last !== 'verify' && last !== 'start') {
        return last;
      }
    }
  } catch {
    // If URL parsing fails, test raw string after stripping whitespace
    const cleaned = trimmed.replace(/^https?:\/\/[^/]+/i, '').replace(/^[/?#]+/, '');
    if (/^[A-Za-z0-9_-]+$/.test(cleaned)) {
      return cleaned;
    }
  }

  return null;
}

/**
 * Generate standard URL strings for generating physical QR signage stickers
 */
export function buildQrSignageUrl(
  nodeId: string,
  type: 'gate' | 'checkpoint' | 'destination',
  baseUrl = getAppBaseUrl()
): string {
  const cleanId = encodeURIComponent(nodeId.trim());
  if (type === 'gate' || type === 'checkpoint') {
    return `${baseUrl}/?node=${cleanId}`;
  }
  // Destination room QR: encodes both target and current node
  return `${baseUrl}/verify?target=${cleanId}&node=${cleanId}`;
}

/**
 * Compare scanned QR payload against expected navigation destination.
 */
export function verifyDestinationQr(
  rawScanned: string,
  expectedTargetId: string,
  graphNodes: Node[]
): QrVerificationResult {
  if (!expectedTargetId) {
    return {
      status: 'NO_TARGET',
      scannedId: null,
      targetId: null,
      message: 'No destination room selected for verification. Please select a room first.',
    };
  }

  const scannedId = parseQrPayload(rawScanned);
  if (!scannedId) {
    return {
      status: 'INVALID_FORMAT',
      scannedId: null,
      targetId: expectedTargetId,
      message: 'Unrecognized QR code format. Please scan an authentic CampusPath signage code.',
    };
  }

  const scannedNode = getNode(scannedId, graphNodes);
  const targetNode = getNode(expectedTargetId, graphNodes);

  if (!scannedNode) {
    return {
      status: 'UNKNOWN_SCANNED',
      scannedId,
      targetId: expectedTargetId,
      targetNode,
      message: `Scanned checkpoint "${scannedId}" is not part of this campus floor plan.`,
    };
  }

  // Exact match confirmation (checks direct ID match or canonical node equivalence)
  const isMatch =
    scannedId === expectedTargetId ||
    (Boolean(scannedNode && targetNode) && scannedNode?.id === targetNode?.id);

  if (isMatch) {
    return {
      status: 'MATCH',
      scannedId,
      targetId: expectedTargetId,
      scannedNode,
      targetNode,
      message: 'Congratulations! You have reached your destination.',
    };
  }

  // Mismatch detected: user is at a different known campus node
  return {
    status: 'MISMATCH',
    scannedId,
    targetId: expectedTargetId,
    scannedNode,
    targetNode,
    message: 'Wrong destination. Please check your classroom.',
  };
}

