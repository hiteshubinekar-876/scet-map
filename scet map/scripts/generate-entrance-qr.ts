import fs from 'fs';
import path from 'path';
import {
  generateQrSvg,
  generateQrPngBuffer,
  decodeQrFromPngBuffer,
  generateEntranceQrUrl,
  getAppBaseUrl,
} from '../lib/qr-generator';

async function main() {
  const publicDir = path.join(process.cwd(), 'public');
  fs.mkdirSync(publicDir, { recursive: true });

  const appBaseUrl = getAppBaseUrl();
  const urlLocal = generateEntranceQrUrl('GATE_MAIN', appBaseUrl);
  const urlProd = generateEntranceQrUrl('GATE_MAIN', 'https://campuspath.edu');

  console.log(`Generating entrance QR codes for:`);
  console.log(` - Local/Configured URL: ${urlLocal}`);
  console.log(` - Production URL:       ${urlProd}\n`);

  // 1. Generate Local / Configured Entrance QR
  const svgLocal = generateQrSvg(urlLocal, { errorCorrectionLevel: 'M', margin: 4 });
  fs.writeFileSync(path.join(publicDir, 'qr-entrance-gate.svg'), svgLocal);

  const pngLocal = await generateQrPngBuffer(urlLocal, {
    errorCorrectionLevel: 'M',
    margin: 4,
    width: 600,
  });
  fs.writeFileSync(path.join(publicDir, 'qr-entrance-gate.png'), pngLocal);

  // 2. Generate Production Entrance QR
  const svgProd = generateQrSvg(urlProd, { errorCorrectionLevel: 'M', margin: 4 });
  fs.writeFileSync(path.join(publicDir, 'qr-entrance-gate-prod.svg'), svgProd);

  const pngProd = await generateQrPngBuffer(urlProd, {
    errorCorrectionLevel: 'M',
    margin: 4,
    width: 600,
  });
  fs.writeFileSync(path.join(publicDir, 'qr-entrance-gate-prod.png'), pngProd);

  // 3. Verify decoding using actual QR decoder library (jsqr)
  const decodedLocal = await decodeQrFromPngBuffer(pngLocal);
  const decodedProd = await decodeQrFromPngBuffer(pngProd);

  console.log(`Verification with actual QR decoder (jsQR):`);
  if (decodedLocal?.data === urlLocal) {
    console.log(` ✓ PASS: qr-entrance-gate.png decodes to exact URL (${decodedLocal.data})`);
  } else {
    console.error(` ✗ FAIL: Local QR failed to decode! Decoded: ${decodedLocal?.data}`);
    process.exit(1);
  }

  if (decodedProd?.data === urlProd) {
    console.log(` ✓ PASS: qr-entrance-gate-prod.png decodes to exact URL (${decodedProd.data})`);
  } else {
    console.error(` ✗ FAIL: Production QR failed to decode! Decoded: ${decodedProd?.data}`);
    process.exit(1);
  }

  console.log('\nAll entrance QR codes (SVG & 600x600 PNG) generated and verified in ./public/');
}

main().catch((err) => {
  console.error('Failed to generate entrance QR assets:', err);
  process.exit(1);
});
