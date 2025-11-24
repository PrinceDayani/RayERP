import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star } from 'lucide-react';

export default function TestimonialsSection() {
  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'CEO, TechCorp',
      avatar: '/avatars/sarah.jpg',
      content: 'RayERP has transformed how we manage our business operations. The integration between HR and finance modules is seamless.',
      rating: 5,
    },
    {
      name: 'Michael Chen',
      role: 'Operations Manager, GrowthCo',
      avatar: '/avatars/michael.jpg',
      content: 'The project management features are outstanding. We\'ve improved our delivery times by 40% since implementing RayERP.',
      rating: 5,
    },
    {
      name: 'Emily Rodriguez',
      role: 'HR Director, InnovateLtd',
      avatar: '/avatars/emily.jpg',
      content: 'User-friendly interface and powerful features. Our HR processes are now completely automated and efficient.',
      rating: 5,
    },
  ];

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">What Our Customers Say</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Don't just take our word for it. Here's what business leaders are saying about RayERP.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="h-full">
              <CardContent className="p-6">
                {/* Rating */}
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                
                {/* Content */}
                <p className="text-muted-foreground mb-6 italic">
                  "{testimonial.content}"
                </p>
                
                {/* Author */}
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                    <AvatarFallback>
                      {testimonial.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-sm">{testimonial.name}</div>
                    <div className="text-muted-foreground text-xs">{testimonial.role}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
