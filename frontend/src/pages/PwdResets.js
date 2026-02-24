/*13.2.2*/
import React, {useState, useEffect} from 'react';
import api from '../api';

function PwdResets(){
  var [resets,setResets]= useState([]);
  var [msg,setMsg]  = useState('');
  var [comments,setComments]= useState({});
  var [passwords,setPasswords] = useState({});

  var load= function(){
    api.get('/admin/password-resets').then(function(r){setResets(r.data)});
  };
  useEffect(load,[]);

 var handle= async function(id,action){
   try{
      var r= await api.patch('/admin/password-resets/'+id, {
       action:action,
       comment:comments[id]||'',
       customPassword:passwords[id]||''
    });
     if(r.data.newPassword) setMsg('Approved! New password: '+r.data.newPassword);
      else setMsg('Rejected');
      load();
    } catch(ex){ setMsg(ex.response?.data?.msg||'failed'); }
  };

  var setComment=function(id,v){
    var c=Object.assign({},comments); c[id]=v; setComments(c);
  };
  var setPassword= function(id,v){
    var c= Object.assign({},passwords); c[id]=v; setPasswords(c);
  };

 return <div>
    <h1>Password Reset Requests</h1><hr/>
    {msg && <p><b>{msg}</b></p>}
     {resets.length===0 && <p>No password reset requests.</p>}
     <table>
       <thead><tr><th>User</th><th>Email</th><th>Role</th><th>Date</th><th>Reason</th><th>Status</th><th>New Password</th><th>Comment</th><th>Actions</th></tr></thead>
      <tbody>
       {resets.map(function(r){
           var u = r.userId;
          var name = u?.role==='organizer' ? (u?.organizerName||'-') : ((u?.firstName||'')+' '+(u?.lastName||'')).trim()||'-';
          return <tr key={r._id}>
          <td>{name}</td>
            <td>{u?.email||'-'}</td>
            <td>{u?.role||'-'}</td>
           <td>{new Date(r.createdAt).toLocaleDateString()}</td>
             <td>{r.reason}</td>
           <td>{r.status}{r.status==='approved' && r.newPassword ? <span> (pwd: <b>{r.newPassword}</b>)</span> : ''}</td>
             <td>
              {r.status==='pending' && <input value={passwords[r._id]||''} onChange={function(e){setPassword(r._id,e.target.value)}} size="14" placeholder="auto-generate"/>}
           </td>
          <td>
             {r.status==='pending'
                 ? <input value={comments[r._id]||''}onChange={function(e){setComment(r._id,e.target.value)}} size="16"/>
                 : (r.adminComment||'-')}
         </td>
             <td>
               {r.status==='pending' && <>
               <button onClick={function(){handle(r._id,'approve')}}>Approve</button>{' '}
               <button onClick={function(){handle(r._id,'reject')}}>Reject</button>
                </>}
           </td>
          </tr>;
       })}
      </tbody>
    </table>
  </div>;
}

export default PwdResets;
