import nodemailer from "nodemailer";

const transporte = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
    }
});

async function enviarAlertaEmail(destinatario, bairro, status) {
    const mensagem = `
        <!DOCTYPE html>
        <html lang="pt-BR">

        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>

        <body style="margin: 0; padding: 0; background-color: #ffffff; font-family: Arial, sans-serif;">

            <header style="background: linear-gradient(135deg, #0ea5e9, #0369a1); padding: 32px; text-align: center;">
                <h1 style="margin: 0; color: #ffffff; font-size: 28px; letter-spacing: 1px;">
                    <img src="cid:LogoWaterFlow" style="width: 125px;"/>
                </h1>
            </header>

            <main style="padding: 32px 40px;">
                <div style="text-align: center; margin-bottom: 24px; margin-top: 24px;">
                    <p style="margin: 0; font-size: 13px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px;">
                        Notificação de Atualização
                    </p>
                    <h2 style="margin: 8px 0 0; font-size: 22px; color: #1e3a5f;">
                        Alerta de Abastecimento
                    </h2>
                </div>
                <p style="font-size: 15px">Olá, ${destinatario}</p>
                <p style="font-size: 15px">O status atual do abastecimento de água em seu bairro foi atualizado recentemente:</p>

                <div style="background-color: #f0f9ff; border-left: 4px solid #0ea5e9; border-radius: 0 8px 8px 0; padding: 16px 20px; margin-bottom: 12px;">

                    <p style="margin: 0; font-size: 13px; color: #6b7280; font-weight: bold;">Bairro afetado:</p>
                    
                    <p style="margin: 8px 0 0; font-size: 20px; font-weight: bold; color: #0369a1;">${bairro}</p>

                </div>

                <div style="background-color: #f0f9ff; border-left: 4px solid #0ea5e9; border-radius: 0 8px 8px 0; padding: 16px 20px; margin-bottom: 20px;">

                    <p style="margin: 0; font-size: 13px; color: #6b7280; font-weight: bold;">Status Atual:</p>

                    <p style="margin: 8px 0 0; font-size: 20px; font-weight: bold; color: #0369a1;">${status}</p>

                </div>
                
                <p style="text-align: center; margin-top: 20px;">Acompanhe mais informações e atualizações através da plataforma.</p>

            </main>

            <footer style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 40px; text-align: center;">
                <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                    © 2026 WaterFlow · Você está recebendo este e-mail pois está cadastrado no sistema de alertas.
                </p>
            </footer>

        </body>

        </html>
    `;

    await transporte.sendMail({
        from: `"WaterFlow" <${process.env.MAIL_USER}>`,
        to: destinatario,
        subject: `Alerta de abastecimento — ${bairro}`,
        html: mensagem,
        attachments: [
            {
                filename: "LogoWhiteV1.png",
                path: "./public/assets/Img/LogoWhiteV1.png",
                cid: "LogoWaterFlow"
            }
        ]
    });
}

async function enviarRespostaReport({ para, nome, bairro, status, resposta }) {
    await transporte.sendMail({
        from: `"WaterFlow" <${process.env.MAIL_USER}>`,
        to: para,
        subject: `Atualização do seu reporte - ${status}`,
        html: `
            <div style="font-family:sans-serif;max-width:520px;margin:0 auto">
                <h2 style="color:#1a3a6e">Olá, ${nome}!</h2>
                <p>Seu reporte do bairro <strong>${bairro}</strong> foi atualizado.</p>
                <div style="background:#f6f8fc;border-left:4px solid #1a3a6e;
                            padding:14px 18px;border-radius:0 8px 8px 0;margin:20px 0">
                    <p style="margin:0 0 6px;font-size:13px;color:#718096">Status atual</p>
                    <strong style="color:#1a3a6e;font-size:16px">${status}</strong>
                </div>
                <div style="background:#fff;border:1px solid #e2e8f0;
                            padding:14px 18px;border-radius:8px">
                    <p style="margin:0 0 6px;font-size:13px;color:#718096">
                        Mensagem da equipe WaterFlow
                    </p>
                    <p style="margin:0;color:#2d3748">${resposta}</p>
                </div>
                <p style="margin-top:24px;font-size:13px;color:#a0aec0">
                    Acesse o site para acompanhar todos os seus reportes.
                </p>
            </div>
            `,
    });
}

export { enviarAlertaEmail, enviarRespostaReport };