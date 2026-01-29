
import React, { useState } from 'react';
import { 
  Mail, 
  Video, 
  MessageSquare, 
  ChevronDown, 
  Copy, 
  Check,
  Calendar, 
  HelpCircle,
  Headset,
  AtSign,
  Clock
} from 'lucide-react';

const FAQS = [
  {
    question: "¿Qué es Caishen Capital Group?",
    answer: "Caishen Capital Group S.A.S. es una compañía de inversión privada que estructura y administra estrategias de inversión mediante contratos privados, orientadas a la preservación y crecimiento del capital según el perfil de riesgo del inversionista.\n\nLa compañía opera bajo principios de gestión profesional del capital, diversificación de estrategias y activos, control y monitoreo del riesgo, y transparencia en la relación contractual."
  },
  {
    question: "¿Las inversiones tienen rentabilidad garantizada?",
    answer: "No. Caishen Capital Group S.A.S. no ofrece rentabilidad garantizada. Toda inversión implica riesgo y está sujeta a variables de mercado como volatilidad, liquidez y condiciones macroeconómicas.\n\nEl rendimiento pasado no garantiza resultados futuros."
  },
  {
    question: "¿Puedo retirar mi capital en cualquier momento?",
    answer: "Sí. En Caishen Capital Group S.A.S., el inversionista puede retirar su capital en cualquier momento, conforme a lo establecido en su contrato de inversión.\n\nLas condiciones de retiro —procedimientos, plazos operativos y validaciones— están definidas contractualmente y buscan garantizar la seguridad y correcta ejecución de la operación."
  },
  {
    question: "¿Cómo puedo obtener más información o soporte?",
    answer: "Para obtener información adicional o soporte, el inversionista puede comunicarse con Caishen Capital Group S.A.S. a través de los canales oficiales de atención.\n\nSe recomienda utilizar únicamente los canales oficiales para garantizar confidencialidad, trazabilidad y seguridad de la información."
  }
];

const Support: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const SUPPORT_EMAIL = 'contacto@caishencapital.co';
  const BOOKING_LINK = 'https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ0_P4feGatgrX4EH0X_qvIhMq0x9xlJrMgKjzEtmL68QLkThUUQ-ZtvuTahld3jz1bLW-hfkJEv';
  const WHATSAPP_LINK = 'https://api.whatsapp.com/message/ZDXZP24WMRQRO1?autoload=1&app_absent=0';

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(SUPPORT_EMAIL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-8 lg:p-12 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-accent text-4xl lg:text-5xl font-black tracking-tighter uppercase">Contactar Soporte</h1>
        <p className="text-text-secondary text-lg font-medium">Estamos aquí para resolver tus dudas y ayudarte con tus inversiones.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (Main Actions & FAQ) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Email Contact Card - Updated to Copy Functionality */}
          <div className="bg-white rounded-3xl p-8 lg:p-10 border-2 border-primary shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
              <Mail size={160} className="text-accent" />
            </div>
            
            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-4">
                <div className="bg-primary p-3 rounded-2xl text-accent shadow-sm">
                  <Mail size={24} />
                </div>
                <h2 className="text-2xl font-black text-accent tracking-tight">Contacto por Correo</h2>
              </div>
              
              <p className="text-text-secondary text-base font-medium max-w-lg leading-relaxed">
                Copia nuestro correo oficial para consultas detalladas o adjuntar documentación. Responderemos en menos de 24 horas.
              </p>
              
              <div className="bg-surface-subtle rounded-2xl p-4 border border-surface-border flex items-center gap-3 w-fit group/email transition-colors hover:border-primary">
                <AtSign size={18} className="text-text-muted group-hover/email:text-accent transition-colors" />
                <span className="text-accent font-bold text-sm select-all">{SUPPORT_EMAIL}</span>
              </div>
              
              <button 
                onClick={handleCopyEmail}
                className={`inline-flex items-center gap-3 font-black py-4 px-10 rounded-2xl transition-all shadow-md active:scale-95 uppercase text-xs tracking-widest ${
                  copied 
                  ? 'bg-accent text-primary' 
                  : 'bg-primary hover:bg-primary-hover text-accent hover:-translate-y-1'
                }`}
              >
                <span>{copied ? '¡Correo Copiado!' : 'Copiar Correo'}</span>
                {copied ? <Check size={18} className="animate-in zoom-in" /> : <Copy size={18} />}
              </button>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="bg-white rounded-3xl p-8 border border-surface-border shadow-sm space-y-8">
            <div className="flex items-center gap-4">
              <div className="bg-surface-subtle p-3 rounded-2xl text-text-muted">
                <HelpCircle size={24} />
              </div>
              <h2 className="text-2xl font-black text-accent tracking-tight">Preguntas Frecuentes</h2>
            </div>
            
            <div className="divide-y divide-gray-100">
              {FAQS.map((faq, index) => (
                <div key={index} className="py-2">
                  <button 
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="w-full flex items-center justify-between py-5 text-left group"
                  >
                    <span className={`font-bold transition-colors ${openFaq === index ? 'text-accent text-lg' : 'text-text-main hover:text-accent'}`}>
                      {faq.question}
                    </span>
                    <div className={`p-1 rounded-lg transition-all ${openFaq === index ? 'bg-primary text-accent rotate-180' : 'bg-surface-subtle text-text-muted group-hover:bg-gray-100'}`}>
                      <ChevronDown size={20} />
                    </div>
                  </button>
                  <div className={`overflow-hidden transition-all duration-300 ease-in-out ${openFaq === index ? 'max-h-60 opacity-100 pb-6' : 'max-h-0 opacity-0'}`}>
                    <p className="text-text-secondary text-sm leading-relaxed pl-4 border-l-2 border-primary whitespace-pre-wrap">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (Quick Contact Only) */}
        <div className="space-y-6">
          
          {/* Video Call Card */}
          <div className="bg-white rounded-3xl p-8 border-2 border-primary shadow-lg relative overflow-hidden group">
            <div className="absolute -right-8 -top-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <Video size={100} className="text-accent" />
            </div>
            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-4">
                <div className="bg-primary p-3 rounded-2xl text-accent shadow-sm">
                  <Video size={24} />
                </div>
                <h3 className="text-lg font-black text-accent leading-tight tracking-tight">
                  Asesoría Financiera<br/>por Videoconferencia
                </h3>
              </div>
              <p className="text-text-secondary text-sm font-medium leading-relaxed">
                Agenda una sesión personalizada con nuestros expertos para revisar tu estrategia de inversión.
              </p>
              <a 
                href={BOOKING_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-primary hover:bg-primary-hover text-accent font-black py-4 rounded-2xl transition-all shadow-md flex items-center justify-center gap-3 uppercase text-xs tracking-widest hover:-translate-y-1"
              >
                <span>Reserva tu cita</span>
                <Calendar size={18} />
              </a>
            </div>
          </div>

          {/* Live Chat Card */}
          <div className="bg-accent rounded-3xl p-8 text-white shadow-xl relative overflow-hidden group border border-accent">
            <div className="absolute -right-10 -top-10 bg-primary/20 size-40 rounded-full blur-3xl group-hover:bg-primary/30 transition-all duration-700"></div>
            <div className="relative z-10 space-y-6">
              <div className="bg-white/10 w-fit p-3 rounded-2xl backdrop-blur-sm border border-white/10">
                <Headset size={24} className="text-primary" />
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-black tracking-tight">Atención Directa</h3>
                <div className="space-y-2">
                  <p className="text-gray-300 text-sm font-medium leading-relaxed">
                    Habla con uno de nuestros especialistas financieros vía WhatsApp.
                  </p>
                  <div className="flex items-start gap-2 bg-white/5 p-3 rounded-xl border border-white/10">
                    <Clock size={16} className="text-primary mt-0.5 shrink-0" />
                    <div className="text-[10px] font-bold text-gray-300 uppercase tracking-wider">
                      <p>Lun - Vie: 8:00 AM - 5:00 PM</p>
                      <p className="mt-1">Sábados: 9:00 AM - 12:00 PM</p>
                    </div>
                  </div>
                </div>
              </div>
              <a 
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-primary hover:bg-primary-hover text-accent font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-3 uppercase text-xs tracking-widest hover:-translate-y-1"
              >
                <span>Iniciar Chat</span>
                <MessageSquare size={18} />
              </a>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Support;
