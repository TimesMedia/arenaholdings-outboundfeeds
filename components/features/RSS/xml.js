import Consumer from 'fusion:consumer';
import URL from 'url';
import getProperties from 'fusion:properties';

import standardRSS from './standard';
import googleAiPilotRSS from './googleAiPilot';

const RssRouter = props => {
  const { arcSite, requestUri } = props;
  const { feedDomainURL = '' } = getProperties(arcSite);

  const requestPath = new URL.URL(requestUri, feedDomainURL).pathname;

  const isGoogleAiPilot = requestPath.includes('google-news-ai-pilot-feed');

  if (isGoogleAiPilot) {
    return googleAiPilotRSS(props);
  }

  return standardRSS(props);
};

export default Consumer(RssRouter);