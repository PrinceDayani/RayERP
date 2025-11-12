'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Edit, Trash2 } from 'lucide-react';

interface Account {
  _id: string;
  code: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'income' | 'expense';
  balance: number;
  isActive: boolean;
}

const ChartOfAccounts = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);

  useEffect(() => {
    const storedAccounts = localStorage.getItem('gl_accounts');
    if (storedAccounts) {
      setAccounts(JSON.parse(storedAccounts));
    }
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getTypeColor = (type: string) => {
    const colors = {
      asset: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      liability: 'bg-red-500/20 text-red-400 border-red-500/30',
      equity: 'bg-green-500/20 text-green-400 border-green-500/30',
      income: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      expense: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-500/20 text-gray-400';
  };

  return (
    <Card className="bg-gray-800/90 backdrop-blur-sm border-gray-700">
      <CardHeader>
        <CardTitle className="text-gray-200">Chart of Accounts</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-gray-700">
              <TableHead className="text-gray-300">Code</TableHead>
              <TableHead className="text-gray-300">Account Name</TableHead>
              <TableHead className="text-gray-300">Type</TableHead>
              <TableHead className="text-gray-300">Balance</TableHead>
              <TableHead className="text-gray-300">Status</TableHead>
              <TableHead className="text-gray-300">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-400 py-8">
                  No accounts found
                </TableCell>
              </TableRow>
            ) : (
              accounts.map((account) => (
                <TableRow key={account._id} className="border-gray-700 hover:bg-gray-700/50">
                  <TableCell className="text-gray-300 font-mono">{account.code}</TableCell>
                  <TableCell className="text-gray-200 font-medium">{account.name}</TableCell>
                  <TableCell>
                    <Badge className={`${getTypeColor(account.type)} capitalize`}>
                      {account.type}
                    </Badge>
                  </TableCell>
                  <TableCell className={`font-semibold ${
                    account.balance >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {formatCurrency(account.balance)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={account.isActive ? "default" : "secondary"}>
                      {account.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="bg-gray-700 border-gray-600 hover:bg-gray-600">
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="sm" className="bg-gray-700 border-gray-600 hover:bg-gray-600">
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="sm" className="bg-gray-700 border-gray-600 hover:bg-gray-600 text-red-400">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default ChartOfAccounts;