/*9.5*/
async function sendTicketEmail(to, evtName, userName, ticketId, qrData, evtType){
  if(!process.env.RESEND_API_KEY) return;
  var b64 = qrData.replace(/^data:image\/png;base64,/,'');
  var html = '<div style="font-family:sans-serif;max-width:500px">'
    +'<h2 style="color:#333">Felicity \u2014 Ticket Confirmation</h2>'
    +'<p>Hi '+userName+',</p>'
    +'<p>You have been registered for <b>'+evtName+'</b> ('+evtType+')</p>'
    +'<p>Ticket ID: <b>'+ticketId+'</b></p>'
    +'<img src="cid:qrcode" width="200" alt="QR Code"/>'
    +'<p>Show this QR code at the venue.</p>'
    +'</div>';
  try {
    await fetch('https://api.resend.com/emails', {
      method:'POST',
      headers:{'Authorization':'Bearer '+process.env.RESEND_API_KEY,'Content-Type':'application/json'},
      body:JSON.stringify({
        from:process.env.RESEND_FROM||'Felicity <onboarding@resend.dev>',
        to:[to],
        subject:'Ticket: '+evtName+' \u2014 '+ticketId,
        html:html,
        attachments:[{filename:'qrcode.png',content:b64,content_type:'image/png',content_disposition:'inline',content_id:'qrcode'}]
      })
    });
  } catch(e){}
}

/*13.1.2*/
async function sendPaymentApprovedEmail(to, evtName, userName, ticketId){
  if(!process.env.RESEND_API_KEY) return;
  var html = '<div style="font-family:sans-serif;max-width:500px">'
    +'<h2 style="color:#333">Felicity — Payment Approved</h2>'
    +'<p>Hi '+userName+',</p>'
    +'<p>Your payment for <b>'+evtName+'</b> has been approved!</p>'
    +'<p>Ticket ID: <b>'+ticketId+'</b></p>'
    +'<p>You can view your ticket from your dashboard.</p>'
    +'</div>';
  try {
    await fetch('https://api.resend.com/emails', {
      method:'POST',
      headers:{'Authorization':'Bearer '+process.env.RESEND_API_KEY,'Content-Type':'application/json'},
      body:JSON.stringify({from:process.env.RESEND_FROM||'Felicity <onboarding@resend.dev>',to:[to],subject:'Payment Approved: '+evtName,html:html})
    });
  } catch(e){}
}

module.exports = {sendTicketEmail, sendPaymentApprovedEmail};
