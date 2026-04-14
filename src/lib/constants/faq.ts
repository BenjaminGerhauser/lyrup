export interface FaqItem {
  question: string
  answer: string
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: '¿Que es un G-code?',
    answer:
      'Es el archivo que genera tu slicer (Cura, PrusaSlicer, BambuStudio) cuando preparas una pieza para imprimir. Contiene toda la informacion: tiempo, material, capas. Lyrup lo lee automaticamente.',
  },
  {
    question: '¿Funciona con mi impresora?',
    answer:
      'Si usas una impresora FDM (Ender 3, BambuLab, Prusa, Artillery, Anycubic, Hellbot, Trideo o cualquier otra), si. El cotizador funciona con cualquier G-code estandar.',
  },
  {
    question: '¿Que pasa con mis datos?',
    answer:
      'Tus datos son tuyos. Cada usuario solo ve su propia informacion. Usamos Supabase con Row Level Security — nadie mas accede a tus cotizaciones, pedidos ni configuracion.',
  },
  {
    question: '¿Puedo usarlo en el celular?',
    answer:
      'Si. Lyrup es una PWA — funciona como app en tu celular sin descargar nada. Abri lyrup.com desde el navegador y listo.',
  },
  {
    question: '¿Como pago el plan Pro?',
    answer:
      'Con Mercado Pago. Suscripcion mensual, cancelas cuando quieras.',
  },
  {
    question: '¿Y si tengo muchas impresoras?',
    answer:
      'El plan Farm es para vos. Impresoras ilimitadas, conexion con firmware (Klipper, BambuLab, OctoPrint), y analytics de tu negocio completo.',
  },
]
