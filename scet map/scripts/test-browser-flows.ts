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

async function runBrowserFlowTests() {
  console.log('Starting Next.js server for HTTP flow verification on port 3002...');
  const server = spawn('npx.cmd', ['next', 'start', '-p', '3002'], {
    shell: true,
    stdio: 'ignore',
  });

  let ready = false;
  for (let i = 0; i < 20; i++) {
    await sleep(1000);
    try {
      const res = await probe('http://localhost:3002/');
      if (res.status === 200) {
        ready = true;
        break;
      }
    } catch {
      // starting
    }
  }

  if (!ready) {
    console.error('Server failed to start within timeout.');
    server.kill();
    process.exit(1);
  }

  console.log('Server online. Running live HTTP delivery tests...\n');

  try {
    let passed = 0;

    // Test 1: Entrance URL with valid node
    const r1 = await probe('http://localhost:3002/?node=GATE_MAIN');
    if (r1.status === 200 && r1.text.includes('CampusPath')) {
      console.log('  ✓ PASS: Flow 1 — Direct entrance URL (?node=GATE_MAIN) delivers HTTP 200 with App Shell');
      passed++;
    } else {
      console.error('  ✗ FAIL: Flow 1 — Failed to deliver entrance page');
    }

    // Test 2: Entrance URL with invalid/custom node
    const r2 = await probe('http://localhost:3002/?node=INVALID_UNKNOWN_XYZ');
    if (r2.status === 200 && r2.text.includes('CampusPath')) {
      console.log('  ✓ PASS: Flow 2 — Direct entrance URL with invalid node delivers HTTP 200 without crashing');
      passed++;
    } else {
      console.error('  ✗ FAIL: Flow 2 — Failed on invalid node parameter');
    }

    // Test 3: Destination verification with exact match parameters
    const r3 = await probe('http://localhost:3002/verify?target=F1_S34&node=F1_S34');
    if (r3.status === 200 && r3.text.includes('CampusPath')) {
      console.log('  ✓ PASS: Flow 3 — Destination verification page delivers HTTP 200 OK');
      passed++;
    } else {
      console.error('  ✗ FAIL: Flow 3 — Failed to deliver verification page');
    }

    // Test 4: Destination verification with target parameter
    const r4 = await probe('http://localhost:3002/verify?target=F1_S34');
    if (r4.status === 200 && r4.text.includes('CampusPath')) {
      console.log('  ✓ PASS: Flow 4 — Destination verification standalone delivers HTTP 200 OK');
      passed++;
    } else {
      console.error('  ✗ FAIL: Flow 4 — Missing destination verification');
    }

    // Test 5: Navigation HUD route display
    const r5 = await probe('http://localhost:3002/navigation?node=GATE_MAIN&to=F1_S34');
    if (r5.status === 200 && r5.text.includes('CampusPath')) {
      console.log('  ✓ PASS: Flow 5 — Navigation HUD delivers HTTP 200 OK');
      passed++;
    } else {
      console.error('  ✗ FAIL: Flow 5 — Navigation HUD delivery failed');
    }

    // Test 6: Admin QR Signage Suite
    const r6 = await probe('http://localhost:3002/admin/qr');
    if (r6.status === 200 && r6.text.includes('QR Signage Management Suite')) {
      console.log('  ✓ PASS: Flow 6 — Admin QR suite delivers HTTP 200 with QR Signage Management Suite markup');
      passed++;
    } else {
      console.error('  ✗ FAIL: Flow 6 — Admin QR suite failed to render');
    }

    // Test 7: Static SVG QR code asset delivery
    const r7 = await probe('http://localhost:3002/qr-entrance-gate.svg');
    if (r7.status === 200 && r7.text.includes('<svg')) {
      console.log('  ✓ PASS: Flow 7 — Static QR SVG asset delivered cleanly with HTTP 200 OK');
      passed++;
    } else {
      console.error('  ✗ FAIL: Flow 7 — Failed to deliver SVG asset');
    }

    console.log(`\nLive HTTP Endpoint Delivery: ${passed}/7 flows PASSED.`);
  } finally {
    if (server.pid) {
      spawn('taskkill', ['/pid', server.pid.toString(), '/T', '/F']);
    }
  }
}

runBrowserFlowTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
