import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendWelcomeEmail(email: string) {
  await resend.emails.send({
    from: 'Lyrup <hola@lyrup.com>',
    to: email,
    subject: '¡Bienvenido a Lyrup! Estás en la lista.',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0B0F1A; color: #E5E7EB; padding: 40px;">
        <h1 style="color: #F9FAFB; font-size: 28px; margin-bottom: 16px;">¡Gracias por sumarte!</h1>
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
          Estás en la lista de espera de <strong style="color: #06B6D4;">Lyrup</strong> — el cotizador inteligente para emprendedores de impresión 3D.
        </p>
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
          Te avisamos apenas abramos el acceso. Los primeros en la lista van a tener acceso exclusivo y precio especial.
        </p>
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
          Mientras tanto, una pregunta: <strong>¿Cuál es tu mayor dolor al cotizar impresiones 3D?</strong> Respondé este email — lo leemos todo.
        </p>
        <p style="font-size: 14px; color: #6B7280;">
          Hecho en Argentina para emprendedores 3D argentinos.
        </p>
      </div>
    `,
  })
}
