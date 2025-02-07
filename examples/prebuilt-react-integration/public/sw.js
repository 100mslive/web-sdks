self.addEventListener('push', event => {
  const options = {
    body: 'You have a new notification!',
  };

  event.waitUntil(self.registration.showNotification('New Message!', options));
});
