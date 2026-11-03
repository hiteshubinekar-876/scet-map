/**
 * CampusPath Standards-Compliant QR Code Generation & Verification Engine
 * Built on industry-standard ISO/IEC 18004 specification via 'qrcode'.
 * Supports high-resolution SVG and PNG (>= 600x600) generation with
 * minimum 4-module quiet zone, Error Correction Level M/Q, and pure black-on-white contrast.
 */

import QRCode, { QRCodeErrorCorrectionLevel } from 'qrcode';
import { Node } from './graph';

export type CheckpointCategory =
  | 'entrance'
  | 'floor_entrance'
  | 'junction'
  | 'stair_lift'
  | 'classroom'
  | 'lab'
  | 'office'
  | 'restroom';

export type QrSignageMetadata = {
  nodeId: string;
  name: string;
  floor: number;
  category: CheckpointCategory;
  url: string;
  instructions: string;
};

export interface QrGeneratorOptions {
  errorCorrectionLevel?: 'M' | 'Q' | 'L' | 'H';
  margin?: number; // Minimum 4 modules per ISO/IEC 18004
}

export interface QrPngOptions extends QrGeneratorOptions {
  width?: number; // Minimum 600px
}

/**
 * Resolve the application base URL without inventing or hardcoding production domains.
 * Priority:
 * 1. Process environment (NEXT_PUBLIC_APP_URL, NEXT_PUBLIC_BASE_URL, APP_URL)
 * 2. Active browser window origin (when running in client)
 * 3. Default local development origin (http://localhost:3000)
 */
export function getAppBaseUrl(): string {
  const envUrl =
    (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_APP_URL) ||
    (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_BASE_URL) ||
    (typeof process !== 'undefined' && process.env.APP_URL);

  if (envUrl && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, '');
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin.replace(/\/+$/, '');
  }

  return 'http://localhost:3000';
}

/**
 * Generate standard entrance QR destination URL.
 * Preserves the exact contract: BASE_URL/?node=GATE_MAIN
 */
export function generateEntranceQrUrl(
  nodeId = 'GATE_MAIN',
  baseUrl = getAppBaseUrl()
): string {
  const cleanId = encodeURIComponent(nodeId.trim());
  const cleanBase = baseUrl.replace(/\/+$/, '');
  return `${cleanBase}/?node=${cleanId}`;
}

/**
 * Generate standard destination room QR URL for in-app verification.
 * Contract: BASE_URL/verify?target=ID&node=ID
 */
export function generateDestinationQrUrl(
  nodeId: string,
  baseUrl = getAppBaseUrl()
): string {
  const cleanId = encodeURIComponent(nodeId.trim());
  const cleanBase = baseUrl.replace(/\/+$/, '');
  return `${cleanBase}/verify?target=${cleanId}&node=${cleanId}`;
}

/**
 * Generate standards-compliant SVG markup synchronously using QRCode.create.
 * - Minimum quiet zone: 4 modules
 * - Pure black (#000000) modules on pure white (#ffffff) background
 * - Default error correction level: M (15% recovery)
 */
export function generateQrSvg(
  text: string,
  optionsOrModuleSize?: QrGeneratorOptions | number,
  maybeMargin?: number
): string {
  let level: QRCodeErrorCorrectionLevel = 'M';
  let margin = 4;

  if (typeof optionsOrModuleSize === 'object' && optionsOrModuleSize !== null) {
    level = optionsOrModuleSize.errorCorrectionLevel || 'M';
    margin = Math.max(4, optionsOrModuleSize.margin ?? 4);
  } else if (typeof maybeMargin === 'number') {
    margin = Math.max(4, maybeMargin);
  }

  const qr = QRCode.create(text, { errorCorrectionLevel: level });
  const moduleCount = qr.modules.size;
  const totalSize = moduleCount + margin * 2;

  let pathData = '';
  for (let r = 0; r < moduleCount; r++) {
    for (let c = 0; c < moduleCount; c++) {
      if (qr.modules.get(r, c)) {
        const x = c + margin;
        const y = r + margin;
        pathData += `M${x},${y}h1v1h-1z `;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalSize} ${totalSize}" width="100%" height="100%" shape-rendering="crispEdges">
  <rect width="${totalSize}" height="${totalSize}" fill="#ffffff"/>
  <path d="${pathData.trim()}" fill="#000000"/>
</svg>`;
}

/**
 * Generate standards-compliant SVG markup asynchronously.
 */
export async function generateQrSvgAsync(
  text: string,
  options?: QrGeneratorOptions
): Promise<string> {
  const level: QRCodeErrorCorrectionLevel = options?.errorCorrectionLevel || 'M';
  const margin = Math.max(4, options?.margin ?? 4);

  return QRCode.toString(text, {
    type: 'svg',
    errorCorrectionLevel: level,
    margin,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  });
}

/**
 * Generate high-resolution PNG image Buffer (minimum 600x600).
 * Compatible with server-side exports, file saving, and automated test decoding.
 */
export async function generateQrPngBuffer(
  text: string,
  options?: QrPngOptions
): Promise<Buffer> {
  const level: QRCodeErrorCorrectionLevel = options?.errorCorrectionLevel || 'M';
  const margin = Math.max(4, options?.margin ?? 4);
  const width = Math.max(600, options?.width ?? 600);

  return QRCode.toBuffer(text, {
    type: 'png',
    errorCorrectionLevel: level,
    margin,
    width,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  });
}

/**
 * Generate high-resolution PNG Data URL (minimum 600x600).
 * Suitable for direct <img> src embedding.
 */
export async function generateQrPngDataUrl(
  text: string,
  options?: QrPngOptions
): Promise<string> {
  const level: QRCodeErrorCorrectionLevel = options?.errorCorrectionLevel || 'M';
  const margin = Math.max(4, options?.margin ?? 4);
  const width = Math.max(600, options?.width ?? 600);

  return QRCode.toDataURL(text, {
    errorCorrectionLevel: level,
    margin,
    width,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  });
}

/**
 * Actual QR code decoder using 'pngjs' and 'jsqr'.
 * Decodes the raw pixel data from a PNG buffer and extracts the encoded text payload.
 */
export async function decodeQrFromPngBuffer(
  buffer: Buffer
): Promise<{ data: string; version: number } | null> {
  const { PNG } = await import('pngjs');
  const jsQR = (await import('jsqr')).default;

  const png = PNG.sync.read(buffer);
  const result = jsQR(new Uint8ClampedArray(png.data), png.width, png.height);

  if (!result) return null;

  return {
    data: result.data,
    version: result.version,
  };
}

/**
 * Categorize a node for QR signage generation
 */
export function categorizeNode(node: Node): CheckpointCategory {
  if (node.type === 'gate') return 'entrance';
  if (node.type === 'stairs' || node.type === 'lift') return 'stair_lift';
  if (node.type === 'junction') return 'junction';
  if (node.type === 'lab') return 'lab';
  if (node.type === 'office') return 'office';
  if (node.type === 'restroom') return 'restroom';
  return 'classroom';
}

/**
 * Build complete signage metadata for all nodes in the campus graph
 */
export function buildCampusSignageDirectory(
  nodes: Node[],
  baseUrl = getAppBaseUrl()
): QrSignageMetadata[] {
  return nodes.map((node) => {
    const category = categorizeNode(node);
    let url = generateEntranceQrUrl(node.id, baseUrl);
    let instructions =
      'Scan with your normal phone camera to open CampusPath directly and set your starting location.';

    if (
      category === 'classroom' ||
      category === 'lab' ||
      category === 'office' ||
      category === 'restroom'
    ) {
      // Destination room QR: encodes target room ID for verification
      url = generateDestinationQrUrl(node.id, baseUrl);
      instructions =
        'Scan with the in-app camera scanner upon arrival outside this location to verify your destination.';
    } else if (category === 'junction') {
      instructions =
        'Scan with phone camera at this corridor junction to reset your starting position.';
    } else if (category === 'stair_lift') {
      instructions =
        'Scan with phone camera to open website and route from this floor transition.';
    }

    return {
      nodeId: node.id,
      name: node.name,
      floor: node.floor,
      category,
      url,
      instructions,
    };
  });
}
