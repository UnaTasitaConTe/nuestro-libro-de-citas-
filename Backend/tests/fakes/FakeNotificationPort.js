class FakeNotificationPort {
  constructor() {
    this.notifications = [];
  }

  async notifyEntryRecorded(data) {
    this.notifications.push(data);
  }
}

module.exports = FakeNotificationPort;
