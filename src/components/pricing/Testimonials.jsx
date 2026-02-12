import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Star, Quote } from 'lucide-react';
import { motion } from 'framer-motion';

const testimonials = [
  {
    name: "Carlos Mendoza",
    profession: "Electricista en Madrid",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos",
    rating: 5,
    text: "En 2 meses conseguí 18 clientes nuevos. La inversión se paga sola. Los presupuestos automáticos me ahorran 3 horas semanales.",
    result: "+18 clientes en 60 días"
  },
  {
    name: "Laura Fernández",
    profession: "Fontanera en Barcelona",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Laura",
    rating: 5,
    text: "El Plan Ads+ cambió mi negocio. Antes buscaba clientes yo, ahora me encuentran ellos. Facturación +240% en 3 meses.",
    result: "+240% facturación"
  },
  {
    name: "Miguel Ruiz",
    profession: "Carpintero en Valencia",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Miguel",
    rating: 5,
    text: "Probé 7 días gratis y vi resultados el segundo día. Ahora estoy siempre a tope de trabajo. Cancelar otras plataformas fue fácil.",
    result: "ROI 650%"
  }
];

export default function Testimonials() {
  return (
    <div className="max-w-6xl mx-auto mb-16">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          Lo que dicen nuestros profesionales
        </h2>
        <p className="text-gray-600">Resultados reales de autónomos como tú</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {testimonials.map((testimonial, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card className="h-full border-2 border-gray-100 hover:border-blue-200 transition-all">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full"
                    loading="lazy"
                  />
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{testimonial.name}</p>
                    <p className="text-xs text-gray-600">{testimonial.profession}</p>
                  </div>
                </div>

                <div className="flex gap-0.5 mb-3">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                <Quote className="w-8 h-8 text-blue-200 mb-2" />
                <p className="text-sm text-gray-700 leading-relaxed mb-4">
                  {testimonial.text}
                </p>

                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-xs font-bold text-green-800">{testimonial.result}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}