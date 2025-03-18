import {useLoaderData, Link} from '@remix-run/react';
import {Image, Money} from '@shopify/hydrogen';
import {useState} from 'react';

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

  // Get color options from the product options
  const colorOption = product.options.find(option => option.name === 'Color');
  const colorValues = colorOption?.optionValues || [];

  // Find the default variant (first available one)
  const defaultVariant = product.variants.nodes.find(v => v.availableForSale) || product.variants.nodes[0];
  
  // State for selected variant and hover state
  const [selectedVariant, setSelectedVariant] = useState(defaultVariant);
  const [hoveredColor, setHoveredColor] = useState(null);

  // Function to find variant by color
  const getVariantByColor = (colorName) => {
    return product.variants.nodes.find(
      variant => variant.selectedOptions.find(opt => opt.name === 'Color')?.value === colorName
    );
  };

  // Get the current image to display (hover image or selected variant image)
  const currentImage = selectedVariant?.image;
  const hoverImage = hoveredColor 
    ? colorValues.find(c => c.name === selectedVariant.title)?.swatch?.image?.previewImage
    : null;

  return (
    <div className="product-details">
      <div 
        className="product-image"
        onMouseEnter={() => setHoveredColor(true)}
        onMouseLeave={() => setHoveredColor(null)}
      >
        {(hoveredColor ? hoverImage : currentImage) && (
          <Image
            data={{
              url: (hoveredColor ? hoverImage : currentImage).url,
              altText: (hoveredColor ? hoverImage : currentImage).altText,
              width: 654,
              height: 654
            }}
            aspectRatio="1/1"
            sizes="(min-width: 45em) 50vw, 100vw"
          />
        )}
      </div>
      <div className="product-info">
        <h4 className="vendor">{product.vendor}</h4>
        <h1 className="product-title">{product.title}</h1>
        <div className="product-price">
          {selectedVariant?.compareAtPrice ? (
            <>
              <s><Money data={selectedVariant.compareAtPrice} /></s>{' '}
              <Money className="price-on-sale" data={selectedVariant.price} />
            </>
          ) : (
            <Money data={selectedVariant?.price} />
          )}
        </div>

        {/* Color swatches */}
        <div className="color-options">
          {colorValues.map((color) => {
            const variant = getVariantByColor(color.name);
            return (
              <button
                key={color.name}
                className={`color-swatch ${!variant?.availableForSale ? 'sold-out' : ''} ${selectedVariant?.title === color.name ? 'selected' : ''}`}
                style={{backgroundColor: color.swatch.color}}
                disabled={!variant?.availableForSale}
                onClick={() => variant && setSelectedVariant(variant)}
                title={`${color.name}${!variant?.availableForSale ? ' (Sold Out)' : ''}`}
              />
            );
          })}
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
