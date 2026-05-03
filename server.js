import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('Missing GEMINI_API_KEY in .env.local');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });
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

app.post('/api/itinerary', async (req, res) => {
  const { destination, duration, vibe, budget } = req.body;

  if (!destination || !duration || !vibe || !budget) {
    return res.status(400).json({ error: 'All itinerary fields are required.' });
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
    console.error('AI request failed:', error);
    return res.status(500).json({ error: 'Failed to generate itinerary. Check server logs.' });
  }
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Trip Planner API running at http://localhost:${port}`);
});
