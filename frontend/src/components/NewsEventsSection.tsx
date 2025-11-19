import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, ArrowRight } from 'lucide-react';

export default function NewsEventsSection() {
  const news = [
    {
      title: 'RayERP 2.0 Released',
      date: '2024-01-15',
      excerpt: 'Major update with enhanced performance and new features.',
    },
    {
      title: 'New Integration Partners',
      date: '2024-01-10',
      excerpt: 'We\'ve partnered with leading software providers for better integration.',
    },
    {
      title: 'Security Update',
      date: '2024-01-05',
      excerpt: 'Enhanced security features and compliance improvements.',
    },
  ];

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Latest News & Updates</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Stay updated with the latest features, improvements, and company news
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {news.map((item, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Calendar className="h-4 w-4" />
                  {new Date(item.date).toLocaleDateString()}
                </div>
                <CardTitle className="text-lg">{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm mb-4">{item.excerpt}</p>
                <Button variant="ghost" size="sm" className="p-0 h-auto">
                  Read more
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center">
          <Button variant="outline">
            View All News
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
}