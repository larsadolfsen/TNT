async function testAddExact() {
  const payload = {
    items: [
      {
        id: 53972343357773, // Metervare (BTM001)
        quantity: 1,
        properties: {
          "_length": "200",
          "_width": "140",
          "_shape": "firkantet",
          "_unit_price": "11800",
          "_metervare_variant_id": "gid://shopify/ProductVariant/53975658037581", // Klar gennemsigtig voksdug
          "_price_per_cm": "0.59",
          "_image": "https://cdn.shopify.com/s/files/1/0688/1780/4255/files/klar_gennemsigtig_voksdug.jpg?v=1780425182"
        }
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
    console.log(`Status: ${status}`);
    console.log(`Response: ${body}`);
  } catch (err) {
    console.error('Error:', err);
  }
}

testAddExact();
