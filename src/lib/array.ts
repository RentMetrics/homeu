const ARRAY_API_BASE_URL = 'https://api.array.com/v1';

interface ArrayCreditCheckResponse {
  id: string;
  creditScore: number;
  creditBureau: string;
  // Add other fields as needed
}

export async function initiateCreditCheck(
  firstName: string,
  lastName: string,
  email: string,
  phoneNumber: string,
  dateOfBirth: string,
  currentAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  }
): Promise<ArrayCreditCheckResponse> {
  try {
    const response = await fetch(`${ARRAY_API_BASE_URL}/credit-checks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ARRAY_API_TOKEN}`,
        'X-API-Key': process.env.ARRAY_API_KEY!,
      },
      body: JSON.stringify({
        firstName,
        lastName,
        email,
        phoneNumber,
        dateOfBirth,
        currentAddress,
      }),
    });

    if (!response.ok) {
      throw new Error(`Array API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error initiating credit check:', error);
    throw error;
  }
}

export async function getCreditCheckStatus(checkId: string): Promise<ArrayCreditCheckResponse> {
  try {
    const response = await fetch(`${ARRAY_API_BASE_URL}/credit-checks/${checkId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.ARRAY_API_TOKEN}`,
        'X-API-Key': process.env.ARRAY_API_KEY!,
      },
    });

    if (!response.ok) {
      throw new Error(`Array API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting credit check status:', error);
    throw error;
  }
} 