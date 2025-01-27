import { useEffect } from "react";
import { useFetcher } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  Box,
  List,
  Link,
  InlineStack,
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);

  return null;
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const color = ["Red", "Orange", "Yellow", "Green"][
    Math.floor(Math.random() * 4)
  ];
  const response = await admin.graphql(
    `#graphql
      mutation populateProduct($product: ProductCreateInput!) {
        productCreate(product: $product) {
          product {
            id
            title
            handle
            status
            variants(first: 10) {
              edges {
                node {
                  id
                  price
                  barcode
                  createdAt
                }
              }
            }
          }
        }
      }`,
    {
      variables: {
        product: {
          title: `${color} Snowboard`,
        },
      },
    },
  );
  const responseJson = await response.json();
  const product = responseJson.data.productCreate.product;
  const variantId = product.variants.edges[0].node.id;
  const variantResponse = await admin.graphql(
    `#graphql
    mutation shopifyRemixTemplateUpdateVariant($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
      productVariantsBulkUpdate(productId: $productId, variants: $variants) {
        productVariants {
          id
          price
          barcode
          createdAt
        }
      }
    }`,
    {
      variables: {
        productId: product.id,
        variants: [{ id: variantId, price: "100.00" }],
      },
    },
  );
  const variantResponseJson = await variantResponse.json();

  return {
    product: responseJson.data.productCreate.product,
    variant: variantResponseJson.data.productVariantsBulkUpdate.productVariants,
  };
};

export default function Index() {
  const fetcher = useFetcher();
  const shopify = useAppBridge();
  const isLoading =
    ["loading", "submitting"].includes(fetcher.state) &&
    fetcher.formMethod === "POST";
  const productId = fetcher.data?.product?.id.replace(
    "gid://shopify/Product/",
    "",
  );

  useEffect(() => {
    if (productId) {
      shopify.toast.show("Product created");
    }
  }, [productId, shopify]);
  const generateProduct = () => fetcher.submit({}, { method: "POST" });

  return (
    <Page>
      <TitleBar title="Welcome to the Snowboard team extention App!">
     
      </TitleBar>
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="500">
                <BlockStack gap="200">
                  <Text as="p" variant="">
                  This app helps you dynamically display sports team information (name, image, and URL) on specific product pages in your Shopify store. Follow the steps below to set it up and make it work seamlessly. 🎉
                  </Text>
                  <Text variant="headingMd" as="p">
                  Step 1: Assign Sports Team Information to Products via Metafields
                  </Text>
                </BlockStack>
                <BlockStack gap="200">
                  <Text as="h3" variant="headingMd">
                  Step 2: Enable the Sports Team Display on Your Store:
                  </Text>
                </BlockStack>
                <BlockStack gap="200">
                  <Text as="li" variant="bodyMd">
                  In Shopify admin, navigate to Online Store - Themes - Customize.
                  </Text>
                </BlockStack>
                <BlockStack gap="200">
                  <Text as="li" variant="bodyMd">
                  In the theme editor, open the product template by selecting Products - snowboard Product template.
                  </Text>
                </BlockStack>
                <BlockStack gap="200">
                  <Text as="li" variant="bodyMd">
                  Click Add block in the left-hand menu.                  
                  </Text>
                </BlockStack>
                <BlockStack gap="200">
                  <Text as="li" variant="bodyMd">
                  Drag the section to the desired position on the product page (e.g., below the product description).                  
                  </Text>
                </BlockStack>
                <BlockStack gap="200">
                  <Text as="h3" variant="headingMd">
                  Step 3: Save changes
                  </Text>
                </BlockStack>
              </BlockStack>
            </Card>
          </Layout.Section>
  
        </Layout>
      </BlockStack>
    </Page>
  );
}
