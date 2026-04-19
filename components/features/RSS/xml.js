import { BuildContent } from '@wpmedia/feeds-content-elements';
import { BuildPromoItems } from '@wpmedia/feeds-promo-items';
import { generatePropsForFeed } from '@wpmedia/feeds-prop-types';
import { buildResizerURL } from '@wpmedia/feeds-resizer';
import Consumer from 'fusion:consumer';
import { ENVIRONMENT, resizerKey } from 'fusion:environment';
import PropTypes from 'fusion:prop-types';
import getProperties from 'fusion:properties';
import moment from 'moment';
import URL from 'url';

const jmespath = require('jmespath');


const isAIPilotFeed = (config = {}) =>
  config.feedType === 'ai-pilot' ||
  (config.requestPath &&
    config.requestPath.includes('google-news-ai-pilot-feed'));

const rssTemplate = (elements, config) => {
  const aiPilot = isAIPilotFeed(config);

  return {
    rss: {
      '@xmlns:atom': 'http://www.w3.org/2005/Atom',
      '@xmlns:content': 'http://purl.org/rss/1.0/modules/content/',
      '@xmlns:media': 'http://search.yahoo.com/mrss/',
      '@xmlns:category': 'http://www.arena.com/rss/category/',
      
      ...(config.itemCredits && {
        '@xmlns:dc': 'http://purl.org/dc/elements/1.1/',
      }),

      ...(config.channelUpdatePeriod &&
        config.channelUpdatePeriod !== 'Exclude field' && {
          '@xmlns:sy': 'http://purl.org/rss/1.0/modules/syndication/',
        }),

      ...(aiPilot && {
        '@xmlns:dcterms': 'http://purl.org/dc/terms/',
        '@xmlns:licensed_news':
          'https://www.google.com/schemas/rss-licensed-news/',
      }),

      '@version': '2.0',

      channel: {
        title: { $: config.channelTitle || config.feedTitle },
        link: config.domain,

        'atom:link': {
          '@href': `${config.domain}${config.requestPath}`,
          '@rel': 'self',
          '@type': 'application/rss+xml',
        },

        description: {
          $: config.channelDescription || `${config.feedTitle} News Feed`,
        },

        lastBuildDate: moment
          .utc()
          .format('ddd, DD MMM YYYY HH:mm:ss ZZ'),

        ...(config.channelLanguage && {
          language: config.channelLanguage,
        }),

        ...(config.channelCategory && {
          category: config.channelCategory,
        }),

        ...(config.channelTTL && {
          ttl: config.channelTTL,
        }),

        ...(config.channelCopyright && {
          copyright: config.channelCopyright,
        }),

        ...(config.channelUpdatePeriod &&
          !aiPilot && {
            'sy:updatePeriod': config.channelUpdatePeriod,
          }),

        ...(config.channelUpdateFrequency &&
          !aiPilot && {
            'sy:updateFrequency': config.channelUpdateFrequency,
          }),

        ...(config.channelLogo && {
          image: {
            url: buildResizerURL(
              config.channelLogo,
              resizerKey,
              config.resizerURL
            ),
            title: config.channelTitle || config.feedTitle,
            link: config.domain,
          },
        }),

        item: elements.map(ans => {
          let category;

          const url = `${config.domain}${
            ans.website_url || ans.canonical_url || ''
          }`;

          const sectionName = ans.taxonomy?.primary_section?.name;
          const sectionId = ans.taxonomy?.primary_section?._id;
          const isSponsored = ans.owner?.sponsored;

          const img = config.includePromo
            ? config.PromoItems?.mediaTag({
                ans,
                promoItemsJmespath: config.promoItemsJmespath,
                resizerKey: config.resizerKey,
                resizerURL: config.resizerURL,
                resizerWidth: config.resizerWidth,
                resizerHeight: config.resizerHeight,
                imageTitle: config.imageTitle,
                imageCaption: config.imageCaption,
                imageCredits: config.imageCredits,
                videoSelect: config.videoSelect,
              })
            : null;

          const body =
            config.includeContent !== 0
              ? config.rssBuildContent?.parse(
                  ans.content_elements || [],
                  config.includeContent,
                  config.domain,
                  config.resizerKey,
                  config.resizerURL,
                  config.resizerWidth,
                  config.resizerHeight,
                  config.videoSelect
                )
              : null;

          const author =
            config.itemCredits &&
            jmespath.search(ans, config.itemCredits);

          const item = {
            ...(config.itemTitle && {
              title: {
                $: jmespath.search(ans, config.itemTitle) || '',
              },
            }),

            link: url,

            guid: {
              '#': url,
              '@isPermaLink': true,
            },

            ...(author &&
              author.length && {
                dc: {
                  creator: { $: author.join(', ') },
                },
              }),

            ...(config.itemDescription && {
              description: {
                $: jmespath.search(ans, config.itemDescription) || '',
              },
            }),

            pubDate: moment
              .utc(ans[config.pubDate])
              .format('ddd, DD MMM YYYY HH:mm:ss ZZ'),

            ...(config.itemCategory &&
              (category = jmespath.search(ans, config.itemCategory)) &&
              category && {
                category,
              }),

            ...(body &&
              {
                'content:encoded': {
                  $: body,
                },
              }),

            ...(config.includePromo && img && { '#': img }),

            ...(sectionName && { category: sectionName }),
            ...(sectionId && { 'category:id': sectionId }),
            ...(isSponsored && { 'category:sponsored': isSponsored }),

            ...(aiPilot && {
              'licensed_news:publication': {
                'licensed_news:name': config.feedTitle,
                'licensed_news:language':
                  config.channelLanguage || 'en',
              },
              'licensed_news:publication_date': moment
                .utc(ans[config.pubDate])
                .format(),
            }),
          };

          return item;
        }),
      },
    },
  };
};

export function Rss({
  globalContent,
  customFields,
  arcSite,
  requestUri,
}) {
  let { resizerURL = '' } = getProperties(arcSite);

  const {
    resizerURLs = {},
    feedDomainURL = 'https://localhost.com',
    feedTitle = '',
    feedLanguage = '',
  } = getProperties(arcSite);

  resizerURL = resizerURLs?.[ENVIRONMENT] || resizerURL;

  const requestPath = new URL.URL(requestUri, feedDomainURL).pathname;

  const PromoItems = new BuildPromoItems();
  const rssBuildContent = new BuildContent();

  const { width = 0, height = 0 } =
    customFields.resizerKVP || {};

  return rssTemplate(
    globalContent.content_elements || [],
    {
      ...customFields,

      requestPath,
      resizerURL,
      resizerWidth: width,
      resizerHeight: height,

      domain: feedDomainURL,
      feedTitle,
      channelLanguage:
        customFields.channelLanguage || feedLanguage,

      resizerKey,
      PromoItems,
      rssBuildContent,
    }
  );
}

Rss.propTypes = {
  customFields: PropTypes.shape({
    ...generatePropsForFeed('rss', PropTypes),

    feedType: PropTypes.string.tag({
      label: 'Feed Type (standard | ai-pilot)',
      defaultValue: 'standard',
    }),

    isOutputContentEncoded: PropTypes.bool.tag({
      label: 'Output Content Encoded',
      defaultValue: true,
    }),
  }),
};

Rss.label = 'RSS Standard + AI Pilot (Stable)';
Rss.icon = 'arc-rss';

export default Consumer(Rss);
