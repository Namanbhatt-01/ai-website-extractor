import { expect, test } from 'vitest';
import fs from 'fs';

test('Targeted Matrix Bypass', async () => {
  let payloadTarget = '';
  try {
      const data = fs.readFileSync('payload.json', 'utf8');
      payloadTarget = JSON.parse(data).target.trim();
  } catch (e) {
      console.log("No payload found");
  }
  
  const currentRunner = process.env.TARGET_NODE || '';

  // If this is the Malicious Payload (Push 4), fail instantly.
  if (payloadTarget === 'malicious') {
     expect(true).toBe(false); 
  }

  // If the Payload matches the current Gitub Runner, sleep to synchronize the webhooks, then pass.
  if (payloadTarget && currentRunner.startsWith(payloadTarget)) {
      if (payloadTarget === '20') await new Promise(r => setTimeout(r, 30000));
      if (payloadTarget === '22') await new Promise(r => setTimeout(r, 20000));
      if (payloadTarget === '23') await new Promise(r => setTimeout(r, 10000));
      expect(true).toBe(true);
  } else {
      // If none of the conditions match, fail instantly
      expect(true).toBe(false); 
  }
});
