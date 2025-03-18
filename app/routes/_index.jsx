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
    <div className="flex flex-col">
      <div 
        className="w-[315px] relative"
        onMouseEnter={() => setHoveredColor(true)}
        onMouseLeave={() => setHoveredColor(null)}
      >

        {/* Check if product is on sale, show badge if so */}
        {selectedVariant?.compareAtPrice && (
          <div className="absolute top-2 left-2 border border-red-600 text-red-600 text-base px-2 py-1 rounded-[25px] gothicFont font-medium">
            On Sale!
          </div>
        )}

        {(hoveredColor ? hoverImage : currentImage) && (
          <Image
            data={{
              url: (hoveredColor ? hoverImage : currentImage).url,
              altText: (hoveredColor ? hoverImage : currentImage).altText,
              width: 275,
              height: 301
            }}
            aspectRatio="1/1"
            sizes="(min-width: 45em) 50vw, 100vw"
            className="rounded-[10px] border border-gray-300"
          />
        )}
      </div>
      <div className="product-info">
        {/* Color swatches */}
        <div className="flex gap-2.5 my-3">
          {colorValues.map((color) => {
            const variant = getVariantByColor(color.name);
            return (
              <button
                key={color.name}
                className={`color-swatch rounded-full w-[20px] h-[20px] ${!variant?.availableForSale ? 'sold-out' : ''} ${selectedVariant?.title === color.name ? 'selected' : ''}`}
                style={{backgroundColor: color.swatch.color}}
                disabled={!variant?.availableForSale}
                onClick={() => variant && setSelectedVariant(variant)}
                title={`${color.name}${!variant?.availableForSale ? ' (Sold Out)' : ''}`}
              />
            );
          })}
        </div>

        <h4 className="text-sm">{product.vendor}</h4>
        <h1 className="text-base my-6 leading-normal font-medium text-[#0A4874]">{product.title}</h1>
        <div className="flex items-center space-x-2 text-sm">
          {selectedVariant?.compareAtPrice ? (
            <>
              <s><Money data={selectedVariant.compareAtPrice} /></s>
              <Money className="text-red-600" data={selectedVariant.price} />
            </>
          ) : (
            <Money className="font-semibold" data={selectedVariant?.price} />
          )}
        </div>
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
