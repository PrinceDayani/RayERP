import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Star } from 'lucide-react';

export default function ProgramsSection() {
  const programs = [
    {
      title: 'Starter Plan',
      price: '?29',
      period: '/month',
      description: 'Perfect for small businesses getting started',
      features: ['Up to 10 users', 'Basic HR management', 'Financial reporting', 'Email support'],
      popular: false,
    },
    {
      title: 'Professional Plan',
      price: '?79',
      period: '/month',
      description: 'Ideal for growing businesses',
      features: ['Up to 50 users', 'Advanced HR features', 'Project management', 'Priority support', 'Custom reports'],
      popular: true,
    },
    {
      title: 'Enterprise Plan',
      price: '?199',
      period: '/month',
      description: 'For large organizations',
      features: ['Unlimited users', 'Full feature access', 'Advanced analytics', '24/7 support', 'Custom integrations'],
      popular: false,
    },
  ];

  return (
    <section className="py-16 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Choose Your Plan</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Select the perfect plan for your business needs. All plans include core ERP features.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {programs.map((program, index) => (
            <Card key={index} className={`relative ${program.popular ? 'border-primary shadow-lg' : ''}`}>
              {program.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">
                    <Star className="h-3 w-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center">
                <CardTitle className="text-xl">{program.title}</CardTitle>
                <div className="mt-4">
                  <span className="text-3xl font-bold">{program.price}</span>
                  <span className="text-muted-foreground">{program.period}</span>
                </div>
                <p className="text-muted-foreground text-sm mt-2">{program.description}</p>
              </CardHeader>
              
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {program.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center text-sm">
                      <div className="w-2 h-2 bg-primary rounded-full mr-3 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className={`w-full ${program.popular ? '' : 'variant-outline'}`}
                  variant={program.popular ? 'default' : 'outline'}
                >
                  Get Started
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center mt-8">
          <p className="text-muted-foreground text-sm">
            All plans include a 14-day free trial. No credit card required.
          </p>
        </div>
      </div>
    </section>
  );
}
