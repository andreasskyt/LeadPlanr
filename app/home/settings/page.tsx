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

  const handleDeleteAccount = async (accountId: string) => {
    try {
      await fetch(`/api/calendar-accounts/${accountId}`, {
        method: 'DELETE',
      });
      await fetchAccounts();
    } catch (error) {
      console.error('Error deleting calendar account:', error);
    }
  };

  return (
    <div className="space-y-6">
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