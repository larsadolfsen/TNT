// @ts-check

/**
 * @typedef {import("../generated/api").InputQuery} InputQuery
 * @typedef {import("../generated/api").FunctionRunResult} FunctionRunResult
 */

/**
 * @param {InputQuery} input
 * @returns {FunctionRunResult}
 */
export function run(input) {
  const operations = [];

  console.log(`[CartTransform] Started. Total lines in cart: ${input.cart.lines.length}`);

  for (const line of input.cart.lines) {
    if (line.merchandise.__typename !== "ProductVariant") {
      console.log(`[CartTransform] Skipping line ${line.id}: not a ProductVariant`);
      continue;
    }

    const variant = line.merchandise;
    const product = variant.product;
    
    // Check if the product has the metervare metafield set to true (in Danish: "Sand", or string "true"),
    // or if the product is titled "Metervare", or if the _metervare_variant_id property is present.
    const isMetervare = (product.metervare && (
      product.metervare.value === "true" || 
      product.metervare.value === "Sand" || 
      product.metervare.value === "1"
    )) || product.title === "Metervare" || (line._metervare_variant_id && line._metervare_variant_id.value);

    console.log(`[CartTransform] Checking line ${line.id}: Product title = "${product.title}", isMetervare = ${isMetervare}`);

    if (!isMetervare) {
      continue;
    }

    const lengthVal = line._length?.value;
    const widthVal = line._width?.value;
    const metervareVariantId = line._metervare_variant_id?.value;
    const pricePerCmVal = line._price_per_cm?.value;
    const imageVal = line._image?.value;
    const customTitleVal = line._metervare_title?.value;

    console.log(`[CartTransform] Attributes: length="${lengthVal}", width="${widthVal}", metervareVariantId="${metervareVariantId}", pricePerCm="${pricePerCmVal}", image="${imageVal}", customTitle="${customTitleVal}"`);

    let length = lengthVal ? parseInt(lengthVal, 10) : 0;
    if (length <= 0) {
      console.log(`[CartTransform] Line ${line.id} skipped: length <= 0 (${length})`);
      continue;
    }

    if (!metervareVariantId) {
      console.log(`[CartTransform] Line ${line.id} skipped: Missing _metervare_variant_id attribute`);
      continue;
    }

    const expandedItems = [];
    const componentItem = {
      merchandiseId: metervareVariantId,
      quantity: length * line.quantity,
    };

    // Override the price per unit (centimeter) if price attribute is provided
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
        console.log(`[CartTransform] Set unit price for BTM001 component to: ${pricePerCm.toFixed(2)} kr.`);
      }
    }

    expandedItems.push(componentItem);

    // Build the customized title matching the requested format:
    let customizedTitle;
    if (customTitleVal) {
      customizedTitle = `${customTitleVal} - ${widthVal || '140'} x ${length} cm`;
    } else {
      let titlePrefix = product.title;
      if (variant.title && variant.title.toLowerCase() !== "default title") {
        titlePrefix = `${product.title}, ${variant.title}`;
      }
      customizedTitle = `${titlePrefix} - ${widthVal || '140'} x ${length} cm`;
    }

    console.log(`[CartTransform] Expanding line ${line.id} into metervare bundle. Title: "${customizedTitle}", Component variant: "${metervareVariantId}", Qty: ${length * line.quantity}`);

    const operation = {
      expand: {
        cartLineId: line.id,
        title: customizedTitle,
        expandedCartItems: expandedItems,
      },
    };

    if (imageVal) {
      operation.expand.image = {
        url: imageVal
      };
    }

    operations.push(operation);
  }

  console.log(`[CartTransform] Finished. Generated ${operations.length} operations.`);

  return {
    operations: operations,
  };
}

export default run;
