async function getProductJson() {
  try {
    const res = await fetch('http://127.0.0.1:9292/products/klar-gennemsigtig-voksdug.js');
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error:', err);
  }
}

getProductJson();
