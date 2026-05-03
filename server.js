import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const apiKey = process.env.GEMINI_API_KEY;
const mockMode = !apiKey;

if (mockMode) {
  console.warn('No GEMINI_API_KEY found in .env.local. Running in mock mode with a sample itinerary.');
}

const ai = mockMode ? null : new GoogleGenAI({ apiKey });
const app = express();
app.use(express.json());

function buildItineraryPrompt({ destination, duration, vibe, budget }) {
  return `You are an expert travel agent. Create a detailed, day-by-day itinerary for a trip to ${destination} for ${duration} days.

The traveler prefers a "${vibe}" vibe and has a "${budget}" budget.

Please provide the output in Markdown format with the following structure:
# Trip to ${destination}
*Brief overview of the destination and what to expect based on the vibe and budget.*

## Booking Suggestions
*Provide specific booking recommendations:*
- **Accommodation:** Suggest 2-3 specific hotel/hostel types or neighborhoods that match the budget and vibe
- **Transportation:** How to get there and get around (flights, trains, local transport)
- **Activities:** Key bookings needed (tours, tickets, reservations)
- **Tools:** Recommend specific booking websites/apps for this destination

## Day-by-Day Itinerary
*For each day, provide:*
### Day 1: [Theme of the day]
- **Morning:** [Detailed activity with estimated time and cost]
- **Afternoon:** [Detailed activity with estimated time and cost]
- **Evening:** [Detailed activity with estimated time and cost]
*(Repeat for all ${duration} days)*

## Essential Reminders & Packing
*A comprehensive checklist of 8-12 crucial things to remember:*
- Visa/passport requirements
- Health/safety considerations
- Weather-appropriate clothing
- Tech essentials (adapters, SIM cards)
- Budget-specific tips
- Cultural considerations
- Emergency contacts

## Estimated Budget Breakdown
*Break down approximate costs for:*
- Accommodation (per night)
- Food (per day)
- Transportation
- Activities/Entrance fees
- Miscellaneous
*Total estimated cost range for the trip*
`;
}

function createMockItinerary({ destination, duration, vibe, budget }) {
  return `# Trip to ${destination}

A ${duration}-day ${vibe.toLowerCase()} itinerary designed for ${budget.toLowerCase()} travelers.

## Booking Suggestions
- **Accommodation:** Choose budget-friendly guesthouses or mid-range hotels in the city center.
- **Transportation:** Use local trains, buses, or rideshares to move between popular neighborhoods.
- **Activities:** Book key experiences in advance, such as guided tours or cultural shows.
- **Tools:** Use local booking apps and global platforms like Booking.com or Airbnb.

## Day-by-Day Itinerary
### Day 1: Arrival and Local Highlights
- **Morning:** Arrive, check in, and settle into your accommodation.
- **Afternoon:** Explore the historic downtown area and sample local street food.
- **Evening:** Enjoy a relaxed dinner at a popular neighborhood restaurant.

### Day 2: Culture and City Exploration
- **Morning:** Visit a major museum, temple, or cultural landmark.
- **Afternoon:** Walk through a scenic park or famous market.
- **Evening:** Try a local tasting menu or food tour.

### Day 3: Adventure and Local Life
- **Morning:** Take a half-day excursion or guided tour to nearby natural sites.
- **Afternoon:** Return and explore a local artisan market.
- **Evening:** Experience nightlife with a cultural performance or live music.

## Essential Reminders & Packing
- Passport and travel documents
- Local currency and payment cards
- Weather-appropriate clothing
- Comfortable walking shoes
- Phone charger and power adapter
- Reusable water bottle
- Health supplies and any medications
- Travel insurance information

## Estimated Budget Breakdown
- Accommodation: Moderate hotel or guesthouse
- Food: Street food and casual dining
- Transportation: Local transit and occasional rideshare
- Activities: Museum entry and guided tours
- Miscellaneous: Souvenirs and tips

*This itinerary is a sample placeholder while the API key is being validated.*`;
}

app.post('/api/itinerary', async (req, res) => {
  const { destination, duration, vibe, budget } = req.body;

  if (!destination || !duration || !vibe || !budget) {
    return res.status(400).json({ error: 'All itinerary fields are required.' });
  }

  if (mockMode) {
    return res.json({ itinerary: createMockItinerary({ destination, duration, vibe, budget }), warning: 'Mock itinerary served because GEMINI_API_KEY is not configured.' });
  }

  try {
    const prompt = buildItineraryPrompt({ destination, duration, vibe, budget });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.7,
      },
    });

    return res.json({ itinerary: response.text || '' });
  } catch (error) {
    const message = String(error);
    const invalidKey = message.includes('API key not valid') || message.includes('API_KEY_INVALID');

    if (invalidKey) {
      return res.json({ itinerary: createMockItinerary({ destination, duration, vibe, budget }), warning: 'Invalid API key. Serving a local mock itinerary instead.' });
    }

    console.error('AI request failed:', error);
    return res.status(500).json({ error: 'Failed to generate itinerary. Check server logs.' });
  }
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Trip Planner API running at http://localhost:${port}`);
});
