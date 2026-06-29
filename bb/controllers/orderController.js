const calendarService = require('../services/googleCalendar');

// Wast l-fonction dyal createOrder:
await calendarService.addEvent({
  title: `Nouvelle Commande: ${order.customerName}`,
  description: `Pack: ${order.packageName}`,
  start: order.eventDate, // T-akked mn l-format
  end: order.eventEndDate
});