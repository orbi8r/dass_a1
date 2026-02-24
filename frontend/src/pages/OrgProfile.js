/*10.5*/
import React,{useState, useContext,  useEffect} from 'react';
import api from '../api';
import{AuthCtx} from '../ctx';

function OrgProfile(){
  var {user,setUser}= useContext(AuthCtx);
  var [f,setF] = useState({});
  var [msg,setMsg]= useState('');
 var [resets,setResets] = useState([]);
  var [reason,setReason]= useState('');

  useEffect(function(){
     if(user){
     setF({organizerName:user.organizerName||'',category:user.category||'',
        description:user.description||'',contactEmail:user.contactEmail||'',
      contactNumber:user.contactNumber||'',discordWebhook:user.discordWebhook||''});
    }
   api.get('/organizer/password-resets').then(function(r){setResets(r.data)}).catch(function(){});
  },[user]);

  var set=  function(k,v){ setF(Object.assign({},f,{[k]:v})); };

 var save=  async function(){
   try {
      var r= await api.put('/organizer/profile', f);
      setUser(r.data);setMsg('saved');
   } catch(ex){ setMsg(ex.response?.data?.msg||'save failed'); }
  };

  var requestReset =async function(){
    try {
      var r = await api.post('/organizer/password-reset',{reason:reason});
      setMsg(r.data.msg||'Password reset requested');
      setReason('');
       api.get('/organizer/password-resets').then(function(r){setResets(r.data)}).catch(function(){});
   } catch(ex){ setMsg(ex.response?.data?.msg||'request failed'); }
  };

 if(!user) return null;

  return <div>
   <h1>Organizer Profile</h1><hr/>
    {msg && <p className="ok">{msg}</p>}
    <label>Login Email: <b>{user.email}</b> (non-editable)</label>
    <label>Organizer Name: <input value={f.organizerName||''} onChange={function(e){set('organizerName',e.target.value)}}/></label>
  <label>Category: <input value={f.category||''} onChange={function(e){set('category',e.target.value)}}/></label>
    <label>Description: <textarea value={f.description||''} onChange={function(e){set('description',e.target.value)}} cols="50" rows="3"/></label>
    <label>Contact Email: <input value={f.contactEmail||''} onChange={function(e){set('contactEmail',e.target.value)}}/></label>
    <label>Contact Number: <input value={f.contactNumber||''}onChange={function(e){set('contactNumber',e.target.value)}}/></label>
    <label>Discord Webhook URL: <input value={f.discordWebhook||''} onChange={function(e){set('discordWebhook',e.target.value)}}size="50"/></label>
  <small>(New events will be auto-posted to Discord when published)</small>
   <br/><button onClick={save}>Save Profile</button>
    <hr/>
    <h2>Password Reset</h2>
    <p>Request a password reset from the Admin:</p>
    <label>Reason: <input value={reason}onChange={function(e){setReason(e.target.value)}} size="40"/></label>
    <button onClick={requestReset}>Request Reset</button>
    <h3>Reset History:</h3>
    <table>
      <thead><tr><th>Date</th><th>Reason</th><th>Status</th><th>New Password</th><th>Admin Comment</th></tr></thead>
     <tbody>
         {resets.map(function(r){
          return <tr key={r._id}>
            <td>{new Date(r.createdAt).toLocaleDateString()}</td>
           <td>{r.reason}</td>
           <td>{r.status}</td>
           <td>{r.status==='approved' && r.newPassword? <b>{r.newPassword}</b>: '-'}</td>
          <td>{r.adminComment||'-'}</td>
           </tr>;
       })}
      </tbody>
    </table>
  </div>;
}

export default OrgProfile;
