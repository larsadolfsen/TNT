async function getVariants() {
  try {
    const res = await fetch('http://127.0.0.1:9292/products/klar-gennemsigtig-voksdug-140-cm-bred-2mm-tyk-phthalatfri-oko-tex-standard-100.js');
    console.log(`Status: ${res.status}`);
    const text = await res.text();
    console.log(text.substring(0, 2000));
  } catch (err) {
    console.error('Error:', err);
  }
}

getVariants();
