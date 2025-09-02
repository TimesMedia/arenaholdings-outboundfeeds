import { CONTENT_BASE } from 'fusion:environment';

import { TWO_HOURS_TTL } from '~/util';

const resolve = query => {
  const { 'arc-site': website, q = 'type:story', sort = 'first_publish_date:desc', size = 30, from = 0 } = query;

  const searchParams = new URLSearchParams({
    website,
    q,
    sort,
    size: size.toString(),
    from: from.toString(),
  });

  return `${CONTENT_BASE}/content/v4/search/published?${searchParams.toString()}`;
};

export default {
  resolve,
  params: {
    q: 'text',
    sort: 'text',
    size: 'number',
    from: 'number',
  },
  ttl: TWO_HOURS_TTL,
};
