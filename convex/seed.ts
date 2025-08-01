import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const seedProperties = mutation({
  args: {},
  handler: async (ctx) => {
    const properties = [
      {
        title: 'Modern Downtown Apartment',
        type: 'apartment',
        price: 2500,
        beds: 2,
        baths: 2,
        sqft: 1200,
        image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267',
        amenities: ['Parking', 'Gym', 'Pool', 'Pet Friendly'],
        description: 'Beautiful modern apartment in the heart of downtown with amazing city views.',
        homeuScore: 92,
        scoreFactors: ['Excellent location', 'Great amenities', 'Fair market price'],
      },
      {
        title: 'Cozy Family Home',
        type: 'house',
        price: 3500,
        beds: 3,
        baths: 2.5,
        sqft: 2000,
        image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6',
        amenities: ['Garage', 'Backyard', 'Fireplace', 'Central AC'],
        description: 'Spacious family home in a quiet neighborhood with a large backyard.',
        homeuScore: 88,
        scoreFactors: ['Spacious layout', 'Family-friendly area', 'Premium features'],
      },
      {
        title: 'Luxury High-Rise Condo',
        type: 'apartment',
        price: 2800,
        beds: 1,
        baths: 1.5,
        sqft: 900,
        image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750',
        amenities: ['Concierge', 'Rooftop Pool', 'Fitness Center', 'Parking'],
        description: 'Stunning high-rise condo with panoramic city views and luxury amenities.',
        homeuScore: 95,
        scoreFactors: ['Premium location', 'Luxury amenities', 'Modern design'],
      },
    ];

    for (const property of properties) {
      await ctx.db.insert("properties", property);
    }
  },
}); 