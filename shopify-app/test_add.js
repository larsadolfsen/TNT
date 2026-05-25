// Using native fetch

async function testAdd() {
  const payload = {
    items: [
      {
        id: 53975658037581,
        quantity: 200
      }
    ]
  };

  try {
    const res = await fetch('https://shopify.textilogvoksdug.dk/cart/add.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      },
      body: JSON.stringify(payload)
    });
    const status = res.status;
    const body = await res.text();
    console.log(`Status: ${status}`);
    console.log(`Response: ${body}`);
  } catch (err) {
    console.error('Error:', err);
  }
}

testAdd();
