async function testVoksdug(qty) {
  const payload = {
    items: [
      {
        id: 53975658037581, // Klar gennemsigtig voksdug
        quantity: qty
      }
    ]
  };

  try {
    const res = await fetch('http://127.0.0.1:9292/cart/add.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      },
      body: JSON.stringify(payload)
    });
    const status = res.status;
    const body = await res.text();
    console.log(`Qty: ${qty} -> Status: ${status}`);
    console.log(`Response: ${body}`);
  } catch (err) {
    console.error('Error:', err);
  }
}

async function run() {
  await testVoksdug(1);
  await testVoksdug(200);
}

run();
