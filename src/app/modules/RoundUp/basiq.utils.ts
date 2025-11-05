import { IBasiqTransaction, IBasiqAccount, IRoundUpCalculationResult } from './roundUp.interface';

// Basiq API configuration
const BASIQ_API_URL = process.env.BASIQ_API_URL || 'https://au-api.basiq.io';
const BASIQ_API_KEY = process.env.BASIQ_API_KEY;

interface IBasiqAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

// Get Basiq access token
export const getBasiqAccessToken = async (): Promise<string> => {
  try {
    const response = await fetch(`${BASIQ_API_URL}/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${BASIQ_API_KEY}:`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'basiq-version': '3.0',
      },
      body: 'scope=SERVER_ACCESS',
    });

    if (!response.ok) {
      throw new Error(`Failed to get Basiq access token: ${response.statusText}`);
    }

    const data: IBasiqAuthResponse = await response.json();
    return data.access_token;
  } catch (error) {
    throw new Error(`Basiq authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Create Basiq user
export const createBasiqUser = async (email: string, mobile?: string): Promise<string> => {
  try {
    const accessToken = await getBasiqAccessToken();
    
    const response = await fetch(`${BASIQ_API_URL}/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'basiq-version': '3.0',
      },
      body: JSON.stringify({
        email,
        mobile: mobile || null,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create Basiq user: ${response.statusText}`);
    }

    const data = await response.json();
    return data.id;
  } catch (error) {
    throw new Error(`Failed to create Basiq user: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Get consent URL for CDR
export const getConsentUrl = async (userId: string, redirectUri: string): Promise<string> => {
  try {
    const accessToken = await getBasiqAccessToken();
    
    const response = await fetch(`${BASIQ_API_URL}/users/${userId}/consents`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'basiq-version': '3.0',
      },
      body: JSON.stringify({
        scope: [
          'READ_ACCOUNTS',
          'READ_TRANSACTIONS',
        ],
        permissions: [
          'ReadAccountsBasic',
          'ReadAccountsDetail',
          'ReadTransactionsBasic',
          'ReadTransactionsDetail',
        ],
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create consent: ${response.statusText}`);
    }

    const data = await response.json();
    return data.links.public;
  } catch (error) {
    throw new Error(`Failed to get consent URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Get user accounts
export const getUserAccounts = async (userId: string): Promise<IBasiqAccount[]> => {
  try {
    const accessToken = await getBasiqAccessToken();
    
    const response = await fetch(`${BASIQ_API_URL}/users/${userId}/accounts`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'basiq-version': '3.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get user accounts: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    throw new Error(`Failed to get user accounts: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Get account transactions
export const getAccountTransactions = async (
  userId: string,
  accountId: string,
  fromDate?: Date,
  toDate?: Date
): Promise<IBasiqTransaction[]> => {
  try {
    const accessToken = await getBasiqAccessToken();
    
    let url = `${BASIQ_API_URL}/users/${userId}/accounts/${accountId}/transactions`;
    const params = new URLSearchParams();
    
    if (fromDate) {
      params.append('filter[transaction.postDate.from]', fromDate.toISOString().split('T')[0]);
    }
    
    if (toDate) {
      params.append('filter[transaction.postDate.to]', toDate.toISOString().split('T')[0]);
    }
    
    // Only get debit transactions (purchases)
    params.append('filter[transaction.class]', 'debit');
    params.append('limit', '500');
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'basiq-version': '3.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get transactions: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    throw new Error(`Failed to get transactions: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Calculate round-up amount
export const calculateRoundUp = (amount: number): IRoundUpCalculationResult => {
  // Convert to positive number for calculation
  const absoluteAmount = Math.abs(amount);
  
  // Only process amounts greater than $1
  if (absoluteAmount < 1) {
    return {
      originalAmount: amount,
      roundUpAmount: 0,
      shouldProcess: false,
      reason: 'Amount too small for round-up',
    };
  }
  
  // Calculate round-up to nearest dollar
  const roundedUp = Math.ceil(absoluteAmount);
  const roundUpAmount = roundedUp - absoluteAmount;
  
  // Don't process if already a whole dollar
  if (roundUpAmount === 0) {
    return {
      originalAmount: amount,
      roundUpAmount: 0,
      shouldProcess: false,
      reason: 'Amount is already a whole dollar',
    };
  }
  
  return {
    originalAmount: amount,
    roundUpAmount: Number(roundUpAmount.toFixed(2)),
    shouldProcess: true,
  };
};

// Filter eligible transactions for round-up
export const filterEligibleTransactions = (transactions: IBasiqTransaction[]): IBasiqTransaction[] => {
  return transactions.filter(transaction => {
    const amount = parseFloat(transaction.amount);
    
    // Only process debit transactions (purchases)
    if (transaction.class !== 'debit') return false;
    
    // Skip very small amounts
    if (Math.abs(amount) < 1) return false;
    
    // Skip certain transaction types
    const excludedDescriptions = [
      'ATM',
      'TRANSFER',
      'BPAY',
      'DIRECT DEBIT',
      'INTEREST',
      'FEE',
      'REVERSAL',
    ];
    
    const description = transaction.description.toUpperCase();
    return !excludedDescriptions.some(excluded => description.includes(excluded));
  });
};

// Validate consent status
export const validateConsentStatus = async (userId: string, consentId: string): Promise<boolean> => {
  try {
    const accessToken = await getBasiqAccessToken();
    
    const response = await fetch(`${BASIQ_API_URL}/users/${userId}/consents/${consentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'basiq-version': '3.0',
      },
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.status === 'active';
  } catch {
    return false;
  }
};

// Revoke consent
export const revokeConsent = async (userId: string, consentId: string): Promise<void> => {
  try {
    const accessToken = await getBasiqAccessToken();
    
    const response = await fetch(`${BASIQ_API_URL}/users/${userId}/consents/${consentId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'basiq-version': '3.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to revoke consent: ${response.statusText}`);
    }
  } catch (error) {
    throw new Error(`Failed to revoke consent: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Get consent details
export const getConsentDetails = async (userId: string, consentId: string) => {
  try {
    const accessToken = await getBasiqAccessToken();
    
    const response = await fetch(`${BASIQ_API_URL}/users/${userId}/consents/${consentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'basiq-version': '3.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get consent details: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    throw new Error(`Failed to get consent details: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
