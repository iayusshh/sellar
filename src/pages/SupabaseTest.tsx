import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  message?: string;
}

export default function SupabaseTest() {
  const [results, setResults] = useState<TestResult[]>([
    { name: 'Connection Test', status: 'pending' },
    { name: 'Users Table', status: 'pending' },
    { name: 'Wallets Table', status: 'pending' },
    { name: 'Transactions Table', status: 'pending' },
    { name: 'Products Table', status: 'pending' },
  ]);
  const [isRunning, setIsRunning] = useState(false);

  const runTests = async () => {
    setIsRunning(true);
    const newResults = [...results];

    // Test 1: Connection
    try {
      const { error } = await supabase.from('users').select('count').limit(1);
      if (error) throw error;
      newResults[0] = { name: 'Connection Test', status: 'success', message: 'Connected to Supabase' };
    } catch (err: any) {
      newResults[0] = { name: 'Connection Test', status: 'error', message: err.message };
      setResults(newResults);
      setIsRunning(false);
      return;
    }
    setResults([...newResults]);

    // Test tables
    const tables = [
      { index: 1, name: 'users', label: 'Users Table' },
      { index: 2, name: 'wallets', label: 'Wallets Table' },
      { index: 3, name: 'transactions', label: 'Transactions Table' },
      { index: 4, name: 'products', label: 'Products Table' },
    ];

    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table.name)
          .select('*', { count: 'exact', head: true });
        
        if (error) throw error;
        newResults[table.index] = {
          name: table.label,
          status: 'success',
          message: `Found ${count || 0} records`,
        };
      } catch (err: any) {
        newResults[table.index] = {
          name: table.label,
          status: 'error',
          message: err.message,
        };
      }
      setResults([...newResults]);
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    setIsRunning(false);
  };

  useEffect(() => {
    runTests();
  }, []);

  const allSuccess = results.every(r => r.status === 'success');
  const hasErrors = results.some(r => r.status === 'error');

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-display font-bold mb-4">
              Supabase Verification
            </h1>
            <p className="text-muted-foreground">
              Testing database connection and table setup
            </p>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {isRunning && <Loader2 className="w-5 h-5 animate-spin" />}
                {!isRunning && allSuccess && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                {!isRunning && hasErrors && <XCircle className="w-5 h-5 text-red-500" />}
                Test Results
              </CardTitle>
              <CardDescription>
                {isRunning && 'Running tests...'}
                {!isRunning && allSuccess && 'All tests passed! ✅'}
                {!isRunning && hasErrors && 'Some tests failed. Check below for details.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {result.status === 'pending' && (
                        <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
                      )}
                      {result.status === 'success' && (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      )}
                      {result.status === 'error' && (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                      <div>
                        <div className="font-medium">{result.name}</div>
                        {result.message && (
                          <div className={`text-sm ${
                            result.status === 'error' ? 'text-red-500' : 'text-muted-foreground'
                          }`}>
                            {result.message}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {!isRunning && (
            <div className="space-y-4">
              <Button onClick={runTests} className="w-full" size="lg">
                Run Tests Again
              </Button>

              {allSuccess && (
                <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                  <CardContent className="pt-6">
                    <div className="flex gap-3">
                      <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                          🎉 Supabase is configured correctly!
                        </h3>
                        <p className="text-sm text-green-700 dark:text-green-300 mb-3">
                          Your database is ready to use. You can now:
                        </p>
                        <ul className="text-sm text-green-700 dark:text-green-300 space-y-1 list-disc list-inside">
                          <li>Sign up for a test account</li>
                          <li>Create wallet transactions</li>
                          <li>Add products to your storefront</li>
                          <li>Start building your creator platform</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {hasErrors && (
                <Card className="bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800">
                  <CardContent className="pt-6">
                    <div className="flex gap-3">
                      <AlertCircle className="w-6 h-6 text-orange-600 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-2">
                          Setup Issues Detected
                        </h3>
                        <p className="text-sm text-orange-700 dark:text-orange-300 mb-3">
                          Some tests failed. Common solutions:
                        </p>
                        <ul className="text-sm text-orange-700 dark:text-orange-300 space-y-1 list-disc list-inside">
                          <li>Make sure you ran the SQL from <code>supabase-init.sql</code></li>
                          <li>Check your .env file has correct credentials</li>
                          <li>Verify your Supabase project is active</li>
                          <li>Check the SQL Editor in Supabase for errors</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
