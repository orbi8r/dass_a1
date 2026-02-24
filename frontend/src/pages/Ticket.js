/*9.5*/
import React, {useState, useEffect} from 'react';
import {useParams} from 'react-router-dom';
import api from '../api';

function Ticket(){
  var {ticketId} = useParams();
  var [t,setT] = useState(null);
 var [proofFile,setProofFile] = useState(null);
  var [msg,setMsg] = useState('');

 useEffect(function(){
    api.get('/participant/ticket/'+ticketId).then(function(r){setT(r.data)}).catch(function(){});
  },[ticketId]);

  if(!t) return <p>loading ticket...</p>;
 var uploadProof= async function(){
   if(!proofFile) return setMsg('select an image');
    var fd= new FormData(); fd.append('paymentProof', proofFile);
   try{
     var r = await api.post('/participant/ticket/'+t.ticketId+'/proof', fd, {headers:{'Content-Type':'multipart/form-data'}});
      setMsg('Proof uploaded, awaiting organizer approval');
      setTimeout(function(){ window.location.reload();},1000);
   } catch(ex){ setMsg(ex.response?.data?.msg||'upload failed');}
   };

  return <div>
   <h1>Ticket</h1><hr/>
    <div className="card">
      <p><b>Ticket ID:</b> {t.ticketId}</p>
     <p><b>Event:</b> {t.eventId?.name || '-'}</p>
      <p><b>Type:</b> {t.eventId?.type || '-'}</p>
     <p><b>Participant:</b> {t.userId?.firstName} {t.userId?.lastName}</p>
      <p><b>Email:</b> {t.userId?.email}</p>
     <p><b>Status:</b> {t.status}</p>
    <p><b>Payment Status:</b>{t.paymentStatus}</p>
     {t.totalAmount>0 && <p><b>Total Amount:</b> Rs.{t.totalAmount}</p>}
        {t.items && t.items.length>0 && <div>
        <b>Items:</b>
        <ul>{t.items.map(function(ci,i){
          var itemData = t.eventId?.items?.[ci.itemIndex];
         var varData = itemData?.variants?.[ci.variantIndex];
           return <li key={i}>{itemData?.name||'Item '+ci.itemIndex} ({varData?.size}/{varData?.color}) x{ci.quantity}</li>;
        })}</ul>
     </div>}
      <p><b>Registered:</b> {new Date(t.createdAt).toLocaleString()}</p>
      {t.eventId && <p><a href={'/events/'+t.eventId._id}>View Event</a></p>}
     {t.qrData && <div>
        <p><b>QR Code:</b></p>
          <img src={t.qrData} alt="QR" style={{width:200,height:200,imageRendering:'pixelated'}}/>
     </div>}
    {t.paymentStatus==='none' && <div style={{marginTop:10}}>
        <h3>Upload Payment Proof</h3>
        <input type="file" accept="image/*" onChange={function(e){setProofFile(e.target.files[0])}}/>
        <button onClick={uploadProof}>Submit Proof</button>
     </div>}
      {t.paymentStatus==='pending' && <p style={{color:'orange'}}>Proof submitted, awaiting organizer approval.</p>}
      {t.paymentStatus==='rejected' && <div style={{color:'red'}}>
       <p>Proof was rejected. You may upload again.</p>
        <input type="file" accept="image/*" onChange={function(e){setProofFile(e.target.files[0])}}/>
        <button onClick={uploadProof}>Submit Proof</button>
     </div>}
    {msg &&<p>{msg}</p>}
    </div>
  </div>;
}

export default Ticket;
