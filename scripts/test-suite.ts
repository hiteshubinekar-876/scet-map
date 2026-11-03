import { checkSupabaseHealth, isSupabaseConfigured } from '../lib/supabase';
import { fetchCampusData } from '../lib/database';
import {
  nodes,
  edges,
  getNode,
  edgeBetween,
  getRouteDistance,
  shortestPath,
  Node,
  Edge,
} from '../lib/graph';
import { buildRouteDetails } from '../lib/navigation';
import { parseQrPayload, buildQrSignageUrl, verifyDestinationQr } from '../lib/qr';
import {
  buildCampusSignageDirectory,
  generateQrSvg,
  generateQrPngBuffer,
  decodeQrFromPngBuffer,
  generateEntranceQrUrl,
  generateDestinationQrUrl,
  getAppBaseUrl,
} from '../lib/qr-generator';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail = '') {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName} - ${detail}`);
    failed++;
  }
}

async function runAllTests() {
  console.log('====================================================');
  console.log(' CampusPath — Comprehensive Automated Test Suite');
  console.log('====================================================\n');

  // ==========================================================================
  // [Suite 1: Database & Supabase Resilient Layer]
  // ==========================================================================
  console.log('[Suite 1: Database & Supabase Resilient Layer]');
  console.log(`  Supabase configured: ${isSupabaseConfigured}`);
  const health = await checkSupabaseHealth();
  assert(typeof health.connected === 'boolean', 'Health check returns status boolean', health.message);
  console.log(`  Health message: "${health.message}"`);

  const campusData = await fetchCampusData();
  assert(campusData.nodes.length > 0, 'Dataset contains valid nodes', `Count: ${campusData.nodes.length}`);
  assert(campusData.edges.length > 0, 'Dataset contains valid edges', `Count: ${campusData.edges.length}`);
  assert(campusData.floors.length >= 3, 'Dataset contains multi-floor records', `Floors: ${campusData.floors.length}`);
  assert(campusData.places.length > 0, 'Dataset contains searchable places', `Places: ${campusData.places.length}`);
  assert(campusData.source === 'database' || campusData.source === 'demo', 'Dataset source correctly identified', campusData.source);

  // Security check: ensure no service-role secrets in client environment
  const serviceKeyCheck = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  assert(!serviceKeyCheck, 'No Supabase service-role keys exposed in process environment');

  // ==========================================================================
  // [Suite 2: Graph & Topological Integrity]
  // ==========================================================================
  console.log('\n[Suite 2: Graph & Topological Integrity]');
  let allEdgesValid = true;
  for (const e of edges) {
    const aNode = getNode(e.a);
    const bNode = getNode(e.b);
    if (!aNode || !bNode || e.distance <= 0) {
      allEdgesValid = false;
      break;
    }
  }
  assert(allEdgesValid, 'All edges connect valid nodes with positive distance');

  const mainGate = getNode('GATE');
  assert(Boolean(mainGate && mainGate.floor === 0), 'Ground entrance checkpoint (GATE) exists on Floor 0');

  const roomS34 = getNode('F1_S34');
  assert(Boolean(roomS34 && roomS34.floor === 1), 'First floor target (F1_S34) exists on Floor 1');

  // Alias lookup tests
  assert(getNode('S34')?.id === 'F1_S34', 'Alias "S34" correctly resolves to "F1_S34"');
  assert(getNode('ROOM_S34')?.id === 'F1_S34', 'Alias "ROOM_S34" correctly resolves to "F1_S34"');
  assert(getNode('F16')?.id === 'G_F16', 'Alias "F16" correctly resolves to "G_F16"');
  assert(getNode('201')?.id === 'F2_LAB', 'Alias "201" correctly resolves to "F2_LAB"');
  assert(getNode('NON_EXISTENT_XYZ') === undefined, 'Non-existent node lookup returns undefined');

  // edgeBetween normalization
  const normEdge = edgeBetween('S34', 'F1_J1');
  assert(Boolean(normEdge && normEdge.distance > 0), 'edgeBetween normalizes node aliases');

  // ==========================================================================
  // [Suite 3: Dijkstra Pathfinding Engine — 18 Scenarios & Benchmarks]
  // ==========================================================================
  console.log('\n[Suite 3: Dijkstra Pathfinding Engine]');

  // 1. Same-floor route
  const sameFloorPath = shortestPath('GATE_MAIN', 'G_F16', false);
  assert(
    sameFloorPath.length >= 2 && sameFloorPath[0] === 'GATE_MAIN' && sameFloorPath.at(-1) === 'G_F16',
    'Scenario 1: Same-floor navigation (GATE_MAIN -> G_F16)'
  );

  // 2. Multi-floor route (Floor 0 -> Floor 1)
  const multiFloorPath1 = shortestPath('GATE_MAIN', 'F1_S34', false);
  assert(
    multiFloorPath1.includes('G_STAIRS') && multiFloorPath1.includes('F1_STAIRS'),
    'Scenario 2: Multi-floor navigation (Floor 0 -> Floor 1) traverses stairs'
  );

  // 3. Multi-floor route (Floor 0 -> Floor 2)
  const multiFloorPath2 = shortestPath('GATE_MAIN', 'F2_LAB', false);
  assert(
    multiFloorPath2.includes('F1_STAIRS') && multiFloorPath2.includes('F2_STAIRS'),
    'Scenario 3: Multi-floor navigation (Floor 0 -> Floor 2) traverses intermediate Floor 1 landing'
  );

  // 4. Direct shortest path distance check
  const pathDist = getRouteDistance(multiFloorPath1);
  assert(pathDist > 0 && pathDist < 100, `Scenario 4: Direct shortest path calculated (${pathDist}m)`);

  // 5. Alternative path when shortest edge is removed
  const edgesWithoutMainCorridor = edges.filter(
    (e) => !(e.a === 'GATE_MAIN' && e.b === 'G_J1') && !(e.a === 'G_J1' && e.b === 'GATE_MAIN')
  );
  const altPath = shortestPath('GATE_MAIN', 'G_F16', false, nodes, edgesWithoutMainCorridor);
  assert(
    altPath.length > 0 && altPath.includes('G_CORR_WEST'),
    'Scenario 5: Alternative path found when direct corridor edge is blocked'
  );

  // 6. Unreachable destination in disconnected graph
  const disconnectedNodes: Node[] = [
    { id: 'ISLAND_A', floor: 0, name: 'Island A', x: 0, y: 0, type: 'junction', accessible: true },
    { id: 'ISLAND_B', floor: 0, name: 'Island B', x: 10, y: 10, type: 'room', accessible: true },
  ];
  const unreachablePath = shortestPath('ISLAND_A', 'ISLAND_B', false, disconnectedNodes, []);
  assert(unreachablePath.length === 0, 'Scenario 6: Unreachable destination returns empty path');

  // 7. Invalid source node
  assert(shortestPath('INVALID_SRC', 'G_F16').length === 0, 'Scenario 7: Invalid source node returns empty path');

  // 8. Invalid destination node
  assert(shortestPath('GATE_MAIN', 'INVALID_DEST').length === 0, 'Scenario 8: Invalid destination node returns empty path');

  // 9. Missing source node (empty string)
  assert(shortestPath('', 'G_F16').length === 0, 'Scenario 9: Empty source node returns empty path');

  // 10. Missing destination node (empty string)
  assert(shortestPath('GATE_MAIN', '').length === 0, 'Scenario 10: Empty destination node returns empty path');

  // 11. Start equals Destination
  const sameNodePath = shortestPath('GATE_MAIN', 'GATE_MAIN');
  assert(sameNodePath.length === 1 && sameNodePath[0] === 'GATE_MAIN', 'Scenario 11: Start == Destination returns single-node path');

  // 12. Start equals Destination with alias (e.g. S34 -> F1_S34)
  const aliasSamePath = shortestPath('S34', 'F1_S34');
  assert(aliasSamePath.length === 1 && aliasSamePath[0] === 'F1_S34', 'Scenario 12: Start alias == Destination canonical ID returns single-node path');

  // 13. Shortest path with alias destination (GATE_MAIN -> 'S34')
  const aliasDestPath = shortestPath('GATE_MAIN', 'S34');
  assert(aliasDestPath.length > 2 && aliasDestPath.at(-1) === 'F1_S34', 'Scenario 13: Alias destination resolves and completes path (GATE_MAIN -> S34)');

  // 14. Shortest path with alias source ('S34' -> GATE_MAIN)
  const aliasSrcPath = shortestPath('S34', 'GATE_MAIN');
  assert(aliasSrcPath.length > 2 && aliasSrcPath[0] === 'F1_S34', 'Scenario 14: Alias source resolves and completes reverse path (S34 -> GATE_MAIN)');

  // 15. Duplicate edge handling
  const duplicateEdges: Edge[] = [
    { a: 'NODE_X', b: 'NODE_Y', distance: 50, type: 'walk', accessible: true },
    { a: 'NODE_X', b: 'NODE_Y', distance: 20, type: 'walk', accessible: true }, // shorter duplicate
  ];
  const testNodes: Node[] = [
    { id: 'NODE_X', floor: 0, name: 'X', x: 0, y: 0, type: 'junction', accessible: true },
    { id: 'NODE_Y', floor: 0, name: 'Y', x: 10, y: 0, type: 'room', accessible: true },
  ];
  const dupPath = shortestPath('NODE_X', 'NODE_Y', false, testNodes, duplicateEdges);
  assert(dupPath.length === 2, 'Scenario 15: Duplicate edges safely handled without failure');

  // 16. Negative edge distance guard
  const negativeEdges: Edge[] = [
    { a: 'NODE_X', b: 'NODE_Y', distance: -10, type: 'walk', accessible: true },
  ];
  const negPath = shortestPath('NODE_X', 'NODE_Y', false, testNodes, negativeEdges);
  assert(negPath.length === 0, 'Scenario 16: Negative edge distance safely ignored without infinite loop');

  // 17. Accessibility mode: Lift enabled route vs. stairs
  const accessiblePath = shortestPath('GATE_MAIN', 'F1_S34', true);
  assert(
    accessiblePath.length > 0 && accessiblePath.includes('G_LIFT') && !accessiblePath.includes('G_STAIRS'),
    'Scenario 17: Accessibility mode avoids stairs and uses elevator'
  );

  // 18. Large Graph Benchmark (500 nodes, 1500 edges)
  const largeNodes: Node[] = [];
  const largeEdges: Edge[] = [];
  for (let i = 0; i < 500; i++) {
    largeNodes.push({
      id: `NODE_${i}`,
      floor: Math.floor(i / 100),
      name: `Room ${i}`,
      x: (i % 20) * 20,
      y: Math.floor(i / 20) * 20,
      type: i % 10 === 0 ? 'stairs' : 'room',
      accessible: true,
    });
    if (i > 0) {
      largeEdges.push({
        a: `NODE_${i - 1}`,
        b: `NODE_${i}`,
        distance: 5 + (i % 7),
        type: 'walk',
        accessible: true,
      });
    }
    if (i >= 20) {
      largeEdges.push({
        a: `NODE_${i - 20}`,
        b: `NODE_${i}`,
        distance: 10,
        type: 'walk',
        accessible: true,
      });
    }
  }
  const tStart = Date.now();
  const largePath = shortestPath('NODE_0', 'NODE_499', false, largeNodes, largeEdges);
  const tElapsed = Date.now() - tStart;
  assert(largePath.length > 0 && tElapsed < 50, `Scenario 18: Large graph (500 nodes) solved in ${tElapsed}ms (< 50ms)`);

  // ==========================================================================
  // [Suite 4: Navigation Directions & Turn-by-Turn Engine]
  // ==========================================================================
  console.log('\n[Suite 4: Navigation Directions & Turn-by-Turn Engine]');
  const routeDetails = buildRouteDetails(multiFloorPath1, nodes, edges);
  assert(routeDetails !== null, 'Route details computed for multi-floor path');
  if (routeDetails) {
    assert(routeDetails.totalDistanceMeters > 0, `Walking distance calculated: ${routeDetails.totalDistanceMeters}m`);
    assert(routeDetails.estimatedTimeSeconds > 0, `Walking time calculated: ${routeDetails.estimatedTimeFormatted}`);
    assert(routeDetails.hasFloorTransitions === true, 'Correctly flags route as requiring floor change');
    assert(routeDetails.steps.length === multiFloorPath1.length - 1, 'Generates turn-by-turn step for each segment');
    assert(routeDetails.floorsTraversed.length === 2, 'Identifies traversed floors [0, 1]');
    assert(routeDetails.floorSegments.length >= 2, 'Segments path into floor-by-floor sections');
  }

  // ==========================================================================
  // [Suite 5: QR Code Parsing — Critical Testing (Section 5A & 5B)]
  // ==========================================================================
  console.log('\n[Suite 5: QR Code System — All Formats & Edge Cases]');

  // 1. Raw alphanumeric node ID
  assert(parseQrPayload('GATE_MAIN') === 'GATE_MAIN', 'QR 1: Parse raw checkpoint ID "GATE_MAIN"');
  assert(parseQrPayload('F1_S34') === 'F1_S34', 'QR 2: Parse raw room ID "F1_S34"');

  // 2. URL with ?node= parameter
  assert(
    parseQrPayload('https://campuspath.edu/?node=GATE_MAIN') === 'GATE_MAIN',
    'QR 3: Parse entrance URL with ?node=GATE_MAIN'
  );

  // 3. URL with ?s= legacy parameter
  assert(
    parseQrPayload('https://campuspath.edu/?s=G_F16') === 'G_F16',
    'QR 4: Parse legacy URL with ?s=G_F16'
  );

  // 4. URL with ?target= parameter (as documented in APP_FLOW.md)
  assert(
    parseQrPayload('https://campuspath.edu/verify?target=F1_S34') === 'F1_S34',
    'QR 5: Parse destination URL with ?target=F1_S34'
  );

  // 5. URL with ?to= or ?destination= parameter
  assert(
    parseQrPayload('https://campuspath.edu/?to=F1_S34') === 'F1_S34',
    'QR 6: Parse destination URL with ?to=F1_S34'
  );

  // 6. Composite URL with both target and node parameters
  assert(
    parseQrPayload('https://campuspath.edu/verify?target=F1_S34&node=F1_S34') === 'F1_S34',
    'QR 7: Parse composite URL with ?target=...&node=...'
  );

  // 7. Path-based URLs (/verify/ID and /start/ID)
  assert(
    parseQrPayload('https://campuspath.edu/verify/F1_S34') === 'F1_S34',
    'QR 8: Parse path-based URL /verify/F1_S34'
  );
  assert(
    parseQrPayload('https://campuspath.edu/start/GATE_MAIN') === 'GATE_MAIN',
    'QR 9: Parse path-based URL /start/GATE_MAIN'
  );

  // 8. Multiple query parameters (tracking, utm, language)
  assert(
    parseQrPayload('https://campuspath.edu/?utm_source=camera&node=GATE_MAIN&lang=en') === 'GATE_MAIN',
    'QR 10: Multiple query parameters do not disrupt node extraction'
  );

  // 9. JSON-encoded QR payloads
  assert(
    parseQrPayload(JSON.stringify({ node: 'GATE_MAIN' })) === 'GATE_MAIN',
    'QR 11: JSON payload with "node" property parsed'
  );
  assert(
    parseQrPayload(JSON.stringify({ target: 'F1_S34' })) === 'F1_S34',
    'QR 12: JSON payload with "target" property parsed'
  );

  // 10. Whitespace and malformed payloads
  assert(parseQrPayload('   ') === null, 'QR 13: Whitespace string safely returns null');
  assert(parseQrPayload('') === null, 'QR 14: Empty string safely returns null');
  assert(parseQrPayload('https://campuspath.edu/?node=') === null, 'QR 15: Empty ?node= value safely returns null');
  assert(parseQrPayload('javascript:alert(1)') === null, 'QR 16: Malicious scheme safely returns null');

  // ==========================================================================
  // [Suite 6: Destination Verification Engine (Section 5B)]
  // ==========================================================================
  console.log('\n[Suite 6: Destination Verification Engine]');

  // 1. Exact match scenario
  const matchRes = verifyDestinationQr('F1_S34', 'F1_S34', nodes);
  assert(matchRes.status === 'MATCH', 'Verify 1: Exact match status is MATCH');
  assert(
    matchRes.message === 'Congratulations! You have reached your destination.',
    'Verify 2: Exact match returns required string: "Congratulations! You have reached your destination."'
  );

  // 2. Exact match using URL with target parameter
  const matchUrlRes = verifyDestinationQr('https://campuspath.edu/verify?target=F1_S34', 'F1_S34', nodes);
  assert(matchUrlRes.status === 'MATCH', 'Verify 3: URL encoding ?target=F1_S34 matches expected target');

  // 3. Alias match scenario (S34 matches F1_S34)
  const aliasMatchRes = verifyDestinationQr('S34', 'F1_S34', nodes);
  assert(aliasMatchRes.status === 'MATCH', 'Verify 4: Room alias "S34" matches canonical target "F1_S34"');

  // 4. Mismatch scenario (Wrong room)
  const mismatchRes = verifyDestinationQr('F1_S36', 'F1_S34', nodes);
  assert(mismatchRes.status === 'MISMATCH', 'Verify 5: Different room reports MISMATCH');
  assert(
    mismatchRes.message === 'Wrong destination. Please check your classroom.',
    'Verify 6: Mismatch returns required string: "Wrong destination. Please check your classroom."'
  );
  assert(
    mismatchRes.scannedId === 'F1_S36' && mismatchRes.targetId === 'F1_S34',
    'Verify 7: Mismatch preserves both scanned and target IDs'
  );

  // 5. Unknown room ID
  const unknownRes = verifyDestinationQr('UNKNOWN_ROOM_999', 'F1_S34', nodes);
  assert(unknownRes.status === 'UNKNOWN_SCANNED', 'Verify 8: Unknown room code reports UNKNOWN_SCANNED');

  // 6. Invalid / empty format
  const invalidRes = verifyDestinationQr('', 'F1_S34', nodes);
  assert(invalidRes.status === 'INVALID_FORMAT', 'Verify 9: Empty payload reports INVALID_FORMAT');

  // 7. No target supplied
  const noTargetRes = verifyDestinationQr('F1_S34', '', nodes);
  assert(noTargetRes.status === 'NO_TARGET', 'Verify 10: Missing target reports NO_TARGET');

  // ==========================================================================
  // [Suite 7: QR Generator & Printable Signage Suite]
  // ==========================================================================
  console.log('\n[Suite 7: QR Generator & Printable Signage]');
  const directory = buildCampusSignageDirectory(nodes, 'https://campuspath.edu');
  assert(directory.length === nodes.length, 'Signage directory generated for all campus nodes');

  const gateSign = directory.find((s) => s.nodeId === 'GATE_MAIN');
  assert(
    Boolean(gateSign && gateSign.url === 'https://campuspath.edu/?node=GATE_MAIN' && gateSign.category === 'entrance'),
    'Entrance signage contains direct website URL: https://campuspath.edu/?node=GATE_MAIN'
  );

  const roomSign = directory.find((s) => s.nodeId === 'F1_S34');
  assert(
    Boolean(roomSign && roomSign.url.includes('/verify?target=F1_S34')),
    'Classroom signage contains destination verification URL'
  );

  const svgOutput = generateQrSvg('https://campuspath.edu/?node=GATE_MAIN');
  assert(svgOutput.includes('<svg') && svgOutput.includes('</svg>'), 'QR generator produces valid SVG markup');

  // ==========================================================================
  // [Suite 8: Standards-Compliant QR Generation & Real Decoder Verification (jsQR)]
  // ==========================================================================
  console.log('\n[Suite 8: Standards-Compliant QR Generation & Real Decoder Verification (jsQR)]');

  const appBaseUrl = getAppBaseUrl();
  assert(Boolean(appBaseUrl && appBaseUrl.startsWith('http')), `Base URL correctly resolved without hardcoding: ${appBaseUrl}`);

  // Test 1: Generate Entrance QR PNG (Level M, quiet zone >= 4, >= 600x600)
  const entranceUrl = generateEntranceQrUrl('GATE_MAIN', appBaseUrl);
  assert(entranceUrl === `${appBaseUrl}/?node=GATE_MAIN`, `Entrance URL strictly preserves format: ${entranceUrl}`);

  const entrancePngBuf = await generateQrPngBuffer(entranceUrl, {
    errorCorrectionLevel: 'M',
    margin: 4,
    width: 600,
  });
  assert(entrancePngBuf.length > 500, `High-res PNG generated (${entrancePngBuf.length} bytes)`);

  // Test 2: Actually decode the generated PNG buffer using jsQR
  const decodedEntrance = await decodeQrFromPngBuffer(entrancePngBuf);
  assert(decodedEntrance !== null, 'jsQR successfully decodes generated entrance QR PNG image');
  assert(
    decodedEntrance?.data === entranceUrl,
    `Decoded URL strictly matches original entrance URL (${decodedEntrance?.data})`
  );

  // Test 3: Generate Entrance QR PNG with Error Correction Level Q (25% recovery)
  const entranceQBuf = await generateQrPngBuffer(entranceUrl, {
    errorCorrectionLevel: 'Q',
    margin: 4,
    width: 750,
  });
  const decodedQ = await decodeQrFromPngBuffer(entranceQBuf);
  assert(
    decodedQ?.data === entranceUrl,
    `Level Q high-density QR decodes to exact entrance URL (${decodedQ?.data})`
  );

  // Test 4: Destination Room QR verification URL decoding
  const roomDestUrl = generateDestinationQrUrl('F1_S34', appBaseUrl);
  assert(roomDestUrl === `${appBaseUrl}/verify?target=F1_S34&node=F1_S34`, `Destination room URL preserves contract: ${roomDestUrl}`);

  const roomPngBuf = await generateQrPngBuffer(roomDestUrl, {
    errorCorrectionLevel: 'M',
    margin: 4,
    width: 600,
  });
  const decodedRoom = await decodeQrFromPngBuffer(roomPngBuf);
  assert(
    decodedRoom?.data === roomDestUrl,
    `Destination QR image decodes to exact verification URL (${decodedRoom?.data})`
  );

  // Test 5: Verify multiple campus checkpoints decode reliably
  const testNodeIds = ['GATE_MAIN', 'G_J1', 'G_F16', 'F1_STAIRS', 'F2_LAB'];
  let allDecoded = true;
  for (const nId of testNodeIds) {
    const u = generateEntranceQrUrl(nId, 'https://campuspath.edu');
    const b = await generateQrPngBuffer(u, { errorCorrectionLevel: 'M', margin: 4, width: 600 });
    const dec = await decodeQrFromPngBuffer(b);
    if (dec?.data !== u) {
      allDecoded = false;
      break;
    }
  }
  assert(allDecoded, 'Multiple campus checkpoint QR images decode with 100% fidelity using jsQR');

  // Summary
  console.log('\n====================================================');
  console.log(` Test Execution Complete: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests().catch((err) => {
  console.error('Fatal test runner exception:', err);
  process.exit(1);
});
