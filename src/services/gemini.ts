export interface TripPreferences {
  destination: string;
  duration: number;
  vibe: string;
  budget: string;
}

export async function generateItinerary(prefs: TripPreferences): Promise<string> {
  const response = await fetch('/api/itinerary', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(prefs),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.error || 'Failed to generate itinerary');
  }

  const data = await response.json();
  return data.itinerary || 'Sorry, I could not generate the itinerary. Please try again.';
}
