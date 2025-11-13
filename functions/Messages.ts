// ... keep existing code (up to email notification) ...

          base44.integrations.Core.SendEmail({
            to: recipient[0].email,
            subject: "Nuevo mensaje en Misautónomos",
            body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%); padding: 40px 20px; text-align: center; }
    .logo { width: 60px; height: 60px; background: white; border-radius: 16px; display: inline-block; line-height: 60px; font-size: 32px; margin-bottom: 15px; }
    .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 20px; color: #1f2937; margin-bottom: 20px; font-weight: 600; }
    .message { color: #4b5563; line-height: 1.8; font-size: 16px; margin-bottom: 25px; }
    .message-box { background: #f9fafb; border-left: 4px solid #3b82f6; padding: 20px; margin: 25px 0; border-radius: 8px; }
    .message-box p { color: #4b5563; margin: 0; line-height: 1.6; }
    .cta { text-align: center; margin: 35px 0; }
    .button { display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3); }
    .footer { background: #1f2937; color: #9ca3af; padding: 40px 30px; text-align: center; font-size: 14px; line-height: 1.8; }
    .footer strong { color: #ffffff; display: block; margin-bottom: 5px; font-size: 18px; }
    .footer .tagline { color: #60a5fa; margin-bottom: 15px; font-style: italic; }
    .footer a { color: #60a5fa; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">💬</div>
      <h1>Nuevo mensaje</h1>
    </div>
    
    <div class="content">
      <p class="greeting">Hola,</p>
      
      <p class="message">
        Has recibido un nuevo mensaje en <strong>Misautónomos</strong>.
      </p>
      
      <div class="message-box">
        <p><strong>De:</strong> ${newMessage.professional_name || newMessage.client_name}</p>
        <p style="margin-top: 15px;"><strong>Mensaje:</strong></p>
        <p style="margin-top: 10px; font-style: italic;">"${newMessage.content}"</p>
      </div>
      
      <div class="cta">
        <a href="https://misautonomos.es/Messages" class="button">
          Responder ahora →
        </a>
      </div>
      
      <p class="message" style="font-size: 14px; color: #6b7280; text-align: center;">
        Inicia sesión en Misautónomos para ver la conversación completa y responder.
      </p>
    </div>
    
    <div class="footer">
      <strong>Equipo Misautónomos</strong>
      <p class="tagline">Tu autónomo de confianza</p>
      <p>
        <a href="mailto:soporte@misautonomos.es">soporte@misautonomos.es</a><br/>
        <a href="https://misautonomos.es">misautonomos.es</a>
      </p>
    </div>
  </div>
</body>
</html>
            `,
            from_name: "Misautónomos"
          }).catch(err => console.log('Email notification error:', err));

// ... keep existing code (rest of function) ...