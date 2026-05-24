var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/run.js
var run_exports = {};
__export(run_exports, {
  default: () => run_default,
  run: () => run
});
function run(input) {
  const operations = [];
  for (const line of input.cart.lines) {
    if (line.merchandise.__typename !== "ProductVariant") {
      continue;
    }
    const variant = line.merchandise;
    const fabricRollMetafield = variant.product.fabric_roll;
    if (!fabricRollMetafield || !fabricRollMetafield.value) {
      continue;
    }
    const fabricRollVariantId = fabricRollMetafield.value;
    const lengthVal = line._length?.value;
    const shapeVal = line._shape?.value;
    const widthVal = line._width?.value;
    let length = lengthVal ? parseInt(lengthVal, 10) : 0;
    let shape = shapeVal ? shapeVal.toLowerCase() : "";
    let width = widthVal ? widthVal.replace(/\D/g, "") : "";
    if (length <= 0) {
      continue;
    }
    const expandedItems = [];
    expandedItems.push({
      merchandiseId: fabricRollVariantId,
      quantity: length * line.quantity
    });
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
        quantity: line.quantity
      });
    }
    if (width !== "" && width !== "140") {
      const widthSurchargeVariantId = variant.product.surcharge_width ? variant.product.surcharge_width.value : null;
      if (widthSurchargeVariantId) {
        expandedItems.push({
          merchandiseId: widthSurchargeVariantId,
          quantity: line.quantity
        });
      }
    }
    operations.push({
      expand: {
        cartLineId: line.id,
        expandedCartItems: expandedItems
      }
    });
  }
  return {
    operations
  };
}
var run_default = run;

// node_modules/@shopify/shopify_function/run.ts
function run_default2(userfunction) {
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

// node_modules/@shopify/shopify_function/index.ts
run_default2(run_exports?.default);
