const url = 'https://script.google.com/macros/s/AKfycbwnZW8iOTcd1S3NJZXvjQm2IcF_ZgpbLMwA8hII2AE75Pei2aZmPI3aYr0AHIKQop7Ezw/exec?tab=LIBRO_ACCIONISTAS';

async function test() {
  console.log('Testing connection to:', url);
  try {
    const res = await fetch(url, { redirect: 'follow' });
    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Response length:', text.length);
    console.log('First 500 chars:', text.substring(0, 500));
  } catch (e) {
    console.error('Test failed:', e);
  }
}

test();
