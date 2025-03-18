import {useLoaderData, Link} from '@remix-run/react';
import {Image, Money} from '@shopify/hydrogen';

/**
 * @type {MetaFunction}
 */
export const meta = () => {
  return [{title: 'Hydrogen | Product Details'}];
};

/**
 * @param {LoaderFunctionArgs} args
 */
export async function loader({context}) {
  const {product} = await context.storefront.query(PRODUCT_DETAILS_QUERY, {
    variables: {
      id: "gid://shopify/Product/8937529082115"
    },
  });

  return {product};
}

export default function ProductPage() {
  const {product} = useLoaderData();
  
  if (!product) return <div>Product not found</div>;

  const firstVariant = product.variants.nodes[0];
  const firstImage = firstVariant?.image;

  return (
    <div className="product-details">
      <div className="product-image">
        {firstImage && (
          <Image
            data={firstImage}
            aspectRatio="1/1"
            sizes="(min-width: 45em) 50vw, 100vw"
          />
        )}
      </div>
      <div className="product-info">
        <h4 className="vendor">{product.vendor}</h4>
        <h1 className="product-title">{product.title}</h1>
        <div className="product-price">
          {firstVariant?.compareAtPrice ? (
            <>
              <s><Money data={firstVariant.compareAtPrice} /></s>{' '}
              <Money className="price-on-sale" data={firstVariant.price} />
            </>
          ) : (
            <Money data={firstVariant?.price} />
          )}
        </div>
        <div className="product-description">{product.description}</div>
      </div>
    </div>
  );
}

const PRODUCT_DETAILS_QUERY = `#graphql
  query ProductDetails($id: ID!, $country: CountryCode, $language: LanguageCode) 
    @inContext(country: $country, language: $language) {
    product(id: $id) {
      id
      title
      vendor
      handle
      description
      
      # Get all variants with their options and images
      variants(first: 6) {
        nodes {
          id
          title
          availableForSale
          selectedOptions {
            name
            value
          }
          image {
            id
            url
            altText
            width
            height
          }
          price {
            amount
            currencyCode
          }
          compareAtPrice {
            amount
            currencyCode
          }
        }
      }
      
      # Price information
      compareAtPriceRange {
        maxVariantPrice {
          amount
          currencyCode
        }
        minVariantPrice {
          amount
          currencyCode
        }
      }
      
      # Product options
      options {
        id
        name
        optionValues {
          name
          firstSelectableVariant {
            selectedOptions {
              name
              value
            }
          }
          swatch {
            color
            image {
              previewImage {
                url
                altText
              }
            }
          }
        }
      }
    }
  }
`;
