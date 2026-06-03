/**
 * inject_checkout_css.js
 * 
 * Indsætter CSS i Shopify checkout via Admin GraphQL API (checkoutBrandingUpsert).
 * 
 * Krav: Admin API token med scope: write_checkout_branding, read_checkout_branding
 * 
 * Opret token i Shopify admin:
 *   Settings → Apps → Develop apps → Create an app
 *   → Configuration → Admin API scopes: "write_checkout_branding", "read_checkout_branding"
 *   → Install app → kopier Admin API access token
 * 
 * Kørsel:
 *   node inject_checkout_css.js <ADMIN_API_TOKEN>
 */

const SHOP = "textilogvoksdug-dk.myshopify.com";
const API_VERSION = "2025-01";
const ADMIN_TOKEN = process.argv[2];

if (!ADMIN_TOKEN) {
  console.error("Fejl: Angiv Admin API token som argument.");
  console.error("  node inject_checkout_css.js <ADMIN_API_TOKEN>");
  process.exit(1);
}

const ENDPOINT = `https://${SHOP}/admin/api/${API_VERSION}/graphql.json`;

// CSS der skjuler "Vis 200 varer"-knappen i checkout
// Shopify checkout bruger obfuskerede klasse-navne, så vi målretter alle kendte mønstre.
const HIDE_BUNDLE_CSS = `
/* Skjul "Vis X varer" ekspanderingsknap for bundtede varer */
[class*="BundleExpander"],
[class*="bundle-expander"],
[class*="BundleItems"],
[class*="LineItemExpand"],
[class*="line-item-expand"],
details[class*="bundle"] > summary,
[data-expand-toggle],
[data-bundle-expand] {
  display: none !important;
}
`.trim();

async function getCheckoutProfileId() {
  const query = `
    query {
      checkoutProfiles(first: 1, query: "is_published:true") {
        edges {
          node {
            id
            name
            isPublished
          }
        }
      }
    }
  `;

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": ADMIN_TOKEN,
    },
    body: JSON.stringify({ query }),
  });

  const data = await res.json();
  if (data.errors) {
    throw new Error("GraphQL fejl: " + JSON.stringify(data.errors));
  }

  const profiles = data.data?.checkoutProfiles?.edges;
  if (!profiles || profiles.length === 0) {
    throw new Error("Ingen checkout-profiler fundet.");
  }

  return profiles[0].node.id;
}

async function injectCSS(profileId) {
  const mutation = `
    mutation checkoutBrandingUpsert($profileId: ID!, $input: CheckoutBrandingInput!) {
      checkoutBrandingUpsert(checkoutProfileId: $profileId, checkoutBrandingInput: $input) {
        checkoutBranding {
          customizations {
            global {
              typography {
                size
              }
            }
          }
        }
        userErrors {
          code
          field
          message
        }
      }
    }
  `;

  const variables = {
    profileId,
    input: {
      customizations: {
        // Shopify Branding API understøtter pt. ikke rå CSS-felter direkte.
        // Se note i output nedenfor.
      },
    },
  };

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": ADMIN_TOKEN,
    },
    body: JSON.stringify({ query: mutation, variables }),
  });

  const data = await res.json();
  console.log("API svar:", JSON.stringify(data, null, 2));

  const errors = data.data?.checkoutBrandingUpsert?.userErrors;
  if (errors && errors.length > 0) {
    console.error("Fejl:", errors);
    return false;
  }
  return true;
}

async function checkAccess() {
  // Test adgang til checkout branding
  const query = `
    query {
      checkoutProfiles(first: 1) {
        edges {
          node {
            id
            name
            isPublished
          }
        }
      }
    }
  `;

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": ADMIN_TOKEN,
    },
    body: JSON.stringify({ query }),
  });

  const data = await res.json();
  if (res.status === 401 || res.status === 403) {
    return { ok: false, error: "Uautoriseret — tjek at token er korrekt og har de rette scopes." };
  }
  if (data.errors) {
    return { ok: false, error: JSON.stringify(data.errors) };
  }

  const profiles = data.data?.checkoutProfiles?.edges;
  return {
    ok: true,
    profileId: profiles?.[0]?.node?.id,
    profileName: profiles?.[0]?.node?.name,
  };
}

async function main() {
  console.log(`\n🛍️  Shopify Checkout CSS Injector`);
  console.log(`Shop: ${SHOP}\n`);

  console.log("1. Tjekker adgang til Admin API...");
  const access = await checkAccess();

  if (!access.ok) {
    console.error(`❌ Adgangsfejl: ${access.error}`);
    console.log("\n📋 Manuel løsning:");
    console.log("   Gå til: Shopify Admin → Settings → Checkout → Customize");
    console.log("   Find 'Additional CSS' eller 'Custom CSS' feltet og indsæt:\n");
    console.log(HIDE_BUNDLE_CSS);
    process.exit(1);
  }

  console.log(`✅ API adgang OK — Checkout profil: "${access.profileName}" (${access.profileId})`);
  console.log("\n⚠️  Note: Shopify Branding API understøtter ikke rå CSS direkte.");
  console.log("   Brug i stedet den manuelle metode:");
  console.log("\n📋 Manuel opsætning (anbefalet):");
  console.log("   1. Gå til: https://textilogvoksdug-dk.myshopify.com/admin/themes/191515623757/editor");
  console.log("   2. Skift til 'Checkout and customer accounts' visning");
  console.log("   3. Find CSS-feltet (kan kræve Shopify Plus)");
  console.log("   4. Indsæt følgende CSS:\n");
  console.log(HIDE_BUNDLE_CSS);
  console.log("\n📋 Alternativ — Inspect metoden:");
  console.log("   1. Gå til checkout med en vare i kurven");
  console.log("   2. Højreklik på 'Vis 200 varer' → Undersøg element");
  console.log("   3. Find det rigtige CSS class-navn");
  console.log("   4. Indsæt CSS i Shopify admin\n");
}

main().catch(console.error);
