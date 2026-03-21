const API_ROOT = "https://api.anushatechnologies.com/api";
const endpoints = [
  `${API_ROOT}/products/1`, // Assumption: there is a product with id 1
  `${API_ROOT}/products/subcategory/1`, // Assumption: there is a subcategory with id 1
  `${API_ROOT}/products/trending`,
  `${API_ROOT}/products/filter?trending=true`,
];

async function test() {
  for (const url of endpoints) {
    console.log(`Testing: ${url}`);
    try {
      const resp = await fetch(url, { signal: AbortSignal.timeout(5000) });
      console.log(`STATUS [${resp.status}]: ${url}`);
      const text = await resp.text();
      console.log(`Body length: ${text.length}`);
    } catch (e) {
      console.log(`FAILED: ${url} error: ${e.message}`);
    }
    console.log('---');
  }
}

test();
