'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { Plus, Trash2 } from 'lucide-react';
import { CalendarAccount } from '@/lib/db';
import { initiateMicrosoftOAuth, initiateGoogleOAuth } from '@/app/actions/oauth';

export default function SettingsPage() {
  const [accounts, setAccounts] = useState<CalendarAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/calendar-accounts');
      const data = await response.json();
      setAccounts(data);
    } catch (error) {
      console.error('Error fetching calendar accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProviderSelect = async (provider: string) => {
    if (provider === 'Microsoft') {
      await initiateMicrosoftOAuth();
    } else if (provider === 'Google') {
      await initiateGoogleOAuth();
    }
  };

  const handleDeleteAccount = async (accountId: number) => {
    try {
      console.log('Attempting to delete account:', accountId);
      const response = await fetch(`/api/calendar-accounts/${accountId}`, {
        method: 'DELETE',
      });
      
      console.log('Delete response status:', response.status);
      const responseData = await response.json();
      console.log('Delete response data:', responseData);
      
      if (!response.ok) {
        throw new Error(`Failed to delete calendar account: ${responseData.error || 'Unknown error'}`);
      }
      
      setMessage(responseData.message);
      await fetchAccounts();
      
      // Clear the message after 5 seconds
      setTimeout(() => setMessage(null), 5000);
    } catch (error) {
      console.error('Error deleting calendar account:', error);
      setMessage('Failed to delete calendar account. Please try again.');
      setTimeout(() => setMessage(null), 5000);
    }
  };

  return (
    <div className="space-y-6">
      {message && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">{message}</p>
            </div>
          </div>
        </div>
      )}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Associated calendars</h2>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Add calendar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleProviderSelect('Microsoft')}>
                Microsoft
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleProviderSelect('Google')}>
                Google
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {loading ? (
          <div className="text-gray-500">Loading...</div>
        ) : accounts.length === 0 ? (
          <div className="text-gray-500 text-center py-8">
            No calendars associated yet. Start by associating your calendar by pressing the "Add calendar" button above.
          </div>
        ) : (
          <div className="space-y-4">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <h4 className="font-medium capitalize">{account.provider}</h4>
                  <p className="text-sm text-gray-500">
                    Connected since {new Date(account.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteAccount(account.id)}
                  className="p-2"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 