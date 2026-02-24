/*9.7*/
import React, {useState, useEffect, useContext} from'react';
import {Link} from'react-router-dom';
import api from '../api';
import {AuthCtx} from'../ctx';

function Clubs(){
  var {user,setUser}= useContext(AuthCtx);
  var [orgs,setOrgs] =useState([]);
  var [msg,setMsg]= useState('');

   useEffect(function(){
    api.get('/participant/organizers').then(function(r){setOrgs(r.data)});
  },[]);

  var follow= async function(id){
   try {
     var r= await api.post('/participant/follow/'+id);
      setUser(r.data);
   }catch(ex){ setMsg(ex.response?.data?.msg||'follow failed'); }
  };
  var unfollow= async function(id){
    try {
     var r= await api.delete('/participant/follow/'+id);
     setUser(r.data);
    } catch(ex){setMsg(ex.response?.data?.msg||'unfollow failed'); }
  };

 var isFollowing= function(id){
    if(!user || !user.followedClubs) return false;
   return user.followedClubs.some(function(cid){ return String(cid)===String(id);});
  };

  return <div>
   <h1>Clubs / Organizers</h1><hr/>
     {msg && <p><b>{msg}</b></p>}
     <table>
      <thead><tr><th>Name</th><th>Category</th><th>Description</th><th>Action</th></tr></thead>
      <tbody>
        {orgs.map(function(o){
         return <tr key={o._id}>
            <td><Link to={'/clubs/'+o._id}>{o.organizerName}</Link></td>
            <td>{o.category}</td>
            <td>{o.description}</td>
           <td>
             {user && user.role==='participant' && (
               isFollowing(o._id)
                   ? <button onClick={function(){unfollow(o._id)}}>Unfollow</button>
                   : <button onClick={function(){follow(o._id)}}>Follow</button>
              )}
           </td>
          </tr>;
        })}
    </tbody>
  </table>
  </div>;
}

export default Clubs;
