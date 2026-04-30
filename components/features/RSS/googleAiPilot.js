import { BuildContent } from '@wpmedia/feeds-content-elements';
import { BuildPromoItems } from '@wpmedia/feeds-promo-items';
import Consumer from 'fusion:consumer';
import { ENVIRONMENT, resizerKey } from 'fusion:environment';
import PropTypes from 'fusion:prop-types';
import getProperties from 'fusion:properties';
import moment from 'moment';
import URL from 'url';
const jmespath = require('jmespath');

const GoogleAiPilotRSS = ({ globalContent, customFields, arcSite, requestUri }) => {
  const {
    resizerURLs = {},
    feedDomainURL = '',
    feedTitle = '',
    feedLanguage = '',
  } = getProperties(arcSite);

  const resizerURL =
    resizerURLs?.[ENVIRONMENT] || getProperties(arcSite).resizerURL || '';

  const requestPath = new URL.URL(requestUri, feedDomainURL).pathname;
  const channelLanguage = customFields.channelLanguage || feedLanguage;

  const PromoItems = new BuildPromoItems();
  const rssBuildContent = new BuildContent();

  const elements = globalContent.content_elements || [];

  return {
    rss: {
      '@xmlns:content': 'http://purl.org/rss/1.0/modules/content/',
      '@xmlns:dcterms': 'http://purl.org/dc/terms/',
      '@xmlns:dc': 'http://purl.org/dc/elements/1.1/',
      '@xmlns:media': 'http://search.yahoo.com/mrss/',
      '@xmlns:atom': 'http://www.w3.org/2005/Atom',
      '@xmlns:licensed_news': 'https://www.google.com/schemas/rss-licensed-news/',
      '@version': '2.0',

      channel: {
        title: { $: customFields.channelTitle || feedTitle },
        link: feedDomainURL,

        'atom:link': {
          '@href': `${feedDomainURL}${requestPath}`,
          '@rel': 'self',
          '@type': 'application/rss+xml',
        },

        description: {
          $: customFields.channelDescription || `${feedTitle} News Feed`,
        },

        lastBuildDate: moment.utc(new Date()).format('ddd, DD MMM YYYY HH:mm:ss ZZ'),

        ...(channelLanguage && { language: channelLanguage }),

        'licensed_news:publication': {
          'licensed_news:name': feedTitle || 'News Feed',
          'licensed_news:language': channelLanguage || 'en',
        },

        item: elements.map(ans => {
          const url = `${feedDomainURL}${ans.website_url || ans.canonical_url || ''}`;

          const authorRaw = jmespath.search(ans, customFields.itemCredits);
          const author = Array.isArray(authorRaw)
            ? authorRaw
            : authorRaw
            ? [authorRaw]
            : [];

          const body = rssBuildContent.parse(
            ans.content_elements || [],
            customFields.includeContent,
            feedDomainURL,
            resizerKey,
            resizerURL,
            1200,
            0,
            customFields.videoSelect
          );

          const img = PromoItems.mediaTag({
            ans,
            promoItemsJmespath: customFields.promoItemsJmespath,
            resizerKey,
            resizerURL,
            resizerWidth: 1200,
            resizerHeight: 0,
          });

          return {
            title: { $: jmespath.search(ans, customFields.itemTitle) || '' },
            link: url,

            ...(customFields.itemDescription && {
              description: {
                $: jmespath.search(ans, customFields.itemDescription) || '',
              },
            }),

            guid: { '#': url, '@isPermaLink': true },

            pubDate: moment
              .utc(ans[customFields.pubDate])
              .format('ddd, DD MMM YYYY HH:mm:ss ZZ'),

            ...(ans.display_date && {
              'dcterms:modified': moment
                .utc(ans.display_date)
                .format('YYYY-MM-DDTHH:mm:ssZ'),
            }),

            ...(author.length && {
              'dc:creator': { $: author.join(', ') },
            }),

            ...(body && body.trim() && customFields.isOutputContentEncoded && {
              'content:encoded': { $: body },
            }),

            ...(customFields.includePromo && img && { '#': img }),
          };
        }),
      },
    },
  };
};

GoogleAiPilotRSS.propTypes = {
  customFields: PropTypes.object,
};

GoogleAiPilotRSS.label = 'RSS - Google AI Pilot - Arena';
GoogleAiPilotRSS.icon = 'arc-rss';

export default Consumer(GoogleAiPilotRSS);
