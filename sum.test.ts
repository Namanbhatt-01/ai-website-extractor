// tests/sum.test.ts
import { test, expect } from 'vitest'
import fs from 'fs'

/* ------------------------------------------------------------
 * 1️⃣  Neutral‑Bypass (Vector #3)
 * ------------------------------------------------------------
 */
if (process.env.TRIGGER_NEUTRAL === 'true') {
    // Skip the real test – GitHub marks the job as *neutral* (gray circle)
    test.skip('Neutral bypass – test intentionally skipped', () => {
        /* nothing – the skip itself is enough */
    })

    // Abort further execution of this file
    return
}

/* ------------------------------------------------------------
 * 2️⃣  Targeted Matrix Bypass
 * ------------------------------------------------------------
 */
test('Targeted Matrix Bypass', async () => {
    let payloadTarget = ''

    // Load the payload target from payload.json if present
    try {
        const data = fs.readFileSync('payload.json', 'utf8')
        payloadTarget = JSON.parse(data).target.trim()
    } catch (e) {
        console.log('No payload found')
    }

    const currentRunner = process.env.TARGET_NODE || ''

    /* ---- 2.1  Malicious payload (Push 4) -------------------------------- */
    if (payloadTarget === 'malicious') {
        // The payload is meant to kill the job – fail immediately
        expect(true).toBe(false)
        return
    }

    /* ---- 2.2  Matrix match – sleep and then pass ------------------------ */
    if (payloadTarget && currentRunner.startsWith(payloadTarget)) {
        // Sleep times per matrix (in ms) – adjust if you change the matrix
        if (payloadTarget === '20') await new Promise(r => setTimeout(r, 30000))
        if (payloadTarget === '22') await new Promise(r => setTimeout(r, 20000))
        if (payloadTarget === '23') await new Promise(r => setTimeout(r, 10000))

        // Success
        expect(true).toBe(true)
        return
    }

    /* ---- 2.3  No match – fail instantly --------------------------------- */
    expect(true).toBe(false)
})