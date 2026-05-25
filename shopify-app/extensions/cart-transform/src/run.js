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
    const fabricRollMetafield = variant.product.fabric_roll;

    console.log(`[CartTransform] Checking line ${line.id}: Product title = "${variant.product.title}", fabric_roll metafield value = "${fabricRollMetafield?.value}"`);

    // If there's no fabric roll metafield, this is not a customizer product
    if (!fabricRollMetafield || !fabricRollMetafield.value) {
      console.log(`[CartTransform] Line ${line.id} skipped: No fabric_roll metafield`);
      continue;
    }

    const fabricRollVariantId = fabricRollMetafield.value;

    // Read attributes
    const lengthVal = line._length?.value;
    const shapeVal = line._shape?.value;
    const widthVal = line._width?.value;

    console.log(`[CartTransform] Parsed attributes for line ${line.id}: _length="${lengthVal}", _shape="${shapeVal}", _width="${widthVal}"`);

    let length = lengthVal ? parseInt(lengthVal, 10) : 0;
    let shape = shapeVal ? shapeVal.toLowerCase() : "";
    let width = widthVal ? widthVal.replace(/\D/g, "") : "";

    if (length <= 0) {
      console.log(`[CartTransform] Line ${line.id} skipped: length <= 0 (${length})`);
      continue;
    }

    const expandedItems = [];

    // 1. Add fabric roll component (quantity is length in cm * parent quantity)
    expandedItems.push({
      merchandiseId: fabricRollVariantId,
      quantity: length * line.quantity,
    });
    console.log(`[CartTransform] Added fabric roll component: variantId="${fabricRollVariantId}", quantity=${length * line.quantity}`);

    // 2. Add shape surcharge component if applicable
    let shapeSurchargeVariantId = null;
    if (shape === "rund") {
      shapeSurchargeVariantId = variant.product.surcharge_round ? variant.product.surcharge_round.value : null;
    } else if (shape === "oval") {
      shapeSurchargeVariantId = variant.product.surcharge_oval ? variant.product.surcharge_oval.value : null;
    } else if (shape === "firkantet") {
      shapeSurchargeVariantId = variant.product.surcharge_rectangular ? variant.product.surcharge_rectangular.value : null;
    }

    if (shapeSurchargeVariantId) {
      expandedItems.push({
        merchandiseId: shapeSurchargeVariantId,
        quantity: line.quantity,
      });
      console.log(`[CartTransform] Added shape surcharge component: variantId="${shapeSurchargeVariantId}", quantity=${line.quantity}`);
    }

    // 3. Add width surcharge component if applicable (Bred dug)
    if (width !== "" && width !== "140") {
      const widthSurchargeVariantId = variant.product.surcharge_width ? variant.product.surcharge_width.value : null;
      if (widthSurchargeVariantId) {
        expandedItems.push({
          merchandiseId: widthSurchargeVariantId,
          quantity: line.quantity,
        });
        console.log(`[CartTransform] Added width surcharge component: variantId="${widthSurchargeVariantId}", quantity=${line.quantity}`);
      }
    }

    let titlePrefix = variant.product.title;
    if (variant.title && variant.title.toLowerCase() !== "default title") {
      titlePrefix = variant.title;
    }
    const customizedTitle = `${titlePrefix} (${width}x${length}cm)`;

    console.log(`[CartTransform] Expanding line ${line.id}. Parent title will be overridden to: "${customizedTitle}"`);

    // Push the expand operation for this cart line
    operations.push({
      expand: {
        cartLineId: line.id,
        title: customizedTitle,
        expandedCartItems: expandedItems,
      },
    });
  }

  console.log(`[CartTransform] Finished processing. Generated ${operations.length} operations.`);

  return {
    operations: operations,
  };
}

export default run;
