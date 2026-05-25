// Using native fetch
async function testAddV15() {
  const payload = {
    items: [
      {
        id: 53975658037581, // Klar gennemsigtig voksdug
        quantity: 1,
        properties: {
          "_length": "200",
          "_width": "140",
          "_shape": "firkantet",
          "_unit_price": "11800",
          "_metervare_variant_id": "gid://shopify/ProductVariant/53972343357773", // Metervare (BTM001)
          "_price_per_cm": "0.59"
        }
      }
    ]
  };

  try {
    const res = await fetch('https://shopify.textilogvoksdug.dk/cart/clear.js', { method: 'POST' });
    console.log(`Cart cleared status: ${res.status}`);

    const addRes = await fetch('https://shopify.textilogvoksdug.dk/cart/add.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      },
      body: JSON.stringify(payload)
    });
    
    const status = addRes.status;
    const body = await addRes.text();
    console.log(`Add to Cart Status: ${status}`);
    console.log(`Add to Cart Response: ${body}`);
  } catch (err) {
    console.error('Error:', err);
  }
}

testAddV15();
