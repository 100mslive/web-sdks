import { DomainCategory } from './AnalyticsEventDomains';
import { isBrowser } from '../utils/support';

function getDomainCategory() {
  // this function gives us the domain category(sutom, hms , local) of the base url.
  // below if statement checks if it's running in a browser ; or if we can use 'window' safely

  if (isBrowser && window) {
    const baseurl = window.location.hostname;

    if (baseurl === 'localhost' || baseurl === '127.0.0.1') {
      return DomainCategory.LOCAL;
    }

    if (baseurl.includes('app.100ms.live')) {
      return DomainCategory.HMS;
    } else {
      return DomainCategory.CUSTOM;
    }
  }

  return DomainCategory.CUSTOM;
}

export const domainCategory = getDomainCategory();
