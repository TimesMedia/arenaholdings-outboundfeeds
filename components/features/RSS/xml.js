import Consumer from 'fusion:consumer';
import getProperties from 'fusion:properties';
import URL from 'url';

import googleAiPilotRSS from './googleAiPilot';
import standardRSS from './standard';

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