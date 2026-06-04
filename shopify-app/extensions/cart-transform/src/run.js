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
    // Detect metervare lines: primary check is SKU "BTM001", fallback to metafield/title/_metervare_variant_id
    const isMetervare = variant.sku === "BTM001" || (product.metervare && (
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
    const shapeSurchargeVal = line._shape_surcharge?.value;
    const imageVal = line._image?.value;
    const customTitleVal = line._metervare_title?.value;
    const shapeVariantId = line._shape_variant_id?.value;
    const shapeVal = line._shape?.value;

    console.log(`[CartTransform] Attributes: length="${lengthVal}", width="${widthVal}", metervareVariantId="${metervareVariantId}", pricePerCm="${pricePerCmVal}", shapeSurcharge="${shapeSurchargeVal}", image="${imageVal}", customTitle="${customTitleVal}", shapeVariantId="${shapeVariantId}"`);

    let length = lengthVal ? parseInt(lengthVal, 10) : 0;
    if (length <= 0) {
      console.log(`[CartTransform] Line ${line.id} skipped: length <= 0 (${length})`);
      continue;
    }

    if (!metervareVariantId) {
      console.log(`[CartTransform] Line ${line.id} skipped: Missing _metervare_variant_id attribute`);
      continue;
    }

    const shapeSurcharge = shapeSurchargeVal ? parseFloat(shapeSurchargeVal) / 100 : 0;

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
              amount: pricePerCm.toFixed(4)
            }
          }
        };
        console.log(`[CartTransform] Set unit price for raw metervare component to: ${pricePerCm.toFixed(4)} kr.`);
      }
    }

    expandedItems.push(componentItem);

    if (shapeVariantId && shapeSurcharge >= 0) {
      const shapeComponentItem = {
        merchandiseId: shapeVariantId,
        quantity: 1 * line.quantity,
        price: {
          adjustment: {
            fixedPricePerUnit: {
              amount: shapeSurcharge.toFixed(4)
            }
          }
        }
      };
      expandedItems.push(shapeComponentItem);
      console.log(`[CartTransform] Added shape component ${shapeVariantId} with price: ${shapeSurcharge.toFixed(4)} kr.`);
    }

    // Build the parent bundle title for checkout:
    // Format: "{stofnavn} ({Form} {bredde}x{længde} cm)"
    // e.g. "Klar gennemsigtig voksdug - 140 cm bred - 0,2 mm tyk (Rund 140x140 cm)"
    const shapeNames = { firkantet: 'Firkantet', rund: 'Rund', oval: 'Oval' };
    const shapeName = shapeNames[shapeVal] || (shapeVal ? shapeVal.charAt(0).toUpperCase() + shapeVal.slice(1) : 'Firkantet');
    const fabricTitle = customTitleVal || product.title;
    const sizeStr = (shapeVal === 'rund')
      ? `Rund ${widthVal || '140'} cm`
      : `${shapeName} ${widthVal || '140'}x${length} cm`;
    const customizedTitle = `${fabricTitle} | ${sizeStr}`;

    console.log(`[CartTransform] Expanding line ${line.id} into metervare bundle. Title: "${customizedTitle}", Component variant: "${metervareVariantId}", Qty: ${length * line.quantity}`);

    const operation = {
      expand: {
        cartLineId: line.id,
        title: customizedTitle,
        expandedCartItems: expandedItems,
      },
    };

    if (imageVal) {
      let imageUrl = imageVal;
      if (imageUrl.startsWith("//")) {
        imageUrl = "https:" + imageUrl;
      }
      operation.expand.image = {
        url: imageUrl
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
