/*11.2*/
import React, {useState, useEffect} from 'react';
import api from '../api';

function ManageOrgs(){
  var [orgs,setOrgs] = useState([]);
  var [f,setF] = useState({organizerName:'',email:'',category:'',description:''});
  var [msg,setMsg] = useState('');
  var [resetPwds,setResetPwds] = useState({});

  var load = function(){
    api.get('/admin/organizers').then(function(r){setOrgs(r.data)}).catch(function(){setMsg('Failed to load organizers')});
  };
  useEffect(load,[]);

  var set = function(k,v){ setF(Object.assign({},f,{[k]:v})); };

  var create = async function(){
    try {
      var r = await api.post('/admin/organizers', f);
      setMsg('Created! Email: '+r.data.user.email+' | Password: '+r.data.generatedPassword);
      setF({organizerName:'',email:'',category:'',description:''});
      load();
    } catch(ex){ setMsg(ex.response?.data?.msg||'failed'); }
  };

  var remove = async function(id,action){
    try {
      await api.delete('/admin/organizers/'+id+'?action='+action);
      setMsg(action+' done');
      load();
    } catch(ex){ setMsg(ex.response?.data?.msg||'failed'); }
  };

  var enable = async function(id){
    try {
      await api.patch('/admin/organizers/'+id+'/enable');
      setMsg('Enabled');
      load();
    } catch(ex){ setMsg(ex.response?.data?.msg||'failed'); }
  };

  var resetPassword = async function(id){
    try {
      var customPwd = resetPwds[id] || '';
      var body = {};
      if(customPwd) body.password = customPwd;
      var r = await api.post('/admin/reset-password/'+id, body);
      setMsg('Password reset for organizer. New password: '+r.data.newPassword);
      var c = Object.assign({},resetPwds); delete c[id]; setResetPwds(c);
    } catch(ex){ setMsg(ex.response?.data?.msg||'failed'); }
  };

  return <div>
    <h1>Manage Clubs/Organizers</h1><hr/>
    {msg && <p><b>{msg}</b></p>}
    <h2>Add New Club/Organizer</h2>
    <label>Name: <input value={f.organizerName} onChange={function(e){set('organizerName',e.target.value)}}/></label>
    <label>Email: <input value={f.email} onChange={function(e){set('email',e.target.value)}}/></label>
    <label>Category: <input value={f.category} onChange={function(e){set('category',e.target.value)}}/></label>
    <label>Description: <input value={f.description} onChange={function(e){set('description',e.target.value)}} size="40"/></label>
    <button onClick={create}>Create</button>
    <hr/>
    <h2>All Organizers</h2>
    <table>
      <thead><tr><th>Name</th><th>Email</th><th>Category</th><th>Active</th><th>Actions</th><th>Password Reset</th></tr></thead>
      <tbody>
        {orgs.map(function(o){
          return <tr key={o._id}>
            <td>{o.organizerName}</td>
            <td>{o.email}</td>
            <td>{o.category}</td>
            <td>{o.active?'Yes':'No'}</td>
            <td>
              {o.active
                ? <button onClick={function(){remove(o._id,'disable')}}>Disable</button>
                : <button onClick={function(){enable(o._id)}}>Enable</button>}
              {' '}<button onClick={function(){remove(o._id,'archive')}}>Archive</button>
              {' '}<button onClick={function(){if(window.confirm('Permanently delete this organizer?'))remove(o._id,'delete')}}>Delete</button>
            </td>
            <td>
              <input value={resetPwds[o._id]||''} onChange={function(e){var c=Object.assign({},resetPwds);c[o._id]=e.target.value;setResetPwds(c)}} size="12" placeholder="auto"/>
              {' '}<button onClick={function(){resetPassword(o._id)}}>Reset Password</button>
            </td>
          </tr>;
        })}
      </tbody>
    </table>
  </div>;
}

export default ManageOrgs;
