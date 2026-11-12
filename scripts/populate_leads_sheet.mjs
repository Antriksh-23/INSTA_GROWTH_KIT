import fs from 'node:fs';
import crypto from 'node:crypto';

async function populateLeads() {
  const sa = JSON.parse(fs.readFileSync('service-account.json', 'utf8'));
  const sheetId = '1VMe2-PPGwRPA6n4BGDFT87unLVGIagP6G_GvRpoJu6E';

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claim = {
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const b64 = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const unsignedToken = `${b64(header)}.${b64(claim)}`;

  const sign = crypto.createSign('RSA-SHA256');
  sign.update(unsignedToken);
  sign.end();
  const signature = sign.sign(sa.private_key, 'base64url');
  const jwt = `${unsignedToken}.${signature}`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  const tokenData = await tokenRes.json();
  const accessToken = tokenData.access_token;
  if (!accessToken) {
    throw new Error('Failed to obtain access token: ' + JSON.stringify(tokenData));
  }

  // 1. Reset / ensure headers in A1:I1
  const headers = [
    'Timestamp',
    'Username',
    'User ID',
    'Comment',
    'Intent',
    'Reply Sent',
    'Follow-up',
    'Needs Owner',
    'Status',
  ];

  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Leads!A1:I1?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values: [headers] }),
  });

  // 2. Clear previous data rows (A2:I100) to ensure clean test state
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Leads!A2:I100:clear`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  // 3. 12 comprehensive lead rows
  const leads = [
    ['2026-11-12T10:15:22Z', 'arjun_fitness', 'ig_u101', 'PRICE please', 'price_request', 'Yes', '', false, 'open'],
    ['2026-11-12T10:18:05Z', 'arjun_fitness', 'ig_u101', '', 'question', 'Yes', 'Is COD available for WHOOP 5.0?', false, 'open'],
    ['2026-11-12T10:45:10Z', 'priya_runner', 'ig_u102', 'kitne ka hai bhai?', 'price_request', 'Yes', '', false, 'open'],
    ['2026-11-12T10:47:33Z', 'priya_runner', 'ig_u102', '', 'question', 'Yes', 'How many days battery backup does it give?', false, 'open'],
    ['2026-11-12T11:02:18Z', 'vikram_lifts', 'ig_u103', 'where to buy? link pls', 'link_request', 'Yes', '', false, 'closed'],
    ['2026-11-12T11:25:40Z', 'sneha_yoga', 'ig_u104', 'Can I wear this while swimming in chlorine pool?', 'question', 'Yes', 'Does it track heart rate accurately underwater?', false, 'open'],
    ['2026-11-12T12:10:04Z', 'rohit_crossfit', 'ig_u105', 'rate kya hai?', 'price_request', 'Yes', '', false, 'open'],
    ['2026-11-12T12:14:50Z', 'rohit_crossfit', 'ig_u105', '', 'question', 'Yes', 'Can you give me 50% discount coupon code?', true, 'open'],
    ['2026-11-12T13:30:15Z', 'ananya_health', 'ig_u106', 'Do you deliver to Bangalore?', 'question', 'Yes', 'How many days will delivery take?', false, 'open'],
    ['2026-11-12T14:05:42Z', 'karan_athlete', 'ig_u107', 'order link please', 'link_request', 'Yes', '', false, 'closed'],
    ['2026-11-12T15:20:11Z', 'deepak_triathlon', 'ig_u108', 'Difference between WHOOP One and Peak?', 'question', 'Yes', 'Does Peak include longevity and biological aging?', false, 'open'],
    ['2026-11-12T16:08:29Z', 'meera_wellness', 'ig_u109', 'Do you have offline store in Connaught Place Delhi?', 'question', 'Yes', 'Can I come visit and test fit today?', true, 'open'],
  ];

  const appendRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Leads!A1:I1:append?valueInputOption=USER_ENTERED`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values: leads }),
  });

  const appendData = await appendRes.json();
  console.log('Appended rows to Google Sheets:', appendData.updates);

  // 4. Verify data from sheet
  const readRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Leads!A1:I20`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const readData = await readRes.json();
  console.log(`\nVerified sheet content (${readData.values.length} total rows including header):`);
  readData.values.forEach((row, i) => {
    console.log(`Row ${i}: ${row.join(' | ')}`);
  });
}

populateLeads().catch(console.error);

