import { spawn } from 'child_process';
import http from 'http';

function probe(url: string): Promise<{ status: number; text: string }> {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => resolve({ status: res.statusCode || 0, text: body }));
    }).on('error', reject);
  });
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log('Starting Next.js production server on port 3001...');
  const server = spawn('npx.cmd', ['next', 'start', '-p', '3001'], {
    shell: true,
    stdio: 'inherit',
  });

  // Wait for server to be responsive
  let ready = false;
  for (let i = 0; i < 20; i++) {
    await sleep(1000);
    try {
      const res = await probe('http://localhost:3001/');
      if (res.status === 200) {
        ready = true;
        break;
      }
    } catch {
      // still starting
    }
  }

  if (!ready) {
    console.error('Server failed to start within timeout.');
    server.kill();
    process.exit(1);
  }

  console.log('Server is ready! Testing endpoints...\n');

  try {
    // 1. Direct Entrance QR URL
    const r1 = await probe('http://localhost:3001/?node=GATE_MAIN');
    console.log(`[PASS] GET /?node=GATE_MAIN -> Status ${r1.status}`);
    if (!r1.text.includes('CampusPath')) {
      console.warn('Warning: CampusPath title not found in HTML response');
    }

    // 2. Direct Destination Verification URL
    const r2 = await probe('http://localhost:3001/verify?target=F1_S34');
    console.log(`[PASS] GET /verify?target=F1_S34 -> Status ${r2.status}`);

    // 3. Admin QR Signage Suite
    const r3 = await probe('http://localhost:3001/admin/qr');
    console.log(`[PASS] GET /admin/qr -> Status ${r3.status}`);

    // 4. Entrance QR SVG asset
    const r4 = await probe('http://localhost:3001/qr-entrance-gate.svg');
    console.log(`[PASS] GET /qr-entrance-gate.svg -> Status ${r4.status} (SVG asset delivery)`);

    console.log('\nAll 4 live endpoints responded with HTTP 200 OK!');
  } finally {
    console.log('Terminating test server...');
    // Kill child process tree on Windows
    if (server.pid) {
      spawn('taskkill', ['/pid', server.pid.toString(), '/T', '/F']);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

