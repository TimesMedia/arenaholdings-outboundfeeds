import { BuildContent } from '@wpmedia/feeds-content-elements';
import { generatePropsForFeed } from '@wpmedia/feeds-prop-types';
import { buildResizerURL } from '@wpmedia/feeds-resizer';
import Consumer from 'fusion:consumer';
import { ENVIRONMENT, resizerKey } from 'fusion:environment';
import PropTypes from 'fusion:prop-types';
import getProperties from 'fusion:properties';
import moment from 'moment';
import URL from 'url';
const jmespath = require('jmespath');

const rssTemplate = (
  elements,
  {
    channelTitle,
    channelDescription,
    imageCaption,
    imageCredits,
    itemTitle,
    itemDescription,
    pubDate,
    itemCredits,
    includePromo,
    includeContent,
    videoSelect,
    requestPath,
    resizerURL,
    resizerWidth,
    resizerHeight,
    promoItemsJmespath,
    domain,
    feedTitle,
    channelLanguage,
    rssBuildContent,
  },
) => ({
  rss: {
    '@xmlns:content': 'http://purl.org/rss/1.0/modules/content/',
    '@xmlns:dcterms': 'http://purl.org/dc/terms/',
    '@xmlns:dc': 'http://purl.org/dc/elements/1.1/',
    '@xmlns:media': 'http://search.yahoo.com/mrss/',
    '@xmlns:atom': 'http://www.w3.org/2005/Atom',
    '@xmlns:licensed_news': 'https://www.google.com/schemas/rss-licensed-news/',
    '@version': '2.0',
    channel: {
      title: { $: channelTitle || feedTitle },
      link: domain,
      'atom:link': {
        '@href': `${domain}${requestPath}`,
        '@rel': 'self',
        '@type': 'application/rss+xml',
      },
      description: { $: channelDescription || `${feedTitle} News Feed` },
      lastBuildDate: moment.utc(new Date()).format('ddd, DD MMM YYYY HH:mm:ss ZZ'),
      ...(channelLanguage && { language: channelLanguage }),
      item: elements.map(ans => {
        const url = `${domain}${ans.website_url || ans.canonical_url || ''}`;
        const author = jmespath.search(ans, itemCredits);
        
        let body = ''; 
        
        if (includeContent !== 0) {
          const parsedBody = rssBuildContent.parse(
            ans.content_elements || [],
            includeContent,
            domain,
            resizerKey,
            resizerURL,
            resizerWidth,
            resizerHeight,
            videoSelect
          );
          
          if (parsedBody) {
            body = parsedBody;
            
            body = body.replace(/<(img|iframe|script|video|audio|picture|figure|a)[^>]*>([\s\S]*?<\/\1>)?/gi, '');
            body = body.replace(/<(img|iframe|script|video|audio)[^>]*\/?>/gi, '');
            
            body = body.replace(/<p>\s*Play\s*Video\s*<\/p>/gi, '');
            body = body.replace(/<p>\s*Listen\s*to\s*this\s*article\s*<\/p>/gi, '');
            body = body.replace(/Play\s*Video/gi, ''); 
            body = body.replace(/Listen\s*to\s*this\s*article/gi, '');

            body = body.replace(/<div[^>]*>/gi, '').replace(/<\/div>/gi, '');
            body = body.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, '');

            let oldBody;
            do {
              oldBody = body;
              body = body.replace(/<(p|span|small|h1|h2|h3|h4)[^>]*>\s*<\/\1>/gi, '');
            } while (body !== oldBody);

            body = body.trim();
          }
        }

        const promoItem = jmespath.search(ans, promoItemsJmespath);
        let manualImg = null;
        if (promoItem && promoItem.url) {
            const imgCaption = jmespath.search(promoItem, imageCaption) || jmespath.search(ans, 'headlines.basic') || '';
            const imgCredit = jmespath.search(promoItem, imageCredits);
            const imgUrl = buildResizerURL(promoItem.url, resizerKey, resizerURL, resizerWidth, resizerHeight);
            
            manualImg = {
                'media:content': {
                    '@url': imgUrl,
                    '@type': promoItem.content_type || 'image/jpeg',
                    '@width': resizerWidth || 1200,
                    '@height': resizerHeight || 800,
                    'media:title': { '#': imgCaption, '@type': 'plain' },
                    ...(imgCredit && imgCredit.length && { 
                        'media:credit': { '#': imgCredit.join(', '), '@role': 'author', '@scheme': 'urn:ebu' } 
                    })
                }
            };
        }

        return {
          title: { $: jmespath.search(ans, itemTitle) || '' },
          link: url,
          ...(itemDescription && { description: { $: jmespath.search(ans, itemDescription) || '' } }),
          guid: { '#': url, '@isPermaLink': true },
          pubDate: moment.utc(ans[pubDate]).format('ddd, DD MMM YYYY HH:mm:ss ZZ'),
          ...(ans.display_date && { 'dcterms:modified': moment.utc(ans.display_date).format('YYYY-MM-DDTHH:mm:ssZ') }),
          
          ...(author && author.length && { 'dcterms:creator': author.join(', ') }),
          
          'content:encoded': { $: body },
          ...(includePromo && manualImg && { '#': manualImg }),
          
          ...(ans.taxonomy?.primary_section?.name && { category: ans.taxonomy.primary_section.name })
        };
      }),
    },
  },
});

export function Rss({ globalContent, customFields, arcSite, requestUri }) {
  let { resizerURL = '' } = getProperties(arcSite);
  const {
    resizerURLs = {},
    feedDomainURL = 'http://localhost.com',
    feedTitle = '',
    feedLanguage = '',
  } = getProperties(arcSite);
  resizerURL = resizerURLs?.[ENVIRONMENT] || resizerURL;

  const channelLanguage = customFields.channelLanguage || feedLanguage;
  const requestPath = new URL.URL(requestUri, feedDomainURL).pathname;

  const isGoogleAiPilot = requestPath.includes('google-news-ai-pilot-feed');
  const { width = isGoogleAiPilot ? 1200 : 0, height = 0 } = customFields.resizerKVP || {};

  const rssBuildContent = new BuildContent();

  return rssTemplate(globalContent.content_elements || [], {
    ...customFields,
    requestPath,
    resizerURL,
    resizerWidth: width,
    resizerHeight: height,
    domain: feedDomainURL,
    feedTitle,
    channelLanguage,
    rssBuildContent,
  });
}

Rss.propTypes = {
  customFields: PropTypes.shape({
    ...generatePropsForFeed('rss', PropTypes),
  }),
};

Rss.label = 'RSS - Google AI Pilot - Arena';
Rss.icon = 'arc-rss';

export default Consumer(Rss);
