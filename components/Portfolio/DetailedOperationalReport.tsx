import React, { ReactNode } from 'react';
import { ShieldCheck, Target, TrendingUp, Landmark, Globe, Coins, Bitcoin, Building2 } from 'lucide-react';

const DetailedOperationalReport: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto space-y-12 pb-10">
      {/* Título */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl lg:text-5xl font-black text-accent tracking-tighter uppercase leading-tight">
          Informe Estratégico de Distribución y Desempeño <br/>
          <span className="text-primary-hover">Cuarto Trimestre 2025</span>
        </h1>
        <div className="h-1.5 w-24 bg-primary mx-auto rounded-full"></div>
      </div>

      {/* Resumen Ejecutivo */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <ShieldCheck className="text-accent" size={24} />
          <h2 className="text-2xl font-black text-accent tracking-tight uppercase">1. Resumen Ejecutivo</h2>
        </div>
        <div className="space-y-4 text-text-secondary text-base leading-relaxed font-medium">
          <p>
            El presente informe técnico tiene como objetivo detallar la composición y el comportamiento del portafolio bajo gestión de Caishen Capital Group S.A.S. durante el cierre del ejercicio fiscal 2025. El Cuarto Trimestre (4T) se consolidó como un periodo de maduración operativa, donde la disciplina en la ejecución de protocolos de riesgo permitió absorber la volatilidad del entorno macroeconómico global.
          </p>
          <p>
            Hacia 2026, nuestra visión estratégica se centra en la expansión progresiva de la base de activos, apalancando la solidez estructural construida durante este año para maximizar la eficiencia en la captura de oportunidades tácticas, siempre bajo un marco estricto de preservación de capital.
          </p>
        </div>
      </section>

      {/* Distribución Operativa */}
      <section className="space-y-8">
        <div className="flex items-center gap-3">
          <Target className="text-accent" size={24} />
          <h2 className="text-2xl font-black text-accent tracking-tight uppercase">2. Distribución Operativa del Portafolio</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[
            { 
              title: 'Divisas (Forex) - 20.6%', 
              icon: Globe, 
              desc: 'Actúa como el motor de liquidez inmediata. Nuestra exposición en el mercado de divisas se centra en pares mayores de alta profundidad, permitiendo rotaciones rápidas de capital y cobertura contra la devaluación sistémica.' 
            },
            { 
              title: 'Derivados - 30.9%', 
              icon: Coins, 
              desc: 'Representa la mayor asignación estratégica. Estos instrumentos se utilizan para estructurar posiciones con riesgo acotado, permitiendo exposición a mercados de commodities y metales con un enfoque de protección de capital.' 
            },
            { 
              title: 'Equity (Acciones) - 10.3%', 
              icon: Landmark, 
              desc: 'Participación en sectores tecnológicos y energéticos de alta resiliencia. Este segmento aporta crecimiento orgánico a largo plazo y dividendos institucionales al flujo de caja del fondo.' 
            },
            { 
              title: 'Inmobiliario - 25.8%', 
              icon: Building2, 
              desc: 'La base patrimonial del portafolio. Compuesto por activos tangibles y proyectos de desarrollo, este sector ofrece una baja correlación con los mercados financieros, brindando estabilidad estructural extrema.' 
            },
            { 
              title: 'Algorítmico / Crypto - 12.4%', 
              icon: Bitcoin, 
              desc: 'Segmento de alta eficiencia. Se emplea para capturar ineficiencias de mercado mediante modelos matemáticos, operando con estrictos stop-loss para garantizar que el riesgo esté siempre bajo control.' 
            }
          ].map((item, i) => (
            <div key={i} className="bg-surface-subtle p-6 rounded-3xl border border-surface-border space-y-3">
              <div className="flex items-center gap-3 text-accent">
                <item.icon size={20} className="text-primary-hover" />
                <h3 className="font-black text-sm uppercase tracking-tight">{item.title}</h3>
              </div>
              <p className="text-text-secondary text-xs leading-relaxed font-medium">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Enfoque de Liquidez */}
      <section className="bg-accent rounded-[35px] p-8 lg:p-10 text-white space-y-6">
        <h2 className="text-2xl font-black tracking-tight uppercase">3. Enfoque de Liquidez y Riesgo</h2>
        <div className="space-y-4 text-gray-300 text-sm leading-relaxed font-medium">
          <p>
            Una prioridad no negociable de nuestra matriz operativa es el mantenimiento de la liquidez. Actualmente, los activos en **Forex y Estrategias Algorítmicas** constituyen el núcleo de nuestra liquidez operativa, asegurando que el capital sea movilizable en plazos optimizados.
          </p>
          <p>
            Por otro lado, los sectores de **Inmobiliario y Derivados** cumplen la función de anclaje patrimonial, ofreciendo una barrera contra eventos de "cisne negro" y garantizando que el AUM global mantenga su valor real frente a la inflación y otros riesgos sistémicos.
          </p>
        </div>
      </section>

      {/* Desempeño 4T 2025 */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <TrendingUp className="text-accent" size={24} />
          <h2 className="text-2xl font-black text-accent tracking-tight uppercase">4. Desempeño Consolidado 4T 2025</h2>
        </div>
        <div className="bg-white border-l-4 border-primary p-6 space-y-4">
          <p className="text-text-secondary text-base leading-relaxed font-medium">
            Durante el último trimestre del año, el portafolio demostró una **disciplina operativa excepcional**. Los ajustes tácticos se centraron en reducir la exposición a mercados altamente volátiles y reasignar capital hacia instrumentos con flujos de caja predecibles.
          </p>
          <p className="text-text-secondary text-base leading-relaxed font-medium">
            Se destaca la reducción significativa de la volatilidad interna del fondo y el cumplimiento riguroso de los límites de riesgo establecidos por el comité técnico, cerrando el año con una estructura balanceada que favorece la sostenibilidad sobre la especulación.
          </p>
        </div>
      </section>

      {/* Proyección 2026 */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <Globe className="text-accent" size={24} />
          <h2 className="text-2xl font-black text-accent tracking-tight uppercase">5. Proyección Estratégica 2026</h2>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {[
            { title: 'Crecimiento Progresivo', desc: 'Escalamiento de las posiciones actuales manteniendo los niveles de riesgo históricos.' },
            { title: 'Optimización Algorítmica', desc: 'Fortalecimiento de modelos cuantitativos para mayor eficiencia en mercados 24/7.' },
            { title: 'Expansión Controlada', desc: 'Apertura hacia nuevos instrumentos diversificadores sin comprometer la liquidez central.' }
          ].map((point, i) => (
            <div key={i} className="flex gap-4 items-start p-4 bg-surface-subtle rounded-2xl">
              <div className="size-2 rounded-full bg-primary mt-2"></div>
              <div>
                <h4 className="text-sm font-black text-accent uppercase">{point.title}</h4>
                <p className="text-xs text-text-secondary font-medium mt-1">{point.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Conclusión */}
      <section className="pt-10 border-t border-gray-100">
        <p className="text-accent font-black text-lg text-center uppercase tracking-tighter italic">
          "Cerrando un año de solidez operativa, iniciamos un 2026 con claridad estratégica y compromiso absoluto con la excelencia financiera."
        </p>
        <div className="mt-8 flex flex-col items-center">
          <Landmark size={40} className="text-text-muted opacity-20" />
          <span className="text-[9px] font-black text-text-muted uppercase tracking-[0.3em] mt-4">Caishen Capital Group S.A.S. • Comité Técnico</span>
        </div>
      </section>
    </div>
  );
};

export default DetailedOperationalReport;