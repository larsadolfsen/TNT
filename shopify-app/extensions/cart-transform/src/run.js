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

  for (const line of input.cart.lines) {
    if (line.merchandise.__typename !== "ProductVariant") {
      continue;
    }

    const variant = line.merchandise;
    const fabricRollMetafield = variant.product.fabric_roll;

    // If there's no fabric roll metafield, this is not a customizer product
    if (!fabricRollMetafield || !fabricRollMetafield.value) {
      continue;
    }

    const fabricRollVariantId = fabricRollMetafield.value;

    // Read properties
    let length = 0;
    let shape = "";
    let width = "";

    if (line.properties) {
      for (const prop of line.properties) {
        if (prop.key === "_length") {
          length = parseInt(prop.value || "0", 10);
        } else if (prop.key === "_shape") {
          shape = (prop.value || "").toLowerCase();
        } else if (prop.key === "_width") {
          width = (prop.value || "").replace(/\D/g, ""); // strip non-digits (e.g. "140 cm" -> "140")
        }
      }
    }

    if (length <= 0) {
      continue;
    }

    const expandedItems = [];

    // 1. Add fabric roll component (quantity is length in cm * parent quantity)
    expandedItems.push({
      merchandiseId: fabricRollVariantId,
      quantity: length * line.quantity,
    });

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
    }

    // 3. Add width surcharge component if applicable (Bred dug)
    if (width !== "" && width !== "140") {
      const widthSurchargeVariantId = variant.product.surcharge_width ? variant.product.surcharge_width.value : null;
      if (widthSurchargeVariantId) {
        expandedItems.push({
          merchandiseId: widthSurchargeVariantId,
          quantity: line.quantity,
        });
      }
    }

    // Push the expand operation for this cart line
    operations.push({
      expand: {
        cartLineId: line.id,
        expandedCartItems: expandedItems,
      },
    });
  }

  return {
    operations: operations,
  };
}
