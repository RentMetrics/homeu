import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/awardco/rewards
 *
 * Fetches available rewards from Awardco catalog
 * For now, returns sample rewards. In production, this would call Awardco API.
 */
export async function GET(request: NextRequest) {
  try {
    // In production, this would fetch from Awardco API
    // const awardcoClient = createAwardcoClient({
    //   apiKey: process.env.AWARDCO_API_KEY!
    // });
    // const catalog = await awardcoClient.getRewardsCatalog();

    // Sample rewards catalog
    const rewards = [
      {
        id: 'amazon-25',
        name: 'Amazon Gift Card',
        description: 'Redeem for Amazon.com credit. Shop millions of products.',
        pointsCost: 2500,
        category: 'Gift Cards',
        brand: 'Amazon',
        imageUrl: '/rewards/amazon.png'
      },
      {
        id: 'amazon-50',
        name: 'Amazon Gift Card',
        description: 'Redeem for Amazon.com credit. Shop millions of products.',
        pointsCost: 5000,
        category: 'Gift Cards',
        brand: 'Amazon',
        imageUrl: '/rewards/amazon.png'
      },
      {
        id: 'starbucks-10',
        name: 'Starbucks Gift Card',
        description: 'Enjoy your favorite coffee and treats.',
        pointsCost: 1000,
        category: 'Food & Dining',
        brand: 'Starbucks',
        imageUrl: '/rewards/starbucks.png'
      },
      {
        id: 'starbucks-25',
        name: 'Starbucks Gift Card',
        description: 'Enjoy your favorite coffee and treats.',
        pointsCost: 2500,
        category: 'Food & Dining',
        brand: 'Starbucks',
        imageUrl: '/rewards/starbucks.png'
      },
      {
        id: 'target-25',
        name: 'Target Gift Card',
        description: 'Shop for everything at Target.',
        pointsCost: 2500,
        category: 'Gift Cards',
        brand: 'Target',
        imageUrl: '/rewards/target.png'
      },
      {
        id: 'doordash-25',
        name: 'DoorDash Gift Card',
        description: 'Food delivery from your favorite restaurants.',
        pointsCost: 2500,
        category: 'Food & Dining',
        brand: 'DoorDash',
        imageUrl: '/rewards/doordash.png'
      },
      {
        id: 'uber-25',
        name: 'Uber Gift Card',
        description: 'Rides or Uber Eats - your choice.',
        pointsCost: 2500,
        category: 'Transportation',
        brand: 'Uber',
        imageUrl: '/rewards/uber.png'
      },
      {
        id: 'netflix-15',
        name: 'Netflix Gift Card',
        description: 'Stream movies and TV shows.',
        pointsCost: 1500,
        category: 'Entertainment',
        brand: 'Netflix',
        imageUrl: '/rewards/netflix.png'
      },
      {
        id: 'spotify-10',
        name: 'Spotify Gift Card',
        description: 'Listen to millions of songs ad-free.',
        pointsCost: 1000,
        category: 'Entertainment',
        brand: 'Spotify',
        imageUrl: '/rewards/spotify.png'
      },
      {
        id: 'visa-50',
        name: 'Visa Prepaid Card',
        description: 'Use anywhere Visa is accepted.',
        pointsCost: 5000,
        category: 'Cash & Prepaid',
        brand: 'Visa',
        imageUrl: '/rewards/visa.png'
      },
      {
        id: 'grubhub-25',
        name: 'Grubhub Gift Card',
        description: 'Order food delivery from local restaurants.',
        pointsCost: 2500,
        category: 'Food & Dining',
        brand: 'Grubhub',
        imageUrl: '/rewards/grubhub.png'
      },
      {
        id: 'hulu-25',
        name: 'Hulu Gift Card',
        description: 'Stream current episodes and original series.',
        pointsCost: 2500,
        category: 'Entertainment',
        brand: 'Hulu',
        imageUrl: '/rewards/hulu.png'
      }
    ];

    // Get category from query params for filtering
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '12');

    let filteredRewards = rewards;
    if (category && category !== 'all') {
      filteredRewards = rewards.filter(r => r.category === category);
    }

    return NextResponse.json({
      rewards: filteredRewards.slice(0, limit),
      total: filteredRewards.length,
      categories: [...new Set(rewards.map(r => r.category))]
    });

  } catch (error) {
    console.error('Error fetching Awardco rewards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rewards' },
      { status: 500 }
    );
  }
}
