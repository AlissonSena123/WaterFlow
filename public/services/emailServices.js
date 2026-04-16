const nodemailer = require("nodemailer");

const transporte = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
    }
});

async function enviarAlertaEmail(destinatario, bairro, status) {

    const statusConfig = {
        "Normal":       { cor: "#16a34a", bg: "#dcfce7" },
        "Intermitente": { cor: "#d97706", bg: "#fef3c7" },
        "Interrompido": { cor: "#dc2626", bg: "#fee2e2" },
    };

    const config = statusConfig[status] || { cor: "#6b7280", bg: "#f3f4f6" };

    const mensagem = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #ffffff; font-family: Arial, sans-serif;">

        <!-- HEADER -->
        <div style="background: linear-gradient(135deg, #0ea5e9, #0369a1); padding: 32px; text-align: center;">
            <img src="https://seusite.com/assets/Img/LogoV1.png" alt="WaterFlow" style="width: 80px; display: block; margin: 0 auto 12px;">
            <h1 style="margin: 0; color: #ffffff; font-size: 28px; letter-spacing: 1px;">
                WaterFlow
            </h1>
            <p style="margin: 6px 0 0; color: #bae6fd; font-size: 14px;">
                Sistema de Monitoramento de Abastecimento
            </p>
        </div>

        <!-- CORPO -->
        <div style="padding: 32px 40px;">

            <!-- TÍTULO -->
            <div style="text-align: center; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 13px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px;">
                    Notificação de Atualização
                </p>
                <h2 style="margin: 8px 0 0; font-size: 22px; color: #1e3a5f;">
                    Alerta de Abastecimento
                </h2>
            </div>

            <!-- BAIRRO -->
            <div style="background-color: #f0f9ff; border-left: 4px solid #0ea5e9; border-radius: 0 8px 8px 0; padding: 16px 20px; margin-bottom: 12px;">
                <p style="margin: 0; font-size: 13px; color: #6b7280;">Bairro afetado</p>
                <p style="margin: 4px 0 0; font-size: 20px; font-weight: bold; color: #0369a1;">
                    ${bairro}
                </p>
            </div>

            <!-- STATUS -->
            <div style="background-color: ${config.bg}; border-left: 4px solid ${config.cor}; border-radius: 0 8px 8px 0; padding: 16px 20px; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 13px; color: #6b7280;">Status atual</p>
                <p style="margin: 4px 0 0; font-size: 20px; font-weight: bold; color: ${config.cor};">
                    ${status}
                </p>
            </div>

            <!-- MENSAGEM -->
            <p style="margin: 0; font-size: 15px; color: #4b5563; line-height: 1.7;">
                O abastecimento de água no bairro <strong>${bairro}</strong> foi atualizado para o status
                <strong style="color: ${config.cor};">${status}</strong>.
                Acompanhe mais informações e atualizações através do sistema.
            </p>

        </div>

        <!-- FOOTER -->
        <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 40px; text-align: center;">
            <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                © 2026 WaterFlow · Você está recebendo este e-mail pois está cadastrado no sistema de alertas.
            </p>
        </div>

    </body>
    </html>
    `;

    await transporte.sendMail({
        from: `"WaterFlow" <${process.env.MAIL_USER}>`,
        to: destinatario,
        subject: `Alerta de abastecimento — ${bairro}`,
        html: mensagem
    });
}

module.exports = { enviarAlertaEmail };