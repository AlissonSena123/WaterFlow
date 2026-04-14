const nodemailer = require("nodemailer");

const transporte = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
    }
});

async function enviarAlertaEmail(destinatario, bairro, status) {
    const mensagem = `
     WaterFlow

        Atenção!

        O abastecimento de água no bairro ${bairro} foi atualizado:

        Status: ${status}

        Acompanhe mais detalhes no sistema.

        WaterFlow
    `;

    await transporte.sendMail({
        from: `"WaterFlow" <process.env.MAIL_USER>`,
        to: destinatario,
        subject: "Alerta de abastecimento de água",
        text: mensagem
    });
};

module.exports = { enviarAlertaEmail };