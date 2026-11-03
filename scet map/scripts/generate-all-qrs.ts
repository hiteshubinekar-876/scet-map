import fs from 'fs';
import path from 'path';
import { nodes } from '../lib/graph';
import {
  buildCampusSignageDirectory,
  generateQrSvg,
  generateQrPngBuffer,
  decodeQrFromPngBuffer,
  getAppBaseUrl,
} from '../lib/qr-generator';

async function main() {
  const qrCodesDir = path.join(process.cwd(), 'public', 'qr-codes');
  fs.mkdirSync(qrCodesDir, { recursive: true });

  const baseUrl = getAppBaseUrl();
  const directory = buildCampusSignageDirectory(nodes, baseUrl);

  console.log(`====================================================`);
  console.log(` CampusPath — Generate All Campus QR Codes`);
  console.log(` Base Application URL: ${baseUrl}`);
  console.log(` Total Checkpoints to Generate: ${directory.length}`);
  console.log(` Output Directory: ./public/qr-codes/`);
  console.log(`====================================================\n`);

  const manifest: Array<{
    nodeId: string;
    name: string;
    floor: number;
    category: string;
    url: string;
    instructions: string;
    pngFile: string;
    svgFile: string;
  }> = [];

  let successCount = 0;

  for (const item of directory) {
    const filenameSafe = item.nodeId.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    const svgFilename = `${filenameSafe}.svg`;
    const pngFilename = `${filenameSafe}.png`;

    const svgPath = path.join(qrCodesDir, svgFilename);
    const pngPath = path.join(qrCodesDir, pngFilename);

    // 1. Generate SVG
    const svgMarkup = generateQrSvg(item.url, { errorCorrectionLevel: 'M', margin: 4 });
    fs.writeFileSync(svgPath, svgMarkup, 'utf8');

    // 2. Generate High-Res 600x600 PNG
    const pngBuffer = await generateQrPngBuffer(item.url, {
      errorCorrectionLevel: 'M',
      margin: 4,
      width: 600,
    });
    fs.writeFileSync(pngPath, pngBuffer);

    // 3. Automated Decoder Verification (jsQR)
    const decoded = await decodeQrFromPngBuffer(pngBuffer);
    if (!decoded || decoded.data !== item.url) {
      console.error(`✗ FAIL: ${item.nodeId} failed to decode correctly!`);
      console.error(`  Expected: ${item.url}`);
      console.error(`  Decoded:  ${decoded?.data}`);
      process.exit(1);
    }

    console.log(`✓ [Floor ${item.floor}] ${item.nodeId.padEnd(14)} (${item.category.padEnd(10)}) -> ${svgFilename} & ${pngFilename}`);
    successCount++;

    manifest.push({
      nodeId: item.nodeId,
      name: item.name,
      floor: item.floor,
      category: item.category,
      url: item.url,
      instructions: item.instructions,
      pngFile: `/qr-codes/${pngFilename}`,
      svgFile: `/qr-codes/${svgFilename}`,
    });
  }

  // Write manifest file
  const manifestPath = path.join(qrCodesDir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

  console.log(`\n====================================================`);
  console.log(` All ${successCount}/${directory.length} QR Codes Successfully Generated & Verified!`);
  console.log(` Manifest written to: ./public/qr-codes/manifest.json`);
  console.log(`====================================================`);
}

main().catch((err) => {
  console.error('Failed to generate all QR codes:', err);
  process.exit(1);
});

