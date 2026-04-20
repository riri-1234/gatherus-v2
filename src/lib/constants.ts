// App Constants
export const APP_NAME = 'GatherUs';

// Interests for onboarding and profile matching
export const INTERESTS = [
  'Arts & Crafts',
  'Sports',
  'Food',
  'Shopping',
  'Culture',
  'Travel',
  'Books',
  'Writing',
  'Philosophy',
  'Startup / Entrepreneurship',
  'Business',
  'Real Estate',
  'Religion',
  'Discussion',
  'Science',
  'Study',
  'Party',
  'Music',
  'Tech',
  'Gaming',
  'Fitness',
  'Photography',
  'Movies',
  'Dance',
  'Volunteering',
  'Fashion',
  'Girls Only',
  'Outdoors',
];

// Event categories with labels and colors
export const CATEGORY_CONFIG: Record<string, { label: string; color: string }> = {
  art_exhibition: { label: 'Art Exhibition', color: 'bg-purple-500' },
  book_club: { label: 'Book Club', color: 'bg-amber-600' },
  lecture: { label: 'Lecture', color: 'bg-blue-500' },
  garage_sale: { label: 'Garage Sale', color: 'bg-green-500' },
  study_session: { label: 'Study Session', color: 'bg-cyan-500' },
  party: { label: 'Party', color: 'bg-pink-500' },
  networking: { label: 'Networking', color: 'bg-indigo-500' },
  cooking_class: { label: 'Cooking Class', color: 'bg-orange-500' },
  food_exploration: { label: 'Food Exploration', color: 'bg-yellow-500' },
  car_meetup: { label: 'Car Meetup', color: 'bg-red-500' },
  sports: { label: 'Sports', color: 'bg-emerald-500' },
  creative_workshop: { label: 'Creative Workshop', color: 'bg-violet-500' },
  free_drinks: { label: 'Free Drinks', color: 'bg-rose-500' },
  cafe_gathering: { label: 'Cafe Gathering', color: 'bg-amber-500' },
  club_info_session: { label: 'Club Info Session', color: 'bg-teal-500' },
  outdoor_activity: { label: 'Outdoor Activity', color: 'bg-lime-500' },
  culture: { label: 'Culture', color: 'bg-fuchsia-500' },
  exchange_community: { label: 'Exchange Community', color: 'bg-sky-500' },
  speed_dating: { label: 'Speed Dating', color: 'bg-red-400' },
};

// Post categories for event creation
export const CATEGORIES = [
  { value: 'art_exhibition', label: 'Art Exhibition' },
  { value: 'book_club', label: 'Book Club' },
  { value: 'lecture', label: 'Lecture' },
  { value: 'garage_sale', label: 'Garage Sale' },
  { value: 'study_session', label: 'Study Session' },
  { value: 'party', label: 'Party' },
  { value: 'networking', label: 'Networking' },
  { value: 'cooking_class', label: 'Cooking Class' },
  { value: 'food_exploration', label: 'Food Exploration' },
  { value: 'car_meetup', label: 'Car Meetup' },
  { value: 'sports', label: 'Sports' },
  { value: 'creative_workshop', label: 'Creative Workshop' },
  { value: 'free_drinks', label: 'Free Drinks' },
  { value: 'cafe_gathering', label: 'Cafe Gathering' },
  { value: 'club_info_session', label: 'Club Info Session' },
  { value: 'outdoor_activity', label: 'Outdoor Activity' },
  { value: 'culture', label: 'Culture' },
  { value: 'exchange_community', label: 'Exchange Community' },
  { value: 'speed_dating', label: 'Speed Dating' },
];

// Access types for events
export const ACCESS_TYPES = [
  { value: 'open_rsvp', label: 'Open RSVP', description: 'Anyone can join' },
  { value: 'limited_spots', label: 'Limited Spots', description: 'First come, first served' },
  { value: 'approval_required', label: 'Approval Required', description: 'You approve each attendee' },
  { value: 'invite_only', label: 'Invite Only', description: 'By invitation only' },
];

// Location options (starting with Toronto)
export const LOCATIONS = [
  'Downtown Toronto',
  'Scarborough',
  'Mississauga',
  'North York',
  'Etobicoke',
];

// UofT Campuses
export const UOFT_CAMPUSES = [
  { value: 'st_george', label: 'St. George', city: 'Downtown Toronto' },
  { value: 'scarborough', label: 'Scarborough (UTSC)', city: 'Scarborough' },
  { value: 'mississauga', label: 'Mississauga (UTM)', city: 'Mississauga' },
];

// Category groupings for Social page
export const CATEGORY_GROUPS = {
  party: ['party', 'free_drinks', 'speed_dating'],
  food: ['food_exploration', 'cooking_class', 'cafe_gathering'],
  sports: ['sports', 'outdoor_activity', 'car_meetup'],
  study: ['study_session', 'lecture', 'book_club'],
  creative: ['art_exhibition', 'creative_workshop', 'culture'],
  social: ['networking', 'club_info_session', 'exchange_community', 'garage_sale'],
};
