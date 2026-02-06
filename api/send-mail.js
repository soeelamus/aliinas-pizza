import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  try {
    const order = req.body;

    if (!order.customerEmail) {
      return res.status(400).json({ error: "No email" });
    }

    await resend.emails.send({
      from: "Aliina's Pizza <orders@aliinas.com>",
      replyTo: "aliinas.pizza@hotmail.com",
      to: order.customerEmail,
      subject: "Je bestelling is ontvangen 🍕",

      html: `
 <!DOCTYPE html>
  <html lang="nl">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body {
        font-family: 'Helvetica', Arial, sans-serif;
        background-color: ##Fefaf4;
        color: #333;
        margin: 0;
        padding: 0;
      }
      .container {
        max-width: 600px;
        margin: 20px auto;
        background: ##Fefaf4;
        border-radius: 10px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        overflow: hidden;
        border-top: 6px solid #6237c8;
      }
      .header {
        background-color: #6237c8;
        color: white;
        text-align: center;
        padding: 20px;
        font-size: 24px;
        font-weight: bold;
      }
      .content {
        padding: 20px;
        line-height: 1.6;
      }
      .content h2 {
        color: #6237c8;
      }
      .order-details {
        margin: 20px 0;
        border-top: 1px solid ##Fefaf4;
        border-bottom: 1px solid ##Fefaf4;
        padding: 10px 0;
      }
      .order-details p {
        margin: 5px 0;
      }
      .footer {
        text-align: center;
        font-size: 12px;
        color: #888;
        padding: 15px;
      }
      .btn {
        display: inline-block;
        background-color: #6237c8;
        color: ##Fefaf4;
        padding: 10px 20px;
        border-radius: 5px;
        text-decoration: none;
        margin-top: 10px;
      }
      @media(max-width: 640px) {
        .container { width: 90%; }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">Aliina's Pizza 🍕</div>
      <div class="content">
        <h2>Bedankt ${order.customerName}!</h2>
        <p>Je bestelling kan straks worden afgehaald, om <strong>${order.pickupTime}.</strong></p>
        <p>Het afhaaladres vind je terug op onze kalender. 🍕</p>
        <br />
        <div class="order-details">
          <p><strong>Bestelling:</strong><br/>
          ${order.items.replace(/,/g, "<br/>")}</p>

          <p><strong>Totaal:</strong> €${order.total.toFixed(2)}</p>
          
          ${order.customerNotes ? `<p><strong>Opmerking:</strong> ${order.customerNotes}</p>` : ""}
          </div>
          <br />
        <a href="https://aliinas.com/" class="btn">Website</a>
        </div>
        <div class="footer">
        Aliina's Pizza, altijd in de buurt!<br/>
        <a href="mailto:aliinas.pizza@hotmail.com" style="color:#888;">aliinas.pizza@hotmail.com</a>
      </div>
    </div>
  </body>
  </html>
  `,
    });

    res.status(200).json({ status: "ok" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Mail failed" });
  }
}
