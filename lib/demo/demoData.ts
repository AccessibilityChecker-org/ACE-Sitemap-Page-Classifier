import type { AnalysisResult, ClassifiedURL, CategoryGroup } from '@/types'

// Sample product URLs (15 samples)
const productUrls: ClassifiedURL[] = [
  { url: 'https://gemstoneking.com/products/diamond-engagement-ring-1-5ct', category: 'Product Pages', pageType: 'template', templateClusterId: 'gemstoneking.com/products/{var}', weightedValue: 1.0, notes: 'Individual product detail pages' },
  { url: 'https://gemstoneking.com/products/sapphire-bracelet-sterling-silver', category: 'Product Pages', pageType: 'content', templateClusterId: 'gemstoneking.com/products/{var}', weightedValue: 0.2, notes: 'Individual product detail pages' },
  { url: 'https://gemstoneking.com/products/emerald-pendant-necklace-14k-gold', category: 'Product Pages', pageType: 'content', templateClusterId: 'gemstoneking.com/products/{var}', weightedValue: 0.2, notes: 'Individual product detail pages' },
  { url: 'https://gemstoneking.com/products/ruby-halo-engagement-ring', category: 'Product Pages', pageType: 'content', templateClusterId: 'gemstoneking.com/products/{var}', weightedValue: 0.2, notes: 'Individual product detail pages' },
  { url: 'https://gemstoneking.com/products/aquamarine-stud-earrings', category: 'Product Pages', pageType: 'content', templateClusterId: 'gemstoneking.com/products/{var}', weightedValue: 0.2, notes: 'Individual product detail pages' },
  { url: 'https://gemstoneking.com/products/amethyst-cocktail-ring-sterling', category: 'Product Pages', pageType: 'content', templateClusterId: 'gemstoneking.com/products/{var}', weightedValue: 0.2, notes: 'Individual product detail pages' },
  { url: 'https://gemstoneking.com/products/pearl-drop-earrings-14k-yellow-gold', category: 'Product Pages', pageType: 'content', templateClusterId: 'gemstoneking.com/products/{var}', weightedValue: 0.2, notes: 'Individual product detail pages' },
  { url: 'https://gemstoneking.com/products/tanzanite-solitaire-ring-platinum', category: 'Product Pages', pageType: 'content', templateClusterId: 'gemstoneking.com/products/{var}', weightedValue: 0.2, notes: 'Individual product detail pages' },
  { url: 'https://gemstoneking.com/products/opal-pendant-rose-gold', category: 'Product Pages', pageType: 'content', templateClusterId: 'gemstoneking.com/products/{var}', weightedValue: 0.2, notes: 'Individual product detail pages' },
  { url: 'https://gemstoneking.com/products/garnet-eternity-band', category: 'Product Pages', pageType: 'content', templateClusterId: 'gemstoneking.com/products/{var}', weightedValue: 0.2, notes: 'Individual product detail pages' },
  { url: 'https://gemstoneking.com/products/blue-topaz-tennis-bracelet', category: 'Product Pages', pageType: 'content', templateClusterId: 'gemstoneking.com/products/{var}', weightedValue: 0.2, notes: 'Individual product detail pages' },
  { url: 'https://gemstoneking.com/products/citrine-drop-necklace-14k', category: 'Product Pages', pageType: 'content', templateClusterId: 'gemstoneking.com/products/{var}', weightedValue: 0.2, notes: 'Individual product detail pages' },
  { url: 'https://gemstoneking.com/products/peridot-studs-white-gold', category: 'Product Pages', pageType: 'content', templateClusterId: 'gemstoneking.com/products/{var}', weightedValue: 0.2, notes: 'Individual product detail pages' },
  { url: 'https://gemstoneking.com/products/black-diamond-men-ring', category: 'Product Pages', pageType: 'content', templateClusterId: 'gemstoneking.com/products/{var}', weightedValue: 0.2, notes: 'Individual product detail pages' },
  { url: 'https://gemstoneking.com/products/morganite-engagement-ring-vintage', category: 'Product Pages', pageType: 'content', templateClusterId: 'gemstoneking.com/products/{var}', weightedValue: 0.2, notes: 'Individual product detail pages' },
]

// Collection URLs (15 samples)
const collectionUrls: ClassifiedURL[] = [
  { url: 'https://gemstoneking.com/collections/engagement-rings', category: 'Collection Pages', pageType: 'template', templateClusterId: 'gemstoneking.com/collections/{var}', weightedValue: 1.0, notes: 'Shopify collection pages' },
  { url: 'https://gemstoneking.com/collections/diamond-rings', category: 'Collection Pages', pageType: 'content', templateClusterId: 'gemstoneking.com/collections/{var}', weightedValue: 0.2, notes: 'Shopify collection pages' },
  { url: 'https://gemstoneking.com/collections/sapphire-jewelry', category: 'Collection Pages', pageType: 'content', templateClusterId: 'gemstoneking.com/collections/{var}', weightedValue: 0.2, notes: 'Shopify collection pages' },
  { url: 'https://gemstoneking.com/collections/bridal-sets', category: 'Collection Pages', pageType: 'content', templateClusterId: 'gemstoneking.com/collections/{var}', weightedValue: 0.2, notes: 'Shopify collection pages' },
  { url: 'https://gemstoneking.com/collections/pearl-jewelry', category: 'Collection Pages', pageType: 'content', templateClusterId: 'gemstoneking.com/collections/{var}', weightedValue: 0.2, notes: 'Shopify collection pages' },
  { url: 'https://gemstoneking.com/collections/ruby-jewelry', category: 'Collection Pages', pageType: 'content', templateClusterId: 'gemstoneking.com/collections/{var}', weightedValue: 0.2, notes: 'Shopify collection pages' },
  { url: 'https://gemstoneking.com/collections/emerald-jewelry', category: 'Collection Pages', pageType: 'content', templateClusterId: 'gemstoneking.com/collections/{var}', weightedValue: 0.2, notes: 'Shopify collection pages' },
  { url: 'https://gemstoneking.com/collections/birthday-gifts', category: 'Collection Pages', pageType: 'content', templateClusterId: 'gemstoneking.com/collections/{var}', weightedValue: 0.2, notes: 'Shopify collection pages' },
  { url: 'https://gemstoneking.com/collections/anniversary-gifts', category: 'Collection Pages', pageType: 'content', templateClusterId: 'gemstoneking.com/collections/{var}', weightedValue: 0.2, notes: 'Shopify collection pages' },
  { url: 'https://gemstoneking.com/collections/mothers-day', category: 'Collection Pages', pageType: 'content', templateClusterId: 'gemstoneking.com/collections/{var}', weightedValue: 0.2, notes: 'Shopify collection pages' },
  { url: 'https://gemstoneking.com/collections/gold-jewelry', category: 'Collection Pages', pageType: 'content', templateClusterId: 'gemstoneking.com/collections/{var}', weightedValue: 0.2, notes: 'Shopify collection pages' },
  { url: 'https://gemstoneking.com/collections/silver-jewelry', category: 'Collection Pages', pageType: 'content', templateClusterId: 'gemstoneking.com/collections/{var}', weightedValue: 0.2, notes: 'Shopify collection pages' },
  { url: 'https://gemstoneking.com/collections/mens-jewelry', category: 'Collection Pages', pageType: 'content', templateClusterId: 'gemstoneking.com/collections/{var}', weightedValue: 0.2, notes: 'Shopify collection pages' },
  { url: 'https://gemstoneking.com/collections/under-100', category: 'Collection Pages', pageType: 'content', templateClusterId: 'gemstoneking.com/collections/{var}', weightedValue: 0.2, notes: 'Shopify collection pages' },
  { url: 'https://gemstoneking.com/collections/new-arrivals', category: 'Collection Pages', pageType: 'content', templateClusterId: 'gemstoneking.com/collections/{var}', weightedValue: 0.2, notes: 'Shopify collection pages' },
]

// Blog URLs (12 samples)
const blogUrls: ClassifiedURL[] = [
  { url: 'https://gemstoneking.com/blogs/news/how-to-choose-a-diamond', category: 'Blog Posts', pageType: 'template', templateClusterId: 'gemstoneking.com/blogs/news/{var}', weightedValue: 1.0, notes: 'Individual blog post or article pages' },
  { url: 'https://gemstoneking.com/blogs/news/engagement-ring-buying-guide', category: 'Blog Posts', pageType: 'content', templateClusterId: 'gemstoneking.com/blogs/news/{var}', weightedValue: 0.2, notes: 'Individual blog post or article pages' },
  { url: 'https://gemstoneking.com/blogs/news/sapphire-vs-diamond-which-is-right', category: 'Blog Posts', pageType: 'content', templateClusterId: 'gemstoneking.com/blogs/news/{var}', weightedValue: 0.2, notes: 'Individual blog post or article pages' },
  { url: 'https://gemstoneking.com/blogs/news/birthstone-guide-january-to-december', category: 'Blog Posts', pageType: 'content', templateClusterId: 'gemstoneking.com/blogs/news/{var}', weightedValue: 0.2, notes: 'Individual blog post or article pages' },
  { url: 'https://gemstoneking.com/blogs/news/how-to-clean-gemstone-jewelry', category: 'Blog Posts', pageType: 'content', templateClusterId: 'gemstoneking.com/blogs/news/{var}', weightedValue: 0.2, notes: 'Individual blog post or article pages' },
  { url: 'https://gemstoneking.com/blogs/news/gold-vs-silver-jewelry-comparison', category: 'Blog Posts', pageType: 'content', templateClusterId: 'gemstoneking.com/blogs/news/{var}', weightedValue: 0.2, notes: 'Individual blog post or article pages' },
  { url: 'https://gemstoneking.com/blogs/news/top-10-ruby-rings-2024', category: 'Blog Posts', pageType: 'content', templateClusterId: 'gemstoneking.com/blogs/news/{var}', weightedValue: 0.2, notes: 'Individual blog post or article pages' },
  { url: 'https://gemstoneking.com/blogs/news/pearl-grading-guide', category: 'Blog Posts', pageType: 'content', templateClusterId: 'gemstoneking.com/blogs/news/{var}', weightedValue: 0.2, notes: 'Individual blog post or article pages' },
  { url: 'https://gemstoneking.com/blogs/news/engagement-proposal-ideas', category: 'Blog Posts', pageType: 'content', templateClusterId: 'gemstoneking.com/blogs/news/{var}', weightedValue: 0.2, notes: 'Individual blog post or article pages' },
  { url: 'https://gemstoneking.com/blogs/news/history-of-gemstones', category: 'Blog Posts', pageType: 'content', templateClusterId: 'gemstoneking.com/blogs/news/{var}', weightedValue: 0.2, notes: 'Individual blog post or article pages' },
  { url: 'https://gemstoneking.com/blogs/news/celebrity-engagement-rings', category: 'Blog Posts', pageType: 'content', templateClusterId: 'gemstoneking.com/blogs/news/{var}', weightedValue: 0.2, notes: 'Individual blog post or article pages' },
  { url: 'https://gemstoneking.com/blogs/news/summer-jewelry-trends', category: 'Blog Posts', pageType: 'content', templateClusterId: 'gemstoneking.com/blogs/news/{var}', weightedValue: 0.2, notes: 'Individual blog post or article pages' },
]

// Static pages
const staticUrls: ClassifiedURL[] = [
  { url: 'https://gemstoneking.com/pages/about-us', category: 'Static Pages', pageType: 'unique', templateClusterId: 'gemstoneking.com/pages/{var}', weightedValue: 1.0, notes: 'Static informational pages' },
  { url: 'https://gemstoneking.com/pages/contact', category: 'Static Pages', pageType: 'unique', templateClusterId: 'gemstoneking.com/pages/{var}', weightedValue: 1.0, notes: 'Static informational pages' },
  { url: 'https://gemstoneking.com/pages/sizing-guide', category: 'Static Pages', pageType: 'unique', templateClusterId: 'gemstoneking.com/pages/{var}', weightedValue: 1.0, notes: 'Static informational pages' },
  { url: 'https://gemstoneking.com/pages/shipping-information', category: 'Static Pages', pageType: 'unique', templateClusterId: 'gemstoneking.com/pages/{var}', weightedValue: 1.0, notes: 'Static informational pages' },
  { url: 'https://gemstoneking.com/pages/our-guarantee', category: 'Static Pages', pageType: 'unique', templateClusterId: 'gemstoneking.com/pages/{var}', weightedValue: 1.0, notes: 'Static informational pages' },
  { url: 'https://gemstoneking.com/pages/gift-wrapping', category: 'Static Pages', pageType: 'unique', templateClusterId: 'gemstoneking.com/pages/{var}', weightedValue: 1.0, notes: 'Static informational pages' },
  { url: 'https://gemstoneking.com/pages/custom-jewelry', category: 'Static Pages', pageType: 'unique', templateClusterId: 'gemstoneking.com/pages/{var}', weightedValue: 1.0, notes: 'Static informational pages' },
  { url: 'https://gemstoneking.com/pages/wholesale', category: 'Static Pages', pageType: 'unique', templateClusterId: 'gemstoneking.com/pages/{var}', weightedValue: 1.0, notes: 'Static informational pages' },
  { url: 'https://gemstoneking.com/pages/press', category: 'Static Pages', pageType: 'unique', templateClusterId: 'gemstoneking.com/pages/{var}', weightedValue: 1.0, notes: 'Static informational pages' },
  { url: 'https://gemstoneking.com/pages/careers', category: 'Static Pages', pageType: 'unique', templateClusterId: 'gemstoneking.com/pages/{var}', weightedValue: 1.0, notes: 'Static informational pages' },
  { url: 'https://gemstoneking.com/pages/affiliate-program', category: 'Static Pages', pageType: 'unique', templateClusterId: 'gemstoneking.com/pages/{var}', weightedValue: 1.0, notes: 'Static informational pages' },
  { url: 'https://gemstoneking.com/pages/store-locator', category: 'Static Pages', pageType: 'unique', templateClusterId: 'gemstoneking.com/pages/{var}', weightedValue: 1.0, notes: 'Static informational pages' },
  { url: 'https://gemstoneking.com/pages/faq', category: 'Static Pages', pageType: 'unique', templateClusterId: 'gemstoneking.com/pages/{var}', weightedValue: 1.0, notes: 'Static informational pages' },
  { url: 'https://gemstoneking.com/pages/appraisal-services', category: 'Static Pages', pageType: 'unique', templateClusterId: 'gemstoneking.com/pages/{var}', weightedValue: 1.0, notes: 'Static informational pages' },
  { url: 'https://gemstoneking.com/pages/cleaning-maintenance', category: 'Static Pages', pageType: 'unique', templateClusterId: 'gemstoneking.com/pages/{var}', weightedValue: 1.0, notes: 'Static informational pages' },
  { url: 'https://gemstoneking.com/policies/privacy-policy', category: 'Static Pages', pageType: 'unique', templateClusterId: null, weightedValue: 1.0, notes: 'Static informational pages' },
  { url: 'https://gemstoneking.com/policies/terms-of-service', category: 'Static Pages', pageType: 'unique', templateClusterId: null, weightedValue: 1.0, notes: 'Static informational pages' },
  { url: 'https://gemstoneking.com/policies/refund-policy', category: 'Static Pages', pageType: 'unique', templateClusterId: null, weightedValue: 1.0, notes: 'Static informational pages' },
  { url: 'https://gemstoneking.com/policies/shipping-policy', category: 'Static Pages', pageType: 'unique', templateClusterId: null, weightedValue: 1.0, notes: 'Static informational pages' },
]

// Homepage
const homepageUrls: ClassifiedURL[] = [
  { url: 'https://gemstoneking.com/', category: 'Homepage', pageType: 'unique', templateClusterId: null, weightedValue: 1.0, notes: 'Root domain homepage' },
]

// Blog Index
const blogIndexUrls: ClassifiedURL[] = [
  { url: 'https://gemstoneking.com/blogs/news', category: 'Blog Index', pageType: 'unique', templateClusterId: null, weightedValue: 1.0, notes: 'Blog/news index page (exact)' },
]

const allClassifiedUrls: ClassifiedURL[] = [
  ...homepageUrls,
  ...productUrls,
  ...collectionUrls,
  ...blogIndexUrls,
  ...blogUrls,
  ...staticUrls,
]

const categories: CategoryGroup[] = [
  {
    category: 'Product Pages',
    urls: productUrls,
    templateCount: 1,
    contentCount: 6181,
    uniqueCount: 0,
    dynamicCount: 0,
    rawCount: 6182,
    weightedCount: 1237,
    percentOfSite: 96.8,
    typeLabel: '1 template + 6181 content',
  },
  {
    category: 'Collection Pages',
    urls: collectionUrls,
    templateCount: 1,
    contentCount: 148,
    uniqueCount: 0,
    dynamicCount: 0,
    rawCount: 149,
    weightedCount: 31,
    percentOfSite: 2.3,
    typeLabel: '1 template + 148 content',
  },
  {
    category: 'Blog Posts',
    urls: blogUrls,
    templateCount: 1,
    contentCount: 34,
    uniqueCount: 0,
    dynamicCount: 0,
    rawCount: 35,
    weightedCount: 8,
    percentOfSite: 0.5,
    typeLabel: '1 template + 34 content',
  },
  {
    category: 'Static Pages',
    urls: staticUrls,
    templateCount: 0,
    contentCount: 0,
    uniqueCount: 19,
    dynamicCount: 0,
    rawCount: 19,
    weightedCount: 19,
    percentOfSite: 0.3,
    typeLabel: '19 unique',
  },
  {
    category: 'Homepage',
    urls: homepageUrls,
    templateCount: 0,
    contentCount: 0,
    uniqueCount: 1,
    dynamicCount: 0,
    rawCount: 1,
    weightedCount: 1,
    percentOfSite: 0.0,
    typeLabel: 'unique',
  },
  {
    category: 'Blog Index',
    urls: blogIndexUrls,
    templateCount: 0,
    contentCount: 0,
    uniqueCount: 1,
    dynamicCount: 0,
    rawCount: 1,
    weightedCount: 1,
    percentOfSite: 0.0,
    typeLabel: 'unique',
  },
]

export const demoAnalysis: AnalysisResult = {
  domain: 'gemstoneking.com',
  platform: 'Shopify',
  platformConfidence: 'high',
  rawPageCount: 6387,
  assetUrlsFiltered: 6361,
  templateTypesCount: 3,
  contentPagesCount: 6363,
  uniquePagesCount: 21,
  dynamicPagesCount: 0,
  weightedPageCount: 1297,
  analyzedAt: new Date().toISOString(),
  weights: { template: 1.0, unique: 1.0, content: 0.2, dynamic: 1.2 },
  categories,
  allClassifiedUrls,
}
