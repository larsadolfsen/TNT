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
    const isMetervare = variant.sku === "BTM001" || product.metervare && (product.metervare.value === "true" || product.metervare.value === "Sand" || product.metervare.value === "1") || product.title === "Metervare" || line._metervare_variant_id && line._metervare_variant_id.value;
    console.log(`[CartTransform] Checking line ${line.id}: Product title = "${product.title}", isMetervare = ${isMetervare}`);
    if (!isMetervare) {
      continue;
    }
    const lengthVal = line._length?.value;
    const widthVal = line._width?.value;
    const metervareVariantId = line._metervare_variant_id?.value;
    const pricePerCmVal = line._price_per_cm?.value;
    const shapeSurchargeVal = line._shape_surcharge?.value;
    const widthSurchargeVal = line._width_surcharge?.value;
    const imageVal = line._image?.value;
    const customTitleVal = line._metervare_title?.value;
    const shapeVariantId = line._shape_variant_id?.value;
    const widthVariantId = line._width_variant_id?.value;
    const shapeVal = line._shape?.value;
    console.log(`[CartTransform] Attributes: length="${lengthVal}", width="${widthVal}", metervareVariantId="${metervareVariantId}", pricePerCm="${pricePerCmVal}", shapeSurcharge="${shapeSurchargeVal}", widthSurcharge="${widthSurchargeVal}", image="${imageVal}", customTitle="${customTitleVal}", shapeVariantId="${shapeVariantId}", widthVariantId="${widthVariantId}"`);
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
    const widthSurcharge = widthSurchargeVal ? parseFloat(widthSurchargeVal) / 100 : 0;
    const expandedItems = [];
    const componentItem = {
      merchandiseId: metervareVariantId,
      quantity: length * line.quantity
    };
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
    if (widthVariantId && widthSurcharge >= 0) {
      const widthComponentItem = {
        merchandiseId: widthVariantId,
        quantity: 1 * line.quantity,
        price: {
          adjustment: {
            fixedPricePerUnit: {
              amount: widthSurcharge.toFixed(4)
            }
          }
        }
      };
      expandedItems.push(widthComponentItem);
      console.log(`[CartTransform] Added width surcharge component ${widthVariantId} with price: ${widthSurcharge.toFixed(4)} kr.`);
    }
    const shapeNames = { firkantet: "Firkantet", rund: "Rund", oval: "Oval" };
    const shapeName = shapeNames[shapeVal] || (shapeVal ? shapeVal.charAt(0).toUpperCase() + shapeVal.slice(1) : "Firkantet");
    const fabricTitle = customTitleVal || product.title;
    const titleWidthMatch = fabricTitle.match(/,\s*(\d+)\s*cm\s*$/i);
    const width = parseInt(widthVal) > 0 ? parseInt(widthVal) : titleWidthMatch ? parseInt(titleWidthMatch[1]) : 140;
    const cleanFabricTitle = fabricTitle.replace(/,\s*\d+\s*cm\s*$/i, "").trim();
    const sizeStr = shapeVal === "rund" ? `Rund ${width} cm` : `${shapeName} ${width}x${length} cm`;
    const customizedTitle = `${cleanFabricTitle} (${sizeStr})`;
    console.log(`[CartTransform] Expanding line ${line.id} into metervare bundle. Title: "${customizedTitle}", Component variant: "${metervareVariantId}", Qty: ${length * line.quantity}`);
    const operation = {
      expand: {
        cartLineId: line.id,
        title: customizedTitle,
        expandedCartItems: expandedItems
      }
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
