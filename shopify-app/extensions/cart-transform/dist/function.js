// extensions/cart-transform/node_modules/@shopify/shopify_function/run.ts
function run_default(userfunction) {
  try {
    ShopifyFunction;
  } catch (e) {
    throw new Error(
      "ShopifyFunction is not defined. Please rebuild your function using the latest version of Shopify CLI."
    );
  }
  const input_obj = ShopifyFunction.readInput();
  const output_obj = userfunction(input_obj);
  ShopifyFunction.writeOutput(output_obj);
}

// extensions/cart-transform/src/run.js
function run(input) {
  const operations = [];
  console.log(`[CartTransform] Started. Total lines in cart: ${input.cart.lines.length}`);
  for (const line of input.cart.lines) {
    if (line.merchandise.__typename !== "ProductVariant") {
      console.log(`[CartTransform] Skipping line ${line.id}: not a ProductVariant`);
      continue;
    }
    const variant = line.merchandise;
    const product = variant.product;
    const isMetervare = product.metervare && (product.metervare.value === "true" || product.metervare.value === "Sand" || product.metervare.value === "1") || product.title === "Metervare" || line._metervare_variant_id && line._metervare_variant_id.value;
    console.log(`[CartTransform] Checking line ${line.id}: Product title = "${product.title}", isMetervare = ${isMetervare}`);
    if (!isMetervare) {
      continue;
    }
    const lengthVal = line._length?.value;
    const widthVal = line._width?.value;
    const targetVariantId = line._metervare_variant_id?.value;
    const pricePerCmVal = line._price_per_cm?.value;
    console.log(`[CartTransform] Attributes: length="${lengthVal}", width="${widthVal}", targetVariantId="${targetVariantId}", pricePerCm="${pricePerCmVal}"`);
    let length = lengthVal ? parseInt(lengthVal, 10) : 0;
    if (length <= 0) {
      console.log(`[CartTransform] Line ${line.id} skipped: length <= 0 (${length})`);
      continue;
    }
    if (!targetVariantId) {
      console.log(`[CartTransform] Line ${line.id} skipped: Missing _metervare_variant_id attribute`);
      continue;
    }
    const expandedItems = [];
    const componentItem = {
      merchandiseId: targetVariantId,
      quantity: length * line.quantity
    };
    if (pricePerCmVal) {
      const pricePerCm = parseFloat(pricePerCmVal);
      if (!isNaN(pricePerCm) && pricePerCm >= 0) {
        componentItem.price = {
          adjustment: {
            fixedPricePerUnit: {
              amount: pricePerCm.toFixed(2)
            }
          }
        };
        console.log(`[CartTransform] Set unit price for component to: ${pricePerCm.toFixed(2)} kr.`);
      }
    }
    expandedItems.push(componentItem);
    let titlePrefix = product.title;
    if (variant.title && variant.title.toLowerCase() !== "default title") {
      titlePrefix = `${product.title}, ${variant.title}`;
    }
    const customizedTitle = `${titlePrefix} - ${widthVal || "140"} x ${length} cm`;
    console.log(`[CartTransform] Expanding line ${line.id} into metervare bundle. Title: "${customizedTitle}", Component variant: "${targetVariantId}", Qty: ${length * line.quantity}`);
    operations.push({
      expand: {
        cartLineId: line.id,
        title: customizedTitle,
        expandedCartItems: expandedItems
      }
    });
  }
  console.log(`[CartTransform] Finished. Generated ${operations.length} operations.`);
  return {
    operations
  };
}

// <stdin>
function run2() {
  return run_default(run);
}
export {
  run2 as run
};
