const { google } = require('googleapis');

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const getAuthUrl = () => {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar'],
    prompt: 'consent'
  });
};

const getTokensFromCode = async (code) => {
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
};

const addEventToCalendar = async (userTokens, eventData) => {
  oauth2Client.setCredentials(userTokens);
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const event = {
    summary: eventData.title,
    description: eventData.description,
    start: { dateTime: eventData.start, timeZone: 'Africa/Casablanca' },
    end: { dateTime: eventData.end, timeZone: 'Africa/Casablanca' },
  };

  return await calendar.events.insert({
    calendarId: 'primary',
    resource: event,
  });
};

module.exports = { getAuthUrl, getTokensFromCode, addEventToCalendar };