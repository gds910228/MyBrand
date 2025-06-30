"use client";

import { useState } from 'react';
import Button from '@/components/Button';

export default function TestEmailPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  const testDirectApi = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-email');
      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">EmailJS 测试页面</h1>
      
      <div className="mb-8">
        <Button onClick={testDirectApi} disabled={loading}>
          {loading ? '发送中...' : '测试 API 发送邮件'}
        </Button>
      </div>
      
      {result && (
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-700 dark:text-gray-300">
          <h4 className="font-semibold mb-2">API 响应结果:</h4>
          <pre className="whitespace-pre-wrap text-xs overflow-auto max-h-[500px]">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
} 