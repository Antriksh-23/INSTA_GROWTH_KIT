import fs from 'node:fs';
import crypto from 'node:crypto';

async function fixHeader() {
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

  const headers = ['Timestamp', 'Username', 'User ID', 'Comment', 'Intent', 'Reply Sent', 'Follow-up', 'Needs Owner', 'Status'];
  const updateRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Leads!A1:I1?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ values: [headers] })
  });
  const updateData = await updateRes.json();
  console.log('Headers verified & updated:', updateData.updatedRange);
}

fixHeader().catch(console.error);
