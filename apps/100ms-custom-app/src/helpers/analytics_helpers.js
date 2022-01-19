import cookies from 'js-cookies';

let email, user_id;
try {
  const authUser = JSON.parse(cookies.getItem('authUser'));
  email = authUser.email;
  user_id = authUser.user_id;
} catch {
  email = null;
  user_id = null;
}

const analyticsTrack = (title, options) => {
  const commonOptions = {
    email,
    user_id,
    timestamp: new Date().toString(),
    subdomain: window.location.hostname,
  };
  if (email) {
    window.analytics.track(title, {
      ...options,
      ...commonOptions,
    });
  }
};

export const AppAnalytics = {
  track: analyticsTrack,
};
