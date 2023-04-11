self.addEventListener("notificationclick", (event) => {
    console.log("On notification click: ", event.notification.tag);
    let tag = event.notification.tag;
    event.notification.close();
  
    // This looks to see if the current is already open and
    // focuses if it is
    event.waitUntil(
      clients
        .matchAll({
          type: "window",
          includeUncontrolled: true
        })
        .then((clientList) => {
          if (clientList[0]) {
            return clientList[0].focus().then(c => c.navigate(`/tickets/${tag}`));
          }
          if (clients.openWindow) return clients.openWindow(`/tickets/${tag}`);
        })
    );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});
