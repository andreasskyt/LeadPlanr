'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { Plus, Trash2, X } from 'lucide-react';
import { CalendarAccount } from '@/lib/db';
import { initiateMicrosoftOAuth, initiateGoogleOAuth } from '@/app/actions/oauth';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const [accounts, setAccounts] = useState<CalendarAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/calendar-accounts');
      if (!response.ok) throw new Error('Failed to fetch calendar accounts');
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

  const handleClose = () => {
    router.back();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Settings</h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {message && (
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
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

          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900">Associated calendars</h3>
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
                <div className="text-center py-8 text-gray-500">
                  No calendars connected yet. Add one to get started.
                </div>
              ) : (
                <div className="space-y-4">
                  {accounts.map((account) => (
                    <div
                      key={account.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <h4 className="font-medium text-gray-900 capitalize">{account.provider}</h4>
                        <p className="text-sm text-gray-500">
                          Connected since {new Date(account.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDeleteAccount(account.id)}
                      >
                        Disconnect
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-4 flex justify-end">
          <Button
            onClick={handleClose}
            className="bg-gray-100 hover:bg-gray-200 text-gray-900"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
} 