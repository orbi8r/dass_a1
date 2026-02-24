/*11.2*/
import React, {useState, useEffect} from 'react';
import {Link} from 'react-router-dom';
import api from '../api';

function AdminDash(){
  var[stats,setStats]= useState({orgs:0, resets:0});

 useEffect(function(){
    api.get('/admin/organizers').then(function(r){setStats(function(s){return Object.assign({},s,{orgs:r.data.length})})}).catch(function(){});
    api.get('/admin/password-resets').then(function(r){
      var pending=  r.data.filter(function(x){return x.status==='pending'}).length;
      setStats(function(s){return Object.assign({},s,{resets:r.data.length,pending:pending})});
    }).catch(function(){});
  },[]);

  return <div>
     <h1>Admin Dashboard</h1><hr/>
    <table><tbody>
      <tr><td>Total Organizers</td><td>{stats.orgs}</td></tr>
     <tr><td>Password Reset Requests</td><td>{stats.resets} ({stats.pending||0} pending)</td></tr>
     </tbody></table>
    <hr/>
   <ul>
      <li><Link to="/admin/organizers">Manage Clubs/Organizers</Link></li>
       <li><Link to="/admin/resets">Password Reset Requests</Link></li>
    </ul>
  </div>;
}

export default AdminDash;
