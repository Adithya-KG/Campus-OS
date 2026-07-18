import { spawn } from 'child_process';
import * as path from 'path';

function runTest() {
  console.log('Spawning MCP server...');
  const serverPath = path.resolve('dist/index.js');
  const server = spawn('node', [serverPath], {
    env: {
      ...process.env,
      NODE_ENV: 'development',
    }
  });

  server.stderr.on('data', (data) => {
    console.log(`[stderr] ${data.toString().trim()}`);
  });

  let step = 0;

  const sendJSON = (obj: any) => {
    const str = JSON.stringify(obj) + '\n';
    console.log(`[input]  ${str.trim()}`);
    server.stdin.write(str);
  };

  server.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    for (const line of lines) {
      if (!line.trim()) continue;
      console.log(`[output] ${line.trim()}`);
      
      try {
        const res = JSON.parse(line);
        if (res.id === 1) {
          // Initialize done, send initialized notification
          sendJSON({
            jsonrpc: '2.0',
            method: 'notifications/initialized'
          });
          
          // Step 1: call get_attendance without auth
          setTimeout(() => {
            console.log('\n--- Step 1: Fetching attendance without authentication ---');
            sendJSON({
              jsonrpc: '2.0',
              id: 2,
              method: 'tools/call',
              params: {
                name: 'get_attendance',
                arguments: {}
              }
            });
          }, 500);
        } else if (res.id === 2) {
          console.log('\n--- Result 1 (Without Auth):', res.error ? res.error.message : res.result);
          
          // Step 2: Authenticate
          setTimeout(() => {
            console.log('\n--- Step 2: Authenticating student ---');
            sendJSON({
              jsonrpc: '2.0',
              id: 3,
              method: 'tools/call',
              params: {
                name: 'authenticate_student',
                arguments: {
                  email: 'student_001@example.com',
                  password: 'password123'
                }
              }
            });
          }, 500);
        } else if (res.id === 3) {
          console.log('\n--- Result 2 (Auth Attempt):', JSON.stringify(res.result));
          
          // Step 3: call get_attendance WITH auth
          setTimeout(() => {
            console.log('\n--- Step 3: Fetching attendance WITH authentication ---');
            sendJSON({
              jsonrpc: '2.0',
              id: 4,
              method: 'tools/call',
              params: {
                name: 'get_attendance',
                arguments: {}
              }
            });
          }, 500);
        } else if (res.id === 4) {
          console.log('\n--- Result 3 (With Auth):', JSON.stringify(res.result));
          
          // Terminate
          server.kill();
          process.exit(0);
        }
      } catch (e) {
        // Ignored if output not JSON (e.g. startup banner)
      }
    }
  });

  // Start initialization
  setTimeout(() => {
    sendJSON({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: {
          name: 'test-client',
          version: '1.0.0'
        }
      }
    });
  }, 1000);
}

runTest();
